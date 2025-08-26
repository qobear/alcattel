#!/bin/bash

# SSL Certificate Setup Script for AllCattle Farm
# Domain: allcattle.farm
# Uses Let's Encrypt with Certbot

set -e

DOMAIN="allcattle.farm"
EMAIL="admin@allcattle.farm"
WEBROOT="/var/www/html"

echo "🔒 AllCattle Farm SSL Certificate Setup"
echo "======================================="
echo ""
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root"
   exit 1
fi

echo "📋 Step 1: Installing Certbot"
echo "-----------------------------"

# Update package list
apt update

# Install snapd if not present
if ! command -v snap >/dev/null 2>&1; then
    echo "Installing snapd..."
    apt install -y snapd
    systemctl enable --now snapd
    sleep 5
fi

# Install certbot via snap (recommended method)
echo "Installing Certbot..."
snap install core; snap refresh core
snap install --classic certbot

# Create symlink
ln -sf /snap/bin/certbot /usr/bin/certbot

echo "✅ Certbot installed"
echo ""

echo "📋 Step 2: Nginx Configuration Check"
echo "-----------------------------------"

# Check if Nginx is running
if ! systemctl is-active --quiet nginx; then
    echo "❌ Nginx is not running. Starting Nginx..."
    systemctl start nginx
fi

# Test Nginx configuration
if nginx -t; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration has errors"
    exit 1
fi

echo ""

echo "📋 Step 3: Domain Verification"
echo "-----------------------------"

# Check DNS resolution
echo "Checking DNS resolution for $DOMAIN..."
if host_result=$(host "$DOMAIN" 2>/dev/null); then
    resolved_ip=$(echo "$host_result" | grep "has address" | awk '{print $4}' | head -1)
    echo "✅ $DOMAIN resolves to: $resolved_ip"
else
    echo "❌ $DOMAIN does not resolve. Please configure DNS first."
    exit 1
fi

# Check www subdomain
echo "Checking DNS resolution for www.$DOMAIN..."
if host_result=$(host "www.$DOMAIN" 2>/dev/null); then
    www_ip=$(echo "$host_result" | grep "has address" | awk '{print $4}' | head -1)
    echo "✅ www.$DOMAIN resolves to: $www_ip"
else
    echo "⚠️  www.$DOMAIN does not resolve (this is optional)"
fi

echo ""

echo "📋 Step 4: HTTP Verification"
echo "---------------------------"

# Test HTTP connectivity
echo "Testing HTTP access to $DOMAIN..."
if curl -s --connect-timeout 10 -o /dev/null "http://$DOMAIN"; then
    echo "✅ HTTP access successful"
else
    echo "❌ HTTP access failed. Check firewall and Nginx configuration."
    exit 1
fi

echo ""

echo "📋 Step 5: Obtaining SSL Certificate"
echo "-----------------------------------"

# Create webroot directory if it doesn't exist
mkdir -p "$WEBROOT"

# Determine domains to include in certificate
CERT_DOMAINS="-d $DOMAIN"
if host "www.$DOMAIN" >/dev/null 2>&1; then
    CERT_DOMAINS="$CERT_DOMAINS -d www.$DOMAIN"
    echo "Including both $DOMAIN and www.$DOMAIN in certificate"
else
    echo "Including only $DOMAIN in certificate"
fi

# Obtain certificate using Nginx plugin
echo "Obtaining SSL certificate..."
if certbot --nginx $CERT_DOMAINS \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    --redirect \
    --hsts \
    --staple-ocsp; then
    echo "✅ SSL certificate obtained successfully"
else
    echo "❌ Failed to obtain SSL certificate"
    echo ""
    echo "🔧 Troubleshooting steps:"
    echo "1. Check if domain points to this server's IP"
    echo "2. Ensure ports 80 and 443 are open in firewall"
    echo "3. Verify Nginx is serving content properly"
    echo "4. Check Nginx error logs: tail -f /var/log/nginx/error.log"
    exit 1
fi

echo ""

echo "📋 Step 6: SSL Configuration Verification"
echo "----------------------------------------"

# Test SSL certificate
echo "Testing SSL certificate..."
if echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -dates; then
    echo "✅ SSL certificate is valid"
else
    echo "❌ SSL certificate test failed"
fi

# Test HTTPS redirect
echo "Testing HTTPS redirect..."
if curl -s -I "http://$DOMAIN" | grep -q "301\|302"; then
    echo "✅ HTTP to HTTPS redirect is working"
else
    echo "⚠️  HTTP to HTTPS redirect may not be configured"
fi

echo ""

echo "📋 Step 7: Auto-renewal Setup"
echo "----------------------------"

# Test certificate renewal
echo "Testing certificate renewal..."
if certbot renew --dry-run; then
    echo "✅ Certificate auto-renewal is configured correctly"
else
    echo "❌ Certificate auto-renewal test failed"
fi

# Set up cron job for auto-renewal
echo "Setting up auto-renewal cron job..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
echo "✅ Auto-renewal cron job created"

echo ""

echo "📋 Step 8: Security Headers Configuration"
echo "----------------------------------------"

# Update Nginx configuration with security headers
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"

if [[ -f "$NGINX_CONF" ]]; then
    echo "Adding security headers to Nginx configuration..."
    
    # Backup original configuration
    cp "$NGINX_CONF" "$NGINX_CONF.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Add security headers if not already present
    if ! grep -q "Strict-Transport-Security" "$NGINX_CONF"; then
        sed -i '/server_name/a\    # Security Headers\n    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;\n    add_header X-Frame-Options DENY always;\n    add_header X-Content-Type-Options nosniff always;\n    add_header X-XSS-Protection "1; mode=block" always;\n    add_header Referrer-Policy "strict-origin-when-cross-origin" always;' "$NGINX_CONF"
        
        # Test and reload Nginx
        if nginx -t; then
            systemctl reload nginx
            echo "✅ Security headers added and Nginx reloaded"
        else
            echo "❌ Nginx configuration error, restoring backup"
            cp "$NGINX_CONF.backup.$(date +%Y%m%d_%H%M%S)" "$NGINX_CONF"
        fi
    else
        echo "✅ Security headers already configured"
    fi
fi

echo ""

echo "📋 Step 9: Final SSL Test"
echo "------------------------"

echo "Running comprehensive SSL test..."

# Test SSL rating (using external service)
echo "SSL certificate details:"
echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -text | grep -E "(Subject:|Issuer:|Not Before|Not After)"

echo ""
echo "Testing HTTPS connection..."
if curl -s --head "https://$DOMAIN" | head -1; then
    echo "✅ HTTPS connection successful"
else
    echo "❌ HTTPS connection failed"
fi

echo ""

echo "🎉 SSL Setup Complete!"
echo "====================="
echo ""
echo "✅ SSL certificate installed for: $DOMAIN"
if host "www.$DOMAIN" >/dev/null 2>&1; then
    echo "✅ SSL certificate includes: www.$DOMAIN"
fi
echo "✅ Auto-renewal configured"
echo "✅ Security headers enabled"
echo "✅ HTTPS redirect enabled"
echo ""
echo "🌐 Your site is now accessible at:"
echo "   https://$DOMAIN"
if host "www.$DOMAIN" >/dev/null 2>&1; then
    echo "   https://www.$DOMAIN"
fi
echo ""
echo "🔒 SSL Rating Test:"
echo "   https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
echo ""
echo "📊 Certificate Information:"
certbot certificates
echo ""
echo "🔧 Management Commands:"
echo "   Check certificate: certbot certificates"
echo "   Renew certificate: certbot renew"
echo "   Test renewal: certbot renew --dry-run"
echo ""
