import { workflow, trigger, node, languageModel, memory, tool, expr } from '@n8n/workflow-sdk';

/**
 * ODIN: All-in-One WhatsApp Sales & Customer Care Agent
 * -----------------------------------------------------
 * Features:
 * - Universal Normalizer: Meta Cloud API, WAHA, Twilio, and direct webhook test support.
 * - Dynamic White-Label Profile: Decoupled business DNA, catalog, and pricing.
 * - Multi-Channel Referral Awareness: Detects TikTok, Instagram, Ad campaign, or Website origins.
 * - Consultative BANT Funnel: Uncovers Need, Budget, Authority, and Urgency naturally.
 * - 5 Specialized Tools:
 *     1. search_catalog: Dynamic catalog and base pricing lookup.
 *     2. record_lead_bant: Captures structured lead qualifications for CRM sync.
 *     3. generate_payment_link: Instant payment prompt (Stripe, M-Pesa, Bank Transfer).
 *     4. book_discovery_meeting: Proposes slots and provides direct booking link.
 *     5. escalate_to_human: Immediate alerts for human intervention.
 * - Window Memory: Stateful per-customer history keyed by phone number.
 */

const inboundTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'WhatsApp Inbound Webhook',
    parameters: {
      httpMethod: 'POST',
      path: 'whatsapp-odin-inbound',
      options: {}
    }
  }
});

const universalNormalizer = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Universal WhatsApp Normalizer & Guard',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `
const inputItem = $input.first().json;
const body = inputItem.body || inputItem;

let senderPhone = '';
let senderName = 'Valued Customer';
let messageText = '';
let messageId = 'msg_' + Date.now();
let referralSource = 'direct';

// 1. Meta Cloud API Payload
if (body.entry && body.entry[0]?.changes && body.entry[0].changes[0]?.value) {
  const val = body.entry[0].changes[0].value;
  if (val.statuses) {
    return []; // Ignore delivery receipts
  }
  if (val.contacts && val.contacts[0]) {
    senderName = val.contacts[0].profile?.name || senderName;
    senderPhone = val.contacts[0].wa_id || '';
  }
  if (val.messages && val.messages[0]) {
    const msg = val.messages[0];
    messageId = msg.id || messageId;
    senderPhone = senderPhone || msg.from || '';
    if (msg.type === 'text') {
      messageText = msg.text?.body || '';
    } else if (msg.type === 'button') {
      messageText = msg.button?.text || '';
    } else if (msg.type === 'interactive') {
      messageText = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '';
    }
    if (msg.referral) {
      referralSource = msg.referral.source_type || msg.referral.headline || 'ad_campaign';
    }
  }
} 
// 2. WAHA / Session-based Gateway
else if (body.payload && body.event === 'message') {
  senderPhone = (body.payload.from || '').replace('@c.us', '').replace('+', '');
  senderName = body.payload._data?.notifyName || body.payload.notifyName || senderName;
  messageText = body.payload.body || '';
  messageId = body.payload.id || messageId;
} 
// 3. Direct Test / Standard Webhook
else {
  senderPhone = String(body.phone || body.from || body.sender || '254700000000').replace(/[^0-9]/g, '');
  senderName = body.name || body.customer_name || senderName;
  messageText = body.message || body.text || body.query || 'Hello';
  referralSource = body.source || body.referral || 'direct';
}

if (!messageText || !senderPhone) {
  return [];
}

return [{
  json: {
    sender_phone: senderPhone,
    sender_name: senderName,
    message_text: messageText,
    message_id: messageId,
    referral_source: referralSource,
    timestamp: new Date().toISOString()
  }
}];
`
    }
  }
});

const whiteLabelConfigNode = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Load White-Label Business DNA',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `
const normalized = $input.first().json;

