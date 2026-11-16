/**
 * Paystack gateway service.
 *
 * Secrets must be supplied by the process environment. Never commit or return
 * the secret key, and never treat a customer claim as payment confirmation.
 */
const crypto = require('crypto');
const http = require('http');
const https = require('https');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;

function requireSecretKey() {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured');
  }
  return PAYSTACK_SECRET_KEY;
}

function paystackRequest(pathStr, method = 'GET', bodyObj = null) {
  const secretKey = requireSecretKey();
  const apiUrl = new URL(process.env.PAYSTACK_API_BASE_URL || 'https://api.paystack.co');
  return new Promise((resolve, reject) => {
    const payload = bodyObj ? JSON.stringify(bodyObj) : '';
    const headers = {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json'
    };
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);

    const request = apiUrl.protocol === 'http:' ? http.request : https.request;
    const req = request({
      hostname: apiUrl.hostname,
      port: apiUrl.port || 443,
      path: `${apiUrl.pathname.replace(/\/$/, '')}${pathStr}`,
      method,
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json;
        try {
          json = JSON.parse(data || '{}');
        } catch {
          json = { status: false, message: 'Invalid response from Paystack' };
        }
        if (res.statusCode < 200 || res.statusCode >= 300 || json.status === false) {
          const detail = json.message || json.error || `HTTP ${res.statusCode}`;
          resolve({ statusCode: res.statusCode, ...json, _error: `Paystack ${detail}` });
          return;
        }
        resolve({ statusCode: res.statusCode, ...json });
      });
    });

    req.on('error', err => reject(new Error(`Paystack network error: ${err.message}`)));
    if (payload) req.write(payload);
    req.end();
  });
}

function verifyWebhookSignature(rawBody, signature) {
  if (!PAYSTACK_SECRET_KEY || !signature || !rawBody) return false;
  const expected = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest('hex');
  const supplied = String(signature);
  return supplied.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
}

async function initializePayment({ email, amountKES, phone, orderId, tenantId, metadata = {} }) {
  const amount = Number(amountKES);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('A positive payment amount is required');
  if (!email || !String(email).includes('@')) throw new Error('A valid customer email is required by Paystack');

  const res = await paystackRequest('/transaction/initialize', 'POST', {
    email: String(email).trim(),
    amount: Math.round(amount * 100),
    currency: process.env.PAYSTACK_CURRENCY || 'KES',
    channels: ['mobile_money', 'card', 'bank'],
    metadata: { phone: phone || '', orderId: orderId || '', tenantId: tenantId || '', ...metadata }
  });
  if (!res.status || !res.data) throw new Error(res.message || 'Failed to initialize Paystack transaction');

  return {
    success: true,
    authorizationUrl: res.data.authorization_url,
    accessCode: res.data.access_code,
    reference: res.data.reference,
    amountKES: amount,
    email: String(email).trim(),
    phone: phone || null
  };
}

async function chargeMpesa({ email, amountKES, phone, orderId, tenantId, metadata = {} }) {
  const amount = Number(amountKES);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('A positive payment amount is required');
  if (!email || !String(email).includes('@')) throw new Error('A valid customer email is required by Paystack');
  let clean = String(phone || '').replace(/\D/g, '');
  if (clean.startsWith('0')) clean = clean.substring(1);
  if (clean.startsWith('254')) clean = clean.substring(3);
  if (clean.length !== 9 || (!clean.startsWith('7') && !clean.startsWith('1'))) {
    throw new Error('A valid Kenyan mobile number starting with 07, 01, or +254 is required');
  }
  const normalizedPhone = `+254${clean}`;

  const res = await paystackRequest('/charge', 'POST', {
    email: String(email).trim(),
    amount: Math.round(amount * 100),
    currency: process.env.PAYSTACK_CURRENCY || 'KES',
    mobile_money: {
      phone: normalizedPhone,
      provider: 'mpesa'
    },
    metadata: { phone: normalizedPhone, orderId: orderId || '', tenantId: tenantId || '', ...metadata }
  });
  if (!res.status || !res.data) {
    throw new Error(res._error || res.message || 'Failed to request Paystack M-Pesa prompt');
  }

  return {
    success: true,
    status: res.data.status,
    reference: res.data.reference,
    displayText: res.data.display_text || null,
    amountKES: amount,
    email: String(email).trim(),
    phone: normalizedPhone,
    raw: res.data
  };
}

async function verifyTransaction(reference) {
  if (!reference) throw new Error('Payment reference is required');
  return paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`);
}

async function getAccountOverview() {
  const [balanceRes, totalsRes, recipientsRes, settlementRes] = await Promise.all([
    paystackRequest('/balance'),
    paystackRequest('/transaction/totals'),
    paystackRequest('/transferrecipient'),
    paystackRequest('/settlement')
  ]);
  const balance = (balanceRes.data || []).find(item => item.currency === 'KES');
  return {
    success: true,
    currency: 'KES',
    balanceKES: (balance?.balance || 0) / 100,
    totalVolumeKES: (totalsRes.data?.total_volume || 0) / 100,
    totalTransactions: totalsRes.data?.total_transactions || 0,
    recipients: (recipientsRes.data || []).map(item => ({
      recipientCode: item.recipient_code,
      name: item.name,
      type: item.type,
      accountNumber: item.details?.account_number || '',
      accountName: item.details?.account_name || item.name,
      bank: item.details?.bank_name || item.details?.bank_code || ''
    })),
    recentSettlements: (settlementRes.data || []).slice(0, 5).map(item => ({
      id: item.id,
      amountKES: (item.effective_amount || 0) / 100,
      feesKES: (item.total_fees || 0) / 100,
      settlementDate: item.settlement_date,
      status: item.status
    }))
  };
}

async function listTransactions(perPage = 50) {
  const safePerPage = Math.min(Math.max(Number(perPage) || 50, 1), 100);
  const res = await paystackRequest(`/transaction?perPage=${safePerPage}`);
  if (!res.status || !Array.isArray(res.data)) return [];
  return res.data.map(item => ({
    receiptCode: item.reference,
    phone: item.customer?.phone || item.customer?.email || 'Customer',
    amountKES: (item.amount || 0) / 100,
    dateTime: item.paid_at || item.created_at,
    status: item.status,
    channel: item.channel || 'Paystack',
    rawId: item.id,
    paidAt: item.paid_at,
    gatewayResponse: item.gateway_response || item.message || ''
  }));
}

async function initiateWithdrawal({ amountKES, recipientCode, reason = 'Merchant settlement' }) {
  const amount = Number(amountKES);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('A positive withdrawal amount is required');
  if (!recipientCode) throw new Error('A configured Paystack recipient is required');
  return paystackRequest('/transfer', 'POST', {
    source: 'balance',
    amount: Math.round(amount * 100),
    recipient: recipientCode,
    reason
  });
}

module.exports = {
  getAccountOverview,
  listTransactions,
  initializePayment,
  chargeMpesa,
  initiateWithdrawal,
  verifyTransaction,
  verifyWebhookSignature,
  PAYSTACK_PUBLIC_KEY
};
