/**
 * Production Telegram Omnichannel Service for Odin-P3L
 * Connects directly to @fv_rzkbot via Telegram Bot API.
 * Real-time two-way customer communication + owner escalation alerts.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const { runAgentTurn } = require('./agent_runtime/react_runtime');
const db = require('./db_service');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_OWNER_CHAT_ID = process.env.TELEGRAM_OWNER_CHAT_ID || '5784911905';
const TG_API_BASE = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

let isPolling = false;
let lastUpdateId = 0;

/**
 * Send a message via Telegram Bot API
 */
async function sendTelegramMessage(chatId, text, parseMode = 'Markdown') {
  try {
    const res = await fetch(`${TG_API_BASE}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: parseMode
      })
    });
    return await res.json();
  } catch (err) {
    console.error('[Telegram Send Error]', err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Send escalation alert directly to owner Razak Guyo
 */
async function sendOwnerEscalationAlert({ customerName, customerId, channel, userQuery, reason }) {
  const alertText = `🚨 *[ODIN LIVE ESCALATION ALERT]*\n\n` +
    `• *Customer:* ${customerName} (${customerId})\n` +
    `• *Channel:* ${channel}\n` +
    `• *Query:* "${userQuery}"\n` +
    `• *Reason:* ${reason || 'Customer requested human staff/founder'}\n\n` +
    `⚡ *Status:* Escalated to operations desk. Please respond directly.`;

  return await sendTelegramMessage(TELEGRAM_OWNER_CHAT_ID, alertText);
}

/**
 * Handle incoming Telegram update (from webhook or polling)
 */
async function handleTelegramMessage(message) {
  if (!message || !message.text) return;

  const chatId = message.chat.id;
  const userText = message.text.trim();
  const userName = [message.from?.first_name, message.from?.last_name].filter(Boolean).join(' ') || message.from?.username || 'Telegram User';
  const customerId = `tg_${message.from?.id || chatId}`;

  // Don't auto-reply to owner alert commands or empty messages
  if (userText.startsWith('/start')) {
    const isOwner = String(chatId) === String(TELEGRAM_OWNER_CHAT_ID);
    if (isOwner) {
      await sendTelegramMessage(chatId, `*Welcome back, Founder Razak Guyo.* 🚀\n\nOdin Executive Co-Pilot is active and monitoring all systems.\n• WhatsApp Gateway: WAHA Core\n• Database: Supabase PostgreSQL (95 Catalog Items)\n• Live Lead Inquiries: Active\n\nType any operations query or command, e.g. "show pending orders", "inventory summary", or "today's metrics".`);
      return;
    }
    await sendTelegramMessage(chatId, `Hello ${userName}! Welcome to *P3L Developers & Tech Shop* in Nairobi.\n\nI am *Odin*, your Technical Consultant. Ask me anything about our developer laptops, hardware specs, KES pricing, official warranties, or custom software automations.`);
    return;
  }

  console.log(`[Telegram Inbound] From ${userName} (${chatId}): "${userText}"`);

  // 1. Log to Supabase
  let session = null;
  try {
    session = await db.getOrCreateSession(customerId);
    if (session) {
      await db.logChatMessage({
        sessionId: session.id,
        phone: customerId,
        role: 'customer',
        message: userText,
        intent: 'TELEGRAM_INQUIRY',
        tool: 'telegram_bot'
      });
    }
  } catch (e) {}

  // 2. Check if Human Takeover is active
  if (session?.is_human_takeover) {
    console.log(`[Telegram Human Takeover] Bot silent for ${customerId}. Staff in control.`);
    return;
  }

  // 3. Process via Gemini Native ReAct Loop
  try {
    const isOwner = String(chatId) === String(TELEGRAM_OWNER_CHAT_ID);
    const reactRes = await runAgentTurn({
      userMessage: userText,
      customerPhone: isOwner ? 'owner_admin' : customerId,
      dialect: 'english'
    });

    // 4. Send Reply via Telegram
    await sendTelegramMessage(chatId, reactRes.reply);

    // 5. Log Bot Reply
    if (session) {
      await db.logChatMessage({
        sessionId: session.id,
        phone: customerId,
        role: 'assistant',
        message: reactRes.reply,
        intent: reactRes.toolsCalled?.[0]?.name || 'BOT_REPLY',
        tool: 'gemini_react_loop'
      });
    }

    // 6. Check if escalation was triggered
    const isEscalation = reactRes.toolsCalled?.some(t => t.name === 'escalate_to_human_operator');
    if (isEscalation) {
      await sendOwnerEscalationAlert({
        customerName: userName,
        customerId: customerId,
        channel: 'Telegram (@fv_rzkbot)',
        userQuery: userText,
        reason: 'Customer requested founder contact or custom enterprise contract'
      });
    }

    console.log(`[Telegram Outbound] Replied to ${userName} in ${reactRes.latencyMs} ms`);
  } catch (err) {
    console.error('[Telegram Processing Error]', err.message);
    await sendTelegramMessage(chatId, 'We are currently updating our hardware catalog. Please hold on or WhatsApp us directly.');
  }
}

/**
 * Start long-polling daemon for instant Telegram replies without webhook setup
 */
async function startTelegramPolling() {
  if (isPolling) return;
  isPolling = true;
  console.log('🤖 Telegram Bot Poller active: @fv_rzkbot');

  // Delete any existing webhook to enable getUpdates polling
  try {
    await fetch(`${TG_API_BASE}/deleteWebhook`);
  } catch (e) {}

  (async () => {
    while (isPolling) {
      try {
        const url = `${TG_API_BASE}/getUpdates?offset=${lastUpdateId + 1}&timeout=20`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            lastUpdateId = Math.max(lastUpdateId, update.update_id);
            if (update.message) {
              await handleTelegramMessage(update.message);
            }
          }
        }
      } catch (err) {
        // Sleep briefly on connection drop
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  })();
}

function stopTelegramPolling() {
  isPolling = false;
}

module.exports = {
  sendTelegramMessage,
  sendOwnerEscalationAlert,
  handleTelegramMessage,
  startTelegramPolling,
  stopTelegramPolling,
  botUsername: 'fv_rzkbot'
};

