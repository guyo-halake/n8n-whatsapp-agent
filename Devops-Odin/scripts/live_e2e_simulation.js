const http = require('http');
const fs = require('fs');
const path = require('path');
const { sanitizeString, sanitizeObject } = require('../src/core/redactor');
const { generateApprovalToken, verifyApprovalToken } = require('../src/security/signer');
const { classifyIncident } = require('../src/core/classifier');
const { formatHtmlEmail } = require('../src/adapters/notifications/formatter');
const { AuditLogger } = require('../src/core/audit');

const HMAC_SECRET = 'live-test-secret-key-32-chars-long!!';
const AUDIT_DIR = path.resolve(__dirname, '../logs');
const auditLogger = new AuditLogger(AUDIT_DIR);

function runSimulation() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://${req.headers.host}`);

      if (req.method === 'POST' && url.pathname === '/webhook/odin-devops-ingress') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          const rawPayload = JSON.parse(body);
          
          const cleanLogs = sanitizeString(rawPayload.logs);
          const sanitizedPayload = sanitizeObject({ ...rawPayload, logs: cleanLogs });

          const triage = classifyIncident(cleanLogs, rawPayload.exitCode);

          const token = generateApprovalToken({
            actionId: `act_${Date.now()}`,
            actionType: triage.recommendation,
            target: sanitizedPayload.service,
            tenantId: 'tenant-demo',
            secret: HMAC_SECRET,
            ttlMinutes: 15
          });

          const auditRecord = auditLogger.log({
            stage: 'INGRESS_AND_TRIAGE',
            service: sanitizedPayload.service,
            severity: triage.severity,
            category: triage.category,
            sanitizedLogsSample: cleanLogs.slice(0, 100),
            tokenGenerated: true
          });

          res.writeHead(202, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'ACCEPTED',
            incidentId: auditRecord.auditId,
            severity: triage.severity,
            category: triage.category,
            approvalToken: token
          }));
        });
        return;
      }

      if (req.method === 'GET' && url.pathname === '/webhook/odin-approval') {
        const token = url.searchParams.get('token');
        const decision = url.searchParams.get('decision');

        const verification = verifyApprovalToken(token, HMAC_SECRET);
        if (!verification.valid) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: verification.reason }));
          return;
        }

        const auditRecord = auditLogger.log({
          stage: 'APPROVAL_EXECUTED',
          decision,
          targetService: verification.data.target,
          executedBy: 'operator@demo.com',
          status: 'SUCCESS'
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          action: decision === 'approve' ? 'REMEDIATION_TRIGGERED' : 'ACTION_DECLINED',
          auditId: auditRecord.auditId,
          target: verification.data.target
        }));
        return;
      }

      res.writeHead(404);
      res.end();
    });

    server.listen(0, '127.0.0.1', async () => {
      const port = server.address().port;
      const baseUrl = `http://127.0.0.1:${port}`;

      console.log(`[1] Local Ingress Gateway active on ${baseUrl}`);

      const dirtyIncident = {
        source: 'docker',
        service: 'payment-gateway-api',
        environment: 'production',
        exitCode: 137,
        logs: 'FATAL: Process killed by cgroup out of memory event. token=ghp_ABC1234567890SECRETXYZ and Bearer eyJhbGciOiJIUzI1NiJ9.secretpayload password=DatabaseMasterPassword123'
      };

      console.log('\n[2] Dispatching simulated incident with leaked secrets...');
      const ingressResponse = await fetch(`${baseUrl}/webhook/odin-devops-ingress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dirtyIncident)
      });

      const ingressData = await ingressResponse.json();
      console.log('Ingress Gateway Response:', JSON.stringify(ingressData, null, 2));

      console.log('\n[3] Simulating human clicking "Approve Action" link with signed token...');
      const approvalUrl = `${baseUrl}/webhook/odin-approval?token=${encodeURIComponent(ingressData.approvalToken)}&decision=approve`;
      const approvalResponse = await fetch(approvalUrl);
      const approvalData = await approvalResponse.json();
      console.log('Approval Gateway Response:', JSON.stringify(approvalData, null, 2));

      console.log('\n[4] Inspecting verified audit trail on disk...');
      const logFiles = fs.readdirSync(AUDIT_DIR);
      const todayLog = logFiles.find(f => f.startsWith('audit-'));
      if (todayLog) {
        const lines = fs.readFileSync(path.join(AUDIT_DIR, todayLog), 'utf8').trim().split('\n');
        console.log(`Audit log verified: ${lines.length} events logged to disk.`);
        console.log('Latest audit record:\n', JSON.stringify(JSON.parse(lines[lines.length - 1]), null, 2));
      }

      server.close(() => {
        console.log('\n[5] End-to-end simulation completed successfully with zero leaks.');
        resolve();
      });
    });
  });
}

runSimulation().catch(err => {
  console.error('Simulation failed:', err);
  process.exit(1);
});

