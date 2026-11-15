const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');
const https = require('https');
const db = require('./db_service');
const { retrieveKnowledgeContext } = require('./rag_engine');

// Live State per Tenant Session
const sessions = new Map();
const N8N_INBOUND_URL = 'https://p3lautomate.app.n8n.cloud/webhook/whatsapp-odin-inbound';

/**
 * Get or initialize WhatsApp Session for a tenant
 */
async function getOrCreateSession(tenantId = '11111111-1111-1111-1111-111111111111') {
  if (sessions.has(tenantId)) {
    return sessions.get(tenantId);
  }

  const sessionData = {
    tenantId,
    status: 'STARTING',
    qrRaw: null,
    qrDataUrl: null,
    phone: null,
    pushName: null,
    sock: null,
    lastActive: Date.now()
  };

  sessions.set(tenantId, sessionData);

  try {
    const authFolder = path.join(__dirname, 'auth_sessions', tenantId);
    if (!fs.existsSync(authFolder)) {
      fs.mkdirSync(authFolder, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(authFolder);

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: Browsers.macOS('Desktop'),
      syncFullHistory: false,
      markOnlineOnConnect: true,
      defaultQueryTimeoutMs: 60000
    });

    sessionData.sock = sock;

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        sessionData.status = 'SCAN_QR_CODE';
        sessionData.qrRaw = qr;
        try {
          sessionData.qrDataUrl = await qrcode.toDataURL(qr, { margin: 2, scale: 7 });
          console.log(`[WhatsApp Engine] Generated fresh QR for tenant: ${tenantId}`);
        } catch (e) {
          console.error('[WhatsApp Engine] QR generation error:', e);
        }
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const errorReason = lastDisconnect?.error?.message || '';
        const isConflict = statusCode === 440 || errorReason.includes('conflict');
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;

        const isQrTimeout = statusCode === 408 || errorReason.includes('QR refs attempts ended');

        console.log(`[WhatsApp Engine] Connection closed for tenant ${tenantId}. Code: ${statusCode}, reason: ${errorReason}`);
        
        sessionData.status = 'DISCONNECTED';
        sessionData.phone = null;
        sessionData.qrDataUrl = null;

        if (isConflict) {
          console.log(`[WhatsApp Engine] Stream conflict (another device/session took over). Pausing reconnect.`);
          // Do not loop reconnect on stream conflict
        } else if (isQrTimeout) {
          console.log(`[WhatsApp Engine] QR code scanning expired. Pausing until user requests pairing.`);
          sessionData.status = 'READY_TO_PAIR';
        } else if (!isLoggedOut) {
          // Normal reconnect
          setTimeout(() => {
            sessions.delete(tenantId);
            getOrCreateSession(tenantId).catch(err => {
              console.warn('[WhatsApp Engine] Reconnect error:', err.message);
            });
          }, 5000);
        } else {
          // Logged out
          fs.rmSync(authFolder, { recursive: true, force: true });
          sessions.delete(tenantId);
        }
      } else if (connection === 'open') {
        const rawJid = sock.user?.id || '';
        const phone = rawJid.split(':')[0].replace(/[^0-9]/g, '');

        if (phone) {
          console.log(`[WhatsApp Engine] Connection OPEN and WORKING for tenant: ${tenantId}`);
          sessionData.status = 'WORKING';
          sessionData.qrRaw = null;
          sessionData.qrDataUrl = null;
          sessionData.phone = phone;
          sessionData.pushName = sock.user?.name || sock.user?.notify || 'WhatsApp Business';
          console.log(`[WhatsApp Engine] Connected Phone: +${phone} (${sessionData.pushName})`);
        }
      }
    });

    // Inbound Message Listener -> Forward to n8n webhook
    sock.ev.on('messages.upsert', async (m) => {
      if (m.type !== 'notify') return;

      for (const msg of m.messages) {
        if (msg.key.fromMe) continue; // Don't loop bot messages

        const senderJid = msg.key.remoteJid || '';
        if (senderJid.endsWith('@g.us')) continue; // Skip groups for now

        const text = msg.message?.conversation || 
                     msg.message?.extendedTextMessage?.text || 
                     msg.message?.imageMessage?.caption || 
                     '';

        if (!text) continue;

        console.log(`[WhatsApp Inbound] From: ${senderJid} -> "${text}"`);

        // Forward to n8n Cloud Router and pass the EXACT senderJid for outbound reply
        forwardToN8N(tenantId, senderJid, msg.pushName || 'WhatsApp User', text, sock);
      }
    });

  } catch (err) {
    console.error(`[WhatsApp Engine] Error initializing tenant ${tenantId}:`, err);
    sessionData.status = 'ERROR';
  }

  return sessionData;
}

/**
 * Helper to resolve true phone number from standard JID or WhatsApp Multi-Device LID
 */
