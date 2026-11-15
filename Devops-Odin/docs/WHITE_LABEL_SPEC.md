# Odin DevOps White-Label & Multi-Tenant Specification

## 1. Overview
The Odin DevOps platform is engineered for seamless rebranding, multi-tenant packaging, and reseller distribution. A managed service provider (MSP), agency, internal platform team, or software vendor can rebrand the platform without modifying core workflow logic.

## 2. Configuration Schema
All tenant identity and communication settings are managed via `config/tenant.config.json` or environment variables.

### 2.1 Configuration Attributes
```json
{
  "tenant": {
    "id": "acme-corp",
    "displayName": "Acme Cloud Ops Bot",
    "brandColor": "#0284c7",
    "logoUrl": "https://cdn.example.com/branding/logo.png",
    "supportEmail": "devops@example.com",
    "documentationUrl": "https://ops.example.com/docs"
  },
  "security": {
    "requireHmacApproval": true,
    "approvalTokenTtlMinutes": 15,
    "maxAutoRemediationRisk": "LOW"
  },
  "notifications": {
    "defaultChannel": "email",
    "email": {
      "enabled": true,
      "from": "Ops Bot <no-reply@ops.example.com>",
      "to": ["oncall@example.com"]
    },
    "slack": {
      "enabled": false,
      "webhookUrl": ""
    },
    "telegram": {
      "enabled": false,
      "chatId": ""
    },
    "teams": {
      "enabled": false,
      "webhookUrl": ""
    }
  },
  "integrations": {
    "github": {
      "enabled": true,
      "autoCommentOnPR": true
    },
    "docker": {
      "enabled": true,
      "allowedHosts": ["prod-srv-01", "staging-srv-01"]
    },
    "azure": {
      "enabled": true,
      "subscriptionId": "00000000-0000-0000-0000-000000000000"
    }
  }
}
```

## 3. White-Label Email Template Design
All outbound notification emails utilize a responsive, HTML email template that dynamically loads:
- Tenant Display Name
- Tenant Primary Color Header
- Incident Metadata (Service, Environment, Severity, Root Cause)
- One-Click Cryptographically Signed Approval Buttons:
  - `Approve Remediation` (Green CTA button)
  - `Reject Action` (Red Secondary button)
- Tenant Footer with Support Links and Disclaimer

## 4. Multi-Tenant Distribution Modes
1. **Self-Hosted Single-Tenant:** Deployed directly in the client's self-hosted n8n instance and private network.
2. **Managed Multi-Tenant:** Central n8n instance routing incoming webhooks to corresponding tenant configurations via `tenantId` query parameter or webhook slug (`/webhook/odin/:tenantId`).
