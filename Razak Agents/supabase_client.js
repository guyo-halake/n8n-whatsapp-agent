/**
 * Razak Odin: Supabase Multi-Tenant Client Service
 * ------------------------------------------------
 * Centralized data access layer for n8n gateway and sub-workflows.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://muratasgegqmbkhmsevt.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function supabaseFetch(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const headers = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': options.prefer || 'return=representation',
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase error [${response.status}] ${endpoint}: ${errorText}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

/**
 * Resolves the tenant, agent configuration, and escalation roster from the receiving WhatsApp number
 */
async function resolveTenantByPhone(receiverPhone) {
  const cleanPhone = String(receiverPhone).replace(/[^0-9]/g, '');
  
  // 1. Fetch line record
  const lines = await supabaseFetch(`tenant_whatsapp_lines?phone_number=eq.${cleanPhone}&is_active=eq.true&select=*,tenants(*)`);
  if (!lines || lines.length === 0) {
    // Fallback: Return primary default demo tenant if exists
    const fallback = await supabaseFetch(`tenants?is_active=eq.true&limit=1&select=*`);
    if (!fallback || fallback.length === 0) return null;
    const t = fallback[0];
    const configs = await supabaseFetch(`tenant_agent_configs?tenant_id=eq.${t.id}`);
    const escalation = await supabaseFetch(`tenant_escalation_contacts?tenant_id=eq.${t.id}&is_active=eq.true&order=priority_order.asc`);
    return {
      tenant: t,
      agent_config: configs[0] || {},
      escalation_contacts: escalation || []
    };
  }

  const line = lines[0];
  const tenant = line.tenants;

  // 2. Fetch agent config & escalation roster in parallel
  const [configs, escalation] = await Promise.all([
    supabaseFetch(`tenant_agent_configs?tenant_id=eq.${tenant.id}`),
    supabaseFetch(`tenant_escalation_contacts?tenant_id=eq.${tenant.id}&is_active=eq.true&order=priority_order.asc`)
  ]);

  return {
    tenant,
    line,
    agent_config: configs[0] || {},
    escalation_contacts: escalation || []
  };
}

/**
 * Searches the tenant's catalog (products and services)
 */
async function searchCatalog(tenantId, query = '') {
  let endpoint = `catalog_items?tenant_id=eq.${tenantId}&is_available_for_order=eq.true&order=base_price_kes.asc&limit=15`;
  if (query && query.trim()) {
    const cleanQuery = encodeURIComponent(query.trim());
    endpoint += `&or=(name.ilike.*${cleanQuery}*,category.ilike.*${cleanQuery}*,description.ilike.*${cleanQuery}*)`;
  }
  return await supabaseFetch(endpoint);
}

/**
 * Gets or creates active customer
 */
async function getOrCreateCustomer(tenantId, customerPhone, customerName = 'Customer') {
  const cleanPhone = String(customerPhone).replace(/[^0-9]/g, '');
  const existing = await supabaseFetch(`tenant_customers?tenant_id=eq.${tenantId}&phone_number=eq.${cleanPhone}`);
  if (existing && existing.length > 0) {
    return existing[0];
  }
  const created = await supabaseFetch('tenant_customers', {
    method: 'POST',
    body: {
      tenant_id: tenantId,
      phone_number: cleanPhone,
      customer_name: customerName,
      lead_score: 'warm'
    }
  });
  return created[0];
}

/**
 * Gets or creates active chat session for conversational memory
 */
async function getOrCreateSession(tenantId, customerPhone) {
  const cleanPhone = String(customerPhone).replace(/[^0-9]/g, '');
  const existing = await supabaseFetch(`chat_sessions?tenant_id=eq.${tenantId}&customer_phone=eq.${cleanPhone}&order=last_interaction_at.desc&limit=1`);
  
  if (existing && existing.length > 0) {
    const session = existing[0];
    // Touch timestamp
    await supabaseFetch(`chat_sessions?id=eq.${session.id}`, {
      method: 'PATCH',
      body: { last_interaction_at: new Date().toISOString() }
    });
    return session;
  }

  const created = await supabaseFetch('chat_sessions', {
    method: 'POST',
    body: {
      tenant_id: tenantId,
      customer_phone: cleanPhone,
      is_human_takeover: false
    }
  });
  return created[0];
}

/**
 * Appends a message to persistent DB history
 */
async function recordMessage(sessionId, tenantId, role, text, rawPayload = null) {
  return await supabaseFetch('chat_messages', {
    method: 'POST',
    body: {
      session_id: sessionId,
      tenant_id: tenantId,
      sender_role: role,
      message_text: text,
      raw_payload: rawPayload
    }
  });
}

/**
 * Triggers Human Takeover and marks the session
 */
async function triggerHumanTakeover(tenantId, sessionId, customerPhone, reason) {
  await supabaseFetch(`chat_sessions?id=eq.${sessionId}`, {
    method: 'PATCH',
    body: {
      is_human_takeover: true,
      takeover_started_at: new Date().toISOString()
    }
  });

  const contacts = await supabaseFetch(`tenant_escalation_contacts?tenant_id=eq.${tenantId}&is_active=eq.true&order=priority_order.asc`);
  return {
    escalated: true,
    reason,
    contacts
  };
}

module.exports = {
  resolveTenantByPhone,
  searchCatalog,
  getOrCreateCustomer,
  getOrCreateSession,
  recordMessage,
  triggerHumanTakeover
};