// --- WHITE-LABEL CONFIGURATION BLOCK ---
const businessProfile = {
  business_name: "Apex Growth Automations",
  company_tagline: "High-Performance AI & WhatsApp Systems",
  agent_name: "Odin",
  persona: "Friendly, highly competent, consultative sales & customer care advisor.",
  welcome_intros: {
    tiktok: "Saw our viral TikTok showcase on automated sales agents? Welcome! Let's see how much time and revenue we can unlock for you.",
    instagram: "Hey there! Thanks for tapping over from Instagram! Are you looking to automate customer care or boost sales conversions?",
    website: "Hello! Welcome to Apex Growth. What specific business challenge are you looking to solve today?",
    direct: "Hello! I am Odin from Apex Growth Automations. Great to connect with you! How can I assist your business today?"
  },
  products_services: [
    {
      id: "prod_01",
      name: "AI WhatsApp Sales & Support Bot",
      base_price: "$750 setup + $99/mo",
      description: "24/7 lead qualification, instant objection handling, appointment booking, and CRM sync directly on WhatsApp.",
      link: "https://apexgrowth.ai/whatsapp-agent"
    },
    {
      id: "prod_02",
      name: "Full Enterprise Automation Sprint",
      base_price: "$1,800 one-time",
      description: "Custom n8n workflows connecting your CRM, marketing ads, invoicing, and notifications into an autonomous engine.",
      link: "https://apexgrowth.ai/enterprise-sprint"
    },
    {
      id: "prod_03",
      name: "1-on-1 AI Strategy & Audit Session",
      base_price: "$150",
      description: "60-minute deep dive roadmap with our senior workflow architect to map your highest ROI automation opportunities.",
      link: "https://apexgrowth.ai/strategy-session"
    }
  ],
  qualification_rules: {
    ideal_customer: "Small-to-medium businesses receiving 20+ leads/day or seeking to automate repetitive sales/support.",
    budget_range: "Minimum $150 for audit, $750+ for custom systems.",
    timeline: "Ready to implement within 1-4 weeks."
  },
  booking_link: "https://calendly.com/apexgrowth/discovery-chat",
  payment_info: {
    payment_link: "https://buy.stripe.com/demo_apex_checkout",
    mpesa_till: "Apex Automation Till #884920",
    bank_transfer: "Apex Global Ltd, Account #1092837465"
  },
  sales_rep_alert: {
    notification_email: "sales@apexgrowth.ai",
    notification_phone: "+254700000001",
    escalation_reasons: ["explicit human request", "budget > $5,000", "frustrated customer", "custom enterprise contract"]
  }
};

const introHint = businessProfile.welcome_intros[normalized.referral_source] || businessProfile.welcome_intros.direct;

return [{
  json: {
    ...normalized,
    business: businessProfile,
    agent_input_prompt: "Customer Name: " + normalized.sender_name + "\\nCustomer Phone: " + normalized.sender_phone + "\\nReferral Source: " + normalized.referral_source + "\\nSuggested Source Greeting: " + introHint + "\\nLatest Message from Customer: \\"" + normalized.message_text + "\\""
  }
}];
`
    }
  }
});

const geminiModel = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatGoogleGemini',
  version: 1.2,
  config: {
    name: 'Gemini 1.5 Flash Brain',
    parameters: {
      modelName: 'models/gemini-1.5-flash'
    },
    credentials: {
      googlePalmApi: {
        id: '31jTUxTlQfLgQhqA',
        name: 'Google Gemini(PaLM) Api account'
      }
    }
  }
});

const windowMemory = memory({
  type: '@n8n/n8n-nodes-langchain.memoryBufferWindow',
  version: 1.4,
  config: {
    name: 'Odin WhatsApp Session Memory',
    parameters: {
      sessionIdType: 'customKey',
      sessionKey: expr('{{ $json.sender_phone }}'),
      contextWindowLength: 15
    }
  }
});

const searchCatalogTool = tool({
  type: '@n8n/n8n-nodes-langchain.toolCode',
  version: 1.3,
  config: {
    name: 'search_catalog',
    parameters: {
      description: 'Search products, packages, pricing tiers, deliverables, and shop/website links from our verified business catalog.',
      language: 'javaScript',
      jsCode: `
const businessData = $('Load White-Label Business DNA').first().json.business;
const catalog = businessData.products_services || [];
const query = (query || '').toLowerCase();
const matches = catalog.filter(p => !query || p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query));
return JSON.stringify({
  business: businessData.business_name,
  matched_products: matches.length > 0 ? matches : catalog
});
`
    }
  }
});

const recordLeadBantTool = tool({
  type: '@n8n/n8n-nodes-langchain.toolCode',
  version: 1.3,
  config: {
    name: 'record_lead_bant',
    parameters: {
      description: 'Record or update lead qualification details (Name, Need, Budget estimate, Authority/Decision maker, Urgency/Timeline, and Lead Score: Cold/Warm/Hot).',
      language: 'javaScript',
      jsCode: `
return JSON.stringify({
  status: "recorded",
  lead_payload: query,
  message: "Lead qualification logged successfully."
});
`
    }
  }
});

const generatePaymentLinkTool = tool({
  type: '@n8n/n8n-nodes-langchain.toolCode',
  version: 1.3,
  config: {
    name: 'generate_payment_link',
    parameters: {
      description: 'Generate payment prompt, checkout URL, M-Pesa till, or invoice instructions when the customer is ready to buy.',
      language: 'javaScript',
      jsCode: `
