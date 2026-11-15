# Odin DevOps Feature Specification

## 1. Feature Matrix

| Domain | Feature | Automation Mode | Description |
|---|---|---|---|
| **Security** | Zero-Leak Secret Scrubber | Autonomous | Scrubs JWTs, API tokens, passwords, AWS/Azure keys, and SSH private keys prior to AI processing or logging. |
| **Security** | Cryptographic Approval Links | Gated (HITL) | HMAC SHA-256 signed, time-limited single-use tokens for remote actions. |
| **VCS / GitHub** | CI/CD Run Doctor | Autonomous | Fetches GitHub Action run logs, locates step errors, redacts secrets, diagnoses failure, and posts comment on PR/commit. |
| **VCS / GitHub** | PR Quality & Dockerfile Guard | Autonomous | Audits pull request diffs for dangerous patterns (root container execution, unpinned tags, exposed ports). |
| **VCS / GitHub** | Pipeline Rollback Trigger | Gated (HITL) | Dispatches workflow rollback runs or reverts breaking deployment tags upon authorized sign-off. |
| **Containers** | Docker Engine & Compose Controller | Hybrid | Inspects container status, reads tail logs, tests health endpoints, and initiates container restarts. |
| **Containers** | CrashLoopBackOff & OOM Hunter | Autonomous | Detects exit codes 137 (OOM), 139 (Segfault), and 1 (App crash) with immediate root cause deduction. |
| **Containers** | Dangling Resource Pruning | Gated (HITL) | Reclaims system disk space by safely pruning unused build cache, networks, and stopped containers. |
| **Cloud / Azure** | Azure Monitor Alert Ingestion | Autonomous | Ingests Common Alert Schema v2 webhooks (Metric alerts, Log alerts, Activity log events). |
| **Cloud / Azure** | Container Apps / VM Health Check | Autonomous | Queries Azure Resource Health API for availability states (`Available`, `Degraded`, `Unavailable`). |
| **Cloud / Azure** | Azure Resource Safe Reboot | Gated (HITL) | Triggers restart of target Azure Container Apps, App Services, or Virtual Machines with audit tracking. |
| **Operations** | Intelligent Alert Deduplication | Autonomous | Prevents alert storms by caching incident state; only alerts on state transitions and recoveries. |
| **White-Label** | Multi-Channel Branded Dispatcher | Autonomous | Delivers incident summaries and action cards via HTML Email, Slack, Teams, Telegram, and Discord. |
| **Compliance** | Audit Event Trail | Autonomous | Emits auditable JSON structured events for every ingested alert, diagnostic output, and remediation action. |

---

## 2. Technical Contracts

### 2.1 Unified Event Object (`OdinEvent`)
```json
{
  "id": "evt_98f12a34bc",
  "timestamp": "2026-11-05T14:30:00.000Z",
  "tenantId": "default",
  "source": "github | docker | azure | watchdog",
  "eventType": "ci_failed | container_down | resource_alert | disk_warning",
  "service": "api-gateway",
  "environment": "production",
  "payload": {
    "rawLogs": "...",
    "metadata": {}
  }
}
```

### 2.2 Diagnostic Report (`OdinDiagnosticReport`)
```json
{
  "incidentId": "inc_4410a8",
  "timestamp": "2026-11-05T14:30:05.000Z",
  "service": "api-gateway",
  "environment": "production",
  "severity": "SEV-1 | SEV-2 | SEV-3 | SEV-4",
  "summary": "Container terminated with Exit Code 137 (OOM Killer).",
  "rootCause": "Node.js heap allocation exceeded 512MB memory limit during batch image transform.",
  "recommendedAction": {
    "actionId": "act_882910",
    "type": "docker_restart_with_bump",
    "target": "api-gateway",
    "parameters": {
      "service": "api-gateway",
      "restart": true
    },
    "requiresApproval": true,
    "riskLevel": "MEDIUM"
  }
}
```
