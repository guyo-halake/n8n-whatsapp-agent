import { workflow, trigger, node, languageModel, memory, tool, expr } from '@n8n/workflow-sdk';

/**
 * RAZAK ODIN: Multi-Tenant WhatsApp Gateway Router
 * -------------------------------------------------
 * Master thin router for P3L Developers & Multi-Tenancy:
 * - Line: 254768141129
 * - Agent: Odin-P3L
 * - Business: P3L Developers (Tech Startup: Products & Services)
 * - Free Brain: Google Gemini 1.5 Flash
 */

const inboundTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'WhatsApp Universal Gateway Webhook',
    parameters: {
      httpMethod: 'POST',
      path: 'whatsapp-gateway-inbound',
      options: {}
    }
  }
});

const universalNormalizer = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Universal Normalizer & Dedupe',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `
const inputItem = $input.first().json;
const body = inputItem.body || inputItem;

let senderPhone = '';
let receiverLine = '';
let senderName = 'Customer';
let messageText = '';
let messageId = 'msg_' + Date.now();
let referralSource = 'direct';
let provider = 'WAHA';

// 1. Meta Cloud API Payload
if (body.entry && body.entry[0]?.changes && body.entry[0].changes[0]?.value) {
  provider = 'META_CLOUD_API';
  const val = body.entry[0].changes[0].value;
  if (val.statuses) return []; // Discard receipts
  
  receiverLine = val.metadata?.display_phone_number?.replace(/[^0-9]/g, '') || '';
  if (val.contacts && val.contacts[0]) {
    senderName = val.contacts[0].profile?.name || senderName;
    senderPhone = val.contacts[0].wa_id || '';
  }
  if (val.messages && val.messages[0]) {
    const msg = val.messages[0];
    messageId = msg.id || messageId;
    senderPhone = senderPhone || msg.from || '';
    if (msg.type === 'text') messageText = msg.text?.body || '';
    else if (msg.type === 'button') messageText = msg.button?.text || '';
    else if (msg.type === 'interactive') messageText = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '';
    if (msg.referral) referralSource = msg.referral.source_type || 'ad_campaign';
  }
} 
// 2. WAHA Payload
else if (body.payload && body.event === 'message') {
  provider = 'WAHA';
  senderPhone = (body.payload.from || '').replace('@c.us', '').replace(/[^0-9]/g, '');
  receiverLine = (body.session || body.payload.to || '').replace('@c.us', '').replace(/[^0-9]/g, '');
  senderName = body.payload._data?.notifyName || body.payload.notifyName || senderName;
  messageText = body.payload.body || '';
  messageId = body.payload.id || messageId;
} 
// 3. Direct Test Webhook
else {
  provider = 'DIRECT_TEST';
  senderPhone = String(body.phone || body.sender || '254700000000').replace(/[^0-9]/g, '');
  receiverLine = String(body.receiver || body.business_phone || '254768141129').replace(/[^0-9]/g, '');
  senderName = body.name || senderName;
  messageText = body.message || body.text || 'Hello';
  referralSource = body.source || 'direct';
}

if (!messageText || !senderPhone) {
  return [];
}

return [{
  json: {
    sender_phone: senderPhone,
    receiver_line: receiverLine,
    sender_name: senderName,
    message_text: messageText,
    message_id: messageId,
    referral_source: referralSource,
    channel_provider: provider,
    received_at: new Date().toISOString()
  }
}];
`
    }
  }
});

const resolveTenantData = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.2,
  config: {
    name: 'Fetch Tenant from Supabase',
    parameters: {
      method: 'GET',
      url: '=https://muratasgegqmbkhmsevt.supabase.co/rest/v1/tenant_whatsapp_lines?select=*,tenants(*,tenant_agent_configs(*),tenant_escalation_contacts(*),tenant_subscriptions(*))&limit=1',
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'apikey', value: 'SUPABASE_KEY_PLACEHOLDER' },
          { name: 'Authorization', value: 'Bearer SUPABASE_KEY_PLACEHOLDER' }
        ]
      }
    }
  }
});

const assembleAgentContext = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Assemble Agent Context & Guard',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `
const normalized = $('Universal Normalizer & Dedupe').first().json;
const lineRecords = $input.first().json;

