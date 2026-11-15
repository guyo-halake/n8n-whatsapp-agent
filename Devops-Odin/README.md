# Odin DevOps Autonomous SRE Platform (Commercial Edition)

Production-grade, white-label autonomous DevOps & Site Reliability Engineering (SRE) platform. Bridges incident telemetry across **GitHub**, **Docker**, and **Azure** with zero-leak secret redaction, AI root-cause diagnostics, cryptographically verified Human-In-The-Loop (HITL) remediation, and automated cloud cost leak detection.

---

## 1. Directory Structure

```
Devops-Odin/
├── dashboard/
│   └── index.html               # White-label client cockpit (Tailwind CSS, dark mode)
├── docs/
│   ├── ARCHITECTURE.md          # Full system architecture and component flow
│   ├── FEATURES.md              # Feature matrix and API contracts
│   └── WHITE_LABEL_SPEC.md      # Multi-tenant rebranding specification
├── config/
│   ├── tenant.config.json       # Tenant branding, security, and notification settings
│   └── .env.example             # Required environment variables
├── scripts/
│   ├── install.sh               # 1-command client server onboarding script
│   └── odin-agent.sh            # Outbound daemon streaming Docker events to n8n
├── src/
│   ├── core/
│   │   ├── redactor.js          # Zero-trust secret and token scrubber
│   │   ├── classifier.js        # Deterministic incident & exit-code classifier
│   │   └── audit.js             # Structured immutable audit logger
│   ├── security/
│   │   └── signer.js            # HMAC SHA-256 time-bounded token signer
│   └── adapters/
│       ├── vcs/github.js        # GitHub API adapter (logs, comments, dispatches)
│       ├── containers/docker.js # Docker Engine & Compose executor
│       ├── cloud/
│       │   ├── azure.js         # Azure ARM REST API adapter
│       │   └── cost_leak_detector.js # Unattached disks & dangling resource detector
│       └── notifications/
│           ├── formatter.js     # Responsive HTML email & Slack block builder
│           └── executive_report.js # Monday morning CTO savings & ROI briefing
├── workflows/
│   ├── odin-webhook-router.json        # Ingress router & secret scrubber
│   ├── odin-ai-sre-engine.json         # Diagnostic core & triage
│   ├── odin-hitl-approval-gateway.json # Cryptographic approval callback & email
│   └── odin-remediation-executor.json  # Multi-provider remediation executor
└── tests/
    └── suite.test.js            # Automated unit test suite
```

---

## 2. Commercial Features & Value Proposition

### 1. Cloud Cost Leak Detection (Immediate ROI)
Scans Azure Resource Manager for unattached Managed Disks (\$19.71/mo each) and scans Docker hosts for dangling volumes and unused images. Delivers direct dollar savings within 48 hours of onboarding.

### 2. Monday Morning Executive ROI Briefing
Autonomous weekly digest emailed to the CTO / VP of Engineering calculating:
- Total downtime costs avoided.
- Engineer hours reclaimed.
- Mean Time To Resolve (MTTR) reduction.
- Cloud cost leaks identified.

### 3. Outbound-Only Client Onboarding (`install.sh`)
Clients do not need to open inbound SSH Port 22. A single curl command installs `odin-agent.service` which streams local Docker events (`die`, `oom`) over outbound HTTPS directly to your n8n webhook.

### 4. White-Label Client Cockpit (`dashboard/index.html`)
Modern, responsive operational dashboard displaying live fleet status, pending 1-click approvals, cost leak alerts, and real-time audit feeds.

---

## 3. Verification & Execution

### Run Full Test Suite
```bash
node Devops-Odin/tests/suite.test.js
# Output: ALL EXTENDED TEST SUITE PASSED.
```

### Install Daemon on Client Host
```bash
curl -fsSL https://<your-domain>/install.sh | sudo bash -s -- \
  --url "https://<your-n8n-domain>/webhook/odin-devops-ingress" \
  --token "<TENANT_SECRET_TOKEN>" \
  --env "production"
```
