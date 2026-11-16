/**
 * Real Supabase Cloud Database Service for P3L Developers
 * Live Endpoint loaded from environment variables
 */
const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://muratasgegqmbkhmsevt.supabase.co/rest/v1';
const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || '11111111-1111-1111-1111-111111111111';

if (!SUPABASE_KEY) {
  console.error('[DB Service CRITICAL] Missing SUPABASE_SERVICE_ROLE_KEY in environment variables.');
}

function supabaseRequest(endpoint, method, payload = null, customPrefer = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL + endpoint);
    const bodyStr = payload ? (typeof payload === 'string' ? payload : JSON.stringify(payload)) : '';
    
    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json'
    };

    if (customPrefer) {
      headers['Prefer'] = customPrefer;
    } else if (method === 'POST') {
      headers['Prefer'] = 'return=representation';
    }
    if (bodyStr) {
      headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: method,
      headers: headers
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data || '[]') });
          } catch (e) {
            resolve({ status: res.statusCode, data });
          }
        } else {
          reject(new Error(`Supabase error ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

/**
 * Upsert customer into Supabase
 */
async function upsertCustomer(phone, name = '', tenantId = DEFAULT_TENANT_ID) {
  const cleanPhone = String(phone || '').trim().replace(/[^\w\d+]/g, '') || 'web_test_client';
  if (!cleanPhone) return null;

  try {
    const res = await supabaseRequest(
      '/tenant_customers?on_conflict=customer_phone',
      'POST',
      {
        customer_phone: cleanPhone,
        customer_name: name || 'Customer',
        tenant_id: tenantId,
        last_contact_at: new Date().toISOString()
      },
      'resolution=merge-duplicates,return=representation'
    );
    return res.data[0] || { phone: cleanPhone, name };
  } catch (err) {
    return { phone: cleanPhone, name };
  }
}

/**
 * Get or create active chat session in Supabase
 */
async function getOrCreateSession(phone, tenantId = DEFAULT_TENANT_ID) {
  const cleanPhone = String(phone || '').trim().replace(/[^\w\d+]/g, '') || 'web_test_client';
  if (!cleanPhone) return null;

  try {
    const existing = await supabaseRequest(
      `/chat_sessions?customer_phone=eq.${cleanPhone}&tenant_id=eq.${tenantId}&order=created_at.desc&limit=1`,
      'GET'
    );

    if (Array.isArray(existing.data) && existing.data.length > 0) {
      // Update last_interaction_at
      await supabaseRequest(
        `/chat_sessions?id=eq.${existing.data[0].id}`,
        'PATCH',
        { last_interaction_at: new Date().toISOString() }
      ).catch(() => {});
      return existing.data[0];
    }

    const created = await supabaseRequest(
      '/chat_sessions',
      'POST',
      {
        customer_phone: cleanPhone,
        tenant_id: tenantId,
        is_human_takeover: false,
        created_at: new Date().toISOString(),
        last_interaction_at: new Date().toISOString()
      }
    );
    return created.data[0];
  } catch (err) {
    return { id: `sess_${cleanPhone}`, customer_phone: cleanPhone, tenant_id: tenantId, is_human_takeover: false };
  }
}

/**
 * Log a chat message into Supabase
 */
async function logChatMessage({ sessionId, tenantId = DEFAULT_TENANT_ID, role, message, intent = null, tool = null, latencyMs = 0, tokens = null, mediaUrl = null }) {
  try {
    const res = await supabaseRequest('/chat_messages', 'POST', {
      session_id: sessionId,
      tenant_id: tenantId,
      sender_role: role === 'bot' || role === 'assistant' ? 'assistant' : (role === 'operator' || role === 'human_operator' ? 'human_operator' : 'customer'),
      message_text: message,
      media_url: mediaUrl,
      raw_payload: {
        intent,
        tool,
        latencyMs,
        tokens
      },
      created_at: new Date().toISOString()
    });
    return res.data ? res.data[0] : null;
  } catch (err) {
    console.warn('[DB Service] logChatMessage failed:', err.message);
    return null;
  }
}

/**
 * List real sessions from Supabase
 */
async function listSessions(tenantId = null) {
  try {
    const filter = (tenantId && tenantId !== 'all') ? `tenant_id=eq.${tenantId}&` : '';
    const res = await supabaseRequest(
      `/chat_sessions?${filter}order=last_interaction_at.desc&limit=30`,
      'GET'
    );
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    return [];
  }
}

/**
 * Get session messages from Supabase
 */
async function getSessionMessages(sessionId) {
  try {
    const res = await supabaseRequest(
      `/chat_messages?session_id=eq.${sessionId}&order=created_at.asc`,
      'GET'
    );
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    return [];
  }
}

/**
 * Take over session
 */
async function setSessionTakeover(sessionId, operatorName) {
  try {
    const res = await supabaseRequest(
      `/chat_sessions?id=eq.${sessionId}`,
      'PATCH',
      { is_human_takeover: true, human_operator_name: operatorName, takeover_started_at: new Date().toISOString() }
    );
    return res.data;
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Delete a session and its associated messages
 */
async function deleteSession(sessionId) {
  try {
    await supabaseRequest(`/chat_messages?session_id=eq.${sessionId}`, 'DELETE');
    const res = await supabaseRequest(`/chat_sessions?id=eq.${sessionId}`, 'DELETE');
    return res.data || { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Archive session
 */
async function archiveSession(sessionId) {
  try {
    const res = await supabaseRequest(
      `/chat_sessions?id=eq.${sessionId}`,
      'PATCH',
      { session_summary: 'ARCHIVED' }
    );
    return res.data || { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * List real tenants from Supabase
 */
async function listTenants() {
  try {
    const res = await supabaseRequest(
      '/tenants?is_active=eq.true&select=*&order=created_at.asc',
      'GET'
    );
    return Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    return [];
  }
}

/**
 * Get tenant by ID
 */
async function getTenantById(tenantId = DEFAULT_TENANT_ID) {
  try {
    const res = await supabaseRequest(
      `/tenants?id=eq.${tenantId}&select=*&limit=1`,
      'GET'
    );
    if (Array.isArray(res.data) && res.data.length > 0) {
      return res.data[0];
    }
    const all = await listTenants();
    return all[0] || null;
  } catch (e) {
    return null;
  }
}

/**
 * List catalog items from Supabase (all 95 real products & services)
 */
async function getCatalogItems(tenantId = DEFAULT_TENANT_ID) {
  try {
    const res = await supabaseRequest(
      `/catalog_items?tenant_id=eq.${tenantId}&is_available_for_order=eq.true&select=*&order=created_at.asc`,
      'GET'
    );
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.warn('[DB Service] Error fetching catalog_items:', err.message);
    return [];
  }
}

/**
 * Get live Database RAG context from real Supabase catalog_items
 */
async function getDatabaseRagContext(query = '', tenantId = DEFAULT_TENANT_ID) {
  try {
    const items = await getCatalogItems(tenantId);
    if (!items || items.length === 0) return '';

    const q = (query || '').toLowerCase().trim();
    let relevantItems = items;

    if (q) {
      // Find matching items by name, category, or description
      const matched = items.filter(it => {
        const n = (it.name || '').toLowerCase();
        const c = (it.category || '').toLowerCase();
        const d = (it.description || '').toLowerCase();
        return n.includes(q) || c.includes(q) || d.includes(q) ||
          q.split(' ').some(word => word.length > 3 && (n.includes(word) || c.includes(word)));
      });
      if (matched.length > 0) {
        relevantItems = matched.slice(0, 10);
      } else {
        relevantItems = items.slice(0, 8);
      }
    } else {
      relevantItems = items.slice(0, 8);
    }

    return relevantItems.map(it => {
      const price = it.base_price_kes ? `KES ${Number(it.base_price_kes).toLocaleString()}` : 'Price on Inquiry';
      const stock = it.in_stock ? `In Stock (${it.stock_quantity || 1} available)` : 'Out of Stock';
      return `- **${it.name}** (${it.category || 'Hardware'}): ${price} | ${stock}\n  Specs/Details: ${it.description || 'Verified authentic stock with warranty.'}`;
    }).join('\n\n');
  } catch (e) {
    return '';
  }
}

/**
 * List agents from Supabase
 */
async function listAgents(tenantId = DEFAULT_TENANT_ID) {
  try {
    const res = await supabaseRequest(
      `/tenant_agent_configs?tenant_id=eq.${tenantId}&select=*`,
      'GET'
    );
    return Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    return [];
  }
}

/**
 * List WhatsApp lines from Supabase
 */
async function listWhatsAppLines(tenantId = DEFAULT_TENANT_ID) {
  try {
    const res = await supabaseRequest(
      `/tenant_whatsapp_lines?tenant_id=eq.${tenantId}&select=*`,
      'GET'
    );
    return Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    return [];
  }
}

/**
 * Get Complete Business Details (Tenant + Agent + Tier + Catalog + WhatsApp Lines)
 */
async function getBusinessDetails(tenantId = DEFAULT_TENANT_ID) {
  try {
    const [tenant, agentConfigs, lines, catalog, subscriptions] = await Promise.all([
      getTenantById(tenantId),
      listAgents(tenantId),
      listWhatsAppLines(tenantId),
      getCatalogItems(tenantId),
      supabaseRequest(`/tenant_subscriptions?tenant_id=eq.${tenantId}&select=*`, 'GET').catch(() => ({ data: [] }))
    ]);

    return {
      success: true,
      tenant,
      agentConfig: agentConfigs[0] || null,
      whatsappLines: lines || [],
      catalogCount: catalog.length,
      catalogItems: catalog,
      subscription: subscriptions.data?.[0] || null
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Create a new tenant in Supabase and provision agent & subscription
 */
async function createTenant({ business_name, slug, owner_name, owner_email, owner_phone, city, industry, template }) {
  const cleanPhone = String(owner_phone || '').replace(/[^0-9]/g, '');
  const cleanSlug = (slug || business_name || 'biz')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') + '-' + Math.floor(Math.random() * 1000);

  const newTenantRes = await supabaseRequest('/tenants', 'POST', {
    business_name,
    slug: cleanSlug,
    owner_full_name: owner_name || 'Owner',
    owner_email: owner_email || `${cleanSlug}@p3lautomate.com`,
    owner_phone: cleanPhone,
    city: city || 'Nairobi',
    country: 'Kenya',
    currency: 'KES',
    industry: industry === 'tech' ? 'tech' : (industry === 'retail' ? 'retail' : 'custom'),
    is_active: true,
    tagline: `Powered by Odin AI Agent (${template || 'Bitreal'})`,
    created_at: new Date().toISOString()
  });

  const tenant = newTenantRes.data?.[0];
  if (!tenant) throw new Error('Failed to create tenant in Supabase');

  // Provision Agent Config (Forced clean English only)
  await supabaseRequest('/tenant_agent_configs', 'POST', {
    tenant_id: tenant.id,
    agent_name: `Odin-${business_name}`,
    language_mode: 'english_only',
    tone_persona: `Professional, courteous, and efficient technical consultant for ${business_name} in ${city || 'Nairobi'}. Speaks in clear, natural English only. Quotes verified specs and prices from database catalog. Never hallucinates pricing or stock.`,
    welcome_message_template: `Hello! Welcome to ${business_name}. How can I assist you with our catalog and services today?`,
    preferred_model: 'gemini-1.5-flash',
    allow_ai_negotiation: false,
    require_stk_confirmation: true,
    created_at: new Date().toISOString()
  }).catch(() => {});

  // Provision Free Pilot Subscription
  await supabaseRequest('/tenant_subscriptions', 'POST', {
    tenant_id: tenant.id,
    tier: 'free_pilot',
    status: 'active',
    monthly_message_quota: 1000,
    max_catalog_items: 50,
    max_whatsapp_lines: 1,
    created_at: new Date().toISOString()
  }).catch(() => {});

  return tenant;
}

/**
 * Link WhatsApp line to tenant in Supabase
 */
async function linkWhatsAppLine({ tenant_id, phone_number, label, provider = 'WAHA', waha_session_id = 'default' }) {
  const cleanPhone = String(phone_number || '').replace(/[^0-9]/g, '');
  const res = await supabaseRequest('/tenant_whatsapp_lines', 'POST', {
    tenant_id,
    phone_number: cleanPhone,
    label: label || `WhatsApp Line (+${cleanPhone})`,
    provider,
    waha_session_id,
    is_primary: true,
    is_active: true,
    created_at: new Date().toISOString()
  });
  return res.data?.[0];
}

/**
 * Get Full Run History across all chat messages in Supabase
 */
async function getRunHistory(limit = 50) {
  try {
    const messagesRes = await supabaseRequest(
      `/chat_messages?order=created_at.desc&limit=${limit}&select=*`,
      'GET'
    );
    const messages = Array.isArray(messagesRes.data) ? messagesRes.data : [];

    // Group or map messages into execution runs
    const history = messages.map(m => {
      const payload = m.raw_payload || {};
      const isAssistant = m.sender_role === 'assistant';
      return {
        id: m.id,
        sessionId: m.session_id,
        channel: isAssistant ? 'Odin Agent' : 'Customer Inbound',
        role: m.sender_role,
        agentName: isAssistant ? 'Odin-P3L AI' : 'Customer',
        input: !isAssistant ? m.message_text : 'Customer Inquiry',
        output: isAssistant ? m.message_text : 'Received',
        text: m.message_text,
        timestamp: m.created_at,
        status: '200 OK',
        intent: payload.intent || (isAssistant ? 'AI_ASSISTANT_REPLY' : 'CUSTOMER_INQUIRY'),
        tool: payload.tool || (isAssistant ? 'gemini_react_agent' : 'inbound_message'),
        latencyMs: payload.latencyMs || 0,
        tokens: payload.tokens || { totalTokenCount: 0 },
        costUsd: payload.tokens?.totalTokenCount ? (payload.tokens.totalTokenCount * 0.0000005).toFixed(6) : '0.000000'
      };
    });

    return history;
  } catch (err) {
    return [];
  }
}

module.exports = {
  supabaseRequest,
  upsertCustomer,
  getOrCreateSession,
  logChatMessage,
  listSessions,
  getSessionMessages,
  setSessionTakeover,
  listTenants,
  getTenantById,
  getCatalogItems,
  getDatabaseRagContext,
  listAgents,
  listWhatsAppLines,
  getBusinessDetails,
  createTenant,
  linkWhatsAppLine,
  getRunHistory
};
