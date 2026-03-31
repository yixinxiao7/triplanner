// pm2 ecosystem configuration for TripPlanner PRODUCTION
// Usage:
//   pm2 start infra/ecosystem.production.config.cjs
//   pm2 status
//   pm2 logs triplanner-prod-backend
//   pm2 restart triplanner-prod-backend
//   pm2 stop triplanner-prod-backend
//   pm2 delete triplanner-prod-backend
//
// Ports:
//   Backend:  3002 (HTTPS)
//   Frontend: 4174 (HTTPS via vite preview)
//
// Prerequisite: TLS certs must exist at infra/certs/ (run infra/scripts/generate-certs.sh)

module.exports = {
  apps: [
    {
      name: 'triplanner-prod-backend',
      script: 'src/index.js',
      cwd: './backend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      min_uptime: '5s',
      max_restarts: 10,
      restart_delay: 1000,
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
        CORS_ORIGIN: 'https://localhost:4174',
        COOKIE_SECURE: 'true',
        SSL_KEY_PATH: '../infra/certs/localhost-key.pem',
        SSL_CERT_PATH: '../infra/certs/localhost.pem',
      },
      // Log configuration
      error_file: './logs/prod-backend-error.log',
      out_file: './logs/prod-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 8000,
    },
    {
      name: 'triplanner-prod-frontend',
      script: '/bin/bash',
      args: '-c "npm run preview -- --port 4174"',
      cwd: './frontend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      min_uptime: '5s',
      max_restarts: 10,
      restart_delay: 1000,
      env: {
        NODE_ENV: 'production',
        BACKEND_PORT: '3002',
        BACKEND_SSL: 'true',
      },
      // Log configuration
      error_file: './logs/prod-frontend-error.log',
      out_file: './logs/prod-frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 8000,
    },
  ],
};
