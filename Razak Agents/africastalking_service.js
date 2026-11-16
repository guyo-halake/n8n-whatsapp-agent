/**
 * Real Production Africa's Talking SMS & Telco Gateway Service
 * Native integration for African telecom notifications, SMS receipts, and payment alerts.
 */
const https = require('https');
const path = require('path');
const querystring = require('querystring');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const AT_API_KEY = process.env.AFRICASTALKING_API_KEY;
const AT_USERNAME = process.env.AFRICASTALKING_USERNAME || 'sandbox';

/**
 * Send SMS via Africa's Talking
 * @param {string|string[]} to - Recipient phone number (e.g. +2547XXXXXXXX)
 * @param {string} message - Message text
 * @param {string} from - Optional Sender ID or Shortcode
 */
function sendSMS({ to, message, from = null }) {
  if (!AT_API_KEY) return Promise.reject(new Error('AFRICASTALKING_API_KEY is not configured'));
  return new Promise((resolve, reject) => {
    const recipients = Array.isArray(to) ? to.join(',') : to;
    const postData = {
      username: AT_USERNAME,
      to: recipients,
      message: message
    };
    if (from) {
      postData.from = from;
    }

    const payload = querystring.stringify(postData);
    const headers = {
      'apiKey': AT_API_KEY,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(payload),
      'Accept': 'application/json'
    };

    const isSandbox = AT_USERNAME === 'sandbox';
    const hostname = isSandbox ? 'api.sandbox.africastalking.com' : 'api.africastalking.com';

    const options = {
      hostname: hostname,
      path: '/version1/messaging',
      method: 'POST',
      headers: headers
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data || '{}');
          resolve({ statusCode: res.statusCode, ...json });
        } catch (e) {
          resolve({ statusCode: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Africa's Talking Network Error: ${err.message}`));
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Check Africa's Talking Account User Data
 */
function getUserAccount() {
  if (!AT_API_KEY) return Promise.reject(new Error('AFRICASTALKING_API_KEY is not configured'));
  return new Promise((resolve, reject) => {
    const isSandbox = AT_USERNAME === 'sandbox';
    const hostname = isSandbox ? 'api.sandbox.africastalking.com' : 'api.africastalking.com';

    const options = {
      hostname: hostname,
      path: `/version1/user?username=${encodeURIComponent(AT_USERNAME)}`,
      method: 'GET',
      headers: {
        'apiKey': AT_API_KEY,
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data || '{}');
          resolve({ statusCode: res.statusCode, ...json });
        } catch (e) {
          resolve({ statusCode: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Africa's Talking User Error: ${err.message}`));
    });

    req.end();
  });
}

module.exports = {
  sendSMS,
  getUserAccount,
  AT_API_KEY,
  AT_USERNAME
};
