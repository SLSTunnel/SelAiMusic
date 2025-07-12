module.exports = {
  apps: [
    {
      name: 'selai-backend',
      script: './backend/server.js',
      cwd: './backend',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10
    },
    {
      name: 'selai-frontend',
      script: 'npm',
      args: 'start',
      cwd: './frontend',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,
      max_memory_restart: '512M',
      restart_delay: 4000,
      max_restarts: 10
    },
    {
      name: 'selai-ai-service',
      script: './ai-service/server.js',
      cwd: './ai-service',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      error_file: './logs/ai-error.log',
      out_file: './logs/ai-out.log',
      log_file: './logs/ai-combined.log',
      time: true,
      max_memory_restart: '2G',
      restart_delay: 4000,
      max_restarts: 5
    }
  ],
  deploy: {
    production: {
      user: 'root',
      host: 'music.miolong.com',
      ref: 'origin/main',
      repo: 'https://github.com/SLSTunnel/SelAiMusic.git',
      path: '/var/www/selai-music-generator',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
}; 