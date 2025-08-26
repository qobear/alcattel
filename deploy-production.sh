#!/bin/bash

# AllCattle Farm Production Deployment Script
# Domain: allcattle.farm
# Server: 139.180.186.21 (Singapore)

set -e

echo "🚀 Starting AllCattle Farm Production Deployment..."

# Server configuration
SERVER_IP="139.180.186.21"
SERVER_USER="root"
DOMAIN="allcattle.farm"
APP_DIR="/var/www/allcattle"

echo "📋 Deployment Configuration:"
echo "  Server: $SERVER_IP"
echo "  Domain: $DOMAIN"
echo "  App Directory: $APP_DIR"
echo ""

# Function to run commands on remote server
run_remote() {
    ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "$1"
}

# Function to copy files to remote server
copy_to_remote() {
    scp -o StrictHostKeyChecking=no -r "$1" $SERVER_USER@$SERVER_IP:"$2"
}

echo "🔧 Step 1: Server Preparation"
echo "Installing required packages..."

run_remote "
    # Update system
    apt update && apt upgrade -y
    
    # Install Node.js 18
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    
    # Install PM2 for process management
    npm install -g pm2
    
    # Install Nginx
    apt install -y nginx
    
    # Install Certbot for SSL
    apt install -y certbot python3-certbot-nginx
    
    # Install PostgreSQL
    apt install -y postgresql postgresql-contrib
    
    # Install Git
    apt install -y git curl
"

echo "✅ Server packages installed"

echo "🗄️ Step 2: Database Setup"
echo "Setting up PostgreSQL database..."

run_remote "
    # Create database and user
    sudo -u postgres createdb allcattle_production
    sudo -u postgres psql -c \"CREATE USER allcattle_user WITH PASSWORD 'AllCattle2025!Production';\"
    sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE allcattle_production TO allcattle_user;\"
    sudo -u postgres psql -c \"ALTER USER allcattle_user CREATEDB;\"
    
    # Configure PostgreSQL for production
    sed -i \"s/#listen_addresses = 'localhost'/listen_addresses = '*'/g\" /etc/postgresql/*/main/postgresql.conf
    systemctl restart postgresql
"

echo "✅ Database configured"

echo "📁 Step 3: Application Deployment"
echo "Creating application directory and deploying files..."

# Create application directory
run_remote "mkdir -p $APP_DIR"

# Build application locally first
echo "Building application locally..."
npm run build

# Copy application files to server
echo "Copying files to server..."
copy_to_remote ".next" "$APP_DIR/"
copy_to_remote "public" "$APP_DIR/"
copy_to_remote "package.json" "$APP_DIR/"
copy_to_remote "package-lock.json" "$APP_DIR/"
copy_to_remote ".env.production" "$APP_DIR/.env.local"
copy_to_remote "prisma" "$APP_DIR/"

# Install dependencies and setup on server
run_remote "
    cd $APP_DIR
    npm ci --only=production
    
    # Generate Prisma client
    npx prisma generate
    
    # Run database migrations
    npx prisma db push
    
    # Seed database (optional)
    # npx prisma db seed
"

echo "✅ Application deployed"

echo "🌐 Step 4: Nginx Configuration"
echo "Setting up Nginx reverse proxy..."

# Create Nginx configuration
run_remote "cat > /etc/nginx/sites-available/$DOMAIN << 'EOF'
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection \"1; mode=block\";
    add_header Referrer-Policy strict-origin-when-cross-origin;
    
    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    
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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # API rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Static files
    location /_next/static/ {
        alias $APP_DIR/.next/static/;
        expires 1y;
        add_header Cache-Control \"public, immutable\";
    }
    
    # Security: Block access to sensitive files
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

# Enable the site
run_remote "
    ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    nginx -t
    systemctl reload nginx
"

echo "✅ Nginx configured"

echo "🔒 Step 5: SSL Certificate Setup"
echo "Obtaining SSL certificate from Let's Encrypt..."

run_remote "
    # Obtain SSL certificate
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
    
    # Set up auto-renewal
    echo '0 12 * * * /usr/bin/certbot renew --quiet' | crontab -
"

echo "✅ SSL certificate installed"

echo "🚀 Step 6: Start Application"
echo "Starting AllCattle Farm with PM2..."

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
      PORT: 3000
    },
    error_file: '$APP_DIR/logs/error.log',
    out_file: '$APP_DIR/logs/out.log',
    log_file: '$APP_DIR/logs/combined.log',
    time: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false
  }]
};
EOF"

# Create logs directory and start application
run_remote "
    cd $APP_DIR
    mkdir -p logs
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup systemd -u root --hp /root
    systemctl enable pm2-root
"

echo "✅ Application started with PM2"

echo "🔥 Step 7: Firewall Configuration"
echo "Setting up UFW firewall..."

run_remote "
    # Enable UFW
    ufw --force enable
    
    # Allow SSH
    ufw allow ssh
    
    # Allow HTTP and HTTPS
    ufw allow 80
    ufw allow 443
    
    # Show status
    ufw status
"

echo "✅ Firewall configured"

echo "📊 Step 8: Monitoring Setup"
echo "Setting up basic monitoring..."

run_remote "
    # Install htop for monitoring
    apt install -y htop
    
    # Create monitoring script
    cat > /usr/local/bin/allcattle-status << 'EOF'
#!/bin/bash
echo \"=== AllCattle Farm Status ===\"
echo \"Date: \$(date)\"
echo \"\"
echo \"=== PM2 Status ===\"
pm2 status
echo \"\"
echo \"=== Nginx Status ===\"
systemctl status nginx --no-pager -l
echo \"\"
echo \"=== PostgreSQL Status ===\"
systemctl status postgresql --no-pager -l
echo \"\"
echo \"=== Disk Usage ===\"
df -h
echo \"\"
echo \"=== Memory Usage ===\"
free -h
echo \"\"
echo \"=== SSL Certificate ===\"
certbot certificates
EOF
    
    chmod +x /usr/local/bin/allcattle-status
"

echo "✅ Monitoring setup complete"

echo "🎉 Deployment Complete!"
echo ""
echo "🌐 Your AllCattle Farm application is now live at:"
echo "   https://$DOMAIN"
echo "   https://www.$DOMAIN"
echo ""
echo "📋 Server Management Commands:"
echo "   Check status: allcattle-status"
echo "   PM2 status: pm2 status"
echo "   View logs: pm2 logs allcattle-farm"
echo "   Restart app: pm2 restart allcattle-farm"
echo "   Nginx reload: systemctl reload nginx"
echo ""
echo "🔒 SSL Certificate will auto-renew every 12 hours"
echo ""
echo "📊 Next Steps:"
echo "1. Test the application at https://$DOMAIN"
echo "2. Configure DNS to point to $SERVER_IP"
echo "3. Set up monitoring and alerting"
echo "4. Configure backup strategy"
echo ""
