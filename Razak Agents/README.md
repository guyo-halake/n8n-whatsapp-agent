# ODIN — All-in-One WhatsApp AI Sales & Customer Care Agent

> **Live Production Workflow in n8n**: `Odin - All-in-One WhatsApp Sales & Care Agent`
> **Workflow ID**: `Fi2WdhIJRIynNHN7`
> **Canvas URL**: https://p3lautomate.app.n8n.cloud/workflow/Fi2WdhIJRIynNHN7
> **Engine**: Google Gemini 1.5 / 3.0 Flash (`models/gemini-3-flash-preview`)
> **Identity**: P3l Developers (*"Code with P3l"*)
> **Folder**: `Razak Agents`

---

## ⚡ What is Odin?
Odin is an **all-in-one conversational sales and customer care agent** built natively for WhatsApp and powered by n8n and Google Gemini. It balances warm, authentic consultative selling with sharp qualification, instant objection handling, automated media delivery (portfolios, brochures), knowledge base answering, meeting booking, and payment processing.

It is **100% white-label and configuration-driven**: you can adapt Odin for any business (software agencies, salons, e-commerce, real estate, clinics, consulting) by simply adjusting `odin_config.json` or the config node inside n8n without rewriting any workflow logic.

---

## 🏗️ Architecture & Message Flow

```
[Customer on WhatsApp (+254...)]
         │
         ▼  (Inbound Message)
┌────────────────────────────────────────────────────────┐
│ WAHA (WhatsApp HTTP API - NOWEB Engine)                │
│ Port 5000 ──► Cloudflare Public Tunnel                 │
└───────────────────────────┬────────────────────────────┘
                            │ (POST webhook)
                            ▼
┌────────────────────────────────────────────────────────┐
│ 1. Universal WhatsApp Normalizer & Guard               │
│    - Strips formatting & sets sender_phone as session  │
│    - Detects origin: TikTok, Instagram, Ad, or Web     │
│    - Discards duplicate delivery receipts (read/sent)  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 2. Load White-Label Business DNA (P3l Developers)      │
│    - Injects company name, catalog, prices, and links  │
│    - Sets custom greeting tailored to lead's origin    │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 3. Odin AI Sales & Care Brain (Gemini + Window Memory) │
│    - 15-turn context memory per phone number           │
│    - BANT Qualification (Budget, Authority, Need, Time)│
│    - Consultative Selling (friendly, concise WhatsApp) │
└───────────────────────────┬────────────────────────────┘
                            │ (Autonomously Triggers Tools)
     ┌──────────────────────┼──────────────────────┐
     ▼                      ▼                      ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│search_catalog│     │query_        │     │send_media_   │
│(Services,    │     │knowledge_base│     │showcase      │
│Pricing & SOW)│     │(Hours, FAQs) │     │(PDFs/Images) │
└──────────────┘     └──────────────┘     └──────────────┘
     ▲                      ▲                      ▲
     ├──────────────────────┼──────────────────────┤
     ▼                      ▼                      ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│record_lead_  │     │generate_     │     │book_         │
│bant          │     │payment_link  │     │discovery_    │
│(Hot/Warm/Cold│     │(Stripe/Mpesa)│     │meeting       │
└──────────────┘     └──────────────┘     └──────────────┘
     ▲                      ▲                      ▲
     ├──────────────────────┴──────────────────────┤
     ▼                                             ▼
┌──────────────────────────┐          ┌──────────────────────────┐
│send_email_notification   │          │escalate_to_human         │
│(Internal Sales Alerts)   │          │(VIP/High-Budget Handoff) │
└──────────────────────────┘          └──────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 4. Format Outbound Dispatch                            │
│    - Formats clean WhatsApp-friendly response          │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 5. WAHA Send WhatsApp Reply (HTTP Node)                │
│    - Dispatches response back to customer phone        │
└────────────────────────────────────────────────────────┘
```

---

## 🛠️ The 8 Autonomous Tools Connected to Odin

1. **`search_catalog`**: Queries services, packages, deliverables, base pricing, and direct contract links from `odin_config.json`. Odin will never hallucinate or invent prices.
2. **`query_knowledge_base`**: Instantly answers frequently asked questions, business hours, team location, technologies used, SLA, and refund/revision policies.
3. **`send_media_showcase`**: Sends high-resolution portfolio images, product screenshots, or PDF capability decks directly into the WhatsApp chat.
4. **`record_lead_bant`**: Automatically captures and scores leads (`Cold`, `Warm`, `Hot`) based on Budget, Urgency, Need, and Authority for sync with Google Sheets or CRM.
5. **`generate_payment_link`**: Generates instant payment prompts, Stripe checkout links, M-Pesa paybill/till instructions, or wire details when a client is ready to start.
6. **`book_discovery_meeting`**: Shares direct calendar booking links (Calendly, Google Calendar) and suggests meeting slots.
7. **`send_email_notification`**: Automatically sends internal notifications to the sales engineering team (`devs@p3ldevelopers.com`) when meetings are booked or hot leads emerge.
8. **`escalate_to_human`**: Instantly alerts a human sales manager if the client explicitly requests a human, has an enterprise budget (e.g. >$5,000), or requires custom NDA contracts.

---

## 📲 How to Connect WAHA (Docker & WhatsApp Linking)

WAHA (WhatsApp HTTP API) runs locally in Docker and connects directly to WhatsApp using the high-performance `NOWEB` engine (socket-based, avoiding headless browser bot detection).

### 1. Run WAHA Container
```powershell
docker run -d --name waha `
  -p 5000:3000/tcp `
  -e WAHA_DASHBOARD_NO_PASSWORD=true `
  -e WAHA_NO_API_KEY=true `
  -e WAHA_WEBHOOK_URL=https://p3lautomate.app.n8n.cloud/webhook/whatsapp-odin-inbound `
  -e WAHA_WEBHOOK_EVENTS=message `
  --restart unless-stopped `
  devlikeapro/waha
```

### 2. Pair WhatsApp Phone Number (No Camera Needed)
You can link any WhatsApp number using an 8-character pairing code:
1. Open dashboard: `http://localhost:5000/dashboard`
2. Start or view session `default` with engine `NOWEB`.
3. In the pairing code input, enter your international phone number without `+` (e.g., `254141888585`).
4. On your mobile phone, open **WhatsApp > Settings > Linked Devices > Link a Device > Link with phone number instead**.
5. Type the 8-character code shown on screen. Status transitions to **WORKING**.

### 3. Expose Port 5000 to n8n Cloud via Cloudflare Tunnel
```powershell
cloudflared tunnel --url http://localhost:5000
```
Update the outbound node in n8n with the generated `trycloudflare.com` URL (or your static tunnel hostname).

---

## 📁 Files in This Directory

- `odin_whatsapp_sales_agent.json`: Production-ready n8n workflow export (16 nodes, Gemini agent, tools, error handling).
- `odin_config.json`: Master business identity file (company bio, services, FAQs, media links, payment options).
- `odin_whatsapp_sales_agent.js`: Node configuration definitions and tool function implementations.
- `README.md`: This architecture and operations guide.
