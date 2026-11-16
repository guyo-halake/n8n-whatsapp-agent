# Odin AI: Multi-Tenant Autonomous Agent Platform & Production Cloud Runtime

[![Azure Deployment](https://img.shields.io/badge/Azure%20App%20Service-guyoautomates.azurewebsites.net-0078D4?style=for-the-badge&logo=microsoft-azure)](https://guyoautomates.azurewebsites.net)
[![Production Status](https://img.shields.io/badge/System-Production%20Live-emerald?style=for-the-badge&logo=google)](https://guyoautomates.azurewebsites.net)
[![Evaluation Matrix](https://img.shields.io/badge/Evaluations-5%2F5%20PASS%20(100%25)-indigo?style=for-the-badge)](https://guyoautomates.azurewebsites.net)
[![AI Engine](https://img.shields.io/badge/AI%20Engine-Gemini%203.5%20ReAct%20Loop-blue?style=for-the-badge&logo=google-gemini)](https://guyoautomates.azurewebsites.net)
[![Database](https://img.shields.io/badge/Database-Supabase%20Cloud%20PostgreSQL-green?style=for-the-badge&logo=supabase)](https://guyoautomates.azurewebsites.net)

> **Lead Architect & Engineer:** **Razak Guyo**  
> **Production Cloud Endpoint:** [https://guyoautomates.azurewebsites.net](https://guyoautomates.azurewebsites.net)  
> **Repository:** [https://github.com/guyo-halake/n8n-whatsapp-agent](https://github.com/guyo-halake/n8n-whatsapp-agent)

---

## Architecture Overview

Odin AI is an enterprise-grade autonomous customer operations and sales platform. Engineered to run multi-turn reasoning loops with schema-enforced tool execution, multi-tenant database partitioning, and real-time human supervisor handoff.

```
+-----------------------------------------------------------------------------------+
|                              Omnichannel Gateways                                 |
|         WhatsApp (WAHA Engine)      Telegram Bot (@fv_rzkbot)      Web Dashboard  |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                           Production Server & Supervisor                          |
|         Process Watcher (supervisor.js)  |  Express/HTTP Router (server.js)       |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                        Autonomous ReAct Reasoning Loop                            |
|             Google Gemini 3.5 ReAct Engine (agent_runtime/react_runtime.js)        |
|                                                                                   |
|  Tools:                                                                           |
|   - query_catalog: Semantic RAG & structured search partitioned by tenant_id      |
|   - check_stock: Real-time inventory verification and price retrieval             |
|   - create_order: Validates addresses, phones, items, and persists orders         |
|   - escalate_to_human: Freezes bot, flags thread, and alerts operator             |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                         Supabase Cloud PostgreSQL Database                        |
|       - tenants: Business metadata, agent persona, currency, operating hours      |
|       - products / services: Partitioned catalogs with strict tenant isolation    |
|       - conversations & messages: Persistent multi-turn session history           |
|       - orders: Live customer purchase records and dispatch metadata              |
+-----------------------------------------------------------------------------------+
```

---

## Live Cloud Testing & Interactive Verification

The platform is deployed live on Microsoft Azure App Service. Clients, recruiters, and evaluators can verify capabilities in real time:

- **Live Web Console & Operator Inbox:** [https://guyoautomates.azurewebsites.net](https://guyoautomates.azurewebsites.net)
- **Live Health Endpoint:** [https://guyoautomates.azurewebsites.net/api/health](https://guyoautomates.azurewebsites.net/api/health)
- **Live Catalog API:** [https://guyoautomates.azurewebsites.net/api/products](https://guyoautomates.azurewebsites.net/api/products)
- **Omnichannel Telegram Bot:** [@fv_rzkbot](https://t.me/fv_rzkbot)

### Verification Scenarios

1. **Multi-Tenant Isolation Test:**
   - **Business 1: P3L Developers & Tech Shop (`Odin-P3L`)**: Ask *"What coding laptops do you recommend under 150k KES?"*. The agent retrieves live specs, warranty details, and stock from Supabase.
   - **Business 2: Luxe Nails & Spa Lounge (`Bella-Luxe`)**: Switch business context and ask *"Do you sell laptops?"*. The agent strictly enforces business isolation, stating it specializes in manicure, pedicure, and nail enhancements.

2. **Autonomous Tool Execution & Order Creation:**
   - Provide purchase details: *"I want to buy the HP EliteBook 840 G10, delivery to Westlands Nairobi, phone 0712345678."*
   - Gemini activates `create_order`, records the transaction in Supabase PostgreSQL, and triggers high-priority owner notification.

3. **Shared Operator Inbox & Human Takeover:**
   - In any active thread, state: *"I need to speak directly with the founder."*
   - The agent invokes `escalate_to_human`, sets conversation state to `Human Takeover`, silences autonomous bot responses, and surfaces the conversation in the Shared Operator Inbox for manual takeover.

4. **Tone & Quality Guardrails:**
   - Human, minimalist, professional English only.
   - Zero emojis, zero artificial jargon, zero repetitive template language.

---

## Project Structure

```
├── Razak Agents/
│   ├── agent_runtime/
│   │   ├── react_runtime.js     # Autonomous ReAct reasoning loop
│   │   └── tools.js             # Schema-validated tools (catalog, orders, escalation)
│   ├── features/                # Domain feature modules (onboarding, SLA, billing)
│   ├── server.js                # Core HTTP & Webhook server
│   ├── dashboard.html           # Live operator inbox & test chat sandbox
│   ├── db_service.js            # Supabase Cloud data access layer
│   ├── platform_service.js      # Multi-tenant execution bridge
│   ├── rag_engine.js            # Semantic knowledge retrieval
│   ├── telegram_service.js      # Telegram bot poller & dispatch
│   ├── test_suite.js            # 5/5 live end-to-end integration test suite
│   ├── odin_config.json         # Agent parameters & prompt configurations
│   └── odin_whatsapp_sales_agent.json # Exported n8n agent workflow
├── supervisor.js                # Zero-downtime auto-restarting process supervisor
├── ecosystem.config.js          # PM2 production process configuration
├── package.json                 # Node.js dependencies & scripts
└── .gitignore                   # Security rules (never commit secrets)
```

---

## Local Development & Testing

### 1. Environment Setup
Configure your environment variables in `.env` (gitignored):
```env
PORT=3300
NODE_ENV=production
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.5-flash-lite
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_OWNER_CHAT_ID=your_chat_id
```

### 2. Start the Application
Run via the production supervisor with auto-reload:
```bash
npm start
```
Or start the server directly:
```bash
npm run start:server
```

### 3. Run Production Integration Tests
Runs live tests against Gemini and Supabase:
```bash
npm test
```

---

## Deployment to Azure App Service

The application runs as a containerized Node.js 22 LTS App Service on Linux:
- Hostname: `guyoautomates.azurewebsites.net`
- Port binding: `WEBSITES_PORT=3300`
- Startup command: `node supervisor.js`
- Secrets injected via Azure Application Settings (never hardcoded in source control).

---

*Engineered by Razak Guyo — P3L Developers.*
