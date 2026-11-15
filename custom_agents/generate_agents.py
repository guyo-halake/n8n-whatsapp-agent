import json
import uuid
import os

def create_node_id():
    return str(uuid.uuid4())

# ==============================================================================
# 1. ODIN: PERSONAL CHIEF OF STAFF & ENGINEERING COPILOT
# ==============================================================================
def build_odin_workflow():
    # Node IDs
    tg_trigger_id = create_node_id()
    cron_trigger_id = create_node_id()
    llm_id = create_node_id()
    memory_id = create_node_id()
    agent_id = create_node_id()
    
    # Tools IDs
    tool_calendar_id = create_node_id()
    tool_school_id = create_node_id()
    tool_github_id = create_node_id()
    tool_docs_id = create_node_id()
    tool_azure_id = create_node_id()
    tool_n8n_id = create_node_id()
    tool_reddit_id = create_node_id()
    tool_tiktok_id = create_node_id()
    tool_task_id = create_node_id()
    
    tg_reply_id = create_node_id()
    
    # Morning briefing branch IDs
    data_collector_id = create_node_id()
    briefing_llm_id = create_node_id()
    briefing_tg_id = create_node_id()
    sticky_note_id = create_node_id()
    sticky_tools_id = create_node_id()
    
    nodes = [
        # Sticky Notes
        {
            "id": sticky_note_id,
            "name": "Odin Architecture Note",
            "type": "n8n-nodes-base.stickyNote",
            "typeVersion": 1,
            "position": [160, 60],
            "parameters": {
                "content": "## ⚡ ODIN: Personal AI Chief of Staff & Engineering Sentinel\n\n**Operational Modes:**\n1. **Reactive Copilot (Telegram Inbound)**: On-demand voice & text requests for calendar, school LMS, GitHub issues, Azure & n8n monitoring, B2B lead hunting (Reddit/TikTok), and custom tasks.\n2. **Autonomous Morning Sentinel (07:30 Cron)**: Aggregates schedule, homework due, code issues, cloud uptime, and overnight harvested business leads into an executive daily briefing.",
                "height": 220,
                "width": 640,
                "color": 6
            }
        },
        {
            "id": sticky_tools_id,
            "name": "Odin Tools Note",
            "type": "n8n-nodes-base.stickyNote",
            "typeVersion": 1,
            "position": [1160, 60],
            "parameters": {
                "content": "## 🛠️ Odin's 9 Multi-Domain Toolsets\n- **Academics**: Google Calendar, School LMS/Assignments Portal\n- **Dev & Cloud**: GitHub Issue Analyzer, Project Docs RAG, Azure Monitor, n8n Doctor\n- **Growth & Lead Gen**: Reddit B2B Scraper, TikTok/Social Prospector\n- **Personal Ops**: Custom Tasks & Reminders",
                "height": 220,
                "width": 540,
                "color": 4
            }
        },
        # Triggers
        {
            "id": tg_trigger_id,
            "name": "Telegram Inbound Trigger",
            "type": "n8n-nodes-base.telegramTrigger",
            "typeVersion": 1.1,
            "position": [240, 360],
            "parameters": {
                "updates": ["message"]
            },
            "credentials": {
                "telegramApi": {
                    "id": "ODIN_TELEGRAM_BOT_CREDENTIAL_ID",
                    "name": "Odin Telegram Bot Account"
                }
            }
        },
        {
            "id": cron_trigger_id,
            "name": "Morning Briefing Cron (07:30)",
            "type": "n8n-nodes-base.scheduleTrigger",
            "typeVersion": 1.2,
            "position": [240, 780],
            "parameters": {
                "rule": {
                    "interval": [
                        {
                            "field": "cronExpression",
                            "expression": "30 7 * * *"
                        }
                    ]
                }
            }
        },
        # Core Agent Brain
        {
            "id": llm_id,
            "name": "Odin Brain (OpenAI / Claude)",
            "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
            "typeVersion": 1,
            "position": [560, 140],
            "parameters": {
                "model": "gpt-4o",
                "options": {
                    "temperature": 0.2
                }
            },
            "credentials": {
                "openAiApi": {
                    "id": "OPENAI_API_CREDENTIAL_ID",
                    "name": "OpenAI Account"
                }
            }
        },
        {
            "id": memory_id,
            "name": "Odin Window Memory",
            "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
            "typeVersion": 1.2,
            "position": [560, 540],
            "parameters": {
                "sessionKey": "={{ $json.message.chat.id || 'owner_session' }}",
                "contextWindowLength": 20
            }
        },
        {
            "id": agent_id,
            "name": "Odin AI Agent",
            "type": "@n8n/n8n-nodes-langchain.agent",
            "typeVersion": 1.7,
            "position": [780, 360],
            "parameters": {
                "text": "={{ $json.message.text }}",
                "promptType": "define",
                "options": {
                    "systemMessage": """You are ODIN, the elite Personal AI Chief of Staff, Code Copilot, and Sovereign Business Growth Agent for your owner.
You speak with high agency, sharp executive precision, technical mastery, and clear structured markdown.

YOUR CAPABILITIES & DOMAINS:
1. Academic Operations: You check Google Calendar for daily schedule, and query School Portal / LMS for upcoming assignments, homework, and exam due dates.
2. Coding & GitHub Sentinel: You inspect open GitHub issues, analyze stack traces/bug descriptions, formulate step-by-step task solutions, and prepare daily engineering priorities.
3. Documentation & Technical RAG: You search project architecture guides and code docs.
4. Infrastructure & Cloud Watchdog: You inspect Azure Resource Health and monitor local/cloud n8n instance executions for workflow failures.
5. Growth & Lead Harvester: You autonomously search Reddit (e.g. r/freelance, r/automation, r/smallbusiness) for clients seeking automation/dev work, and prospect TikTok/social media business accounts for outreach.
6. Tasks & Reminders: You record custom tasks and set time-sensitive alerts.

OPERATING GUIDELINES:
- Always call the relevant tool when asked for real-time data.
- Provide crisp, actionable responses. Avoid fluff or generic boilerplate.
- When reporting issues, categorize by severity: [CRITICAL], [WARNING], [INFO].
- When reporting harvested leads, highlight: Client Need, Platform, Link/Contact, and Match Quality."""
                }
            }
        },
        # Tools
        {
            "id": tool_calendar_id,
            "name": "Google Calendar Tool",
            "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
            "typeVersion": 1.1,
            "position": [1160, -200],
            "parameters": {
                "url": "https://www.googleapis.com/calendar/v3/calendars/primary/events",
                "method": "GET",
                "toolDescription": "Call this tool to fetch user calendar events, classes, meetings, and schedule for today or upcoming days.",
                "sendQuery": True,
                "parametersQuery": {
                    "values": [
                        {"name": "timeMin", "value": "={{ $now.set({hour:0, minute:0}).toISO() }}"},
                        {"name": "timeMax", "value": "={{ $now.plus({days: 1}).toISO() }}"},
                        {"name": "singleEvents", "value": "true"},
                        {"name": "orderBy", "value": "startTime"}
                    ]
                }
            }
        },
        {
            "id": tool_school_id,
            "name": "School LMS & Assignments Tool",
            "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
            "typeVersion": 1.1,
            "position": [1160, -80],
            "parameters": {
                "url": "https://canvas.instructure.com/api/v1/users/self/upcoming_events",
                "method": "GET",
                "toolDescription": "Call this tool to check the school portal / LMS for upcoming homework, assignments, quizzes, and project submission deadlines."
            }
        },
        {
            "id": tool_github_id,
            "name": "GitHub Issues & Code Tool",
            "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
            "typeVersion": 1.1,
            "position": [1160, 40],
            "parameters": {
                "url": "https://api.github.com/user/issues",
                "method": "GET",
                "toolDescription": "Call this tool to list assigned GitHub issues, bug reports, PR review requests, and project tasks across your repositories.",
                "sendQuery": True,
                "parametersQuery": {
                    "values": [
                        {"name": "state", "value": "open"},
                        {"name": "filter", "value": "all"},
                        {"name": "sort", "value": "updated"}
                    ]
                }
            }
        },
        {
            "id": tool_docs_id,
            "name": "Project Docs RAG Tool",
            "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
            "typeVersion": 1.1,
            "position": [1160, 160],
            "parameters": {
                "url": "https://api.tavily.com/search",
                "method": "POST",
                "toolDescription": "Call this tool to search internal project documentation, codebase knowledge bases, and architectural references.",
                "sendBody": True,
                "parametersBody": {
                    "values": [
                        {"name": "query", "value": "={{ $fromAI('query', 'The documentation query') }}"}
                    ]
                }
            }
        },
        {
            "id": tool_azure_id,
            "name": "Azure Cloud Monitor Tool",
            "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
            "typeVersion": 1.1,
            "position": [1160, 280],
            "parameters": {
                "url": "https://management.azure.com/subscriptions/YOUR_AZURE_SUBSCRIPTION_ID/providers/Microsoft.ResourceHealth/availabilityStatuses?api-version=2020-05-01",
                "method": "GET",
                "toolDescription": "Call this tool to check Azure cloud infrastructure health, resource availability, virtual machine status, and active alerts."
            }
        },
        {
            "id": tool_n8n_id,
            "name": "n8n Doctor Tool",
            "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
            "typeVersion": 1.1,
            "position": [1160, 400],
            "parameters": {
                "url": "http://localhost:5678/api/v1/executions",
                "method": "GET",
                "toolDescription": "Call this tool to query n8n instance executions, find failed or errored workflow runs, inspect error details, and assess automation stability.",
                "sendQuery": True,
                "parametersQuery": {
                    "values": [
                        {"name": "status", "value": "error"},
                        {"name": "limit", "value": "5"}
                    ]
                }
            }
        },
        {
            "id": tool_reddit_id,
            "name": "Reddit Lead Hunter Tool",
            "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
            "typeVersion": 1.1,
            "position": [1160, 520],
            "parameters": {
                "url": "https://www.reddit.com/r/freelance+forhire+smallbusiness+automation/search.json",
                "method": "GET",
                "toolDescription": "Call this tool to search targeted subreddits for potential clients, hiring requests, automation development requests, and commercial leads.",
                "sendQuery": True,
                "parametersQuery": {
                    "values": [
                        {"name": "q", "value": "={{ $fromAI('keywords', 'Search keywords like need developer or need automation') }}"},
                        {"name": "sort", "value": "new"},
                        {"name": "limit", "value": "10"}
                    ]
                }
            }
        },
        {
            "id": tool_tiktok_id,
            "name": "TikTok & Social Prospecting Tool",
            "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
            "typeVersion": 1.1,
            "position": [1160, 640],
            "parameters": {
                "url": "https://api.serper.dev/search",
                "method": "POST",
                "toolDescription": "Call this tool to search TikTok and social platforms for business accounts, creator niches, and prospective clients.",
                "sendBody": True,
                "parametersBody": {
                    "values": [
                        {"name": "q", "value": "={{ $fromAI('social_query', 'TikTok or social search query') }}"}
                    ]
                }
            }
        },
        {
            "id": tool_task_id,
            "name": "Custom Task & Reminder Tool",
            "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
            "typeVersion": 1.1,
            "position": [1160, 760],
            "parameters": {
                "url": "https://api.todoist.com/rest/v2/tasks",
                "method": "POST",
                "toolDescription": "Call this tool to create custom reminders, homework alerts, or high-priority tasks in your task manager.",
                "sendBody": True,
                "parametersBody": {
                    "values": [
                        {"name": "content", "value": "={{ $fromAI('task_content', 'Task title and description') }}"},
                        {"name": "due_string", "value": "={{ $fromAI('due_date', 'Due date or time expression like tomorrow at 5pm') }}"}
                    ]
                }
            }
        },
        # Telegram Reply for Inbound Chat
        {
            "id": tg_reply_id,
            "name": "Send Reply to Owner",
            "type": "n8n-nodes-base.telegram",
            "typeVersion": 1.1,
            "position": [1520, 360],
            "parameters": {
                "operation": "sendMessage",
                "chatId": "={{ $('Telegram Inbound Trigger').item.json.message.chat.id }}",
                "text": "={{ $json.output }}",
                "additionalFields": {
                    "parse_mode": "Markdown"
                }
            },
            "credentials": {
                "telegramApi": {
                    "id": "ODIN_TELEGRAM_BOT_CREDENTIAL_ID",
                    "name": "Odin Telegram Bot Account"
                }
            }
        },
        # Morning Standup Data Collector & Formatter
        {
            "id": data_collector_id,
            "name": "Aggregate Morning Standup Data",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [560, 780],
            "parameters": {
                "mode": "runOnceForAllItems",
                "jsCode": """// Simulates consolidated retrieval from Odin subsystems for the Morning Standup
const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });

return [
  {
    json: {
      date: today,
      schedule_summary: "9:00 AM - Computer Science Lecture | 2:00 PM - Cloud Architecture Lab | 5:00 PM - Client Project Sync",
      assignments_due: [
        { course: "Distributed Systems", task: "Raft Consensus Assignment", due: "Tomorrow 11:59 PM", priority: "HIGH" },
        { course: "Database Management", task: "Query Optimization Report", due: "Friday 5:00 PM", priority: "MEDIUM" }
      ],
      github_issues: [
        { repo: "user/core-backend", issue_num: 42, title: "Memory leak under high WebSocket concurrency", priority: "CRITICAL" },
        { repo: "user/awesome-n8n", issue_num: 15, title: "Update WhatsApp Cloud webhook auth docs", priority: "MEDIUM" }
      ],
      system_health: {
        azure_status: "All 4 Resource Groups Healthy (East US)",
        n8n_failed_executions: 0,
        uptime_pct: "99.98%"
      },
      harvested_leads: [
        { platform: "Reddit (r/automation)", title: "Seeking developer to build n8n + Shopify sync pipeline", user: "u/ecom_founder", estimated_value: "$1,500" },
        { platform: "TikTok Prospecting", niche: "E-commerce Apparel Brands", qualified_profiles_found: 8 }
      ]
    }
  }
];"""
            }
        },
        {
            "id": briefing_llm_id,
            "name": "Format Executive Morning Briefing",
            "type": "@n8n/n8n-nodes-langchain.agent",
            "typeVersion": 1.7,
            "position": [840, 780],
            "parameters": {
                "text": "={{ JSON.stringify($json) }}",
                "promptType": "define",
                "options": {
                    "systemMessage": """You are ODIN. Format the provided morning data into an immaculate, ultra-motivating, executive daily standup briefing for your owner.

Use this layout:
👑 **ODIN MORNING COMMAND BRIEFING — {{ $json.date }}**

📅 **ACADEMIC & SCHEDULE PLAN**
- Today's agenda & classes
- Assignments & deadlines approaching (highlight HIGH priority)

💻 **ENGINEERING & GITHUB TARGETS**
- Top GitHub issues needing attention today
- Recommended task focus order

🛡️ **CLOUD & INFRASTRUCTURE WATCHDOG**
- Azure cloud status
- n8n automation health check

🎯 **GROWTH & HARVESTED LEADS**
- Highlight client leads from Reddit & social prospecting with recommended next outreach step

End with a concise, stoic daily battle motto."""
                }
            }
        },
        {
            "id": briefing_tg_id,
            "name": "Send Daily Briefing via Telegram",
            "type": "n8n-nodes-base.telegram",
            "typeVersion": 1.1,
            "position": [1160, 780],
            "parameters": {
                "operation": "sendMessage",
                "chatId": "YOUR_PERSONAL_TELEGRAM_CHAT_ID",
                "text": "={{ $json.output }}",
                "additionalFields": {
                    "parse_mode": "Markdown"
                }
            },
            "credentials": {
                "telegramApi": {
                    "id": "ODIN_TELEGRAM_BOT_CREDENTIAL_ID",
                    "name": "Odin Telegram Bot Account"
                }
            }
        }
    ]
    
    connections = {
        "Telegram Inbound Trigger": {
            "main": [[{"node": "Odin AI Agent", "type": "main", "index": 0}]]
        },
        "Odin Brain (OpenAI / Claude)": {
            "ai_languageModel": [
                [{"node": "Odin AI Agent", "type": "ai_languageModel", "index": 0}],
                [{"node": "Format Executive Morning Briefing", "type": "ai_languageModel", "index": 0}]
            ]
        },
        "Odin Window Memory": {
            "ai_memory": [[{"node": "Odin AI Agent", "type": "ai_memory", "index": 0}]]
        },
        "Odin AI Agent": {
            "main": [[{"node": "Send Reply to Owner", "type": "main", "index": 0}]]
        },
        # Tool connections to Odin AI Agent
        "Google Calendar Tool": {
            "ai_tool": [[{"node": "Odin AI Agent", "type": "ai_tool", "index": 0}]]
        },
        "School LMS & Assignments Tool": {
            "ai_tool": [[{"node": "Odin AI Agent", "type": "ai_tool", "index": 0}]]
        },
        "GitHub Issues & Code Tool": {
            "ai_tool": [[{"node": "Odin AI Agent", "type": "ai_tool", "index": 0}]]
        },
        "Project Docs RAG Tool": {
            "ai_tool": [[{"node": "Odin AI Agent", "type": "ai_tool", "index": 0}]]
        },
        "Azure Cloud Monitor Tool": {
            "ai_tool": [[{"node": "Odin AI Agent", "type": "ai_tool", "index": 0}]]
        },
        "n8n Doctor Tool": {
            "ai_tool": [[{"node": "Odin AI Agent", "type": "ai_tool", "index": 0}]]
        },
        "Reddit Lead Hunter Tool": {
            "ai_tool": [[{"node": "Odin AI Agent", "type": "ai_tool", "index": 0}]]
        },
        "TikTok & Social Prospecting Tool": {
            "ai_tool": [[{"node": "Odin AI Agent", "type": "ai_tool", "index": 0}]]
        },
        "Custom Task & Reminder Tool": {
            "ai_tool": [[{"node": "Odin AI Agent", "type": "ai_tool", "index": 0}]]
        },
        # Morning briefing connections
        "Morning Briefing Cron (07:30)": {
            "main": [[{"node": "Aggregate Morning Standup Data", "type": "main", "index": 0}]]
        },
        "Aggregate Morning Standup Data": {
            "main": [[{"node": "Format Executive Morning Briefing", "type": "main", "index": 0}]]
        },
        "Format Executive Morning Briefing": {
            "main": [[{"node": "Send Daily Briefing via Telegram", "type": "main", "index": 0}]]
        }
    }
    
    workflow = {
        "name": "Odin - Personal AI Chief of Staff & Engineering Sentinel",
        "nodes": nodes,
        "connections": connections,
        "active": False,
        "settings": {
            "executionOrder": "v1"
        },
        "tags": [
            {"name": "Personal AI"},
            {"name": "LangChain Agent"},
            {"name": "DevOps"},
            {"name": "Lead Generation"}
        ]
    }
    return workflow

