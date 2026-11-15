const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const KB_DIR = path.join(__dirname, 'knowledge_base');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://muratasgegqmbkhmsevt.supabase.co/rest/v1';

// In-memory cache of local knowledge files
let localKnowledgeCache = null;

function loadLocalKnowledge() {
  try {
    const hardware = JSON.parse(fs.readFileSync(path.join(KB_DIR, 'hardware_specs.json'), 'utf8') || '[]');
    const policies = JSON.parse(fs.readFileSync(path.join(KB_DIR, 'company_policies.json'), 'utf8') || '{}');
    const services = JSON.parse(fs.readFileSync(path.join(KB_DIR, 'services_blueprints.json'), 'utf8') || '[]');
    localKnowledgeCache = { hardware, policies, services };
    return localKnowledgeCache;
  } catch (err) {
    console.error('[RAG Engine] Error loading local knowledge base:', err.message);
    return { hardware: [], policies: {}, services: [] };
  }
}

/**
 * Universal Multi-Tenant RAG Search Function
 * Accepts (query, tenantId) or (tenantId, query) interchangeably
 */
async function retrieveKnowledgeContext(arg1, arg2) {
  let query = '';
  let tenantId = '11111111-1111-1111-1111-111111111111';

  if (typeof arg1 === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(arg1)) {
    tenantId = arg1;
    query = arg2 || '';
  } else {
    query = arg1 || '';
    if (typeof arg2 === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(arg2)) {
      tenantId = arg2;
    }
  }

  const qLower = (query || '').toLowerCase().trim();
  const contextParts = [];

  // Always load latest local knowledge
  const kb = loadLocalKnowledge();

  // 1. HARDWARE MATCHING (Laptops, MacBooks, iMacs, iPhones, Monitors, Peripherals)
  const isHardwareQuery = /laptop|asus|lenovo|hp|thinkpad|legion|victus|spectre|zephyrus|macbook|air|pro|m1|m2|m3|imac|iphone|11|12|13|14|15|16|screen|monitor|samsung|lg|dell|keyboard|mouse|headset|storage|ssd|ram|specs|price|cost|buy|stock|deal/i.test(qLower);

  if (isHardwareQuery || qLower.length === 0) {
    const terms = qLower.split(/\s+/).filter(t => t.length > 2);
    
    // Score each item based on keyword matches
    const scored = kb.hardware.map(item => {
      let score = 0;
      const haystack = (
        (item.name || '') + ' ' + 
        (item.category || '') + ' ' + 
        (item.desc || '') + ' ' + 
        JSON.stringify(item.specs || {})
      ).toLowerCase();

      // Direct brand/model matching
      if (qLower.includes('lenovo') && haystack.includes('lenovo')) score += 10;
      if (qLower.includes('asus') && haystack.includes('asus')) score += 10;
      if (qLower.includes('hp') && haystack.includes('hp')) score += 10;
      if (qLower.includes('thinkpad') && haystack.includes('thinkpad')) score += 15;
      if (qLower.includes('legion') && haystack.includes('legion')) score += 15;
      if (qLower.includes('victus') && haystack.includes('victus')) score += 15;
      if (qLower.includes('zephyrus') && haystack.includes('zephyrus')) score += 15;
      if (qLower.includes('macbook') && haystack.includes('macbook')) score += 12;
      if (qLower.includes('imac') && haystack.includes('imac')) score += 15;
      if (qLower.includes('iphone') && haystack.includes('iphone')) score += 12;
      if (qLower.includes('monitor') && (haystack.includes('monitor') || haystack.includes('display'))) score += 10;
      if (qLower.includes('keyboard') && haystack.includes('keyboard')) score += 10;
      if (qLower.includes('mouse') && haystack.includes('mouse')) score += 10;

      // Specific number matches (e.g. 11, 12, 13, 14, 15, 16, 24, 27, 49)
      const numMatches = qLower.match(/\b(11|12|13|14|15|16|24|27|32|49)\b/g);
      if (numMatches) {
        numMatches.forEach(num => {
          if (haystack.includes(num)) score += 5;
        });
      }

      // General term matches
      terms.forEach(term => {
        if (haystack.includes(term)) score += 2;
      });

      return { item, score };
    });

    // Sort by score descending and take top 6 most relevant items
    scored.sort((a, b) => b.score - a.score);
    const topMatches = scored.filter(s => s.score > 0).slice(0, 6).map(s => s.item);

    if (topMatches.length > 0) {
      contextParts.push("### RELEVANT P3L INVENTORY & HARDWARE SPECS (IN STOCK):");
      topMatches.forEach(h => {
        let details = `* ${h.name} - KES ${Number(h.price).toLocaleString()}\n`;
        details += `  Category: ${h.category} | Stock: In Stock\n`;
        if (h.specs) {
          details += `  Specs: ${JSON.stringify(h.specs)}\n`;
        }
        if (h.desc) details += `  Overview: ${h.desc}\n`;
        contextParts.push(details);
      });
    }
  }

  // 2. SERVICES & REPAIRS MATCHING (iPhone Screen, Motherboard, OS, Web Dev, AI Bot)
  const isServiceQuery = /service|repair|screen|broken|crack|display|replacement|motherboard|chip|liquid|spill|dead|power|install|iso|windows|macos|software|setup|driver|web|website|saas|ai|bot|automation|develop/i.test(qLower);

  if (isServiceQuery || qLower.includes('how much') || qLower.includes('help')) {
    const matchedServices = kb.services.filter(s => {
      const sHaystack = ((s.name || '') + ' ' + (s.desc || '') + ' ' + JSON.stringify(s.specs || {})).toLowerCase();
      if (/screen|crack|display/i.test(qLower) && sHaystack.includes('screen')) return true;
      if (/motherboard|chip|spill|water|short/i.test(qLower) && sHaystack.includes('motherboard')) return true;
      if (/iso|os|windows|macos|format|reinstall/i.test(qLower) && sHaystack.includes('os')) return true;
      if (/ai|bot|whatsapp|automation/i.test(qLower) && sHaystack.includes('ai')) return true;
      if (/web|website|saas/i.test(qLower) && sHaystack.includes('web')) return true;
      return false;
    });

    const servicesToInclude = matchedServices.length > 0 ? matchedServices : kb.services.slice(0, 3);
    if (servicesToInclude.length > 0) {
      contextParts.push("### P3L TECHNICAL SERVICES & REPAIR RATES:");
      servicesToInclude.forEach(s => {
        let details = `* Service: ${s.name} (KES ${Number(s.price).toLocaleString()})\n`;
        if (s.specs) details += `  Details: ${JSON.stringify(s.specs)}\n`;
        if (s.desc) details += `  Description: ${s.desc}\n`;
        contextParts.push(details);
      });
    }
  }

  // 3. STORE GROUNDING: PAYMENT, DELIVERY & WARRANTY (Always inject core policies)
  const pol = kb.policies;
  contextParts.push("### P3L OFFICIAL PAYMENT, DELIVERY & WARRANTY POLICIES:");
  contextParts.push(`1. PAYMENT OPTIONS:
   - M-PESA POCHI LA BIASHARA: Send directly to phone number: +254768141129 (Instant, no extra transaction fee).
   - M-PESA PAYBILL: Business Number: 255255 | Account Number: <Customer Name> & <Order Number>.
   - Cash on Delivery available within Nairobi CBD upon minimal rider commitment.`);

  contextParts.push(`2. DELIVERY NETWORK:
   - NAIROBI & ENVIRONS: Same-day dispatch within 1-2 hours via SUPER METRO PARCELS or PICKUP MTAANI (agent lockers) or dedicated motorbike rider.
   - OUTSIDE NAIROBI / COUNTRYWIDE: Next-day guaranteed delivery via WELLS FARGO COURIER (doorstep/office) or G4S across Mombasa, Kisumu, Nakuru, Eldoret, etc.`);

  contextParts.push(`3. WARRANTIES:
   - Brand new laptops & Apple devices: 1-Year International Warranty with immediate factory replacement.
   - Certified refurbished iPhones (Grade A): 6-Months P3L Hardware Warranty + 100% Battery Health guaranteed.
   - Hardware screen & motherboard repairs: 90-Day Warranty on replaced parts.`);

  return contextParts.join('\n\n');
}

module.exports = {
  loadLocalKnowledge,
  retrieveKnowledgeContext
};
