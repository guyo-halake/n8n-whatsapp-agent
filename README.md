# Odin AI: Multi-Tenant Autonomous Agent 

[![Azure Deployment](https://img.shields.io/badge/Azure%20App%20Service-guyoautomates.azurewebsites.net-0078D4?style=for-the-badge&logo=microsoft-azure)](https://guyoautomates.azurewebsites.net)
[![Live Chat with Agent](https://img.shields.io/badge/Live%20Demo-Chat%20With%20Agent-purple?style=for-the-badge&logo=openai)](https://guyoautomates.azurewebsites.net/#chat)
[![Production Status](https://img.shields.io/badge/System-Production%20Live-emerald?style=for-the-badge&logo=google)](https://guyoautomates.azurewebsites.net)



> **Direct Live Agent Chat Console:** [https://guyoautomates.azurewebsites.net/#chat](https://guyoautomates.azurewebsites.net/#chat)  
> **Production Cloud Portal:** [https://guyoautomates.azurewebsites.net](https://guyoautomates.azurewebsites.net)  


---

## Architecture Overview

Od

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


1. **Multi-Tenant Isolation Test:**
   - **Business 1: P3L Developers & Tech Shop (`Odin-P3L`)**: Ask *"What coding laptops do you recommend under 150k KES?"*. The agent retrieves live specs, warranty details, and stock from Supabase.
   - **Business 2: Luxe Nails & Spa Lounge (`Bella-Luxe`)**: Switch business context and ask *"Do you sell laptops?"*. The agent strictly enforces business isolation, stating it specializes in manicure, pedicure, and nail enhancements.





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


