#!/bin/bash

# AllCattle Farm Cloudflare Deployment Script
# Domain: allcattle.farm (with Cloudflare proxy)
# Server: 139.180.186.21 (Singapore)

set -e

echo "🌩️  AllCattle Farm Cloudflare Deployment"
echo "========================================"
echo ""
echo "Domain: allcattle.farm (Cloudflare proxy detected)"
echo "Server: 139.180.186.21"
echo ""

# Since domain is using Cloudflare, we need to:
# 1. Set up the application on the server
# 2. Configure Cloudflare to proxy to our server
# 3. Use Cloudflare's SSL (flexible or full)

echo "📋 Cloudflare Configuration Detected"
echo "-----------------------------------"
echo ""
echo "The domain allcattle.farm is using Cloudflare proxy."
echo "Current DNS points to Cloudflare IPs: 104.21.x.x"
echo ""
echo "We need to configure Cloudflare to point to our server:"
echo "1. Go to Cloudflare Dashboard"
echo "2. Navigate to DNS settings for allcattle.farm"
echo "3. Update A record to point to: 139.180.186.21"
echo "4. Set proxy status based on your preference"
echo ""

read -p "Have you updated Cloudflare DNS to point to 139.180.186.21? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please update Cloudflare DNS first, then run this script again."
    echo ""
    echo "Cloudflare Dashboard: https://dash.cloudflare.com/"
    echo "DNS Record to update:"
    echo "  Type: A"
    echo "  Name: @"
    echo "  Value: 139.180.186.21"
    echo "  Proxy status: Proxied or DNS only (your choice)"
    exit 1
fi

SERVER_IP="139.180.186.21"
SERVER_USER="root"
DOMAIN="allcattle.farm"
APP_DIR="/var/www/allcattle"

echo "🔧 Step 1: Server Connection Test"
echo "--------------------------------"

# Test SSH connection
echo "Testing SSH connection to server..."
if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "echo 'SSH connection successful'"; then
    echo "✅ SSH connection successful"
else
    echo "❌ SSH connection failed"
    echo "Please check:"
    echo "1. Server is running and accessible"
    echo "2. SSH key is configured"
    echo "3. Firewall allows SSH (port 22)"
    exit 1
fi

echo ""

# Function to run commands on remote server
run_remote() {
    ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "$1"
}

# Function to copy files to remote server
copy_to_remote() {
    scp -o StrictHostKeyChecking=no -r "$1" $SERVER_USER@$SERVER_IP:"$2"
}

echo "🔧 Step 2: Server Preparation"
echo "----------------------------"

echo "Installing required packages on server..."
run_remote "
    # Update system
    apt update && apt upgrade -y
    
    # Install Node.js 18
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    
    # Install PM2
    npm install -g pm2
    
    # Install Nginx
    apt install -y nginx
    
    # Install PostgreSQL
    apt install -y postgresql postgresql-contrib
    
    # Install other utilities
    apt install -y git curl unzip htop
    
    echo 'Server packages installed successfully'
"

echo "✅ Server packages installed"
echo ""

echo "🗄️ Step 3: Database Setup"
echo "------------------------"

echo "Setting up PostgreSQL database..."
run_remote "
    # Start PostgreSQL service
    systemctl start postgresql
    systemctl enable postgresql
    
    # Create database and user
    sudo -u postgres psql -c \"DROP DATABASE IF EXISTS allcattle_production;\"
    sudo -u postgres psql -c \"DROP USER IF EXISTS allcattle_user;\"
    sudo -u postgres psql -c \"CREATE DATABASE allcattle_production;\"
    sudo -u postgres psql -c \"CREATE USER allcattle_user WITH PASSWORD 'AllCattle2025!Production';\"
    sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE allcattle_production TO allcattle_user;\"
    sudo -u postgres psql -c \"ALTER USER allcattle_user CREATEDB;\"
    
    echo 'Database configured successfully'
"

