// pm2 ecosystem configuration for TripPlanner staging
// Usage:
//   pm2 start infra/ecosystem.config.cjs
//   pm2 status
//   pm2 logs triplanner-backend
//   pm2 restart triplanner-backend
//   pm2 stop triplanner-backend
//   pm2 delete triplanner-backend

module.exports = {
  apps: [
    {
      name: 'triplanner-backend',
      script: 'src/index.js',
      cwd: './backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      min_uptime: '5s',
      max_restarts: 10,
      restart_delay: 1000,
      env: {
        NODE_ENV: 'staging',
      },
      // Log configuration
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 8000,
    },
  ],
};
