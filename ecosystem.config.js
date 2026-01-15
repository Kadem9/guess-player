// Lit les variables d'environnement du système
const frontendPort = process.env.FRONTEND_PORT || 3002;
const backendPort = process.env.BACKEND_PORT || 3003;

module.exports = {
  apps: [
    {
      name: 'guess-player-frontend',
      script: 'npm',
      args: 'start',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        // Port du frontend - défini via FRONTEND_PORT ou 3002 par défaut
        PORT: frontendPort
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 4000
    },
    {
      name: 'guess-player-backend',
      script: 'server.js',
      cwd: './backend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        // Port du backend Socket.io - défini via BACKEND_PORT ou 3003 par défaut
        SOCKET_PORT: backendPort
      },
      error_file: '../logs/backend-error.log',
      out_file: '../logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 4000
    }
  ]
};