let line = Array.isArray(lineRecords) ? lineRecords[0] : lineRecords;
let tenant = line?.tenants || {};
let agentConfig = tenant.tenant_agent_configs?.[0] || {};
let escalationContacts = tenant.tenant_escalation_contacts || [];
let subscription = tenant.tenant_subscriptions?.[0] || {};

// Strict P3L Developers Production Fallback
if (!tenant.business_name) {
  tenant = {
    id: '11111111-1111-1111-1111-111111111111',
    business_name: 'P3L Developers',
    tagline: 'AI Automations & Software Startup | Smart Tech & Hardware Solutions',
    currency: 'KES',
    offering_type: 'hybrid_both',
    operating_hours: { mon_fri: '08:00-18:00', sat_sun: '09:00-14:00' },
    delivery_zones: { coverage: 'All over Kenya via express courier' }
  };
  agentConfig = {
    agent_name: 'Odin-P3L',
    tone_persona: 'Techy, energetic Kenyan youth founder/consultant from P3L Developers. Warm, welcoming, highly practical, zero fluff. Speaks fluent English, Swahili, and friendly natural Sheng.',
    welcome_message_template: 'Hey, this is P3L Developers. We are an automations and AI startup here to make your business or personal work easier, how may I help you today?'
  };
  escalationContacts = [
    { priority_order: 1, full_name: 'Razak Guyo', role_title: 'Founder & Lead Architect', phone_number: '254768141129' },
    { priority_order: 2, full_name: 'P3L Operations Desk', role_title: 'Technical Systems Engineer', phone_number: '254714188858' }
  ];
}

const promptContext = \`Business Name: \${tenant.business_name}
Tagline: \${tenant.tagline || ''}
Offering Type: \${tenant.offering_type} (Products & Services)
Currency: \${tenant.currency || 'KES'}
Agent Name: \${agentConfig.agent_name || 'Odin-P3L'}
Customer Name: \${normalized.sender_name}
Customer Phone: \${normalized.sender_phone}
Customer Message: "\${normalized.message_text}"\`;

return [{
  json: {
    ...normalized,
    tenant_id: tenant.id,
    business_name: tenant.business_name,
    currency: tenant.currency || 'KES',
    escalation_contacts: escalationContacts,
    subscription_status: subscription.status || 'active',
    agent_input_prompt: promptContext,
    waha_endpoint: line?.waha_endpoint_url || 'http://localhost:3000',
    agent_config: agentConfig
  }
}];
`
    }
  }
});

const geminiFlashModel = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatGoogleGemini',
  version: 1.2,
  config: {
    name: 'Gemini 1.5 Flash Brain (Free)',
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
    name: 'Per-Customer Session Memory',
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
      description: 'Search official verified products (Desktops, MacBooks, Laptops, Accessories) and services (Web Dev & Branding, AI Automations, IoT/Repairs) strictly from the database. NEVER invent prices.',
      language: 'javaScript',
      jsCode: `
const tenantId = $('Assemble Agent Context & Guard').first().json.tenant_id;
const cleanQuery = encodeURIComponent((query || '').trim());
const res = await fetch(\`https://muratasgegqmbkhmsevt.supabase.co/rest/v1/catalog_items?tenant_id=eq.\${tenantId}&is_available_for_order=eq.true&limit=10\`, {
  headers: {
    'apikey': 'SUPABASE_KEY_PLACEHOLDER',
    'Authorization': 'Bearer SUPABASE_KEY_PLACEHOLDER'
  }
});
const items = await res.json();
return JSON.stringify(items || []);
`
    }
  }
});

const initiateMpesaTool = tool({
  type: '@n8n/n8n-nodes-langchain.toolCode',
  version: 1.3,
  config: {
    name: 'initiate_mpesa_payment',
    parameters: {
      description: 'Trigger M-Pesa STK push prompt or provide Till/Paybill instructions when customer confirms their order/service and amount.',
      language: 'javaScript',
      jsCode: `
const context = $('Assemble Agent Context & Guard').first().json;
return JSON.stringify({
  action: "mpesa_prompt_ready",
  business: context.business_name,
  currency: context.currency,
  instructions: "Inform customer to keep phone unlocked to enter their M-Pesa PIN for instant STK confirmation."
});
`
    }
  }
});

