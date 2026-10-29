# ⚡ Odin WhatsApp AI Agent & n8n Automation Suite

[![n8n.io](https://img.shields.io/badge/built%20with-n8n-EA4B71?style=flat-square&logo=n8n)](https://n8n.io)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-WAHA%20Gateway-25D366?style=flat-square&logo=whatsapp)](https://waha.devlike.pro)
[![Gemini](https://img.shields.io/badge/AI%20Brain-Google%20Gemini-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)
[![Docker](https://img.shields.io/badge/Deployment-Docker%20%2B%20Cloudflare-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)

A production-grade, enterprise-ready repository featuring **Odin** (the all-in-one conversational WhatsApp AI Sales & Customer Care Agent by **P3l Developers** / *"Code with P3l"*), accompanied by curated workflow libraries for **WhatsApp automations** and **DevOps & reliability engineering**.

---

## 📂 Repository Structure

```
n8n-whatsapp-agent/
├── Razak Agents/                # 🧠 The Flagship Odin AI WhatsApp Sales & Care System
│   ├── odin_config.json         # Dynamic White-Label Business DNA & Knowledge Base
│   ├── odin_whatsapp_sales_agent.json  # Complete 16-node production n8n workflow export
│   ├── odin_whatsapp_sales_agent.js    # Node scripts, tool logic, and normalizers
│   └── README.md                # Dedicated Odin architectural documentation
├── WhatsApp/                    # 💬 9 Pre-built Production WhatsApp Workflows
│   ├── Automate Sales Meeting Prep with AI & APIFY Sent To WhatsApp.json
│   ├── Building Your First WhatsApp Chatbot.json
│   ├── Capture WhatsApp Leads to Google Sheets with Instant Hebrew Auto-Reply.json
│   ├── Complete business WhatsApp AI-Powered RAG Chatbot using OpenAI.json
│   ├── LeadBot 24h - AI WhatsApp Lead Qualification.json
│   ├── Qualify WhatsApp leads with an AI agent on the Meta Cloud API with handoff and follow-ups.json
│   ├── Receive and Send Messages Across WhatsApp, Instagram and Facebook Messenger with Fiwano.json
│   ├── Respond to WhatsApp Messages with AI Like a Pro!.json
│   └── Send Escalating WhatsApp Invoice Reminders from Google Sheets (Hebrew).json
├── devops/                      # 🛠️ 9 Production DevOps, Monitoring & SRE Workflows
│   ├── Audit a Public Page and Build an Automation Acceptance Pack.json
│   ├── Detect Empty Workflow Outputs with an Optional Keptick Receipt.json
│   ├── disk-space-watchdog.json
│   ├── docker-compose-controller.json
│   ├── GitHub Stars and Dev.to Engagement Monitor.json
│   ├── linux-update-via-webhook.json
│   ├── n8n Silent Workflow Check.json
│   ├── n8n-failed-execution-doctor.json
│   └── uptime-ping-alert.json
└── README.md                    # Root documentation and getting started guide
```

---

## 🌟 Spotlight: Odin AI Sales & Customer Care Agent

**Odin** is an autonomous AI agent engineered specifically for WhatsApp. Designed for businesses, agencies, and e-commerce brands, Odin doesn't just answer questions—it actively leads discovery, qualifies prospects using the **BANT framework** (Budget, Authority, Need, Timing), showcases portfolio media, checks knowledge base guidelines, schedules discovery calls, generates instant checkout links, and escalates complex enterprise leads to human staff.

### 🎯 Key Capabilities

- **100% White-Label & Config-Driven**: Change the business identity, services, base pricing, FAQs, and hours in [Razak Agents/odin_config.json](file:///Razak%20Agents/odin_config.json) without touching the agent's core workflow.
- **8 Autonomous Agent Tools**:
  1. `search_catalog`: Look up verified service packages, pricing, deliverables, and SOW links.
  2. `query_knowledge_base`: Answers FAQs, working hours, business address, and policies.
  3. `send_media_showcase`: Delivers portfolio screenshots, demo images, and PDF capability decks directly via WhatsApp.
  4. `record_lead_bant`: Real-time BANT lead scoring (`Cold`, `Warm`, `Hot`).
  5. `generate_payment_link`: Creates Stripe checkout links, bank details, or M-Pesa paybill/till instructions.
  6. `book_discovery_meeting`: Shares direct Calendly / Google Calendar booking links.
  7. `send_email_notification`: Automatically alerts internal sales teams (`devs@p3ldevelopers.com`) when high-intent leads book meetings.
  8. `escalate_to_human`: Instant human handoff for custom contract inquiries or high-budget enterprise prospects.
- **Universal Payload Normalization**: Ingests payloads from WAHA, Cloud API, or webhook tests cleanly, stripping out delivery receipt noise and extracting sender phone numbers for persistent 15-turn session memory.
- **Anti-Bot Engine (NOWEB)**: Uses WAHA with Baileys socket integration, avoiding Chromium-based detection and enabling 8-character pairing codes without requiring a camera scan.

---

## 🚀 Quick Start Guide

### 1. Run WhatsApp Gateway (WAHA) with Docker
WAHA provides a clean REST API for WhatsApp without monthly API fees or per-conversation Meta pricing.

Run in PowerShell or terminal:
```bash
docker run -d --name waha \
  -p 5000:3000/tcp \
  -e WAHA_DASHBOARD_NO_PASSWORD=true \
  -e WAHA_NO_API_KEY=true \
  -e WAHA_WEBHOOK_URL=https://<your-n8n-instance>/webhook/whatsapp-odin-inbound \
  -e WAHA_WEBHOOK_EVENTS=message \
  --restart unless-stopped \
  devlikeapro/waha
```

### 2. Pair Your WhatsApp Number
1. Navigate to `http://localhost:5000/dashboard`.
2. Start session `default` using the **NOWEB** engine.
3. Enter your phone number (e.g., `254141888585`) to generate an 8-character pairing code.
4. On your phone: Open WhatsApp > **Settings > Linked Devices > Link a Device > Link with phone number instead** and enter the code.
5. Your session will transition to **WORKING**.

### 3. Expose Local WAHA to n8n Cloud (via Cloudflare Tunnel)
If your n8n instance is hosted on the cloud (e.g., n8n.cloud), create a secure outbound tunnel:
```bash
cloudflared tunnel --url http://localhost:5000
```
Copy the generated `https://*.trycloudflare.com` URL into n8n's **Send WAHA Text** HTTP request node.

### 4. Import the Workflow into n8n
1. Open your n8n workspace.
2. Click **Add Workflow > Import from File**.
3. Select `Razak Agents/odin_whatsapp_sales_agent.json`.
4. Configure your Google Generative AI / Gemini credentials.
5. Activate the workflow!

---

## 📦 WhatsApp Template Catalog (`WhatsApp/`)

| Workflow File | Description | Integrations |
| :--- | :--- | :--- |
| `Automate Sales Meeting Prep with AI & APIFY Sent To WhatsApp.json` | Scrapes prospect website/LinkedIn with Apify before sales calls, synthesizes an executive briefing with AI, and delivers it to WhatsApp. | Apify, OpenAI, WhatsApp |
| `Building Your First WhatsApp Chatbot.json` | Lightweight starter template demonstrating incoming message parsing, conditional routing, and auto-replies. | Webhook, WhatsApp |
| `Capture WhatsApp Leads to Google Sheets with Instant Hebrew Auto-Reply.json` | Captures incoming WhatsApp inquiries, writes lead data to Google Sheets, and sends localized instant confirmations. | Google Sheets, WhatsApp |
| `Complete business WhatsApp AI-Powered RAG Chatbot using OpenAI.json` | Advanced RAG bot utilizing vector document search and OpenAI embeddings to answer detailed enterprise product queries. | OpenAI, Vector Store, WhatsApp |
| `LeadBot 24h - AI WhatsApp Lead Qualification.json` | 24/7 autonomous qualification agent filtering cold leads and scheduling appointments for sales reps. | AI Agent, Google Sheets |
| `Qualify WhatsApp leads with an AI agent on the Meta Cloud API with handoff and follow-ups.json` | Official Meta Cloud API workflow with dynamic follow-up triggers and human agent handoff logic. | Meta Cloud API, AI Agent |
| `Receive and Send Messages Across WhatsApp, Instagram and Facebook Messenger with Fiwano.json` | Unified multi-channel inbox orchestration linking WhatsApp, Instagram DMs, and Messenger through Fiwano. | Fiwano, Omnichannel |
| `Respond to WhatsApp Messages with AI Like a Pro!.json` | High-EQ AI response generator using conversational tone guidelines and objection handling prompts. | OpenAI, WhatsApp |
| `Send Escalating WhatsApp Invoice Reminders from Google Sheets (Hebrew).json` | Automated accounts receivable workflow sending staged reminder messages (friendly, firm, urgent) based on due dates. | Google Sheets, WhatsApp |

---

## 🛠️ DevOps & Reliability Catalog (`devops/`)

| Workflow File | Description | Target Use Case |
| :--- | :--- | :--- |
| `disk-space-watchdog.json` | Monitors server disk usage thresholds and fires instant emergency alerts via Slack/Email before partitions fill. | Server Monitoring / Disk Alerts |
| `docker-compose-controller.json` | Webhook-driven controller that executes Docker Compose pull, restart, and healthcheck operations remotely. | CI/CD & Remote Container Ops |
| `n8n-failed-execution-doctor.json` | Subscribes to n8n error triggers, inspects stack traces, diagnoses node failures, and reports incidents to Slack. | n8n Observability & Diagnostics |
| `n8n Silent Workflow Check.json` | Periodically audits critical workflows to ensure scheduled cron jobs and webhooks haven't silently stalled. | Proactive n8n Audit |
| `uptime-ping-alert.json` | Lightweight periodic heartbeat monitor checking critical endpoints and microservices with downtime alerting. | Uptime & Service Health |
| `GitHub Stars and Dev.to Engagement Monitor.json` | Tracks repository traction and blog engagement metrics with aggregated reporting. | Developer Relations & Growth |
| `linux-update-via-webhook.json` | Secure webhook receiver triggering unattended package upgrades and system maintenance tasks. | Linux Server Management |
| `Audit a Public Page and Build an Automation Acceptance Pack.json` | Automates end-to-end page health checks, accessibility verification, and acceptance report generation. | QA & Acceptance Testing |
| `Detect Empty Workflow Outputs with an Optional Keptick Receipt.json` | Catches silent pipeline regressions where upstream nodes return empty arrays or null payloads. | Data Integrity Guard |

---

## ⚙️ Configuration Reference (`odin_config.json`)

To customize Odin for any client or store, edit `Razak Agents/odin_config.json`:

```json
{
  "business": {
    "name": "P3l Developers",
    "tagline": "Code with P3l - High-Impact AI Automation & Full-Stack Solutions",
    "support_email": "devs@p3ldevelopers.com",
    "location": "Nairobi, Kenya (Global Remote Service)"
  },
  "calendar_booking_url": "https://calendly.com/p3ldevelopers/ai-discovery-30min",
  "payment": {
    "mpesa": { "paybill": "522522", "account": "P3L-DEV" },
    "stripe": "https://buy.stripe.com/p3l_ai_starter"
  }
}
```

---

## 🔒 Security & Best Practices

- **Never commit `.env` or plain API keys**: Store all credentials in n8n's encrypted credential vault.
- **Rate Limiting**: The Gemini agent node is preconfigured with exponential backoff and retry rules to handle API quotas smoothly.
- **Port Isolation**: Keep WAHA running behind a reverse proxy or authenticated tunnel in production environments.

---

## 📄 License

MIT License. Free to use, adapt, and deploy for commercial client solutions. Built with ❤️ by **P3l Developers** (*"Code with P3l"*).
