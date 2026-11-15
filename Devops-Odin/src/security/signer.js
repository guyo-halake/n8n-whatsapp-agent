const crypto = require('crypto');

function generateApprovalToken({ actionId, actionType, target, tenantId, secret, ttlMinutes = 15 }) {
  const expiresAt = Date.now() + ttlMinutes * 60 * 1000;
  const payload = JSON.stringify({ actionId, actionType, target, tenantId, expiresAt });
  const payloadBase64 = Buffer.from(payload).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadBase64)
    .digest('base64url');
  return `${payloadBase64}.${signature}`;
}

function verifyApprovalToken(token, secret) {
  if (!token || typeof token !== 'string') {
    return { valid: false, reason: 'TOKEN_MISSING' };
  }
  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, reason: 'MALFORMED_TOKEN' };
  }
  const [payloadBase64, providedSignature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payloadBase64)
    .digest('base64url');

  const providedBuf = Buffer.from(providedSignature);
  const expectedBuf = Buffer.from(expectedSignature);

  if (providedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(providedBuf, expectedBuf)) {
    return { valid: false, reason: 'INVALID_SIGNATURE' };
  }

  try {
    const payloadJson = Buffer.from(payloadBase64, 'base64url').toString('utf8');
    const data = JSON.parse(payloadJson);
    if (Date.now() > data.expiresAt) {
      return { valid: false, reason: 'TOKEN_EXPIRED', data };
    }
    return { valid: true, data };
  } catch {
    return { valid: false, reason: 'INVALID_PAYLOAD' };
  }
}

module.exports = {
  generateApprovalToken,
  verifyApprovalToken
};
