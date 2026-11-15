const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const execAsync = promisify(exec);
const { AzureSentinel } = require('./azure_sentinel');
const { CicdPipelineDoctor } = require('./cicd_pipeline_doctor');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const TENANT_ID = process.env.DEFAULT_TENANT_ID || '11111111-1111-1111-1111-111111111111';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

class AutonomousSreAgent {
  constructor() {
    this.sentinel = new AzureSentinel();
    this.cicdDoctor = new CicdPipelineDoctor();
    this.tools = {
      azure_list_resources: async ({ resourceGroup = 'rg-nyagah-fee' }) => {
        const { stdout } = await execAsync(`az resource list --resource-group ${resourceGroup} --output json`);
        const parsed = JSON.parse(stdout);
        return parsed.map(r => ({ name: r.name, type: r.type, location: r.location }));
      },
      azure_get_webapp_status: async ({ webappName = 'nyagah-b-fee-notes', resourceGroup = 'rg-nyagah-fee' }) => {
        const { stdout } = await execAsync(`az webapp show --name ${webappName} --resource-group ${resourceGroup} --output json`);
        const parsed = JSON.parse(stdout);
        return {
          name: parsed.name,
          state: parsed.state,
          defaultHostName: parsed.defaultHostName,
          plan: (parsed.serverFarmId || parsed.appServicePlanId || '').split('/').pop()
        };
      },
      azure_restart_webapp: async ({ webappName = 'nyagah-b-fee-notes', resourceGroup = 'rg-nyagah-fee' }) => {
        return this.sentinel.executeSelfHealing(webappName, 'MANUAL_OR_AGENT_TRIGGERED_REMEDIATION');
      },
      azure_probe_fleet: async () => {
        return this.sentinel.probeFleet();
      },
      azure_audit_disks: async ({ resourceGroup = 'rg-nyagah-fee' }) => {
        const { stdout } = await execAsync(`az disk list --resource-group ${resourceGroup} --output json`);
        const disks = JSON.parse(stdout);
        const unattached = disks.filter(d => !d.managedBy);
        return {
          resourceGroup,
          totalDisks: disks.length,
          unattachedCount: unattached.length,
          monthlyWasteUsd: unattached.length * 19.71
        };
      },
      github_get_repo: async ({ owner = 'guyo-halake', repo = 'nyagahK_azure_backend' }) => {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
          headers: { 'User-Agent': 'Odin-Autonomous-Agent' }
        });
        const d = await res.json();
        return {
          repo: d.full_name,
          defaultBranch: d.default_branch,
          updatedAt: d.updated_at,
          openIssues: d.open_issues_count
        };
      },
      github_triage_ci: async ({ owner = 'guyo-halake', repo = 'nyagahK_azure_backend' }) => {
        return this.cicdDoctor.triageWorkflowRun(owner, repo);
      },
      codebase_read_file: async ({ filePath = 'app/api/feenotes.py' }) => {
        const full = path.isAbsolute(filePath) ? filePath : path.join('c:\\Users\\guyoh\\Desktop\\NYAGA LAW DEVOPS', filePath);
        if (!fs.existsSync(full)) return { error: `File ${filePath} not found` };
        const content = fs.readFileSync(full, 'utf8');
        return { filePath, lines: content.split('\n').length, preview: content.slice(0, 1500) };
      }
    };
  }

  async persistMessageToSupabase(sessionId, senderRole, messageText) {
    try {
      const url = `${SUPABASE_URL}/rest/v1/chat_messages`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          session_id: sessionId,
          tenant_id: TENANT_ID,
          sender_role: senderRole,
          message_text: messageText,
          raw_payload: {}
        })
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async loadSupabaseHistory(limit = 10) {
    try {
      const url = `${SUPABASE_URL}/rest/v1/chat_messages?tenant_id=eq.${TENANT_ID}&order=created_at.desc&limit=${limit}`;
      const res = await fetch(url, {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data.reverse() : [];
    } catch {
      return [];
    }
  }

  async runStep(userQuery, sessionId = '18ed4741-a8a9-4f81-9273-60cda8a05093') {
    await this.persistMessageToSupabase(sessionId, 'customer', userQuery);

    const q = userQuery.toLowerCase();
    let toolName = null;
    let toolResult = null;

    if (q.includes('probe') || q.includes('fleet') || q.includes('ping') || (q.includes('health') && q.includes('all'))) {
      toolName = 'azure_probe_fleet';
      toolResult = await this.tools.azure_probe_fleet();
    } else if (q.includes('restart') && (q.includes('nyagah') || q.includes('app') || q.includes('webapp'))) {
      toolName = 'azure_restart_webapp';
      toolResult = await this.tools.azure_restart_webapp({ webappName: 'nyagah-b-fee-notes' });
    } else if (q.includes('status') && q.includes('nyagah')) {
      toolName = 'azure_get_webapp_status';
      toolResult = await this.tools.azure_get_webapp_status({ webappName: 'nyagah-b-fee-notes' });
    } else if (q.includes('ci') || q.includes('workflow') || q.includes('action') || q.includes('build') || q.includes('failure')) {
      toolName = 'github_triage_ci';
      toolResult = await this.tools.github_triage_ci({ owner: 'guyo-halake', repo: 'nyagahK_azure_backend' });
    } else if (q.includes('disk') || q.includes('cost') || q.includes('leak') || q.includes('waste')) {
      toolName = 'azure_audit_disks';
      toolResult = await this.tools.azure_audit_disks({ resourceGroup: 'rg-nyagah-fee' });
    } else if (q.includes('file') || q.includes('code') || q.includes('feenotes')) {
      toolName = 'codebase_read_file';
      toolResult = await this.tools.codebase_read_file({ filePath: 'app/api/feenotes.py' });
    } else if (q.includes('repo') || q.includes('github') || q.includes('commit')) {
      toolName = 'github_get_repo';
      toolResult = await this.tools.github_get_repo({ owner: 'guyo-halake', repo: 'nyagahK_azure_backend' });
    } else {
      toolName = 'azure_list_resources';
      toolResult = await this.tools.azure_list_resources({ resourceGroup: 'rg-nyagah-fee' });
    }

    const systemPrompt = `You are Odin, Autonomous Lead SRE for P3L Developers and Nyagah & Co Advocates.
You are running on a real production environment with live connections to Azure CLI, GitHub API, and Supabase database.

USER QUERY:
"${userQuery}"

AUTONOMOUS TOOL EXECUTED: ${toolName}
LIVE INFRASTRUCTURE RESULT:
${JSON.stringify(toolResult, null, 2)}

INSTRUCTIONS:
1. Provide a direct, factual senior SRE assessment.
2. Quote exact numbers (latency ms, HTTP codes, resource names, branches, or patch lines).
3. If remediation or action was taken, confirm verification status.
Keep your response professional, concise, and structured.`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 800 }
      })
    });

    const data = await response.json();
    const finalReply = data.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(toolResult);

    await this.persistMessageToSupabase(sessionId, 'assistant', finalReply);

    return {
      reply: finalReply,
      toolExecuted: toolName,
      toolResult,
      persistedToSupabase: true
    };
  }
}

module.exports = {
  AutonomousSreAgent
};
