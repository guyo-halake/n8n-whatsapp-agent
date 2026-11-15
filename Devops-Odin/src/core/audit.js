const fs = require('fs');
const path = require('path');

class AuditLogger {
  constructor(logDirectory = null) {
    this.logDirectory = logDirectory || path.resolve(__dirname, '../../logs');
    if (!fs.existsSync(this.logDirectory)) {
      fs.mkdirSync(this.logDirectory, { recursive: true });
    }
  }

  log(event) {
    const entry = {
      auditId: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...event
    };
    const logFile = path.join(this.logDirectory, `audit-${new Date().toISOString().slice(0, 10)}.jsonl`);
    fs.appendFileSync(logFile, JSON.stringify(entry) + '\n', 'utf8');
    return entry;
  }
}

module.exports = {
  AuditLogger
};
