const SENSITIVE_PATTERNS = [
  /bearer\s+[A-Za-z0-9._~+/-]{8,}/gi,
  /(api[_-]?key|token|secret|password|passwd|authorization|auth_token)\s*[:=]\s*['"]?[^\s,;'"]+['"]?/gi,
  /-----BEGIN [A-Z ]+ PRIVATE KEY-----[\s\S]*?-----END [A-Z ]+ PRIVATE KEY-----/g,
  /ghp_[A-Za-z0-9]{36}/g,
  /github_pat_[A-Za-z0-9_]{82}/g,
  /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,32}/g,
  /DefaultEndpointsProtocol=https;AccountName=[^;]+;AccountKey=[^;]+;EndpointSuffix=[^;\s]+/gi,
  /postgres(ql)?:\/\/[^:]+:[^@]+@[^\s/]+/gi,
  /mongodb(\+srv)?:\/\/[^:]+:[^@]+@[^\s/]+/gi,
  /mysql:\/\/[^:]+:[^@]+@[^\s/]+/gi,
  /redis:\/\/[^:]*:[^@]+@[^\s/]+/gi
];

function sanitizeString(content) {
  if (typeof content !== 'string') return '';
  let sanitized = content;
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, (match) => {
      if (match.startsWith('-----BEGIN')) {
        return '[REDACTED_PRIVATE_KEY]';
      }
      if (/^bearer\s+/i.test(match)) {
        return 'Bearer [REDACTED]';
      }
      const separatorIdx = match.search(/[:=]/);
      if (separatorIdx !== -1) {
        const key = match.slice(0, separatorIdx + 1);
        return `${key} [REDACTED]`;
      }
      return '[REDACTED]';
    });
  }
  return sanitized;
}

function sanitizeObject(target) {
  if (target === null || target === undefined) return target;
  if (typeof target === 'string') return sanitizeString(target);
  if (Array.isArray(target)) return target.map(sanitizeObject);
  if (typeof target === 'object') {
    const clean = {};
    for (const [key, value] of Object.entries(target)) {
      if (/password|secret|token|authorization|apikey|api_key|credential/i.test(key)) {
        clean[key] = '[REDACTED]';
      } else {
        clean[key] = sanitizeObject(value);
      }
    }
    return clean;
  }
  return target;
}

module.exports = {
  sanitizeString,
  sanitizeObject
};