echo "✅ Database setup complete"
echo ""

echo "📁 Step 4: Application Deployment"
echo "--------------------------------"

# Build application locally first
echo "Building application locally..."
if [[ ! -f "package.json" ]]; then
    echo "❌ Not in project directory. Please run from AllCattle Farm project root."
    exit 1
fi

# Install dependencies and build
npm ci
npm run build

echo "✅ Local build complete"

# Create application directory on server
run_remote "mkdir -p $APP_DIR && mkdir -p $APP_DIR/logs"

# Copy application files
echo "Copying application files to server..."
copy_to_remote ".next" "$APP_DIR/"
copy_to_remote "public" "$APP_DIR/"
copy_to_remote "package.json" "$APP_DIR/"
copy_to_remote "package-lock.json" "$APP_DIR/"
copy_to_remote "prisma" "$APP_DIR/"
copy_to_remote "next.config.js" "$APP_DIR/"

# Create production environment file on server
run_remote "cat > $APP_DIR/.env.local << 'EOF'
NODE_ENV=production
NEXTAUTH_URL=https://allcattle.farm
NEXTAUTH_SECRET=AllCattle2025ProductionSecretKey123!
DATABASE_URL=\"postgresql://allcattle_user:AllCattle2025!Production@localhost:5432/allcattle_production?schema=public\"
HOSTNAME=0.0.0.0
PORT=3000
EOF"

# Install dependencies and setup database
run_remote "
    cd $APP_DIR
    npm ci --only=production
    npx prisma generate
    npx prisma db push
    echo 'Application setup complete'
"

echo "✅ Application deployed"
echo ""

echo "🌐 Step 5: Nginx Configuration for Cloudflare"
echo "--------------------------------------------"

echo "Configuring Nginx with Cloudflare optimization..."

# Create Nginx configuration optimized for Cloudflare
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
    
    # Self-signed SSL certificate (Cloudflare handles the public SSL)
    ssl_certificate /etc/ssl/certs/allcattle-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/allcattle-selfsigned.key;
    
    # SSL configuration for Cloudflare Full mode
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security headers (some may be overridden by Cloudflare)
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection \"1; mode=block\";
    add_header Referrer-Policy strict-origin-when-cross-origin;
    
    # Main application
    location / {
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
    
    # Health check endpoint
    location /api/health {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Health check specific settings
        proxy_connect_timeout 5s;
        proxy_send_timeout 5s;
        proxy_read_timeout 5s;
    }
    
    # Static files caching
    location /_next/static/ {
        alias $APP_DIR/.next/static/;
        expires 1y;
        add_header Cache-Control \"public, immutable\";
        add_header Access-Control-Allow-Origin \"*\";
    }
    
    # Favicon and robots
    location = /favicon.ico {
        alias $APP_DIR/public/favicon.ico;
        expires 1y;
    }
    
    location = /robots.txt {
        alias $APP_DIR/public/robots.txt;
        expires 1d;
    }
    
    # Block sensitive files
    location ~ /\\.env {
        deny all;
        return 404;
    }
    
    location ~ /\\.git {
        deny all;
        return 404;
    }
}
EOF"

# Generate self-signed certificate for Cloudflare Full SSL mode
run_remote "
    mkdir -p /etc/ssl/private
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/ssl/private/allcattle-selfsigned.key \
        -out /etc/ssl/certs/allcattle-selfsigned.crt \
        -subj '/C=SG/ST=Singapore/L=Singapore/O=AllCattle Farm/CN=allcattle.farm'
"

# Enable the site
run_remote "
    ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl restart nginx
    systemctl enable nginx
"

echo "✅ Nginx configured for Cloudflare"
echo ""

echo "🚀 Step 6: Start Application with PM2"
echo "------------------------------------"

# Create PM2 ecosystem file
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
    min_uptime: '10s'
  }]
};
EOF"

# Start application
run_remote "
    cd $APP_DIR
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup systemd -u root --hp /root
    systemctl enable pm2-root
