module.exports = {
  apps: [
    {
      name: 'gmail-automation-backend',
      script: 'python',
      args: '-m uvicorn backend.main:app --host 0.0.0.0 --port 8000',
      cwd: '/mnt/b/__CODEBASE__/tool_email_proxy',
      instances: 1,
      exec_mode: 'fork',
      interpreter: './venv/bin/python',
      env: {
        NODE_ENV: 'production',
        SECURITY_SECRET_KEY: 'production-secret-key-32-characters-long-secure-random-string',
        SECURITY_ENCRYPTION_KEY: 'production-encryption-key-32-characters-long-secure-random',
        SECURITY_PASSWORD_SALT: 'production-password-salt-32-characters-long-secure-random',
        SECURITY_JWT_ALGORITHM: 'HS256',
        SECURITY_JWT_EXPIRATION_HOURS: '24',
        DB_URL: 'sqlite:///./gmail_automation.db',
        DB_ECHO: 'false',
        LOG_LEVEL: 'INFO'
      },
      env_development: {
        NODE_ENV: 'development',
        SECURITY_SECRET_KEY: 'dev-secret-key-32-characters-long-secure-random-string-12345',
        SECURITY_ENCRYPTION_KEY: 'dev-encryption-key-32-characters-long-secure-random-string',
        SECURITY_PASSWORD_SALT: 'dev-password-salt-32-characters-long-secure-random-string',
        LOG_LEVEL: 'DEBUG'
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'gmail-automation-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/mnt/b/__CODEBASE__/tool_email_proxy/dashboard',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
        NEXT_PUBLIC_API_URL: 'http://localhost:8000',
        NEXT_PUBLIC_WS_URL: 'ws://localhost:8000'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: '3000',
        NEXT_PUBLIC_API_URL: 'http://localhost:8000',
        NEXT_PUBLIC_WS_URL: 'ws://localhost:8000'
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: ['your-production-server.com'],
      ref: 'origin/main',
      repo: 'https://github.com/your-org/gmail-automation-tool.git',
      path: '/var/www/gmail-automation-tool',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    },
    staging: {
      user: 'deploy',
      host: ['your-staging-server.com'],
      ref: 'origin/develop',
      repo: 'https://github.com/your-org/gmail-automation-tool.git',
      path: '/var/www/gmail-automation-tool-staging',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': ''
    }
  }
};
