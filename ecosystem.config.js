/**
 * GRM WHATSAPP CRM — PM2 PRODUCTION PROCESS CONFIGURATION
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 status
 *   pm2 logs grm-whatsapp-bridge
 *   pm2 restart grm-whatsapp-bridge
 */

module.exports = {
  apps: [
    {
      name: 'grm-whatsapp-bridge',
      script: './bridge/server.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '600M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/bridge-err.log',
      out_file: './logs/bridge-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      restart_delay: 4000,
      min_uptime: 5000,
      kill_timeout: 3000
    }
  ]
};
