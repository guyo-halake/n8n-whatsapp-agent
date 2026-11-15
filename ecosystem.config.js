module.exports = {
  apps: [
    {
      name: 'odin-agent-platform',
      script: './Razak Agents/server.js',
      cwd: __dirname,
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      max_restarts: 15,
      restart_delay: 2000,
      env: {
        NODE_ENV: 'production',
        PORT: 3300
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};