function resolveSenderPhone(senderJid, tenantId) {
  if (!senderJid) return { cleanPhone: '', targetJid: '' };

  // 1. Standard Phone JID (@s.whatsapp.net)
  if (senderJid.endsWith('@s.whatsapp.net')) {
    const cleanPhone = senderJid.replace(/@.*$/, '').replace(/[^0-9]/g, '');
    return { cleanPhone, targetJid: `${cleanPhone}@s.whatsapp.net` };
  }

  // 2. Multi-Device LID (@lid) -> Look up true phone number from auth store reverse map
  if (senderJid.endsWith('@lid')) {
    const lidNumber = senderJid.replace(/@.*$/, '').replace(/[^0-9]/g, '');
    const authFolder = path.join(__dirname, 'auth_sessions', tenantId);
    const reversePath = path.join(authFolder, `lid-mapping-${lidNumber}_reverse.json`);

    if (fs.existsSync(reversePath)) {
      try {
        const rawPhone = JSON.parse(fs.readFileSync(reversePath, 'utf8'));
        const cleanPhone = String(rawPhone).replace(/[^0-9]/g, '');
        if (cleanPhone) {
          console.log(`[WhatsApp Gateway] Resolved LID ${senderJid} -> Real Phone: +${cleanPhone}`);
          return { cleanPhone, targetJid: `${cleanPhone}@s.whatsapp.net`, lidJid: senderJid };
        }
      } catch (e) {
        console.error('[WhatsApp Gateway] Error reading reverse LID mapping:', e.message);
      }
    }
    return { cleanPhone: lidNumber, targetJid: senderJid };
  }

  const cleanPhone = senderJid.replace(/@.*$/, '').replace(/[^0-9]/g, '');
  return { cleanPhone, targetJid: senderJid };
}

/**
 * Forward message to n8n webhook and reply back to WhatsApp
 */
async function forwardToN8N(tenantId, senderJid, senderName, text, sock) {
  // Resolve true phone number and target delivery JID
  const { cleanPhone, targetJid } = resolveSenderPhone(senderJid, tenantId);

  // 1. Database Persistence: Upsert Customer & Session, and Log Customer Turn
  let session = null;
  try {
    await db.upsertCustomer(cleanPhone, senderName, tenantId).catch(() => {});
    session = await db.getOrCreateSession(cleanPhone, tenantId).catch(() => null);
    if (session && session.id) {
      await db.logChatMessage(session.id, tenantId, 'customer', text).catch(() => {});
    }

    // Human Takeover Gate: If human operator has taken over, do NOT send to AI bot!
    if (session && session.is_human_takeover) {
      console.log(`[WhatsApp Gate] Human takeover active for ${cleanPhone}. Silencing bot.`);
      return;
    }
  } catch (err) {
    console.error('[WhatsApp Gate] Session check error:', err.message);
  }

  // 2. Retrieve Dynamic Knowledge & Detailed Catalog Specs via RAG
  const retrievedContext = await retrieveKnowledgeContext(text, tenantId).catch(() => '');

  const payload = JSON.stringify({
    message: text,
    sender: cleanPhone,
    name: senderName,
    receiver: sock?.user?.id?.split(':')[0]?.replace(/[^0-9]/g, '') || '254768141129',
    tenantId: tenantId,
    ragContext: retrievedContext
  });

  const req = https.request(N8N_INBOUND_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    },
    timeout: 30000
  }, (res) => {
    let body = '';
    res.on('data', c => body += c);
    res.on('end', async () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const replyText = parsed.text || parsed.reply || (typeof parsed === 'string' ? parsed : null);

        if (replyText && sock) {
          // Send to the resolved target JID (primary phone destination)
          try {
            await sock.sendMessage(targetJid, { text: replyText });
            console.log(`[WhatsApp Outbound] Successfully delivered reply to ${targetJid}: "${replyText.substring(0, 50)}..."`);
          } catch (sendErr) {
            console.warn(`[WhatsApp Outbound] Delivery to ${targetJid} failed, trying original ${senderJid}:`, sendErr.message);
            if (targetJid !== senderJid) {
              await sock.sendMessage(senderJid, { text: replyText });
            }
          }

          // 2. Database Persistence: Log Assistant Turn
          if (session && session.id) {
            await db.logChatMessage(session.id, tenantId, 'assistant', replyText).catch(() => {});
          }
        }
      } catch (e) {
        console.error('[WhatsApp Forward] Parse error:', e);
      }
    });
  });

  req.on('error', (err) => console.error('[WhatsApp Forward] n8n request error:', err.message));
  req.write(payload);
  req.end();
}

/**
 * Get current session status
 */
function getSessionStatus(tenantId = '11111111-1111-1111-1111-111111111111') {
  const session = sessions.get(tenantId);
  if (!session) {
    return {
      connected: false,
      status: 'DISCONNECTED',
      phone: null,
      formattedPhone: null,
      pushName: null,
      hasQr: false,
      qrDataUrl: null
    };
  }

  return {
    connected: session.status === 'WORKING',
    status: session.status,
    phone: session.phone,
    formattedPhone: session.phone ? ('+' + session.phone) : null,
    pushName: session.pushName,
    hasQr: !!session.qrDataUrl,
    qrDataUrl: session.qrDataUrl
  };
}

/**
 * Request fresh QR pairing
 */
async function requestPairing(tenantId = '11111111-1111-1111-1111-111111111111') {
  const existing = sessions.get(tenantId);
  if (existing?.sock) {
    try { existing.sock.end(); } catch (e) {}
  }
  sessions.delete(tenantId);

  const authFolder = path.join(__dirname, 'auth_sessions', tenantId);
  if (fs.existsSync(authFolder)) {
    fs.rmSync(authFolder, { recursive: true, force: true });
  }

  return getOrCreateSession(tenantId);
}

module.exports = {
  getOrCreateSession,
  getSessionStatus,
  requestPairing
};

