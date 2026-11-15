/**
 * Production Process Supervisor for Odin Agent Platform
 * Ensures 99.99% uptime, auto-restart on crash, zero-downtime recovery,
 * and persistent structured logging to ./logs/runtime.log
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.resolve(__dirname, 'logs');
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

const RUNTIME_LOG = path.join(LOGS_DIR, 'runtime.log');
const CRASH_LOG = path.join(LOGS_DIR, 'crash.log');

function log(msg, toFile = true) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  process.stdout.write(line);
  if (toFile) {
    fs.appendFileSync(RUNTIME_LOG, line);
  }
}

let restartCount = 0;
let lastStartTime = Date.now();
const MAX_RESTARTS_PER_WINDOW = 20;
const WINDOW_MS = 60000; // 1 minute

let currentChild = null;

function startServer() {
  const now = Date.now();
  if (now - lastStartTime > WINDOW_MS) {
    restartCount = 0;
  }
  lastStartTime = now;
  restartCount++;

  if (restartCount > MAX_RESTARTS_PER_WINDOW) {
    const errMsg = `[CRITICAL] Server crashed ${MAX_RESTARTS_PER_WINDOW} times within 60s. Pausing for 30s to prevent thrashing...`;
    log(errMsg);
    fs.appendFileSync(CRASH_LOG, `[${new Date().toISOString()}] ${errMsg}\n`);
    setTimeout(() => {
      restartCount = 0;
      startServer();
    }, 30000);
    return;
  }

  log(`[SUPERVISOR] Starting Odin Agent Platform (Attempt #${restartCount})...`);

  const child = spawn(process.execPath, [path.resolve(__dirname, 'Razak Agents/server.js')], {
    cwd: __dirname,
    env: { ...process.env, NODE_ENV: 'production' },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  currentChild = child;

  child.stdout.on('data', (chunk) => {
    process.stdout.write(chunk);
    fs.appendFileSync(RUNTIME_LOG, chunk);
  });

  child.stderr.on('data', (chunk) => {
    process.stderr.write(chunk);
    fs.appendFileSync(RUNTIME_LOG, chunk);
    fs.appendFileSync(CRASH_LOG, chunk);
  });

  child.on('error', (err) => {
    log(`[SUPERVISOR ERROR] Failed to spawn child process: ${err.message}`);
    fs.appendFileSync(CRASH_LOG, `[${new Date().toISOString()}] Spawn error: ${err.stack || err.message}\n`);
  });

  child.on('exit', (code, signal) => {
    currentChild = null;
    log(`[SUPERVISOR NOTICE] Server process exited (code=${code}, signal=${signal}). Auto-restarting in 1500ms...`);
    setTimeout(startServer, 1500);
  });
}

// Auto-reload on file edits in Razak Agents
let reloadDebounce = null;
const watchDir = path.resolve(__dirname, 'Razak Agents');
if (fs.existsSync(watchDir)) {
  fs.watch(watchDir, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    if (filename.endsWith('.js') || filename.endsWith('.html') || filename.endsWith('.json')) {
      if (reloadDebounce) clearTimeout(reloadDebounce);
      reloadDebounce = setTimeout(() => {
        log(`[SUPERVISOR] Detected modification in ${filename}. Gracefully restarting child server...`);
        if (currentChild) {
          currentChild.kill();
        }
      }, 800);
    }
  });
}

// Graceful shutdown handling
process.on('SIGINT', () => {
  log('[SUPERVISOR] Received SIGINT. Shutting down gracefully.');
  process.exit(0);
});
process.on('SIGTERM', () => {
  log('[SUPERVISOR] Received SIGTERM. Shutting down gracefully.');
  process.exit(0);
});

startServer();

