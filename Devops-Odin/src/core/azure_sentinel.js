const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const { AuditLogger } = require('./audit');

class AzureSentinel {
  constructor(options = {}) {
    this.resourceGroup = options.resourceGroup || 'rg-nyagah-fee';
    this.primaryApp = options.primaryApp || 'nyagah-b-fee-notes';
    this.auditLogger = new AuditLogger();
    this.endpoints = [
      {
        name: 'nyagah-b-fee-notes',
        url: 'https://nyagah-b-fee-notes.azurewebsites.net',
        resourceGroup: 'rg-nyagah-fee'
      },
      {
        name: 'nyagahkithinji-advocates',
        url: 'https://nyagahkithinji-advocates.azurewebsites.net',
        resourceGroup: 'rg-nyagah-fee'
      },
      {
        name: 'guyohalake',
        url: 'https://guyohalake.azurewebsites.net',
        resourceGroup: 'rg-nyagah-fee'
      }
    ];
  }

  async probeEndpoint(target) {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(target.url, { signal: controller.signal });
      clearTimeout(timeoutId);
      const latencyMs = Date.now() - start;
      return {
        name: target.name,
        url: target.url,
        statusCode: res.status,
        healthy: res.status >= 200 && res.status < 400,
        latencyMs,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      return {
        name: target.name,
        url: target.url,
        statusCode: 0,
        healthy: false,
        latencyMs: Date.now() - start,
        error: err.name === 'AbortError' ? 'TIMEOUT_EXCEEDED' : err.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async probeFleet() {
    const results = await Promise.all(this.endpoints.map(e => this.probeEndpoint(e)));
    const unhealthy = results.filter(r => !r.healthy);
    return {
      timestamp: new Date().toISOString(),
      totalProbed: results.length,
      healthyCount: results.length - unhealthy.length,
      unhealthyCount: unhealthy.length,
      fleetStatus: unhealthy.length === 0 ? 'HEALTHY' : 'DEGRADED',
      details: results
    };
  }

  async executeSelfHealing(webappName, reason = 'HEALTH_CHECK_FAILURE') {
    const auditRecord = this.auditLogger.log({
      stage: 'SENTINEL_SELF_HEALING_TRIGGERED',
      service: webappName,
      reason,
      action: 'az webapp restart'
    });

    try {
      const { stdout } = await execAsync(`az webapp restart --name ${webappName} --resource-group ${this.resourceGroup}`);
      const probeAfter = await this.probeEndpoint(
        this.endpoints.find(e => e.name === webappName) || { name: webappName, url: `https://${webappName}.azurewebsites.net` }
      );

      this.auditLogger.log({
        stage: 'SENTINEL_SELF_HEALING_COMPLETED',
        service: webappName,
        restartResult: 'SUCCESS',
        probeAfter
      });

      return {
        success: true,
        auditId: auditRecord.auditId,
        service: webappName,
        postRestartProbe: probeAfter
      };
    } catch (err) {
      this.auditLogger.log({
        stage: 'SENTINEL_SELF_HEALING_FAILED',
        service: webappName,
        error: err.message
      });
      return {
        success: false,
        error: err.message
      };
    }
  }
}

module.exports = {
  AzureSentinel
};
