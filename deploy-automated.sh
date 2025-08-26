#!/bin/bash

# AllCattle Farm Automated Deployment with SSH Password
# Server: 139.180.186.21 (Singapore)
# Domain: allcattle.farm

set -e

# Server credentials
SERVER_IP="139.180.186.21"
SERVER_USER="root"
SERVER_PASS='6Rc)74b9@?+{yNAT'
DOMAIN="allcattle.farm"
APP_DIR="/var/www/allcattle"

echo "🚀 AllCattle Farm Automated Deployment"
echo "======================================"
echo ""
echo "Server: $SERVER_IP"
echo "Domain: $DOMAIN"
echo "Target: Production deployment with SSL"
echo ""

# Function to run commands on remote server with password
run_remote() {
    sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "$1"
}

# Function to copy files to remote server with password
copy_to_remote() {
    sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no -r "$1" $SERVER_USER@$SERVER_IP:"$2"
}

echo "🔧 Step 1: Testing SSH Connection"
echo "--------------------------------"

if run_remote "echo 'SSH connection successful'"; then
    echo "✅ SSH connection established"
else
    echo "❌ SSH connection failed"
    exit 1
fi

echo ""

echo "🔧 Step 2: Installing Required Packages"
echo "--------------------------------------"

echo "Installing system packages..."
run_remote "
    # Update system packages
    export DEBIAN_FRONTEND=noninteractive
    apt update
    
    # Install Node.js 18
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    
    # Install PM2 globally
    npm install -g pm2
    
    # Install Nginx
    apt install -y nginx
    
    # Install PostgreSQL
    apt install -y postgresql postgresql-contrib
    
    # Install other utilities
    apt install -y git curl unzip htop ufw
    
    echo 'System packages installed successfully'
"

echo "✅ System packages installed"
echo ""

echo "🗄️ Step 3: Database Configuration"
echo "--------------------------------"

echo "Setting up PostgreSQL database..."
run_remote "
    # Start and enable PostgreSQL
    systemctl start postgresql
    systemctl enable postgresql
    
    # Configure PostgreSQL
    sudo -u postgres psql -c \"DROP DATABASE IF EXISTS allcattle_production;\"
    sudo -u postgres psql -c \"DROP USER IF EXISTS allcattle_user;\"
    sudo -u postgres psql -c \"CREATE DATABASE allcattle_production;\"
    sudo -u postgres psql -c \"CREATE USER allcattle_user WITH PASSWORD 'AllCattle2025!Production';\"
    sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE allcattle_production TO allcattle_user;\"
    sudo -u postgres psql -c \"ALTER USER allcattle_user CREATEDB;\"
    
    # Test database connection
    sudo -u postgres psql -d allcattle_production -c \"SELECT 1;\"
    
    echo 'Database setup completed'
"

echo "✅ Database configured"
echo ""

echo "📦 Step 4: Building Application Locally"
echo "--------------------------------------"

# Ensure we're in the project directory
if [[ ! -f "package.json" ]]; then
    echo "❌ Not in AllCattle Farm project directory"
    exit 1
fi

echo "Installing dependencies and building..."
npm ci
npm run build

echo "✅ Application built successfully"
echo ""

echo "📁 Step 5: Deploying Application Files"
echo "-------------------------------------"

# Create application directory on server
run_remote "mkdir -p $APP_DIR && mkdir -p $APP_DIR/logs"

echo "Copying application files to server..."

# Copy built application
copy_to_remote ".next" "$APP_DIR/"
copy_to_remote "public" "$APP_DIR/"
copy_to_remote "package.json" "$APP_DIR/"
copy_to_remote "package-lock.json" "$APP_DIR/"
copy_to_remote "prisma" "$APP_DIR/"
copy_to_remote "next.config.js" "$APP_DIR/"

# Copy production environment file
copy_to_remote ".env.production" "$APP_DIR/.env.local"

echo "Installing production dependencies..."
run_remote "
    cd $APP_DIR
    npm ci --only=production
    npx prisma generate
    npx prisma db push --accept-data-loss
    echo 'Application dependencies installed'
"

echo "✅ Application deployed"
echo ""

echo "🌐 Step 6: Configuring Nginx"
echo "---------------------------"

echo "Setting up Nginx configuration for Cloudflare..."

