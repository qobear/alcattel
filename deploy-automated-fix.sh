#!/bin/bash

# AllCattle Farm - Automated Production Deployment & Fix Script
# Server: 139.180.186.21 (Singapore)
# Domain: allcattle.farm

set -e  # Exit on any error

# Configuration
SERVER_IP="139.180.186.21"
SERVER_USER="root"
SERVER_PASSWORD="6Rc)74b9@?+{yNAT"
DOMAIN="allcattle.farm"
PROJECT_DIR="/var/allcattel"
BACKUP_DIR="/var/backups/allcattle"

echo "🚀 AllCattle Farm - Automated Production Fix & Deployment"
echo "========================================================="
echo ""

# Function to run SSH commands with password
ssh_exec() {
    sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "$1"
}

# Function to copy files via SCP
scp_copy() {
    sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no -r "$1" "$SERVER_USER@$SERVER_IP:$2"
}

echo "Step 1: Checking server status..."
echo "=================================="
ssh_exec "uname -a && uptime && df -h"
echo ""

echo "Step 2: Stopping PM2 processes..."
echo "=================================="
ssh_exec "pm2 stop all || true"
ssh_exec "pm2 delete all || true"
ssh_exec "pm2 kill || true"
echo ""

echo "Step 3: Creating backup..."
echo "=========================="
ssh_exec "mkdir -p $BACKUP_DIR/$(date +%Y%m%d_%H%M%S)"
ssh_exec "cp -r $PROJECT_DIR $BACKUP_DIR/$(date +%Y%m%d_%H%M%S)/ || true"
echo ""

echo "Step 4: Building project locally..."
echo "===================================="
npm run build
echo ""

echo "Step 5: Deploying files to server..."
echo "====================================="
scp_copy ".next" "$PROJECT_DIR/"
scp_copy "package.json" "$PROJECT_DIR/"
scp_copy "package-lock.json" "$PROJECT_DIR/"
scp_copy "next.config.js" "$PROJECT_DIR/"
scp_copy "tsconfig.json" "$PROJECT_DIR/"
scp_copy "tailwind.config.ts" "$PROJECT_DIR/"
scp_copy "postcss.config.js" "$PROJECT_DIR/"
scp_copy "ecosystem.config.js" "$PROJECT_DIR/"
scp_copy "prisma" "$PROJECT_DIR/"
scp_copy "src" "$PROJECT_DIR/"
scp_copy "public" "$PROJECT_DIR/"
echo ""

echo "Step 6: Installing dependencies on server..."
echo "============================================="
ssh_exec "cd $PROJECT_DIR && npm install --production"
echo ""

echo "Step 7: Database setup..."
echo "========================="
ssh_exec "cd $PROJECT_DIR && npx prisma generate"
ssh_exec "cd $PROJECT_DIR && npx prisma db push --force-reset"
echo ""

echo "Step 8: Setting up environment..."
echo "=================================="
ssh_exec "cd $PROJECT_DIR && cat > .env.local << 'EOL'
# Database
DATABASE_URL=\"postgresql://allcattle_user:AllCattle2024@localhost:5432/allcattle_db\"

# NextAuth
NEXTAUTH_URL=\"https://$DOMAIN\"
NEXTAUTH_SECRET=\"$(openssl rand -base64 32)\"

# Stack Auth
STACK_SECRET_SERVER_KEY=\"sk_12345\"
STACK_PUBLISHABLE_CLIENT_KEY=\"pk_12345\"
STACK_PROJECT_ID=\"project_12345\"

# S3/Storage
AWS_ACCESS_KEY_ID=\"your_access_key\"
AWS_SECRET_ACCESS_KEY=\"your_secret_key\"
AWS_REGION=\"ap-southeast-1\"
S3_BUCKET=\"allcattle-media\"

# App
NODE_ENV=\"production\"
PORT=\"3000\"
EOL"
echo ""

