const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const { callRealGemini } = require('./platform_service');
const { retrieveKnowledgeContext } = require('./rag_engine');

async function run() {
  console.log('====================================================');
  console.log('🚀 TESTING LIVE GOOGLE GEMINI 3.5 AI & LOCAL RAG');
  console.log('====================================================');

  const query = 'Hello! What high-performance coding laptops do you have in stock for software development, and what are their prices in KES?';
  console.log(`\nCustomer Query: "${query}"`);

  const t0 = Date.now();
  const context = await retrieveKnowledgeContext(query, '11111111-1111-1111-1111-111111111111');
  console.log(`✅ Local & Database RAG Context Retrieved (${context.length} characters)`);

  const systemPrompt = `You are Odin, Senior Technical Sales & Hardware Consultant for P3L Developers (Nairobi, Kenya).
Founder: Razak Guyo (+254768141129).
Persona: Professional, articulate technical hardware specialist. Communicates strictly in clean, polished English only. Never use Sheng or Swahili.

CATALOG & KNOWLEDGE:
${context}

Instructions:
1. Provide exact laptop specs, hardware warranties, and pricing in KES strictly from the catalog.
2. Outline verified M-Pesa payment options (Pochi La Biashara 0768141129 / Paybill 255255).
3. Confirm express same-day courier dispatch across Nairobi.`;

  try {
    const result = await callRealGemini(systemPrompt, query);
    console.log(`✅ REAL GEMINI AI CONNECTED & REPLIED:`);
    console.log(`Response Time: ${result.latency} ms`);
    console.log(`Token Usage:`, JSON.stringify(result.tokens, null, 2));
    console.log(`\nAgent Reply:\n${result.text}\n`);
    console.log('====================================================');
    console.log('🎉 LIVE GEMINI 3.5 VERIFICATION PASSED');
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    console.error('❌ Gemini Live Call Failed:', err.message);
    process.exit(1);
  }
}

run();

