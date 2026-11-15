/**
 * True Multi-Turn ReAct Loop with Circuit Breakers & Observability
 * Eliminates regex matching. Uses Google Gemini Native Function Calling.
 * Measures real wall-clock latencies (no Math.random).
 */
const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { TOOL_DECLARATIONS, TOOL_EXECUTORS } = require('./tools');
const db = require('../db_service');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const MAX_STEPS = 5;

if (!GEMINI_API_KEY) {
  console.error('[ReAct Runtime CRITICAL] Missing GEMINI_API_KEY in environment variables.');
}

/**
 * Raw HTTPS caller to Google Generative Language API
 */
function callGeminiRaw(model, payload) {
  return new Promise((resolve, reject) => {
    const dataStr = JSON.stringify(payload);
    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataStr)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body || '{}');
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, data: parsed });
          } else {
            reject(new Error(`Gemini API Error ${res.statusCode}: ${parsed.error?.message || body}`));
          }
        } catch (e) {
          reject(new Error(`JSON Parse Error: ${e.message} (Raw: ${body})`));
        }
      });
    });

    req.on('error', reject);
    req.write(dataStr);
    req.end();
  });
}

async function callGeminiWithFallback(payload) {
  const models = ['gemini-3.5-flash-lite', 'gemini-3.8-flash'];
  let lastErr = null;
  for (const m of models) {
    try {
      return await callGeminiRaw(m, payload);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('All Gemini models failed');
}

/**
 * Multi-Turn ReAct Agent Execution Loop
 */
async function runAgentTurn({ userMessage, customerPhone = 'web_test_client', tenantId = '11111111-1111-1111-1111-111111111111', systemPromptOverride = null, dialect = 'english', persistSession = false }) {
  const tStart = Date.now();
  const runId = `run-${Math.random().toString(16).substring(2, 8)}-${Date.now().toString().slice(-4)}`;
  const cleanPhone = String(customerPhone || '').trim().replace(/[^\w\d+]/g, '') || `web_test_${tenantId.substring(0, 8)}`;
  const isNails = tenantId === '22222222-2222-2222-2222-222222222222';
  const trimmedMsg = String(userMessage || '').trim();
  const isSimpleGreeting = /^(hey|hello|hi|good\s*(morning|afternoon|evening)|howdy|habari|niaje)$/i.test(trimmedMsg);

  // Log user message to Supabase ONLY if persistSession is true
  let dbSessionId = null;
  if (persistSession) {
    try {
      const session = await db.getOrCreateSession(cleanPhone, tenantId);
      if (session?.id) {
        dbSessionId = session.id;
        await db.logChatMessage({
          sessionId: session.id,
          tenantId,
          phone: cleanPhone,
          role: 'user',
          message: userMessage,
          intent: 'CUSTOMER_INPUT'
        });
      }
    } catch (e) {}
  }

  let defaultPrompt;

  if (isNails) {
    // BUSINESS 2: LUXE NAILS & SPA LOUNGE (SERVICES)
    const isNailsOwner = cleanPhone.includes('722884400') || cleanPhone === 'owner_admin' || cleanPhone === 'amina_wanjiku';

    defaultPrompt = isNailsOwner ? `You are Bella, front desk manager at Luxe Nails and Spa Lounge on Wood Avenue in Kilimani, Nairobi.
You are speaking with the salon owner, Amina Wanjiku (+254722884400).

Guidelines:
- Address her as Amina.
- No emojis anywhere in your response.
- No AI jargon, robotic phrasing, or artificial pleasantries.
- Provide direct facts: today's bookings, technician availability, and client schedule in concise bullet points.` : `You are Bella, front desk receptionist and nail consultant at Luxe Nails and Spa Lounge.
Location: Wood Avenue Plaza, 3rd Floor, Kilimani, Nairobi.
Owner: Amina Wanjiku (+254722884400).
Salon Hours: Monday to Saturday 8:30 AM to 8:00 PM, Sunday 10:00 AM to 6:00 PM.

CRITICAL TONE AND FORMATTING RULES:
- ABSOLUTELY ZERO EMOJIS UNDER ANY CIRCUMSTANCES. Do not use even a single emoji.
- NO AI JARGON OR ROBOTIC PHRASES. Never say "As an AI", "I am programmed to", "I have dispatched a priority alert", "system note", or "in the interim".
- Speak in a natural, polite, minimalist, human tone like a professional receptionist at an upscale Nairobi salon.
- Clean English only.

BUSINESS SCOPE AND STRICT BOUNDARIES:
- You work strictly for Luxe Nails and Spa Lounge. You specialize in manicures, pedicures, acrylics, BIAB builder gel, and spa treatments.
- YOU DO NOT SELL COMPUTERS, LAPTOPS, ELECTRONICS, HARDWARE, OR TECH SERVICES.
- If someone asks for electronics, laptops, or computer parts, politely clarify: "This is Luxe Nails and Spa Lounge in Kilimani. We do not sell computers or hardware. We offer nail care, manicures, and spa treatments. Let me know if you would like to book an appointment."

WORKFLOW:
- If the customer sends a simple greeting ("hey", "hello", "hi"):
  Respond warmly and simply without calling any tool:
  "Hello, welcome to Luxe Nails and Spa Lounge. How can I help you today?"
- If the customer asks for nail services, treatments, or prices:
  Call search_inventory once. Return clean bullet points with the service name, duration in minutes, and price in KES.
- If the customer wants to book an appointment:
  Call confirm_customer_order with their phone, service name, agreed price, and requested appointment time. Explain that a 500 KES deposit via M-Pesa secures their slot.
- If the customer asks about policies (rescheduling, hygiene, 7-day fix guarantee):
  Call query_company_policy once.
- If the customer asks to speak with the manager or Amina Wanjiku:
  Call escalate_to_human_operator once.
Prices are strictly in KES.`;
  } else {
    // BUSINESS 1: P3L DEVELOPERS & TECH SHOP (HARDWARE & DEV)
    const isP3LOwner = cleanPhone.includes('768141129') || cleanPhone === 'owner_admin' || cleanPhone === '5784911905';

    defaultPrompt = isP3LOwner ? `You are Odin, technical coordinator at P3L Developers.
You are speaking with founder Razak Guyo (+254768141129).

Guidelines:
- Address him as Razak.
- No emojis anywhere in your response.
- No AI jargon, robotic phrasing, or artificial pleasantries.
- Provide direct hardware inventory numbers, pending orders, and client requests in concise bullet points.` : `You are Odin, hardware technician and sales specialist at P3L Developers and Tech Shop in Nairobi.
Founder: Razak Guyo (+254768141129).
Location: Nairobi, Kenya.

CRITICAL TONE AND FORMATTING RULES:
- ABSOLUTELY ZERO EMOJIS UNDER ANY CIRCUMSTANCES. Do not use even a single emoji.
- NO AI JARGON OR ROBOTIC PHRASES. Never say "As an AI", "I am primed to", "I have dispatched a high-priority dispatch", "system note", or "in the interim".
- Speak in a natural, grounded, minimalist, human tone like an experienced technician.
- Clean English only.

BUSINESS SCOPE AND STRICT BOUNDARIES:
- You specialize in developer laptops, workstations, hardware components, screen/motherboard repairs, and custom software development contracts.
- YOU DO NOT OFFER SALON, BEAUTY, MANICURE, OR PEDICURE SERVICES.
- If someone asks for nail care, politely clarify: "This is P3L Developers and Tech Shop. We build software and supply computer hardware. We do not offer salon or nail services."

WORKFLOW:
- If the customer sends a simple greeting ("hey", "hello", "hi"):
  Respond warmly and simply without calling any tool:
  "Hello, welcome to P3L Developers and Tech Shop. Are you looking for a laptop, workstation, or technical support today?"
- If the customer asks for laptops or hardware:
  Call search_inventory once. Provide the laptop name, core specs (processor, RAM, SSD), and KES price.
- If the customer accepts an offer or confirms an order:
  Call confirm_customer_order once with their phone, item name, price, and delivery address.
- If the customer wants to pay via M-Pesa:
  Call initiate_mpesa_payment once.
- If the customer asks about warranty, returns, or courier delivery:
  Call query_company_policy once.
- If the customer asks to speak with Razak Guyo or needs an enterprise contract:
  Call escalate_to_human_operator once.
Prices are strictly in KES.`;
  }

  const systemInstruction = systemPromptOverride || defaultPrompt;

  // Initialize multi-turn conversation memory from Supabase
  const rawHistory = [];
  // For fresh simple greetings, do not poison with old test history
  if (!isSimpleGreeting) {
    try {
      const session = await db.getOrCreateSession(cleanPhone, tenantId);
      if (session?.id) {
        const pastMessages = await db.getSessionMessages(session.id);
        if (Array.isArray(pastMessages) && pastMessages.length > 0) {
          // Retrieve last 4 conversation turns for context continuity
          const recent = pastMessages.slice(-5);
          for (const m of recent) {
            const role = (m.sender_role === 'assistant' || m.sender_role === 'model') ? 'model' : 'user';
            if (m.message_text && m.message_text.trim() && m.message_text !== userMessage) {
              rawHistory.push({
                role: role,
                parts: [{ text: m.message_text }]
              });
            }
          }
        }
      }
    } catch (e) {}
  }

  // Append current user message
  rawHistory.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  // Ensure strict alternating roles for Gemini API (user -> model -> user)
  const contents = [];
  let lastRole = null;
  for (const item of rawHistory) {
    if (item.role !== lastRole) {
      contents.push(item);
      lastRole = item.role;
    } else {
      contents[contents.length - 1].parts[0].text += `\n${item.parts[0].text}`;
    }
  }

  let step = 0;
  let toolCallsMade = [];
  let totalPromptTokens = 0;
  let totalCandidatesTokens = 0;
  let finalReply = '';

  while (step < MAX_STEPS) {
    step++;
    const stepStart = Date.now();

    const requestPayload = {
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: contents,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 900
      }
    };

    // Provide tools only if no tool has been executed yet and not a simple greeting
    if (toolCallsMade.length === 0 && !isSimpleGreeting) {
      requestPayload.tools = [{ functionDeclarations: TOOL_DECLARATIONS }];
    }

    const geminiResponse = await callGeminiWithFallback(requestPayload);

    const stepDuration = Date.now() - stepStart;
    const usage = geminiResponse.data.usageMetadata || {};
    totalPromptTokens += (usage.promptTokenCount || 0);
    totalCandidatesTokens += (usage.candidatesTokenCount || 0);

    const candidate = geminiResponse.data.candidates?.[0];
    if (!candidate || !candidate.content) {
      throw new Error('Gemini returned an empty candidate');
    }

    const parts = candidate.content.parts || [];
    const functionCallPart = parts.find(p => p.functionCall);

    // CASE 1: Model decided to invoke a native tool
    if (functionCallPart && functionCallPart.functionCall) {
      const call = functionCallPart.functionCall;
      const toolName = call.name;
      const toolArgs = call.args || {};
      const toolStart = Date.now();

      const executor = TOOL_EXECUTORS[toolName];
      let toolOutput;

      if (executor) {
        try {
          toolOutput = await executor(toolArgs, { tenantId, customerPhone: cleanPhone });
        } catch (execErr) {
          toolOutput = { error: `Tool execution failed: ${execErr.message}` };
        }
      } else {
        toolOutput = { error: `Unknown tool declared by model: ${toolName}` };
      }

      const toolDuration = Date.now() - toolStart;
      toolCallsMade.push({
        step,
        name: toolName,
        args: toolArgs,
        output: toolOutput,
        latencyMs: toolDuration
      });

      // 1. Append model's response (retaining exact thoughtSignature from candidate.content)
      contents.push(candidate.content);

      // 2. Append tool execution output
      contents.push({
        role: 'user',
        parts: [
          {
            functionResponse: {
              name: toolName,
              response: {
                output: toolOutput
              }
            }
          }
        ]
      });

      // Loop continues so Gemini can synthesize over the real tool output!
      continue;
    }

    // CASE 2: Model emitted textual response
    const textPart = parts.find(p => p.text);
    if (textPart && textPart.text) {
      finalReply = textPart.text;
      break;
    }
  }

  // Circuit breaker check
  if (!finalReply && step >= MAX_STEPS) {
    finalReply = isNails 
      ? "I have retrieved our salon service details. Let me connect you directly with salon manager Amina Wanjiku (+254722884400) to confirm your appointment."
      : "I have retrieved the hardware and pricing details. Let me connect you directly with Razak Guyo (+254768141129) to finalize your order.";
    toolCallsMade.push({
      step: MAX_STEPS,
      name: 'circuit_breaker',
      args: { reason: 'MAX_STEPS_EXCEEDED' },
      output: { tripped: true },
      latencyMs: 1
    });
  }

  const totalWallClockLatency = Date.now() - tStart;
  const totalTokens = totalPromptTokens + totalCandidatesTokens;
  // Gemini 3.5 Flash Lite pricing: ~$0.075 / 1M input tokens, ~$0.30 / 1M output tokens
  const costUsd = ((totalPromptTokens * 0.000000075) + (totalCandidatesTokens * 0.0000003));

  // Persist genuine trace in Supabase ONLY if persistSession is true
  if (persistSession) {
    try {
      const session = await db.getOrCreateSession(cleanPhone);
      if (session?.id) {
        await db.logChatMessage({
          sessionId: session.id,
          phone: cleanPhone,
          role: 'assistant',
          message: finalReply,
          intent: toolCallsMade.length > 0 ? toolCallsMade[0].name : 'CONVERSATIONAL_SYNTHESIS',
          tool: toolCallsMade.map(t => t.name).join(','),
          latencyMs: totalWallClockLatency,
          tokens: {
            promptTokenCount: totalPromptTokens,
            candidatesTokenCount: totalCandidatesTokens,
            totalTokenCount: totalTokens
          }
        });
      }
    } catch (e) {}
  }

  return {
    success: true,
    runId,
    reply: finalReply,
    customerPhone: cleanPhone,
    modelUsed: PRIMARY_MODEL,
    stepsTaken: step,
    toolsCalled: toolCallsMade,
    latencyMs: totalWallClockLatency,
    tokens: {
      promptTokenCount: totalPromptTokens,
      candidatesTokenCount: totalCandidatesTokens,
      totalTokenCount: totalTokens
    },
    costUsd: parseFloat(costUsd.toFixed(6)),
    circuitBreakerTripped: step >= MAX_STEPS
  };
}

module.exports = {
  runAgentTurn,
  callGeminiRaw
};