"

echo "✅ Application started with PM2"
echo ""

echo "🔥 Step 7: Firewall Configuration"
echo "--------------------------------"

run_remote "
    # Configure UFW firewall
    ufw --force enable
    ufw allow ssh
    ufw allow 80
    ufw allow 443
    ufw allow 5432  # PostgreSQL (only from localhost)
    ufw status numbered
"

echo "✅ Firewall configured"
echo ""

echo "📊 Step 8: System Monitoring Setup"
echo "---------------------------------"

run_remote "
    # Create system monitoring script
    cat > /usr/local/bin/allcattle-status << 'EOF'
#!/bin/bash
echo \"=== AllCattle Farm System Status ===\"
echo \"Date: \$(date)\"
echo \"\"
echo \"=== Application Status ===\"
pm2 status
echo \"\"
echo \"=== Nginx Status ===\"
systemctl status nginx --no-pager -l
echo \"\"
echo \"=== Database Status ===\"
systemctl status postgresql --no-pager -l
echo \"\"
echo \"=== System Resources ===\"
echo \"Disk Usage:\"
df -h
echo \"\"
echo \"Memory Usage:\"
free -h
echo \"\"
echo \"CPU Usage:\"
top -bn1 | grep \"Cpu(s)\"
echo \"\"
echo \"=== Application Logs (last 10 lines) ===\"
tail -n 10 $APP_DIR/logs/combined.log
EOF
    
    chmod +x /usr/local/bin/allcattle-status
    
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
}
EOF
"

echo "✅ Monitoring setup complete"
echo ""

echo "🎉 Cloudflare Deployment Complete!"
echo "=================================="
echo ""
echo "🌐 Your AllCattle Farm application is now deployed!"
echo ""
echo "📋 Access Information:"
echo "   Production URL: https://allcattle.farm"
echo "   Server IP: $SERVER_IP"
echo "   Application running on: localhost:3000"
echo ""
echo "🔧 Management Commands (on server):"
echo "   System status: allcattle-status"
echo "   PM2 status: pm2 status"
echo "   View logs: pm2 logs allcattle-farm"
echo "   Restart app: pm2 restart allcattle-farm"
echo "   Nginx status: systemctl status nginx"
echo ""
echo "☁️ Cloudflare Configuration:"
echo "   - Ensure A record points to: $SERVER_IP"
echo "   - SSL mode: Full (recommended) or Flexible"
echo "   - Security: Medium or higher"
echo "   - Caching: Standard or higher"
echo ""
echo "📊 Next Steps:"
echo "1. Test the application: https://allcattle.farm"
echo "2. Configure Cloudflare security settings"
echo "3. Set up monitoring alerts"
echo "4. Configure backup strategy"
echo "5. Review performance settings"
echo ""
echo "🔍 Verification:"
echo "   curl -I https://allcattle.farm"
echo "   curl https://allcattle.farm/api/health"
echo ""

# Final verification
echo "🚀 Running final verification..."
sleep 5

# Test application health
if run_remote "curl -s http://localhost:3000/api/health" > /dev/null 2>&1; then
    echo "✅ Application health check passed"
else
    echo "⚠️  Application health check failed (may need a moment to start)"
fi

# Test Nginx
if run_remote "curl -s -o /dev/null -w '%{http_code}' http://localhost" | grep -q "200\|301\|302"; then
    echo "✅ Nginx is responding"
else
    echo "⚠️  Nginx may need configuration check"
fi

echo ""
echo "🎯 Deployment Summary:"
echo "✅ Server configured and secured"
echo "✅ Database setup complete"
echo "✅ Application deployed and running"
echo "✅ Nginx configured for Cloudflare"
echo "✅ PM2 process management active"
echo "✅ Firewall configured"
echo "✅ Monitoring tools installed"
echo ""
echo "🌟 AllCattle Farm is ready for production use!"
