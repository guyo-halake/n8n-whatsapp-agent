# RAZAK ODIN: Enterprise Multi-Tenant AI Platform

> **Live Direct Chat with Agent**: [https://guyoautomates.azurewebsites.net/#chat](https://guyoautomates.azurewebsites.net/#chat) (or `/chat`)  
> **Production Cloud Portal**: [https://guyoautomates.azurewebsites.net](https://guyoautomates.azurewebsites.net)  
> **Live Supabase Project**: `https://muratasgegqmbkhmsevt.supabase.co`  
> **n8n Live Instance**: `https://p3lautomate.app.n8n.cloud/`  
> **Engine**: Google Gemini 3.5 ReAct Loop  
> **Folder**: `Razak Agents`

---

## 🏗️ System Components in this Directory

| File | Purpose |
| :--- | :--- |
| **[`schema.sql`](file:///c:/Users/guyoh/Desktop/N8N%20AUTOMATIONS/awesome-n8n-templates/Razak%20Agents/schema.sql)** | Complete idempotent PostgreSQL/Supabase DDL with Row Level Security (RLS), multi-line WhatsApp, two-tier escalation, and subscriptions. |
| **[`seed.sql`](file:///c:/Users/guyoh/Desktop/N8N%20AUTOMATIONS/awesome-n8n-templates/Razak%20Agents/seed.sql)** | Ready-to-go seed data for 3 turnkey templates: Restaurant/Cafe, Online Retail Shop, and Wellness/Services. |
| **[`gateway_router.json`](file:///c:/Users/guyoh/Desktop/N8N%20AUTOMATIONS/awesome-n8n-templates/Razak%20Agents/gateway_router.json)** | Importable n8n Master Gateway Workflow with Gemini Flash brain and dynamic Supabase catalog tool. |
| **[`gateway_router.js`](file:///c:/Users/guyoh/Desktop/N8N%20AUTOMATIONS/awesome-n8n-templates/Razak%20Agents/gateway_router.js)** | JavaScript/TypeScript n8n SDK definition of the Master Gateway. |
| **[`sub_mpesa_daraja.json`](file:///c:/Users/guyoh/Desktop/N8N%20AUTOMATIONS/awesome-n8n-templates/Razak%20Agents/sub_mpesa_daraja.json)** | Decoupled sub-workflow handling Safaricom Daraja M-Pesa STK push. |
| **[`sub_human_escalation.json`](file:///c:/Users/guyoh/Desktop/N8N%20AUTOMATIONS/awesome-n8n-templates/Razak%20Agents/sub_human_escalation.json)** | Decoupled sub-workflow alerting primary & secondary personnel on WhatsApp. |
| **[`dashboard.html`](file:///c:/Users/guyoh/Desktop/N8N%20AUTOMATIONS/awesome-n8n-templates/Razak%20Agents/dashboard.html)** | Modern self-service client dashboard template with isolated bot and catalog settings. |
| **[`supabase_client.js`](file:///c:/Users/guyoh/Desktop/N8N%20AUTOMATIONS/awesome-n8n-templates/Razak%20Agents/supabase_client.js)** | Data access service layer for tenant resolution, customer CRM, and sessions. |
| **[`test_suite.js`](file:///c:/Users/guyoh/Desktop/N8N%20AUTOMATIONS/awesome-n8n-templates/Razak%20Agents/test_suite.js)** | Automated validation test script. |
| **[`.env`](file:///c:/Users/guyoh/Desktop/N8N%20AUTOMATIONS/awesome-n8n-templates/Razak%20Agents/.env)** | Supabase credentials and Gemini API configurations. |

---

## 🚀 Quick Setup Instructions

### Step 1: Run the Database Migrations in Supabase
1. Open your [Supabase Dashboard](https://supabase.com/dashboard/project/muratasgegqmbkhmsevt).
2. Go to the **SQL Editor** tab on the left menu.
3. Open and copy the entire contents of **[`schema.sql`](file:///c:/Users/guyoh/Desktop/N8N%20AUTOMATIONS/awesome-n8n-templates/Razak%20Agents/schema.sql)**, paste it in, and click **Run**.
4. Next, copy the contents of **[`seed.sql`](file:///c:/Users/guyoh/Desktop/N8N%20AUTOMATIONS/awesome-n8n-templates/Razak%20Agents/seed.sql)**, paste it in, and click **Run**.
   *This automatically seeds the 3 production templates (Mama Oliech Grills, Nairobi Kicks, and Luxe Glow Spa).*

### Step 2: Import the Workflow into n8n
1. Open your n8n workspace at `https://p3lautomate.app.n8n.cloud/`.
2. Click **Add workflow** > **Import from File**.
3. Select **[`gateway_router.json`](file:///c:/Users/guyoh/Desktop/N8N%20AUTOMATIONS/awesome-n8n-templates/Razak%20Agents/gateway_router.json)**.
4. Activate the workflow!

### Step 3: Run the Test Suite
Run the test script to verify live connectivity:
```powershell
node ".\Razak Agents\test_suite.js"
```

## Production payment safety

The Paystack secret and Africa's Talking API key must be supplied only through
deployment secrets:

```text
PAYSTACK_SECRET_KEY=...
PAYSTACK_PUBLIC_KEY=...
AFRICASTALKING_API_KEY=...
AFRICASTALKING_USERNAME=...
```

Do not put these values in source files, dashboard HTML, logs, or API
responses. Run the additions at the end of `schema.sql` (or
`all_in_one_setup.sql`) before enabling Paystack webhooks. The webhook endpoint
is `/api/paystack-webhook`; configure Paystack to send events there. It
authenticates the signature, verifies the transaction with Paystack, deduplicates
the event, and only then marks the linked order as paid and creates a ledger
entry. No payment is recorded when the customer only claims to have paid.
