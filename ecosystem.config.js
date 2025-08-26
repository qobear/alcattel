module.exports = {
  apps: [{
    name: 'allcattle-farm',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/allcattle',
    instances: 2,
    exec_mode: 'cluster',
    
    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0'
    },
    
    // Logging
    error_file: '/var/www/allcattle/logs/error.log',
    out_file: '/var/www/allcattle/logs/out.log',
    log_file: '/var/www/allcattle/logs/combined.log',
    time: true,
    
    // Process management
    autorestart: true,
    max_memory_restart: '1G',
    watch: false,
    ignore_watch: ['node_modules', '.next', 'logs'],
    
    // Restart settings
    restart_delay: 5000,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Health monitoring
    health_check_url: 'http://localhost:3000/api/health',
    health_check_grace_period: 3000,
    
    // Advanced PM2 features
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Environment-specific settings
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0'
    }
  }],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'root',
      host: '139.180.186.21',
      ref: 'origin/main',
      repo: 'https://github.com/your-username/allcattle-farm.git',
      path: '/var/www/allcattle',
      'post-deploy': 'npm ci && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt update && apt install -y nodejs npm postgresql nginx certbot'
    }
  }
};