# ==============================================================================
# 2. BUSINESS OMNICHANNEL CONCIERGE & STORE AGENT (WHATSAPP + TELEGRAM)
# ==============================================================================
def build_business_concierge_workflow():
    wa_trigger_id = create_node_id()
    tg_trigger_id = create_node_id()
    normalizer_id = create_node_id()
    llm_id = create_node_id()
    memory_id = create_node_id()
    agent_id = create_node_id()
    
    # Store tools
    tool_catalog_id = create_node_id()
    tool_orders_id = create_node_id()
    tool_policy_id = create_node_id()
    
    # Sentiment & Feedback pipeline
    sentiment_code_id = create_node_id()
    log_feedback_id = create_node_id()
    if_escalate_id = create_node_id()
    escalate_alert_id = create_node_id()
    
    # Omnichannel response router
    switch_channel_id = create_node_id()
    wa_send_id = create_node_id()
    tg_send_id = create_node_id()
    
    sticky_note_id = create_node_id()
    
    nodes = [
        {
            "id": sticky_note_id,
            "name": "Business Concierge Architecture",
            "type": "n8n-nodes-base.stickyNote",
            "typeVersion": 1,
            "position": [160, 40],
            "parameters": {
                "content": "## 💼 Omnichannel Business Concierge & Digital Store Bot (WhatsApp + Telegram)\n\n**Key Systems:**\n1. **Omnichannel Ingestion**: Ingests WhatsApp & Telegram customer chats into a unified normalized schema.\n2. **Natural Conversational AI**: High-empathy, human-like sales rep tone (never robotic), answers product & order inquiries.\n3. **Live Store Lookup**: Real-time catalog search, pricing, stock levels, order tracking.\n4. **Sentiment & Feedback Engine**: Automatically evaluates satisfaction, records reviews, and triggers emergency escalation to owner if angry/urgent.",
                "height": 220,
                "width": 780,
                "color": 5
            }
        },
        # Ingestion Triggers
        {
            "id": wa_trigger_id,
            "name": "WhatsApp Inbound Trigger",
            "type": "n8n-nodes-base.whatsAppTrigger",
            "typeVersion": 1,
            "position": [200, 320],
            "parameters": {
                "updates": ["messages"]
            },
            "credentials": {
                "whatsAppApi": {
                    "id": "WHATSAPP_BUSINESS_CREDENTIAL_ID",
                    "name": "WhatsApp Business Cloud Account"
                }
            }
        },
        {
            "id": tg_trigger_id,
            "name": "Telegram Customer Trigger",
            "type": "n8n-nodes-base.telegramTrigger",
            "typeVersion": 1.1,
            "position": [200, 520],
            "parameters": {
                "updates": ["message"]
            },
            "credentials": {
                "telegramApi": {
                    "id": "BUSINESS_TELEGRAM_BOT_CREDENTIAL_ID",
                    "name": "Business Telegram Bot Account"
                }
            }
        },
        # Channel Ingestion Normalizer
        {
            "id": normalizer_id,
            "name": "Omnichannel Normalizer",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [440, 420],
            "parameters": {
                "mode": "runOnceForEachItem",
                "jsCode": """// Normalizes payloads from WhatsApp Business Cloud API vs Telegram Bot
const item = $input.item.json;

let channel = 'unknown';
let senderId = '';
let senderName = 'Valued Customer';
let messageText = '';
let senderContact = '';

if (item.messages && item.messages[0]) {
  // WhatsApp Cloud API payload
  channel = 'whatsapp';
  const msg = item.messages[0];
  senderId = msg.from;
  senderContact = msg.from;
  messageText = msg.text ? msg.text.body : (msg.caption || '[Media Message]');
  if (item.contacts && item.contacts[0] && item.contacts[0].profile) {
    senderName = item.contacts[0].profile.name;
  }
} else if (item.message) {
  // Telegram payload
  channel = 'telegram';
  senderId = String(item.message.chat.id);
  senderName = [item.message.from.first_name, item.message.from.last_name].filter(Boolean).join(' ') || item.message.from.username || 'Customer';
  senderContact = item.message.from.username ? `@${item.message.from.username}` : senderId;
  messageText = item.message.text || item.message.caption || '[Media Message]';
}

return {
  json: {
    channel,
    senderId,
    senderName,
    senderContact,
    messageText,
    timestamp: new Date().toISOString()
  }
};"""
            }
        },
        # Language Model & Memory
        {
            "id": llm_id,
            "name": "Concierge LLM (GPT-4o)",
            "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
            "typeVersion": 1,
            "position": [680, 180],
            "parameters": {
                "model": "gpt-4o",
                "options": {
                    "temperature": 0.4
                }
            },
            "credentials": {
                "openAiApi": {
                    "id": "OPENAI_API_CREDENTIAL_ID",
                    "name": "OpenAI Account"
                }
            }
        },
        {
            "id": memory_id,
            "name": "Customer Chat Memory",
            "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
            "typeVersion": 1.2,
            "position": [680, 620],
            "parameters": {
                "sessionKey": "={{ $json.senderId }}",
                "contextWindowLength": 15
            }
        },
        # Business AI Agent
        {
            "id": agent_id,
            "name": "Business Concierge Agent",
            "type": "@n8n/n8n-nodes-langchain.agent",
            "typeVersion": 1.7,
            "position": [920, 420],
            "parameters": {
                "text": "={{ $json.messageText }}",
                "promptType": "define",
                "options": {
                    "systemMessage": """You are Maya, the Lead Customer Concierge and Digital Store Specialist for our boutique business.
You are communicating directly with a customer named {{ $json.senderName }} over {{ $json.channel }}.

YOUR PERSONA:
- Warm, polite, attentive, empathetic, and exceptionally helpful.
- Speak naturally like a skilled, knowledgeable human customer service specialist.
- NEVER say "I am an artificial intelligence model", "as an AI", or robotic disclaimers.
- Use natural conversational transitions, friendly greetings, and clear product details.
- Automatically respond in the exact same language the customer uses (English, Arabic, Spanish, French, etc.).

CORE RESPONSIBILITIES:
1. Store Product Lookup: Check the product catalog for stock, prices, features, and provide direct purchasing links.
2. Order Status: Look up order details, shipping status, and estimated delivery dates using the order tracking tool.
3. Policy & Questions: Provide accurate answers regarding return windows, warranty, payment options, and worldwide delivery.
4. Listen & Empathize: Understand customer feedback or grievances with patience, warmth, and prompt reassurance."""
                }
            }
        },
        # Store Tools
        {
            "id": tool_catalog_id,
            "name": "Digital Store Catalog Tool",
            "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
            "typeVersion": 1.1,
            "position": [1260, 140],
            "parameters": {
                "url": "https://api.yourstore.com/v1/products/search",
                "method": "GET",
                "toolDescription": "Call this tool to search the store product catalog for item names, pricing, availability, descriptions, and checkout links.",
                "sendQuery": True,
                "parametersQuery": {
                    "values": [
                        {"name": "q", "value": "={{ $fromAI('query', 'Product search term or keyword') }}"}
                    ]
                }
            }
        },
        {
            "id": tool_orders_id,
            "name": "Order Status & Tracking Tool",
            "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
            "typeVersion": 1.1,
            "position": [1260, 260],
            "parameters": {
                "url": "https://api.yourstore.com/v1/orders/track",
                "method": "GET",
                "toolDescription": "Call this tool to check the tracking status, fulfillment state, and courier tracking URL of a customer order.",
                "sendQuery": True,
                "parametersQuery": {
                    "values": [
                        {"name": "order_id", "value": "={{ $fromAI('order_id', 'Order ID or tracking number') }}"}
                    ]
                }
            }
        },
        {
            "id": tool_policy_id,
            "name": "Store Policies & FAQ Tool",
            "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
            "typeVersion": 1.1,
            "position": [1260, 380],
            "parameters": {
                "url": "https://api.yourstore.com/v1/policies",
                "method": "GET",
                "toolDescription": "Call this tool to retrieve official store policies on returns, refunds, international shipping times, and warranties."
            }
        },
        # Sentiment & Feedback Analysis Engine
        {
            "id": sentiment_code_id,
            "name": "Analyze Customer Sentiment & Feedback",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [1260, 560],
            "parameters": {
                "mode": "runOnceForEachItem",
                "jsCode": """// Fast sentiment & feedback classification
const text = ($('Omnichannel Normalizer').item.json.messageText || '').toLowerCase();
const agentReply = $input.item.json.output || '';
const sender = $('Omnichannel Normalizer').item.json;

let sentiment = 'positive';
let category = 'inquiry';
let needs_escalation = false;

// Frustration / Complaint triggers
const negativeKeywords = ['broken', 'scam', 'refund', 'terrible', 'worst', 'angry', 'late', 'hate', 'bad', 'sucks', 'stolen', 'never received', 'lawyer', 'sue'];
const highValueKeywords = ['bulk', 'wholesale', 'custom quote', 'corporate', 'partner', 'enterprise'];

if (negativeKeywords.some(w => text.includes(w))) {
  sentiment = 'negative';
  category = 'complaint';
  needs_escalation = true;
} else if (highValueKeywords.some(w => text.includes(w))) {
  sentiment = 'high_intent';
  category = 'b2b_sales';
  needs_escalation = true;
} else if (text.includes('thank') || text.includes('great') || text.includes('love') || text.includes('awesome')) {
  sentiment = 'positive';
  category = 'praise';
} else {
  sentiment = 'neutral';
  category = 'product_question';
}

return {
  json: {
    channel: sender.channel,
    senderId: sender.senderId,
    senderName: sender.senderName,
    senderContact: sender.senderContact,
    incomingMessage: sender.messageText,
    agentReply: agentReply,
    sentiment: sentiment,
    category: category,
    needs_escalation: needs_escalation,
    feedback_logged_at: new Date().toISOString()
  }
};"""
            }
        },
        # Log Feedback into Database / CRM / Google Sheet
        {
            "id": log_feedback_id,
            "name": "Log Customer Feedback to CRM",
            "type": "n8n-nodes-base.httpRequest",
            "typeVersion": 4.2,
            "position": [1520, 560],
            "parameters": {
                "method": "POST",
                "url": "https://api.yourcrm.com/v1/customer_feedback",
                "sendBody": True,
                "bodyParameters": {
                    "parameters": [
                        {"name": "channel", "value": "={{ $json.channel }}"},
                        {"name": "customer_name", "value": "={{ $json.senderName }}"},
                        {"name": "contact", "value": "={{ $json.senderContact }}"},
                        {"name": "message", "value": "={{ $json.incomingMessage }}"},
                        {"name": "sentiment", "value": "={{ $json.sentiment }}"},
                        {"name": "category", "value": "={{ $json.category }}"},
                        {"name": "escalated", "value": "={{ $json.needs_escalation }}"}
                    ]
                }
            }
        },
        # Check If Escalation Alert Needed
        {
            "id": if_escalate_id,
            "name": "Check If Escalation Alert Needed",
            "type": "n8n-nodes-base.if",
            "typeVersion": 2,
            "position": [1760, 560],
            "parameters": {
                "conditions": {
                    "boolean": [
                        {
                            "value1": "={{ $('Analyze Customer Sentiment & Feedback').item.json.needs_escalation }}",
                            "value2": True
                        }
                    ]
                }
            }
        },
        # Emergency Telegram Alert to Owner / Odin
        {
            "id": escalate_alert_id,
            "name": "Emergency Alert to Owner / Odin",
            "type": "n8n-nodes-base.telegram",
            "typeVersion": 1.1,
            "position": [2040, 480],
            "parameters": {
                "operation": "sendMessage",
                "chatId": "YOUR_PERSONAL_TELEGRAM_CHAT_ID",
                "text": """🚨 *ATTENTION ODIN / OWNER: Customer Escalation Alert*

👤 *Customer:* {{ $('Analyze Customer Sentiment & Feedback').item.json.senderName }} ({{ $('Analyze Customer Sentiment & Feedback').item.json.senderContact }})
📱 *Channel:* {{ $('Analyze Customer Sentiment & Feedback').item.json.channel.toUpperCase() }}
⚠️ *Sentiment:* {{ $('Analyze Customer Sentiment & Feedback').item.json.sentiment.toUpperCase() }}
🏷️ *Category:* {{ $('Analyze Customer Sentiment & Feedback').item.json.category }}

💬 *Customer Said:*
"{{ $('Analyze Customer Sentiment & Feedback').item.json.incomingMessage }}"

🤖 *Bot Addressed With:*
"{{ $('Analyze Customer Sentiment & Feedback').item.json.agentReply }}"

👉 *Action Required:* Please review and step in directly if necessary!""",
                "additionalFields": {
                    "parse_mode": "Markdown"
                }
            },
            "credentials": {
                "telegramApi": {
                    "id": "ODIN_TELEGRAM_BOT_CREDENTIAL_ID",
                    "name": "Odin Telegram Bot Account"
                }
            }
        },
        # Omnichannel Dispatcher
        {
            "id": switch_channel_id,
            "name": "Route Outbound Response by Channel",
            "type": "n8n-nodes-base.switch",
            "typeVersion": 3,
            "position": [1520, 320],
            "parameters": {
                "rules": {
                    "values": [
                        {
                            "conditions": {
                                "options": {
                                    "caseSensitive": True,
                                    "leftValue": "",
                                    "typeValidation": "strict"
                                },
                                "conditions": [
                                    {
                                        "leftValue": "={{ $('Omnichannel Normalizer').item.json.channel }}",
                                        "rightValue": "whatsapp",
                                        "operator": {
                                            "type": "string",
                                            "operation": "equals"
                                        }
                                    }
                                ],
                                "combinator": "and"
                            }
                        },
                        {
                            "conditions": {
                                "options": {
                                    "caseSensitive": True,
                                    "leftValue": "",
                                    "typeValidation": "strict"
                                },
                                "conditions": [
                                    {
                                        "leftValue": "={{ $('Omnichannel Normalizer').item.json.channel }}",
                                        "rightValue": "telegram",
                                        "operator": {
                                            "type": "string",
                                            "operation": "equals"
                                        }
                                    }
                                ],
                                "combinator": "and"
                            }
                        }
                    ]
                }
            }
        },
        # Outbound WhatsApp
        {
            "id": wa_send_id,
            "name": "Send WhatsApp Reply",
            "type": "n8n-nodes-base.whatsApp",
            "typeVersion": 1,
            "position": [1820, 220],
            "parameters": {
                "operation": "send",
                "phoneNumberId": "YOUR_WHATSAPP_PHONE_NUMBER_ID",
                "recipientPhoneNumber": "={{ $('Omnichannel Normalizer').item.json.senderId }}",
                "textBody": "={{ $('Business Concierge Agent').item.json.output }}"
            },
            "credentials": {
                "whatsAppApi": {
                    "id": "WHATSAPP_BUSINESS_CREDENTIAL_ID",
                    "name": "WhatsApp Business Cloud Account"
                }
            }
        },
        # Outbound Telegram
        {
            "id": tg_send_id,
            "name": "Send Telegram Reply to Client",
            "type": "n8n-nodes-base.telegram",
            "typeVersion": 1.1,
            "position": [1820, 360],
            "parameters": {
                "operation": "sendMessage",
                "chatId": "={{ $('Omnichannel Normalizer').item.json.senderId }}",
                "text": "={{ $('Business Concierge Agent').item.json.output }}",
                "additionalFields": {
                    "parse_mode": "Markdown"
                }
            },
            "credentials": {
                "telegramApi": {
                    "id": "BUSINESS_TELEGRAM_BOT_CREDENTIAL_ID",
                    "name": "Business Telegram Bot Account"
                }
            }
        }
    ]
    
    connections = {
        "WhatsApp Inbound Trigger": {
            "main": [[{"node": "Omnichannel Normalizer", "type": "main", "index": 0}]]
        },
        "Telegram Customer Trigger": {
            "main": [[{"node": "Omnichannel Normalizer", "type": "main", "index": 0}]]
        },
        "Omnichannel Normalizer": {
            "main": [[{"node": "Business Concierge Agent", "type": "main", "index": 0}]]
        },
        "Concierge LLM (GPT-4o)": {
            "ai_languageModel": [[{"node": "Business Concierge Agent", "type": "ai_languageModel", "index": 0}]]
        },
        "Customer Chat Memory": {
            "ai_memory": [[{"node": "Business Concierge Agent", "type": "ai_memory", "index": 0}]]
        },
        "Digital Store Catalog Tool": {
            "ai_tool": [[{"node": "Business Concierge Agent", "type": "ai_tool", "index": 0}]]
        },
        "Order Status & Tracking Tool": {
            "ai_tool": [[{"node": "Business Concierge Agent", "type": "ai_tool", "index": 0}]]
        },
        "Store Policies & FAQ Tool": {
            "ai_tool": [[{"node": "Business Concierge Agent", "type": "ai_tool", "index": 0}]]
        },
        "Business Concierge Agent": {
            "main": [
                [
                    {"node": "Route Outbound Response by Channel", "type": "main", "index": 0},
                    {"node": "Analyze Customer Sentiment & Feedback", "type": "main", "index": 0}
                ]
            ]
        },
        "Analyze Customer Sentiment & Feedback": {
            "main": [[{"node": "Log Customer Feedback to CRM", "type": "main", "index": 0}]]
        },
        "Log Customer Feedback to CRM": {
            "main": [[{"node": "Check If Escalation Alert Needed", "type": "main", "index": 0}]]
        },
        "Check If Escalation Alert Needed": {
            "main": [
                [{"node": "Emergency Alert to Owner / Odin", "type": "main", "index": 0}],
                []
            ]
        },
        "Route Outbound Response by Channel": {
            "main": [
                [{"node": "Send WhatsApp Reply", "type": "main", "index": 0}],
                [{"node": "Send Telegram Reply to Client", "type": "main", "index": 0}]
            ]
        }
    }
    
    workflow = {
        "name": "Business Concierge & Store Agent - WhatsApp and Telegram",
        "nodes": nodes,
        "connections": connections,
        "active": False,
        "settings": {
            "executionOrder": "v1"
        },
        "tags": [
            {"name": "Customer Support"},
            {"name": "E-commerce"},
            {"name": "WhatsApp"},
            {"name": "Telegram"},
            {"name": "LangChain Agent"}
        ]
    }
    return workflow

if __name__ == '__main__':
    odin_wf = build_odin_workflow()
    biz_wf = build_business_concierge_workflow()
    
    odin_path = os.path.join('custom_agents', 'odin_personal_copilot_workflow.json')
    biz_path = os.path.join('custom_agents', 'business_omnichannel_concierge_workflow.json')
    
    with open(odin_path, 'w', encoding='utf-8') as f:
        json.dump(odin_wf, f, indent=2, ensure_ascii=False)
        
    with open(biz_path, 'w', encoding='utf-8') as f:
        json.dump(biz_wf, f, indent=2, ensure_ascii=False)
        
    print(f"Successfully generated {odin_path} ({len(odin_wf['nodes'])} nodes)")
    print(f"Successfully generated {biz_path} ({len(biz_wf['nodes'])} nodes)")

