/**
 * Feature 07: Business Hours & Out-of-Office Routing
 * Evaluates current time in East Africa Time (Africa/Nairobi, UTC+3).
 */
const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, '..', '..', 'data', 'business_hours.json');

const DEFAULT_HOURS = {
  enabled: false,
  start: '08:00',
  end: '20:00',
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  outOfOfficeMessage: 'Hello! Thank you for contacting P3L Tech Shop. We are currently closed for the night. Your inquiry has been safely recorded, and our specialist will respond first thing at 8:00 AM.'
};

function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    }
  } catch (e) {}
  return DEFAULT_HOURS;
}

function saveSettings(newSettings) {
  try {
    const updated = { ...loadSettings(), ...newSettings };
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    return { success: true, settings: updated };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Check if current time in Nairobi is within operating hours
 */
function isWithinBusinessHours() {
  const settings = loadSettings();
  if (!settings.enabled) {
    return { isWithinHours: true, enabled: false };
  }

  // Get current day and time in Africa/Nairobi
  const now = new Date();
  const nairobiTimeStr = now.toLocaleTimeString('en-GB', { timeZone: 'Africa/Nairobi', hour12: false }); // "HH:MM:SS"
  const nairobiDayStr = now.toLocaleDateString('en-US', { timeZone: 'Africa/Nairobi', weekday: 'short' }); // "Mon"

  const isDayAllowed = settings.days.includes(nairobiDayStr);
  const currentTime = nairobiTimeStr.substring(0, 5); // "HH:MM"
  const isTimeAllowed = currentTime >= settings.start && currentTime <= settings.end;

  const isWithin = isDayAllowed && isTimeAllowed;

  return {
    isWithinHours: isWithin,
    enabled: true,
    nairobiTime: currentTime,
    nairobiDay: nairobiDayStr,
    schedule: `${settings.start} - ${settings.end} (${settings.days.join(', ')})`,
    outOfOfficeMessage: settings.outOfOfficeMessage
  };
}

module.exports = {
  loadSettings,
  saveSettings,
  isWithinBusinessHours
};
