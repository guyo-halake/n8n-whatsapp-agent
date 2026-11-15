# 🚀 Advanced Dual AI Agents for n8n

This directory contains two production-grade, architectural-grade n8n agent automations designed to solve personal operations, engineering, academic management, autonomous lead generation, and omnichannel customer sales/support.

---

## 📂 Architecture Overview

```
custom_agents/
├── odin_personal_copilot_workflow.json          # Agent 1: Odin - Personal Chief of Staff
├── business_omnichannel_concierge_workflow.json # Agent 2: Omnichannel Business Concierge
├── generate_agents.py                           # Python builder script
├── verify_agents.py                             # Schema & connection validator
└── README.md                                    # Complete architectural guide & setup manual
```

---

## ⚡ Agent 1: ODIN — Personal AI Chief of Staff & Engineering Sentinel

**File:** [`odin_personal_copilot_workflow.json`](./odin_personal_copilot_workflow.json)

Odin is a sovereign, high-agency AI executive designed to eliminate context switching across school, software engineering, cloud infrastructure, and business growth.

### 🌟 Key Capabilities
1. **Interactive Reactive Copilot (Telegram Inbound)**:
   - Direct Telegram conversational interface with session memory buffer.
   - Text or voice-directed task execution.
2. **Autonomous Morning Command Standup (Cron 07:30 AM)**:
   - Runs every morning to aggregate today's classes, assignment deadlines, GitHub priorities, cloud health, and overnight business leads into an executive digest.
3. **9 Multi-Domain Toolsets Equipped**:
   - 📅 **Google Calendar & Agenda**: Schedule checks, meeting planning, conflict detection.
   - 📚 **School LMS & Assignments Portal**: Canvas/Moodle/Blackboard upcoming homework, exam dates, and due date alerts.
   - 💻 **GitHub Issues & Code Analyzer**: Pulls open repository issues, analyzes error logs, categorizes priority, and suggests daily tasks.
   - 📖 **Project Docs RAG**: Technical architecture search and internal documentation queries.
   - ☁️ **Azure Cloud Monitor**: Queries Azure Resource Health, service degradations, and active alerts.
   - 🩺 **n8n Doctor**: Local/remote n8n execution monitor that flags failed workflows, node error traces, and uptime.
   - 🎯 **Reddit Lead Hunter**: Scrapes targeted subreddits (`r/freelance`, `r/forhire`, `r/smallbusiness`, `r/automation`) for buying signals and automation client requests.
   - 📱 **TikTok & Social Prospector**: Scrapes/searches social platforms for business accounts in target niches.
   - ⏰ **Custom Tasks & Reminders**: Automatically adds items to Todoist, Google Tasks, or Notion.

---

## 💼 Agent 2: Omnichannel Business Concierge & Digital Store Bot

**File:** [`business_omnichannel_concierge_workflow.json`](./business_omnichannel_concierge_workflow.json)

A customer-facing sales and support agent that handles both **WhatsApp Business** and **Telegram** seamlessly with a single intelligent brain.

### 🌟 Key Capabilities
1. **Omnichannel Ingestion Normalizer**:
   - Ingests webhooks from WhatsApp Cloud API and Telegram Bot.
   - Unifies payloads into a normalized schema: `{ channel, senderId, senderName, senderContact, messageText, timestamp }`.
2. **Empathetic Human Sales Persona ("Maya")**:
   - Zero robotic phrasing ("As an AI language model...").
   - Warm, persuasive, fluent multilingual support (automatically detects and mirrors customer language).
3. **Live Digital Store Lookup**:
   - **Product Catalog Tool**: Searches inventory, stock availability, specifications, pricing, and provides checkout links.
   - **Order Tracking Tool**: Real-time status lookup using Order ID or phone number.
   - **FAQ & Policies Tool**: Returns, warranty, and delivery times.
4. **Sentiment & Feedback Intelligence Engine**:
   - Real-time customer mood classification: `positive`, `neutral`, `negative`, `high_intent`.
   - Categorizes feedback (e.g., `praise`, `complaint`, `b2b_sales`, `product_question`).
   - Automatically writes to CRM / Google Sheets.
5. **Smart Escalation & Human Handoff**:
   - If a customer is frustrated, requests a refund, or is an enterprise B2B buyer:
     - Instantly dispatches a high-priority Telegram alert to the **Owner / Odin** with customer history, sentiment score, and direct callback link.

---

## 🛠️ Step-by-Step Setup Guide

### 1. How to Import Workflows into n8n
1. Open your n8n web interface (e.g. `http://localhost:5678`).
2. Go to **Workflows** in the left sidebar.
3. Click the **+ Add Workflow** button (top right) or open the three dots menu `...` -> **Import from File**.
4. Select `odin_personal_copilot_workflow.json` (and repeat for `business_omnichannel_concierge_workflow.json`).
5. Click **Save**.

### 2. Required Credentials

#### For Odin:
- **Telegram Bot API**:
  1. Open Telegram, message `@BotFather`, create `/newbot` (e.g. `OdinPersonalBot`).
  2. Copy the HTTP API token into n8n under **Credentials** -> **Telegram API**.
  3. Replace `YOUR_PERSONAL_TELEGRAM_CHAT_ID` with your own Telegram Chat ID (get it from `@userinfobot`).
- **OpenAI / Anthropic / Gemini**:
  - Add your API Key into n8n credentials.
- **GitHub PAT (Personal Access Token)**:
  - Generate a classic or fine-grained token on GitHub (`repo`, `read:org`, `issues`).
  - Add Header Auth in the GitHub tool: `Authorization: Bearer YOUR_GITHUB_TOKEN`.
- **School LMS (Canvas / Blackboard / Moodle)**:
  - Generate an API Access Token in Canvas (Settings -> Approved Integrations -> New Access Token).

#### For Business Concierge:
- **WhatsApp Cloud API**:
  - Set up a Meta Developer App for WhatsApp Business.
  - Connect your Phone Number ID and System User Access Token in n8n **WhatsApp API** credentials.
- **Business Telegram Bot**:
  - Create a second bot via `@BotFather` (e.g. `YourBrandStoreBot`) and add token to n8n.
- **Digital Store API**:
  - Point `https://api.yourstore.com/v1/products/search` to your Shopify, WooCommerce, Medusa, or Supabase REST endpoint.