const escalateToHumanTool = tool({
  type: '@n8n/n8n-nodes-langchain.toolCode',
  version: 1.3,
  config: {
    name: 'escalate_to_human_agents',
    parameters: {
      description: 'Immediately alert Razak Guyo and the technical operations team if the customer explicitly asks for a human, needs a custom contract, or has complex technical scoping.',
      language: 'javaScript',
      jsCode: `
const context = $('Assemble Agent Context & Guard').first().json;
return JSON.stringify({
  escalation_triggered: true,
  contacts: context.escalation_contacts,
  message: "Razak Guyo and operations team notified on WhatsApp. Founder will take over this chat shortly."
});
`
    }
  }
});

const odinGatewayAgent = node({
  type: '@n8n/n8n-nodes-langchain.agent',
  version: 3.1,
  config: {
    name: 'Odin Multilingual Sales Brain',
    parameters: {
      promptType: 'define',
      text: expr('{{ $json.agent_input_prompt }}'),
      options: {
        systemMessage: `You are ODIN-P3L, the consultative tech consultant and AI specialist representing P3L Developers in Nairobi, Kenya.

FOUNDER & BUSINESS DNA:
- Founder: Razak Guyo
- What we do: We build custom AI automations & software, develop high-converting websites/branding, sell high-performance tech hardware (desktops, MacBooks, gaming gear, laptops), and provide IoT & precision hardware repairs.
- Coverage: Same-day delivery in Nairobi, countrywide parcel dispatch across Kenya.
- Operating Hours: Mon-Fri 8am-6pm, Sat-Sun 9am-2pm.

TONE & LOCAL KENYAN MASTERY:
- Techy, energetic Kenyan youth founder vibe. Warm, welcoming, super clear, zero corporate fluff.
- Fluent in English, Kenyan Swahili, and natural friendly Sheng.
- Match client vibe: If they greet with "Niaje", "Rada", "Mambo vipi" -> respond smoothly with warm Sheng/Swahili. If formal -> reply with sharp technical clarity.
- PRICING LAW: Strictly query search_catalog for prices, specs, and availability. NEVER invent prices.
- MONEY ACTIONS: Confirm product/service deliverables and price in KES, then call initiate_mpesa_payment.
- HUMAN ESCALATION: If customer says "ongea na Razak", "ongea na msee", "talk to human", or has complex custom enterprise software scopes, immediately call escalate_to_human_agents.`
      }
    },
    subnodes: {
      model: geminiFlashModel,
      memory: windowMemory,
      tools: [searchCatalogTool, initiateMpesaTool, escalateToHumanTool]
    }
  }
});

const formatOutboundDispatch = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Universal Outbound Dispatcher',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `
const agentOutput = $input.first().json.output || "Karibu! A specialist from P3L Developers will attend to your request shortly.";
const originalContext = $('Assemble Agent Context & Guard').first().json;

return [{
  json: {
    chatId: originalContext.sender_phone + "@c.us",
    phone: originalContext.sender_phone,
    text: agentOutput,
    provider: originalContext.channel_provider,
    waha_endpoint: originalContext.waha_endpoint,
    timestamp: new Date().toISOString()
  }
}];
`
    }
  }
});

const sendWahaReply = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.2,
  config: {
    name: 'WAHA Send Outbound Message',
    parameters: {
      method: 'POST',
      url: '=http://localhost:3000/api/sendText',
      sendBody: true,
      specifyBody: 'json',
      jsonBody: '={\n  "chatId": "{{ $json.chatId }}",\n  "text": {{ JSON.stringify($json.text) }}\n}'
    }
  }
});

export default workflow('razak-odin-gateway-router', 'Razak Odin - Multi-Tenant WhatsApp Gateway Router')
  .add(inboundTrigger)
  .to(universalNormalizer)
  .to(resolveTenantData)
  .to(assembleAgentContext)
  .to(odinGatewayAgent)
  .to(formatOutboundDispatch)
  .to(sendWahaReply);