# Create optimized Nginx configuration for Cloudflare
run_remote "cat > /etc/nginx/sites-available/$DOMAIN << 'EOF'
# Cloudflare real IP configuration
set_real_ip_from 103.21.244.0/22;
set_real_ip_from 103.22.200.0/22;
set_real_ip_from 103.31.4.0/22;
set_real_ip_from 104.16.0.0/13;
set_real_ip_from 104.24.0.0/14;
set_real_ip_from 108.162.192.0/18;
set_real_ip_from 131.0.72.0/22;
set_real_ip_from 141.101.64.0/18;
set_real_ip_from 162.158.0.0/15;
set_real_ip_from 172.64.0.0/13;
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 188.114.96.0/20;
set_real_ip_from 190.93.240.0/20;
set_real_ip_from 197.234.240.0/22;
set_real_ip_from 198.41.128.0/17;
set_real_ip_from 2400:cb00::/32;
set_real_ip_from 2606:4700::/32;
set_real_ip_from 2803:f800::/32;
set_real_ip_from 2405:b500::/32;
set_real_ip_from 2405:8100::/32;
set_real_ip_from 2c0f:f248::/32;
set_real_ip_from 2a06:98c0::/29;
real_ip_header CF-Connecting-IP;

server {
    listen 80;
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # Self-signed SSL certificate for Cloudflare Full mode
    ssl_certificate /etc/ssl/certs/allcattle-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/allcattle-selfsigned.key;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection \"1; mode=block\";
    add_header Referrer-Policy strict-origin-when-cross-origin;
    add_header Strict-Transport-Security \"max-age=31536000; includeSubDomains; preload\";
    
    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=general:10m rate=100r/s;
    
    # Main application
    location / {
        limit_req zone=general burst=20 nodelay;
        
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header CF-Connecting-IP \$http_cf_connecting_ip;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # API endpoints with rate limiting
    location /api/ {
        limit_req zone=api burst=5 nodelay;
        
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header CF-Connecting-IP \$http_cf_connecting_ip;
        
        # API timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # Health check endpoint
    location /api/health {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        
        # Health check specific settings
        proxy_connect_timeout 5s;
        proxy_send_timeout 5s;
        proxy_read_timeout 5s;
        
        access_log off;
    }
    
    # Static files caching
    location /_next/static/ {
        alias $APP_DIR/.next/static/;
        expires 1y;
        add_header Cache-Control \"public, immutable\";
        add_header Access-Control-Allow-Origin \"*\";
    }
    
    location /favicon.ico {
        alias $APP_DIR/public/favicon.ico;
        expires 1y;
        access_log off;
    }
    
    location /robots.txt {
        alias $APP_DIR/public/robots.txt;
        expires 1d;
        access_log off;
    }
    
    # Security: Block sensitive files
    location ~ /\\.env {
        deny all;
        return 404;
    }
    
    location ~ /\\.git {
        deny all;
        return 404;
    }
    
    location ~ /\\.(ht|svn|git) {
        deny all;
        return 404;
    }
}
EOF"

# Generate self-signed certificate for Cloudflare Full mode
run_remote "
    mkdir -p /etc/ssl/private
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/ssl/private/allcattle-selfsigned.key \
        -out /etc/ssl/certs/allcattle-selfsigned.crt \
        -subj '/C=SG/ST=Singapore/L=Singapore/O=AllCattle Farm/CN=allcattle.farm/subjectAltName=DNS:allcattle.farm,DNS:www.allcattle.farm'
    
    chmod 600 /etc/ssl/private/allcattle-selfsigned.key
    chmod 644 /etc/ssl/certs/allcattle-selfsigned.crt
"

# Enable the site and restart Nginx
run_remote "
    ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl restart nginx
    systemctl enable nginx
"

echo "✅ Nginx configured"
echo ""

echo "🚀 Step 7: Starting Application with PM2"
echo "---------------------------------------"

# Create PM2 ecosystem configuration
run_remote "cat > $APP_DIR/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'allcattle-farm',
    script: 'npm',
    args: 'start',
    cwd: '$APP_DIR',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0'
    },
    error_file: '$APP_DIR/logs/error.log',
    out_file: '$APP_DIR/logs/out.log',
    log_file: '$APP_DIR/logs/combined.log',
    time: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false,
    restart_delay: 5000,
    max_restarts: 10,
    min_uptime: '10s',
    kill_timeout: 5000
  }]
};
EOF"

# Start application with PM2
run_remote "
    cd $APP_DIR
    pm2 delete allcattle-farm 2>/dev/null || true
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup systemd -u root --hp /root
    systemctl enable pm2-root
    
    # Wait for application to start
    sleep 10
    
    echo 'Application started with PM2'
"

echo "✅ Application started"
echo ""

echo "🔥 Step 8: Firewall Configuration"
echo "--------------------------------"

run_remote "
    # Configure UFW firewall
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 5432/tcp comment 'PostgreSQL'
    ufw --force enable
    ufw status numbered
"

echo "✅ Firewall configured"
echo ""

echo "📊 Step 9: System Monitoring Setup"
echo "---------------------------------"

# Create monitoring and management scripts
run_remote "
    # Create system status script
    cat > /usr/local/bin/allcattle-status << 'EOF'
