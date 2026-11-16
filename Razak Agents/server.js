const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const http = require('http');
const https = require('https');
const fs = require('fs');

process.on('uncaughtException', (err) => {
  console.warn('[Server Warning] Handled exception:', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.warn('[Server Warning] Handled rejection:', reason);
});

const platform = require('./platform_service');
const whatsappGateway = require('./whatsapp_gateway');
const telegramService = require('./telegram_service');
const db = require('./db_service');
const { loadLocalKnowledge, retrieveKnowledgeContext } = require('./rag_engine');

const PORT = process.env.PORT || 3300;
const HTML_FILE = path.join(__dirname, 'dashboard.html');
const N8N_WEBHOOK_URL = process.env.N8N_INBOUND_URL || 'https://p3lautomate.app.n8n.cloud/webhook/whatsapp-odin-inbound';

// In-memory idempotency & deduplication cache (10-minute TTL)
const processedMessageIds = new Map();
function isDuplicateWebhook(msgId) {
  if (!msgId) return false;
  const now = Date.now();
  if (processedMessageIds.has(msgId)) {
    return true;
  }
  processedMessageIds.set(msgId, now);
  // Evict older than 10 minutes
  for (const [id, ts] of processedMessageIds.entries()) {
    if (now - ts > 10 * 60 * 1000) processedMessageIds.delete(id);
  }
  return false;
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // 1. Dashboard UI
  if ((req.url === '/' || req.url === '/dashboard') && (req.method === 'GET' || req.method === 'HEAD')) {
    if (req.method === 'HEAD') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end();
      return;
    }
    fs.readFile(HTML_FILE, 'utf8', (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading dashboard: ' + err.message);
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
    });
    return;
  }

  // Health Check
  if (req.url === '/api/health' && (req.method === 'GET' || req.method === 'HEAD')) {
    if (req.method === 'HEAD') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end();
      return;
    }
    sendJson(res, 200, {
      status: 'ok',
      agent: 'Odin-P3L',
      port: PORT,
      database: 'Supabase Cloud',
      openclaw: 'http://127.0.0.1:18789'
    });
    return;
  }

  // OpenClaw Gateway Status Check
  if (req.url === '/api/openclaw/status' && req.method === 'GET') {
    try {
      const resp = await fetch('http://127.0.0.1:18789/health');
      const data = await resp.json();
      sendJson(res, 200, {
        success: true,
        live: data.ok === true,
        status: data.status || 'live',
        port: 18789,
        url: 'http://127.0.0.1:18789/'
      });
    } catch (err) {
      sendJson(res, 200, {
        success: false,
        live: false,
        port: 18789,
        url: 'http://127.0.0.1:18789/',
        error: err.message
      });
    }
    return;
  }

  // n8n Engine Status Check
  if (req.url === '/api/n8n/status' && req.method === 'GET') {
    try {
      const resp = await fetch('http://localhost:5678/healthz');
      const data = await resp.json();
      sendJson(res, 200, {
        success: true,
        live: data.status === 'ok',
        status: data.status || 'ok',
        port: 5678,
        url: 'http://localhost:5678/',
        workflowsCount: platform.RAZAK_WORKFLOWS.length
      });
    } catch (err) {
      sendJson(res, 200, {
        success: false,
        live: false,
        port: 5678,
        url: 'http://localhost:5678/',
        error: err.message
      });
    }
    return;
  }

  // 2. Real System Overview (Zero Mock Data)
  if (req.url === '/api/overview' && req.method === 'GET') {
    try {
      const overview = await platform.getRealOverview();
      sendJson(res, 200, overview);
    } catch (err) {
      sendJson(res, 500, { success: false, error: err.message });
    }
    return;
  }

  // 3. Real Razak Agents List
  if (req.url === '/api/platform/agents' && req.method === 'GET') {
    sendJson(res, 200, { success: true, agents: platform.RAZAK_AGENTS });
    return;
  }

  // 4. Real Workflows List
  if (req.url === '/api/platform/workflows' && req.method === 'GET') {
    sendJson(res, 200, { success: true, workflows: platform.RAZAK_WORKFLOWS });
    return;
  }

  // 5. Real Codebase Tests List
  if (req.url === '/api/platform/tests/list' && req.method === 'GET') {
    sendJson(res, 200, { success: true, testSuites: platform.RAZAK_TESTS });
    return;
  }

  // 6. Run Codebase Test
  if (req.url === '/api/platform/tests/run' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const testResult = await platform.runRazakTest(body.testId);
      sendJson(res, 200, testResult);
    } catch (err) {
      sendJson(res, 500, { success: false, error: err.message });
    }
    return;
  }

  // 7. Real Agent Testing Chat (Calls Google Gemini 3.5 + Local RAG)
  if (req.url === '/api/testing/chat' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const chatResult = await platform.executeRealAgentChat(body);
      sendJson(res, 200, chatResult);
    } catch (err) {
      sendJson(res, 500, { success: false, error: err.message });
    }
    return;
  }

  // 8. Live Execution History (Pull from Supabase DB)
  if ((req.url.startsWith('/api/agent/executions') || req.url.startsWith('/api/history/full')) && req.method === 'GET') {
    try {
      const history = await platform.getRunHistory(50);
      sendJson(res, 200, { success: true, history, executions: history });
    } catch (err) {
      sendJson(res, 200, { success: true, history: platform.liveExecutions, executions: platform.liveExecutions });
    }
    return;
  }

  // 8b. Chat Sessions List (Saved previous chat sessions)
  if ((req.url.startsWith('/api/chat/sessions') || req.url.startsWith('/api/portal/chat/sessions')) && req.method === 'GET') {
    try {
      const urlObj = new URL(req.url, 'http://localhost');
      const tenantId = urlObj.searchParams.get('tenantId');
      const sessions = await db.listSessions(tenantId || null);
      sendJson(res, 200, { success: true, sessions });
    } catch (err) {
      sendJson(res, 500, { success: false, error: err.message });
    }
    return;
  }

  // 8c. Chat Session Messages
  if ((req.url.startsWith('/api/chat/session/messages') || req.url.startsWith('/api/portal/chat/session/messages')) && req.method === 'GET') {
    try {
      const urlObj = new URL(req.url, 'http://localhost');
      const sessionId = urlObj.searchParams.get('sessionId');
      const messages = sessionId ? await db.getSessionMessages(sessionId) : [];
      sendJson(res, 200, { success: true, messages });
    } catch (err) {
      sendJson(res, 500, { success: false, error: err.message });
    }
    return;
  }

  // 8d. Businesses Directory
  if ((req.url === '/api/businesses' || req.url === '/api/portal/businesses') && req.method === 'GET') {
    try {
      const tenants = await platform.getBusinesses();
      const businesses = await Promise.all(tenants.map(async (t) => {
        const details = await platform.getBusinessDetails(t.id);
        return {
          id: t.id,
          name: t.business_name,
          slug: t.slug,
          tier: details.subscription?.tier || 'Free Pilot',
          database: 'Supabase Cloud (PostgreSQL)',
          owner: t.owner_full_name,
          email: t.owner_email,
          phone: t.owner_phone,
          city: t.city || 'Nairobi',
          country: t.country || 'Kenya',
          agent: details.agentConfig?.agent_name || 'Odin-P3L',
          agentConfig: details.agentConfig,
          productsCount: details.catalogCount || 95,
          whatsappLines: details.whatsappLines || [],
          catalog: (details.catalogItems || []).slice(0, 10)
        };
      }));
      sendJson(res, 200, { success: true, businesses });
    } catch (err) {
      sendJson(res, 500, { success: false, error: err.message });
    }
    return;
  }

  // 8e. Business Details (Agent, Tier, Products, Lines)
  if ((req.url.startsWith('/api/businesses/details') || req.url.startsWith('/api/portal/business/details')) && req.method === 'GET') {
    try {
      const urlObj = new URL(req.url, 'http://localhost');
      const tenantId = urlObj.searchParams.get('id') || '11111111-1111-1111-1111-111111111111';
      const details = await platform.getBusinessDetails(tenantId);
      sendJson(res, 200, details);
    } catch (err) {
      sendJson(res, 500, { success: false, error: err.message });
    }
    return;
  }

  // 8f. Create New Business
  if ((req.url === '/api/businesses/create' || req.url === '/api/portal/businesses/create') && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const tenant = await platform.createClientBusiness(body);
      sendJson(res, 200, { success: true, tenant });
    } catch (err) {
      sendJson(res, 500, { success: false, error: err.message });
    }
    return;
  }

  // 8g. Live Catalog Items (95 products from Supabase)
  if (req.url === '/api/catalog' && req.method === 'GET') {
    try {
      const catalog = await platform.getCatalog();
      sendJson(res, 200, { success: true, count: catalog.length, catalog });
    } catch (err) {
      sendJson(res, 500, { success: false, error: err.message });
    }
    return;
  }

  // 9. Local Knowledge Base Dump
  if (req.url === '/api/knowledge' && req.method === 'GET') {
    try {
      const kb = loadLocalKnowledge();
      sendJson(res, 200, { success: true, knowledge: kb });
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  // 10. WhatsApp Gateway Status
  if (req.url.startsWith('/api/waha/status') && req.method === 'GET') {
    try {
      const resp = await fetch('http://localhost:5000/api/sessions/default');
      const data = await resp.json();
      sendJson(res, 200, {
        success: true,
        connected: data.status === 'WORKING',
        status: data.status || 'OFFLINE',
        phone: data.me?.id ? '+' + data.me.id.replace('@c.us', '') : null,
        pushName: data.me?.pushName || null,
        platform: 'WAHA Core WhatsApp HTTP Engine',
        webhook: data.config?.webhooks?.[0]?.url || 'http://host.docker.internal:3300/api/whatsapp-inbound'
      });
    } catch (err) {
      sendJson(res, 200, {
        success: false,
        connected: false,
        status: 'OFFLINE',
        phone: null,
        platform: 'WAHA Core WhatsApp HTTP Engine',
        error: err.message
      });
    }
    return;
  }

  // 10a. Live WAHA QR Code Proxy (image/png)
  if (req.url.startsWith('/api/waha/qr') && req.method === 'GET') {
    try {
      const wahaRes = await fetch('http://localhost:5000/api/default/auth/qr');
      if (wahaRes.status === 200) {
        const buffer = await wahaRes.arrayBuffer();
        res.writeHead(200, {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        });
        res.end(Buffer.from(buffer));
        return;
      }
      const errData = await wahaRes.json().catch(() => ({}));
      sendJson(res, 200, {
        qrAvailable: false,
        status: errData.status || 'WORKING',
        message: errData.error || 'WhatsApp is already paired. To link a new client number, click Pair New Device.'
      });
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  // 10b. Request New Pairing / Logout current session to generate QR for new client number
  if (req.url === '/api/waha/pair-new' && req.method === 'POST') {
    try {
      await fetch('http://localhost:5000/api/sessions/default/logout', { method: 'POST' }).catch(() => {});
      await fetch('http://localhost:5000/api/sessions/default/restart', { method: 'POST' }).catch(() => {});
      await new Promise(r => setTimeout(r, 2000));
      sendJson(res, 200, { success: true, message: 'Initiated fresh pairing QR code', qrUrl: '/api/waha/qr' });
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  // 11. Live WhatsApp Webhook Handler (WAHA Inbound Router for P3L Shop)
  if ((req.url === '/api/whatsapp-inbound' || req.url === '/webhook/whatsapp-odin-inbound') && req.method === 'POST') {
    try {
      const data = await parseBody(req);
      const event = data.event;
      const payload = data.payload || {};

      // Only handle real incoming user messages
      if (event === 'message' || event === 'message.any') {
        const msgId = payload.id || payload._data?.id?._serialized;
        if (msgId && isDuplicateWebhook(msgId)) {
          console.log(`[Idempotency] Duplicate message blocked: ${msgId}`);
          sendJson(res, 200, { ignored: true, reason: 'duplicate_idempotency_block' });
          return;
        }

        const isSelfTest = payload.fromMe === true && (payload.to === payload.from || payload.chatId === payload.from);
        if (payload.fromMe === true && !isSelfTest) {
          // Skip automated bot outbound echoes
          sendJson(res, 200, { ignored: true, reason: 'fromMe' });
          return;
        }

        const senderPhone = (payload.from || payload.chatId || '').replace('@c.us', '');
        const senderName = payload._data?.notifyName || payload.notifyName || 'Customer';
        const userMsg = (payload.body || '').trim();

        if (!userMsg || !senderPhone) {
          sendJson(res, 200, { ignored: true, reason: 'empty_body' });
          return;
        }

        console.log(`[WhatsApp P3L Inbound] Received from ${senderPhone} (${senderName}): "${userMsg}"`);

        // Record incoming message in Human Operator Inbox and database
        const conv = await platform.addCustomerMessage(senderPhone, 'customer', userMsg, senderName);

        // Acknowledge receipt to WAHA immediately
        sendJson(res, 200, { success: true, status: 'processing' });

        // If Human Operator has taken over this conversation, do not auto-reply with AI
        if (conv.humanTakeover) {
          console.log(`[Human Takeover Active] Bot silent for ${senderPhone}. Awaiting staff response.`);
          return;
        }

        // Check Business Hours (Feature 07)
        const bhCheck = platform.features.businessHours.isWithinBusinessHours();
        if (bhCheck.enabled && !bhCheck.isWithinHours) {
          console.log(`[After-Hours Inbound] Outside operating hours (${bhCheck.nairobiTime} EAT). Sending auto-responder.`);
          await fetch('http://localhost:5000/api/sendText', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session: 'default',
              chatId: payload.from || payload.chatId,
              text: bhCheck.outOfOfficeMessage
            })
          }).catch(() => {});
          await platform.addCustomerMessage(senderPhone, 'bot', bhCheck.outOfOfficeMessage, 'Odin Auto-Responder');
          return;
        }

        // Asynchronously process with Odin P3L Sales Agent
        (async () => {
          try {
            // Typing indicator via WAHA
            await fetch('http://localhost:5000/api/startTyping', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ session: 'default', chatId: payload.from || payload.chatId })
            }).catch(() => {});

            // Execute P3L Sales Agent reasoning with RAG & Gemini 3.5
            const chatResult = await platform.executeRealAgentChat({
              message: userMsg,
              customerPhone: senderPhone,
              capabilities: { ragEnabled: true, mediaDeliveryEnabled: true }
            });

            // Stop typing indicator
            await fetch('http://localhost:5000/api/stopTyping', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ session: 'default', chatId: payload.from || payload.chatId })
            }).catch(() => {});

            // Send reply directly to WhatsApp via WAHA
            const targetChatId = payload.from || payload.chatId;
            const formattedChatId = targetChatId.includes('@c.us') ? targetChatId : `${targetChatId}@c.us`;

            const sendResp = await fetch('http://localhost:5000/api/sendText', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                session: 'default',
                chatId: formattedChatId,
                text: chatResult.reply
              })
            });

            // If Gemini returned a verified hardware photo, deliver the image directly to customer's WhatsApp!
            if (chatResult.media && chatResult.media.url) {
              await fetch('http://localhost:5000/api/sendImage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  session: 'default',
                  chatId: formattedChatId,
                  file: {
                    url: chatResult.media.url
                  },
                  caption: `📸 Official Hardware Photo: ${chatResult.media.title || 'P3L Developers Stock'}`
                })
              }).catch(() => {});
            }

            // Record bot reply in Human Operator Inbox
            platform.addCustomerMessage(senderPhone, 'bot', chatResult.reply, senderName);

            // If Gemini autonomously triggered escalation to human, alert owner directly on Telegram
            const isEscalation = chatResult.stages?.some(s => s.stage && s.stage.toLowerCase().includes('escalate_to_human_operator'));
            if (isEscalation) {
              telegramService.sendOwnerEscalationAlert({
                customerName: senderName,
                customerId: senderPhone,
                channel: 'WhatsApp Line',
                userQuery: userMsg,
                reason: 'Customer requested human staff/founder'
              }).catch(() => {});
            }

            console.log(`[WhatsApp P3L Outbound] Reply sent to ${senderPhone}: HTTP ${sendResp.status}`);
          } catch (err) {
            console.error('[WhatsApp P3L Outbound Error]', err.message);
          }
        })();

        return;
      }

      sendJson(res, 200, { received: true });
    } catch (err) {
      console.error('[WhatsApp Inbound Error]', err.message);
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  // 11b. Telegram Inbound Webhook
  if ((req.url === '/api/telegram-inbound' || req.url === '/webhook/telegram-odin-inbound') && req.method === 'POST') {
    try {
      const data = await parseBody(req);
      if (data.message) {
        await telegramService.handleTelegramMessage(data.message);
      }
      sendJson(res, 200, { ok: true });
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  // 12. Commercial Portal API Endpoints (10 Features)
  // Settings & Tiers
  if (req.url === '/api/portal/settings' && req.method === 'GET') {
    sendJson(res, 200, platform.getPortalSettings());
    return;
  }
  if (req.url === '/api/portal/settings' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const updated = platform.updatePortalSettings(body);
      sendJson(res, 200, updated);
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  // Shared Human Operator Inbox
  if ((req.url.startsWith('/api/portal/inbox') && !req.url.includes('/takeover') && !req.url.includes('/send')) && req.method === 'GET') {
    try {
      const urlObj = new URL(req.url, 'http://localhost');
      const tenantId = urlObj.searchParams.get('tenantId');
      const inboxData = await platform.getInbox(tenantId || null);
      sendJson(res, 200, inboxData);
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }
  if (req.url === '/api/portal/inbox/takeover' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await platform.toggleHumanTakeover(body.chatId);
      sendJson(res, 200, result);
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }
  if (req.url === '/api/portal/inbox/send' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const chatId = body.chatId;
      const text = body.text;

      if (!chatId || !text) {
        sendJson(res, 400, { error: 'chatId and text are required' });
        return;
      }

      // Record in conversation and database
      await platform.addCustomerMessage(chatId, 'operator', text, body.customerName || 'Customer');

      // Send via WAHA to real WhatsApp
      const wahaTarget = chatId.includes('@c.us') ? chatId : `${chatId}@c.us`;
      const wahaResp = await fetch('http://localhost:5000/api/sendText', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: 'default', chatId: wahaTarget, text })
      }).catch(err => ({ status: 500, statusText: err.message }));

      sendJson(res, 200, { success: true, status: wahaResp.status || 200, chatId, text });
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  // M-Pesa Subscription Billing (Daraja STK Push)
  if (req.url === '/api/portal/billing/stk' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await platform.initiateSubscriptionPayment(body);
      sendJson(res, 200, result);
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  // Knowledge Base Upload
  if (req.url === '/api/portal/knowledge/upload' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = platform.uploadCatalogData(body.filename || 'catalog.json', body.content || '[]');
      sendJson(res, 200, result);
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  // Weekly ROI & Analytics Report
  if (req.url === '/api/portal/roi/report' && req.method === 'GET') {
    try {
      const roiData = await platform.getRoiMetrics();
      sendJson(res, 200, roiData);
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  // Multi-Tenant Businesses Directory from Supabase
  if (req.url === '/api/portal/businesses' && req.method === 'GET') {
    try {
      const tenants = await db.listTenants();
      const kb = loadLocalKnowledge();
      const catalog = kb.hardware || [];
      const businesses = (tenants || []).map(t => ({
        id: t.id,
        name: t.business_name,
        tagline: t.tagline,
        owner: t.owner_full_name,
        email: t.owner_email,
        phone: t.owner_phone,
        city: t.city || 'Nairobi',
        country: t.country || 'Kenya',
        currency: t.currency || 'KES',
        tier: 'Pro Commercial Tier (KES 12,000/mo)',
        agent: 'Odin-P3L (Technical Sales Consultant)',
        model: 'Google Gemini 3.5 Flash Lite',
        database: 'Supabase PostgreSQL (muratasgegqmbkhmsevt)',
        productsCount: catalog.length,
        products: catalog.slice(0, 30).map(p => ({
          name: p.name,
          priceKES: p.price,
          category: p.category,
          stock: p.stock,
          specs: p.specs,
          image: p.image
        }))
      }));
      sendJson(res, 200, { success: true, businesses });
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  // All Saved Chat Sessions from Supabase
  if (req.url === '/api/portal/chat/sessions' && req.method === 'GET') {
    try {
      const sessions = await db.listSessions();
      sendJson(res, 200, { success: true, sessions });
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  // Messages for a specific session
  if (req.url.startsWith('/api/portal/chat/session/messages') && req.method === 'GET') {
    try {
      const urlObj = new URL(req.url, `http://${req.headers.host}`);
      const sessionId = urlObj.searchParams.get('sessionId');
      if (!sessionId) {
        sendJson(res, 400, { error: 'sessionId parameter required' });
        return;
      }
      const messages = await db.getSessionMessages(sessionId);
      sendJson(res, 200, { success: true, messages });
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  // Full Run History across all customer interactions
  if (req.url === '/api/history/full' && req.method === 'GET') {
    try {
      const sessions = await db.listSessions();
      const allHistory = [];
      for (const s of sessions) {
        const msgs = await db.getSessionMessages(s.id);
        for (let i = 0; i < msgs.length; i++) {
          if (msgs[i].sender_role === 'customer' || msgs[i].sender_role === 'user') {
            const nextBotMsg = msgs.slice(i + 1).find(m => m.sender_role === 'assistant');
            allHistory.push({
              sessionId: s.id,
              customerPhone: s.customer_phone,
              input: msgs[i].message_text,
              output: nextBotMsg ? nextBotMsg.message_text : 'Pending response...',
              timestamp: msgs[i].created_at,
              model: 'gemini-3.5-flash-lite',
              channel: s.customer_phone?.startsWith('tg_') ? 'Telegram' : 'WhatsApp',
              status: 'Completed'
            });
          }
        }
      }
      sendJson(res, 200, { success: true, history: allHistory });
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  // 11. Legacy Inbound Chat Hook (n8n Webhook Relay)
  if (req.url === '/api/chat' && req.method === 'POST') {
    try {
      const payload = await parseBody(req);
      const userMsg = payload.message || '';
      const sender = payload.sender || '254768141129';
      const senderName = payload.senderName || 'Razak Guyo';
      const tenantId = payload.tenantId || '11111111-1111-1111-1111-111111111111';

      if (!userMsg) {
        sendJson(res, 400, { error: 'Message cannot be empty' });
        return;
      }

      // Local RAG Context
      const retrievedContext = await retrieveKnowledgeContext(userMsg, tenantId).catch(() => '');

      // Relay to Gemini directly if n8n cloud returns 404
      const geminiResult = await platform.executeRealAgentChat({
        message: userMsg,
        capabilities: { ragEnabled: true, mediaDeliveryEnabled: true }
      });

      sendJson(res, 200, {
        success: true,
        reply: geminiResult.reply,
        phone: sender,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  // 404
  sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('====================================================');
  console.log(`🚀 RAZAK AGENTS PORTAL RUNNING ON PORT ${PORT}`);
  console.log(`👉 URL: http://localhost:${PORT}`);
  console.log(`🤖 Agent: Odin-P3L (P3L Developers)`);
  console.log(`🧠 AI Engine: Google Gemini 3.5 Flash Lite (Live)`);
  console.log(`☁️ Database: Supabase Cloud (muratasgegqmbkhmsevt.supabase.co)`);
  console.log(`💬 WhatsApp Engine: WAHA HTTP Engine (Port 5000)`);
  console.log(`✈️  Telegram Channel: @fv_rzkbot (Active Polling)`);
  console.log('====================================================');

  // Start live Telegram polling daemon
  telegramService.startTelegramPolling().catch(err => {
    console.warn('[Telegram Daemon Warning]', err.message);
  });
});
