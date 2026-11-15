# Odin DevOps Autonomous SRE Agent Architecture

## 1. System Vision
Odin DevOps is a multi-tenant, white-label autonomous Site Reliability Engineering (SRE) and DevOps automation platform. It bridges incident telemetry, version control (GitHub), container workloads (Docker), and cloud infrastructure (Azure) with AI-powered diagnostics and cryptographically verified Human-In-The-Loop (HITL) remediation.

## 2. Architectural Principles
- Zero-Trust Secret Scrubbing: All pipeline, container, and infrastructure logs pass through a deterministic token and credential scrubber before entering any AI context or notification channel.
- Least Privilege & Gated Remediation: Read operations (log retrieval, status checks, metric queries) are autonomous. Write operations (container restarts, PR rollbacks, Azure resource restarts) require cryptographically signed approval tokens.
- White-Label Multitenancy: All branding, notification endpoints, alert templates, and threshold policies are fully decoupled into configuration profiles.
- Transport Agnostic: Runs as native n8n workflows backed by hardened Node.js micro-modules or standalone CLI/SDK adapters.

## 3. High-Level System Architecture

```
+-----------------------------------------------------------------------------------+
|                                EVENT INGESTION                                    |
|  +-------------------+  +-------------------+  +-------------------+              |
|  |   GitHub Events   |  |   Docker Events   |  |   Azure Monitor   |              |
|  | (Actions, PR, CI) |  | (Crash, OOM, Ex)  |  |  (Metrics, Alert) |              |
|  +---------+---------+  +---------+---------+  +---------+---------+              |
+------------|----------------------|----------------------|------------------------+
             |                      |                      |
             +----------------------+----------------------+
                                    |
                                    v
+-----------------------------------------------------------------------------------+
|                        SECURITY & SANITIZATION LAYER                              |
|  +-----------------------------------------------------------------------------+  |
|  | Deterministic Secret Redactor (API Keys, Bearer Tokens, SSH Keys, Passwords)|  |
|  +-----------------------------------------------------------------------------+  |
|  | Rate Limiting, Deduplication & Static State Engine (Suppress Alert Storms)  |  |
+-----------------------------------┬-----------------------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------------------+
|                         AI DIAGNOSTIC & TRIAGE ENGINE                             |
|  +-----------------------------------------------------------------------------+  |
|  | Context Assembler (Correlates Event, Logs, Recent Commits & Service State)  |  |
|  +-----------------------------------------------------------------------------+  |
|  | LLM Diagnostic Core (Strict JSON Schema: Root Cause, Blast Radius, Fix)     |  |
|  +-----------------------------------------------------------------------------+  |
|  | Risk Classifier (SEV-1 to SEV-4, Autonomous vs HITL Gated Action)           |  |
+-----------------------------------┬-----------------------------------------------+
                                    |
                    +---------------+---------------+
                    |                               |
       [Low Risk / Read-Only]           [High Risk / Mutating]
                    |                               |
                    v                               v
+-----------------------+       +---------------------------------------------------+
| Autonomous Execution  |       |               HITL APPROVAL GATE                  |
| - Inspect logs        |       |  +---------------------------------------------+  |
| - Post PR diagnosis   |       |  | HMAC SHA-256 Time-Bounded Token Generator   |  |
| - Update health stats |       |  +---------------------------------------------+  |
+-----------------------+       |  | Multi-Channel Notification Dispatcher       |  |
                                |  | (Email, Slack, MS Teams, Telegram, Webhook) |  |
                                |  +---------------------------------------------+  |
                                |  | One-Click Webhook Approval / Rejection Gate |  |
                                +-------------------┬-------------------------------+
                                                    |
                                           [Approved by Admin]
                                                    |
                                                    v
+-----------------------------------------------------------------------------------+
|                           EXECUTION & REMEDIATION LAYER                           |
|  +---------------------+  +---------------------+  +---------------------------+  |
|  | GitHub Adapter      |  | Docker Adapter      |  | Azure Adapter             |  |
|  | - Dispatch Action   |  | - Safe Restart      |  | - Restart Container App   |  |
|  | - Revert PR / Tag   |  | - Prune Resources   |  | - Restart VM / ACI        |  |
|  | - Create Hotfix Br  |  | - Compose Control   |  | - Query Resource Health   |  |
+--+---------------------+--+---------------------+--+---------------------------+--+
                                    |
                                    v
+-----------------------------------------------------------------------------------+
|                       AUDIT LOGGING & STATUS REPORTING                            |
|  - Immutable Event Log (Execution ID, Approver ID, Action Result, Timestamps)    |
|  - Incident Post-Mortem Generator                                                 |
+-----------------------------------------------------------------------------------+
```

## 4. Component Breakdown

### 4.1 Ingestion Router
- Unified HTTP endpoint `/webhook/odin-devops-ingress`.
- Validates ingress signatures (GitHub HMAC `X-Hub-Signature-256`, Azure Monitor Webhook payload schema, Docker remote ping).
- Normalizes incoming payloads into a unified `OdinEvent` data structure.

### 4.2 Security & Sanitization Layer
- High-performance regular expression and entropy scanner.
- Masks authorization tokens, database connection strings, TLS private keys, and user-defined tenant secrets.
- Hashes and isolates identifiers to ensure multi-tenant security boundary compliance.

### 4.3 AI Diagnostic Core
- Accepts sanitized event traces and system context.
- Enforces structured JSON output matching `OdinDiagnosticReport`:
  - `summary`: Concise incident synopsis.
  - `rootCause`: Technical analysis of failure.
  - `service`: Target service identifier.
  - `severity`: `SEV-1` (Critical outage) down to `SEV-4` (Minor telemetry warning).
  - `proposedAction`: Safe machine-executable action definition.
  - `requiresApproval`: Boolean determining whether HITL gate is triggered.

### 4.4 Human-in-the-Loop (HITL) Gate
- Generates cryptographically signed URLs:
  `/webhook/odin-approval?token=<HMAC_SIGNATURE>&action=<ACTION_ID>&decision=approve`
- Enforces expiry (TTL default: 15 minutes) and one-time execution replay protection.
- Delivers action cards via branded Email (HTML), Slack interactive blocks, or Microsoft Teams adaptive cards.

### 4.5 Remediation & Cloud Adapters
- GitHub: Octokit REST & GraphQL wrapper for issues, runs, annotations, and dispatch.
- Docker: Docker Remote API / SSH execution with container state verification and rollback capabilities.
- Azure: Azure Resource Manager REST API via service principal authentication (OAuth 2.0 Client Credentials) managing VMs, Container Apps, and AKS deployments.

### 4.6 Audit Trail & Multi-Tenant Configuration
- JSON-based immutable audit records detailing every event, diagnostic trace, approval, and execution.
- Config-driven tenant profiles allowing full custom branding: organization name, logo, support email, enabled adapters, severity thresholds, and approval channels.