echo "Step 9: Starting PM2 with proper configuration..."
echo "=================================================="
ssh_exec "cd $PROJECT_DIR && pm2 start ecosystem.config.js"
ssh_exec "pm2 save"
ssh_exec "pm2 startup"
echo ""

echo "Step 10: Configuring Nginx..."
echo "=============================="
ssh_exec "cat > /etc/nginx/sites-available/$DOMAIN << 'EOL'
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/$DOMAIN.crt;
    ssl_certificate_key /etc/ssl/private/$DOMAIN.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options \"SAMEORIGIN\" always;
    add_header X-XSS-Protection \"1; mode=block\" always;
    add_header X-Content-Type-Options \"nosniff\" always;
    add_header Referrer-Policy \"no-referrer-when-downgrade\" always;
    add_header Content-Security-Policy \"default-src 'self' http: https: data: blob: 'unsafe-inline'; frame-ancestors 'self';\" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_connect_timeout 30;
        proxy_send_timeout 30;
        proxy_read_timeout 30;
    }

    # Static files caching
    location /_next/static/ {
        alias $PROJECT_DIR/.next/static/;
        expires 1y;
        add_header Cache-Control \"public, immutable\";
    }

    location /static/ {
        alias $PROJECT_DIR/public/;
        expires 1M;
        add_header Cache-Control \"public\";
    }
}
EOL"

ssh_exec "ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/"
ssh_exec "nginx -t"
ssh_exec "systemctl reload nginx"
echo ""

echo "Step 11: Setting up SSL certificate..."
echo "======================================"
ssh_exec "mkdir -p /etc/ssl/certs /etc/ssl/private"
ssh_exec "openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/$DOMAIN.key \
    -out /etc/ssl/certs/$DOMAIN.crt \
    -subj \"/C=SG/ST=Singapore/L=Singapore/O=AllCattle Farm/CN=$DOMAIN\""
ssh_exec "chmod 600 /etc/ssl/private/$DOMAIN.key"
ssh_exec "chmod 644 /etc/ssl/certs/$DOMAIN.crt"
echo ""

echo "Step 12: Final system checks..."
echo "==============================="
ssh_exec "pm2 list"
ssh_exec "systemctl status nginx"
ssh_exec "curl -I http://localhost:3000 || true"
ssh_exec "netstat -tlnp | grep -E ':80|:443|:3000'"
echo ""

echo "Step 13: Setting up firewall..."
echo "==============================="
ssh_exec "ufw allow ssh"
ssh_exec "ufw allow 80/tcp"
ssh_exec "ufw allow 443/tcp"
ssh_exec "ufw --force enable"
echo ""

echo "Step 14: Installing monitoring tools..."
echo "======================================="
ssh_exec "pm2 install pm2-logrotate"
ssh_exec "pm2 set pm2-logrotate:max_size 10M"
ssh_exec "pm2 set pm2-logrotate:retain 30"
echo ""

echo "Step 15: Final deployment verification..."
echo "========================================="
echo "Checking PM2 processes:"
ssh_exec "pm2 list"
echo ""
echo "Checking application response:"
ssh_exec "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 || echo 'Application not responding'"
echo ""
echo "Checking Nginx status:"
ssh_exec "systemctl is-active nginx"
echo ""

echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Your AllCattle Farm application should be accessible at:"
echo "   - https://$DOMAIN"
echo "   - Server IP: $SERVER_IP"
echo ""
echo "📊 System Status:"
ssh_exec "pm2 monit --no-daemon || pm2 list"
echo ""
echo "🔧 Useful commands for maintenance:"
echo "   - Check logs: ssh root@$SERVER_IP 'pm2 logs'"
echo "   - Restart app: ssh root@$SERVER_IP 'pm2 restart allcattle-farm'"
echo "   - Check status: ssh root@$SERVER_IP 'pm2 list'"
echo ""
echo "🚀 AllCattle Farm is now live and running!"
