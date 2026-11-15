/**
 * Feature 05: Shared Human Operator Inbox
 * 100% Real Live Inbox backed by Supabase Cloud DB and WAHA Core WhatsApp Engine.
 * Zero hardcoded mock contacts or fake conversations.
 */
const http = require('http');
const db = require('../../db_service');

const WAHA_URL = process.env.WAHA_URL || 'http://localhost:5000';

function sendWahaTextMessage(chatId, text) {
  return new Promise((resolve, reject) => {
    const formattedChatId = chatId.includes('@c.us') ? chatId : `${chatId}@c.us`;
    const payload = JSON.stringify({
      session: 'default',
      chatId: formattedChatId,
      text: text
    });

    const url = new URL(WAHA_URL + '/api/sendText');
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data || '{}') });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => resolve({ status: 500, error: err.message }));
    req.write(payload);
    req.end();
  });
}

/**
 * Fetch real customer conversations from Supabase
 * Strictly filters for live customer WhatsApp conversations (excludes mock data & test scripts)
 */
async function getLiveConversations(tenantId = null) {
  try {
    const sessions = await db.listSessions(tenantId);
    if (!Array.isArray(sessions) || sessions.length === 0) {
      return {
        success: true,
        conversations: [],
        message: 'No active WhatsApp customer chats yet for this business. Link a WhatsApp line or scan the QR code to receive live customer messages.'
      };
    }

    // Filter out test runners, web clients, and internal owner numbers
    const realSessions = sessions.filter(s => {
      const phone = String(s.customer_phone || '').trim();
      const isTestOrOwner = phone === 'web_test_client' || 
                            phone.startsWith('web_test') ||
                            phone.startsWith('test_') || 
                            phone.includes('test') || 
                            phone.includes('sess_') ||
                            phone.length > 20 || // Raw UUID
                            phone === '254768141129' || // Founder Razak Guyo
                            phone === '254722884400' || // Salon Owner Amina Wanjiku
                            phone === '254700889900' || // Legacy test number
                            phone === '254711998877' || // Legacy test number
                            phone === '254712345678' || 
                            phone === '254799887766' || 
                            phone === '254700112233' ||
                            phone === '254700000000' ||
                            phone === '254700000001' ||
                            phone === '254141888585';
      return !isTestOrOwner && phone.length >= 9;
    });

    if (realSessions.length === 0) {
      return {
        success: true,
        conversations: [],
        message: 'No active WhatsApp customer chats yet for this business. Link a WhatsApp line or scan the QR code to receive live customer messages.'
      };
    }

    const conversations = await Promise.all(realSessions.map(async (sess) => {
      const messages = await db.getSessionMessages(sess.id);
      const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
      return {
        sessionId: sess.id,
        chatId: sess.customer_phone,
        customerName: sess.customer_phone ? `+${sess.customer_phone}` : 'Customer',
        humanTakeover: !!sess.is_human_takeover,
        humanOperatorName: sess.human_operator_name,
        lastMessage: lastMsg ? lastMsg.message_text : 'Session initiated',
        lastTimestamp: lastMsg ? lastMsg.created_at : sess.last_interaction_at,
        messages: messages.map(m => ({
          sender: m.sender_role === 'human_operator' ? 'operator' : (m.sender_role === 'assistant' ? 'bot' : 'customer'),
          text: m.message_text,
          timestamp: m.created_at
        }))
      };
    }));

    return {
      success: true,
      conversations
    };
  } catch (err) {
    return {
      success: false,
      conversations: [],
      error: err.message
    };
  }
}

/**
 * Toggle human takeover in Supabase
 */
async function toggleSessionTakeover({ sessionId, phone, humanTakeover }) {
  try {
    let targetSessionId = sessionId;
    if (!targetSessionId && phone) {
      const sess = await db.getOrCreateSession(phone);
      targetSessionId = sess.id;
    }

    if (!targetSessionId) {
      return { success: false, error: 'Session ID or phone number required' };
    }

    if (humanTakeover) {
      await db.setSessionTakeover(targetSessionId, 'Razak Guyo');
    } else {
      await db.supabaseRequest(
        `/chat_sessions?id=eq.${targetSessionId}`,
        'PATCH',
        {
          is_human_takeover: false,
          human_operator_name: null,
          takeover_started_at: null,
          last_interaction_at: new Date().toISOString()
        }
      );
    }

    return {
      success: true,
      sessionId: targetSessionId,
      humanTakeover: !!humanTakeover
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Send reply as human operator via WAHA and log to Supabase
 */
async function sendHumanReply({ phone, text, sessionId = null }) {
  const cleanPhone = String(phone || '').replace(/[^0-9]/g, '');
  if (!cleanPhone || !text) {
    return { success: false, error: 'Phone number and message text required' };
  }

  try {
    // 1. Send via live WAHA engine
    const wahaRes = await sendWahaTextMessage(cleanPhone, text);

    // 2. Ensure session exists in Supabase
    let sId = sessionId;
    if (!sId) {
      const sess = await db.getOrCreateSession(cleanPhone);
      sId = sess?.id;
    }

    // 3. Log to Supabase chat_messages
    if (sId) {
      await db.logChatMessage({
        sessionId: sId,
        phone: cleanPhone,
        role: 'human_operator',
        message: text,
        intent: 'HUMAN_OPERATOR_REPLY',
        tool: 'waha_sendText'
      });
    }

    return {
      success: true,
      phone: cleanPhone,
      text,
      wahaStatus: wahaRes.status,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = {
  getLiveConversations,
  toggleSessionTakeover,
  sendHumanReply
};
