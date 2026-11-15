/**
 * Feature 09: Sheng / English Dialect Mode Toggle
 * Adjusts communication style between Strict Corporate English, Friendly Urban Sheng, and Adaptive Bilingual.
 */
const fs = require('fs');
const path = require('path');

const DIALECT_FILE = path.join(__dirname, '..', '..', 'data', 'dialect_mode.json');

const MODES = {
  english: {
    id: 'english',
    label: 'Strict Corporate English',
    description: 'Formal professional B2B tone. No colloquial slang. Recommended for corporate clients and international customers.',
    promptInstruction: 'Tone: Strict Corporate English. Communicate in clear, polished, formal business English. Do not use slang, colloquial expressions, or Sheng.'
  },
  sheng: {
    id: 'sheng',
    label: 'Friendly Urban Sheng / Swahili',
    description: 'Engaging Nairobi street vibe ("Niaje bro", "Machine kali"). Ideal for youth retail and local shoppers.',
    promptInstruction: 'Tone: Authentic Nairobi Sheng & Swahili blend. Use natural, friendly Kenyan expressions (e.g., "Niaje bro", "Machine kali ya coding", "Tuko chonjo", "Delivery ni chap chap"). Keep it vibrant, respectful, and relatable.'
  },
  adaptive_bilingual: {
    id: 'adaptive_bilingual',
    label: 'Adaptive Bilingual (Recommended)',
    description: 'Auto-detects customer dialect. Mirrors Sheng in Sheng, and English in English dynamically.',
    promptInstruction: 'Tone: Adaptive Bilingual Kenyan. Dynamically detect the customer language. If the customer greets in Sheng or Swahili ("Niaje", "Mambo", "Sasa"), respond naturally in warm urban Sheng. If the customer writes in formal English, reply in professional English.'
  }
};

let activeMode = 'adaptive_bilingual';

function loadDialect() {
  try {
    if (fs.existsSync(DIALECT_FILE)) {
      const data = JSON.parse(fs.readFileSync(DIALECT_FILE, 'utf-8'));
      if (data.mode && MODES[data.mode]) {
        activeMode = data.mode;
      }
    }
  } catch (e) {}
  return activeMode;
}

function setDialect(mode) {
  if (MODES[mode]) {
    activeMode = mode;
    try {
      const dir = path.dirname(DIALECT_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DIALECT_FILE, JSON.stringify({ mode: activeMode, updatedAt: new Date().toISOString() }, null, 2), 'utf-8');
    } catch (e) {}
    return { success: true, mode: activeMode, config: MODES[activeMode] };
  }
  return { success: false, error: 'Invalid dialect mode. Choose english, sheng, or adaptive_bilingual' };
}

function getDialectConfig() {
  const mode = loadDialect();
  return {
    activeMode: mode,
    modes: Object.values(MODES),
    current: MODES[mode]
  };
}

module.exports = {
  MODES,
  loadDialect,
  setDialect,
  getDialectConfig
};
