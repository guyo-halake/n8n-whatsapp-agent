const assert = require('assert');
const { sanitizeString, sanitizeObject } = require('../src/core/redactor');
const { generateApprovalToken, verifyApprovalToken } = require('../src/security/signer');
const { classifyIncident } = require('../src/core/classifier');
const { formatHtmlEmail } = require('../src/adapters/notifications/formatter');
const { CostLeakDetector, ESTIMATED_COSTS } = require('../src/adapters/cloud/cost_leak_detector');
const { buildExecutiveRoiReport } = require('../src/adapters/notifications/executive_report');

function testRedactor() {
  const secretKey = 'ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bearer = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDcSemACt8x4iTMCda8Yhe3iZaWbvV5XKSTbuAn0M';
  const input = `Error connecting with token=${secretKey} and header ${bearer}`;
  const sanitized = sanitizeString(input);
  assert(!sanitized.includes(secretKey));
  assert(!sanitized.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'));
  assert(sanitized.includes('[REDACTED]'));

  const obj = {
    apiKey: 'secret_123',
    nested: {
      password: 'mypassword',
      service: 'docker'
    }
  };
  const cleanObj = sanitizeObject(obj);
  assert.strictEqual(cleanObj.apiKey, '[REDACTED]');
  assert.strictEqual(cleanObj.nested.password, '[REDACTED]');
  assert.strictEqual(cleanObj.nested.service, 'docker');
}

function testSigner() {
  const secret = 'super-secret-odin-hmac-key-2026';
  const payload = {
    actionId: 'act_001',
    actionType: 'docker_restart',
    target: 'production_web',
    tenantId: 'tenant_acme',
    ttlMinutes: 10
  };

  const token = generateApprovalToken({ ...payload, secret });
  assert(token.includes('.'));

  const verification = verifyApprovalToken(token, secret);
  assert.strictEqual(verification.valid, true);
  assert.strictEqual(verification.data.actionId, 'act_001');

  const tamperedToken = token.slice(0, -4) + 'abcd';
  const tamperedResult = verifyApprovalToken(tamperedToken, secret);
  assert.strictEqual(tamperedResult.valid, false);
}

function testClassifier() {
  const oom = classifyIncident('Process killed by cgroup out of memory event', 137);
  assert.strictEqual(oom.category, 'oom_killed');
  assert.strictEqual(oom.severity, 'SEV-1');
  assert.strictEqual(oom.requiresApproval, true);

  const auth = classifyIncident('GitHub API returned 401 Unauthorized: bad credentials');
  assert.strictEqual(auth.category, 'authentication');
  assert.strictEqual(auth.severity, 'SEV-2');
}

function testFormatter() {
  const html = formatHtmlEmail({
    tenantConfig: {
      tenant: {
        displayName: 'Acme SRE Bot',
        brandColor: '#2563eb',
        supportEmail: 'ops@acme.com'
      }
    },
    diagnosticReport: {
      severity: 'SEV-1',
      summary: 'API Container Crash',
      service: 'payment-svc',
      environment: 'prod',
      incidentId: 'inc_101',
      rootCause: 'OOM Killed',
      recommendedAction: {
        type: 'docker_restart',
        recommendation: 'Increase limits',
        requiresApproval: true
      }
    },
    approvalToken: 'sample.token',
    webhookBaseUrl: 'https://n8n.example.com'
  });

  assert(html.includes('Acme SRE Bot'));
  assert(html.includes('payment-svc'));
  assert(html.includes('Approve Action'));
}

function testCostLeakDetector() {
  const detector = new CostLeakDetector();
  const mockAzure = {
    provider: 'azure',
    leaks: [
      {
        type: 'azure_unattached_disk',
        name: 'disk-orphan-1',
        estimatedMonthlyWasteUsd: ESTIMATED_COSTS.AZURE_UNATTACHED_DISK_P10_MONTHLY
      }
    ],
    estimatedMonthlyWasteUsd: ESTIMATED_COSTS.AZURE_UNATTACHED_DISK_P10_MONTHLY
  };

  const mockDocker = {
    provider: 'docker',
    leaks: [
      {
        type: 'docker_dangling_images',
        actionRequired: 'docker image prune -f'
      }
    ],
    estimatedMonthlyWasteUsd: 15.00
  };

  const combined = detector.generateCombinedReport(mockAzure, mockDocker);
  assert.strictEqual(combined.totalLeaksFound, 2);
  assert.strictEqual(combined.projectedMonthlySavingsUsd, 34.71);
  assert.strictEqual(combined.projectedAnnualSavingsUsd, 416.52);
}

function testExecutiveRoiReport() {
  const html = buildExecutiveRoiReport({
    tenantConfig: {
      tenant: {
        displayName: 'Acme Cloud Ops',
        brandColor: '#0284c7',
        supportEmail: 'cto@acme.com'
      }
    },
    weeklyStats: {
      incidentsTriaged: 12,
      autonomousResolutions: 10,
      engineerHoursSaved: 7.5,
      estimatedDowntimeAvoidedUsd: 3750,
      cloudCostLeaksFoundUsd: 155
    }
  });

  assert(html.includes('Acme Cloud Ops'));
  assert(html.includes('$3,905'));
  assert(html.includes('7.5 hrs'));
}

function runAll() {
  testRedactor();
  testSigner();
  testClassifier();
  testFormatter();
  testCostLeakDetector();
  testExecutiveRoiReport();
  console.log('ALL EXTENDED TEST SUITE PASSED.');
}

runAll();