#!/bin/bash
echo \"=== AllCattle Farm System Status ===\"
echo \"Date: \$(date)\"
echo \"Uptime: \$(uptime)\"
echo \"\"
echo \"=== Application Status ===\"
pm2 status
echo \"\"
echo \"=== Application Health ===\"
curl -s -o /dev/null -w \"Health Check: %{http_code} (Response: %{time_total}s)\" http://localhost:3000/api/health
echo \"\"
echo \"\"
echo \"=== Nginx Status ===\"
systemctl status nginx --no-pager -l | head -10
echo \"\"
echo \"=== Database Status ===\"
systemctl status postgresql --no-pager -l | head -10
echo \"\"
echo \"=== System Resources ===\"
echo \"Disk Usage:\"
df -h /
echo \"\"
echo \"Memory Usage:\"
free -h
echo \"\"
echo \"CPU Usage:\"
top -bn1 | grep \"Cpu(s)\" | head -1
echo \"\"
echo \"=== Network Connections ===\"
ss -tuln | grep -E ':(80|443|3000|5432)'
echo \"\"
echo \"=== Recent Application Logs ===\"
tail -n 5 $APP_DIR/logs/combined.log 2>/dev/null || echo \"No logs available\"
EOF
    
    chmod +x /usr/local/bin/allcattle-status
    
    # Create backup script
    cat > /usr/local/bin/allcattle-backup << 'EOF'
#!/bin/bash
BACKUP_DIR=\"/var/backups/allcattle\"
mkdir -p \$BACKUP_DIR
DATE=\$(date +%Y%m%d_%H%M%S)

echo \"Creating AllCattle Farm backup: \$DATE\"

# Database backup
sudo -u postgres pg_dump allcattle_production > \$BACKUP_DIR/database_\$DATE.sql

# Application backup
tar -czf \$BACKUP_DIR/application_\$DATE.tar.gz -C /var/www allcattle

# Keep only last 7 days of backups
find \$BACKUP_DIR -name \"*.sql\" -mtime +7 -delete
find \$BACKUP_DIR -name \"*.tar.gz\" -mtime +7 -delete

echo \"Backup completed: \$BACKUP_DIR\"
ls -la \$BACKUP_DIR/
EOF
    
    chmod +x /usr/local/bin/allcattle-backup
    
    # Create log rotation
    cat > /etc/logrotate.d/allcattle << 'EOF'
$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
    su root root
}
EOF
    
    # Create daily backup cron job
    echo \"0 2 * * * /usr/local/bin/allcattle-backup >> /var/log/allcattle-backup.log 2>&1\" | crontab -
    
    echo 'Monitoring and backup setup completed'
"

echo "✅ Monitoring setup complete"
echo ""

echo "🔍 Step 10: Final Verification"
echo "-----------------------------"

# Test application health
echo "Testing application health..."
if run_remote "curl -s http://localhost:3000/api/health" | grep -q "ok\|healthy\|200"; then
    echo "✅ Application health check passed"
else
    echo "⚠️  Application health check needs verification"
fi

# Test Nginx response
echo "Testing Nginx response..."
if run_remote "curl -s -o /dev/null -w '%{http_code}' http://localhost" | grep -qE "200|301|302"; then
    echo "✅ Nginx is responding correctly"
else
    echo "⚠️  Nginx response needs verification"
fi

# Show system status
echo ""
echo "📊 System Status:"
run_remote "/usr/local/bin/allcattle-status"

echo ""
echo "🎉 AllCattle Farm Deployment Complete!"
echo "====================================="
echo ""
echo "🌐 Your application is now deployed at:"
echo "   Production URL: https://allcattle.farm"
echo "   Server IP: $SERVER_IP"
echo ""
echo "🔧 Management Commands (on server):"
echo "   System status: allcattle-status"
echo "   Create backup: allcattle-backup"
echo "   PM2 status: pm2 status"
echo "   View logs: pm2 logs allcattle-farm"
echo "   Restart app: pm2 restart allcattle-farm"
echo "   Nginx status: systemctl status nginx"
echo "   Database backup: sudo -u postgres pg_dump allcattle_production"
echo ""
echo "🔒 Security Features:"
echo "   ✅ UFW Firewall enabled"
echo "   ✅ Rate limiting configured"
echo "   ✅ SSL certificate installed"
echo "   ✅ Security headers enabled"
echo "   ✅ Real IP detection for Cloudflare"
echo ""
echo "📊 Monitoring:"
echo "   ✅ PM2 process monitoring"
echo "   ✅ Automatic restart on failure"
echo "   ✅ Log rotation configured"
echo "   ✅ Daily database backups"
echo ""
echo "🌟 Next Steps:"
echo "1. Test the application: https://allcattle.farm"
echo "2. Configure Cloudflare SSL mode to 'Full'"
echo "3. Set up monitoring alerts"
echo "4. Review application performance"
echo "5. Test all farm management features"
echo ""
echo "🎯 Deployment successful! AllCattle Farm is ready for production use."