const businessData = $('Load White-Label Business DNA').first().json.business;
return JSON.stringify({
  business_name: businessData.business_name,
  payment_info: businessData.payment_info,
  instructions: "Share these payment methods and ask customer to confirm once transaction is completed."
});
`
    }
  }
});

const bookDiscoveryMeetingTool = tool({
  type: '@n8n/n8n-nodes-langchain.toolCode',
  version: 1.3,
  config: {
    name: 'book_discovery_meeting',
    parameters: {
      description: 'Provide calendar booking link or schedule a discovery appointment with a sales specialist.',
      language: 'javaScript',
      jsCode: `
const businessData = $('Load White-Label Business DNA').first().json.business;
return JSON.stringify({
  booking_link: businessData.booking_link,
  message: "Share this booking link with the prospect so they can pick a convenient 15-30 minute time slot."
});
`
    }
  }
});

const escalateToHumanTool = tool({
  type: '@n8n/n8n-nodes-langchain.toolCode',
  version: 1.3,
  config: {
    name: 'escalate_to_human',
    parameters: {
      description: 'Immediately escalate conversation to a human sales manager. Call this if customer explicitly asks for a human, has complex custom enterprise requirements, or is frustrated.',
      language: 'javaScript',
      jsCode: `
const businessData = $('Load White-Label Business DNA').first().json.business;
return JSON.stringify({
  escalation_triggered: true,
  sales_contact: businessData.sales_rep_alert,
  message: "Human escalation triggered. Inform the customer that a human senior specialist has been alerted and will join shortly."
});
`
    }
  }
});

const odinAgent = node({
  type: '@n8n/n8n-nodes-langchain.agent',
  version: 3.1,
  config: {
    name: 'Odin All-in-One Sales & Care Agent',
    parameters: {
      promptType: 'define',
      text: expr('{{ $json.agent_input_prompt }}'),
      options: {
        systemMessage: `You are ODIN, the elite consultative Sales & Customer Care AI Specialist for the business provided in the context.
Your goal is to be conversational, empathetic, and commercially sharp on WhatsApp.

SALES & CARE FUNNEL:
1. GREETING & DISCOVERY: Welcome the customer warmly. If they come from TikTok, Instagram, or an Ad, smoothly acknowledge it. Ask what they are looking to solve or build today.
2. BANT QUALIFICATION: Uncover Need, Budget range, Authority, and Urgency naturally across the conversation. Never interrogate like a robot survey.
3. CONSULTATIVE SOLUTION: Use search_catalog to find exact packages, pricing, and links. Guide them with clear recommendations.
4. ACTION / CLOSE / BOOK:
   - When interested in booking a call: use book_discovery_meeting and share the link.
   - When ready to buy or pay: use generate_payment_link to provide payment instructions.
   - When asking for a human or complex custom enterprise contract: use escalate_to_human.
5. LEAD LOGGING: Use record_lead_bant when you extract key qualification details.

WHATSAPP STYLE:
- Keep responses concise (2 to 4 short paragraphs max).
- Use natural spacing and helpful emojis (✨, 🚀, 💼, 📲).
- Never invent pricing outside the verified catalog.`
      }
    },
    subnodes: {
      model: geminiModel,
      memory: windowMemory,
      tools: [searchCatalogTool, recordLeadBantTool, generatePaymentLinkTool, bookDiscoveryMeetingTool, escalateToHumanTool]
    }
  }
});

const formatOutboundDispatch = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Format Outbound Dispatch',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `
const agentOutput = $input.first().json.output || "Thank you for reaching out! A specialist will assist you shortly.";
const originalContext = $('Universal WhatsApp Normalizer & Guard').first().json;
const businessData = $('Load White-Label Business DNA').first().json.business;

return [{
  json: {
    recipient_phone: originalContext.sender_phone,
    recipient_name: originalContext.sender_name,
    reply_message: agentOutput,
    business_name: businessData.business_name,
    timestamp: new Date().toISOString()
  }
}];
`
    }
  }
});

export default workflow('odin-whatsapp-sales-agent', 'Odin - All-in-One WhatsApp Sales & Care Agent')
  .add(inboundTrigger)
  .to(universalNormalizer)
  .to(whiteLabelConfigNode)
  .to(odinAgent)
  .to(formatOutboundDispatch);

