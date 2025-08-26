#!/bin/bash

# AllCattle Farm Cloudflare SSL Configuration Guide
# For domain: allcattle.farm

echo "🔐 AllCattle Farm SSL Configuration for Cloudflare"
echo "================================================="
echo ""

# Cloudflare SSL options explanation
echo "☁️ Cloudflare SSL Configuration Options"
echo "--------------------------------------"
echo ""
echo "Cloudflare provides several SSL/TLS encryption modes:"
echo ""
echo "1. 🔓 OFF (Not recommended)"
echo "   - No encryption between visitor and Cloudflare"
echo "   - Uses: http://allcattle.farm"
echo ""
echo "2. 🔐 FLEXIBLE (Basic protection)"
echo "   - Encrypted connection: Visitor ↔ Cloudflare"
echo "   - Unencrypted connection: Cloudflare ↔ Server"
echo "   - Uses: https://allcattle.farm (visitors see HTTPS)"
echo "   - Server configuration: HTTP only (port 80)"
echo ""
echo "3. 🔒 FULL (Recommended for most cases)"
echo "   - Encrypted connection: Visitor ↔ Cloudflare"
echo "   - Encrypted connection: Cloudflare ↔ Server (self-signed OK)"
echo "   - Uses: https://allcattle.farm"
echo "   - Server configuration: Self-signed SSL certificate"
echo ""
echo "4. 🔐 FULL (STRICT) (Maximum security)"
echo "   - Encrypted connection: Visitor ↔ Cloudflare"
echo "   - Encrypted connection: Cloudflare ↔ Server (valid certificate required)"
echo "   - Uses: https://allcattle.farm"
echo "   - Server configuration: Valid SSL certificate (Let's Encrypt)"
echo ""

echo "🎯 Recommended Configuration: FULL mode"
echo "---------------------------------------"
echo ""
echo "For AllCattle Farm, we recommend FULL mode because:"
echo "✅ End-to-end encryption"
echo "✅ Self-signed certificates work (easier setup)"
echo "✅ Better security than Flexible mode"
echo "✅ No need for external certificate validation"
echo ""

echo "📋 How to Configure Cloudflare SSL"
echo "---------------------------------"
echo ""
echo "1. Log in to Cloudflare Dashboard:"
echo "   🌐 https://dash.cloudflare.com/"
echo ""
echo "2. Select your domain: allcattle.farm"
echo ""
echo "3. Navigate to SSL/TLS > Overview"
echo ""
echo "4. Select encryption mode:"
echo "   ✅ Choose 'Full' (recommended)"
echo "   🔐 Or 'Full (strict)' if you prefer maximum security"
echo ""
echo "5. Additional Security Settings:"
echo "   - Edge Certificates > Always Use HTTPS: ON"
echo "   - Edge Certificates > Minimum TLS Version: 1.2"
echo "   - Edge Certificates > TLS 1.3: ON"
echo "   - Edge Certificates > Automatic HTTPS Rewrites: ON"
echo "   - Edge Certificates > Certificate Transparency Monitoring: ON"
echo ""

echo "🔧 Server-Side SSL Certificate Setup"
echo "-----------------------------------"
echo ""
echo "Our deployment script creates a self-signed certificate that works with Cloudflare Full mode:"
echo ""
echo "Certificate location:"
echo "  📄 Certificate: /etc/ssl/certs/allcattle-selfsigned.crt"
echo "  🔑 Private key: /etc/ssl/private/allcattle-selfsigned.key"
echo ""
echo "This certificate enables:"
echo "✅ HTTPS communication between Cloudflare and your server"
echo "✅ End-to-end encryption"
echo "✅ Compatibility with Cloudflare Full mode"
echo ""

# Function to check current SSL configuration
check_ssl_config() {
    echo "🔍 Checking Current SSL Configuration"
    echo "-----------------------------------"
    echo ""
    
    # Check if domain resolves
    echo "DNS Resolution:"
    if nslookup allcattle.farm > /dev/null 2>&1; then
        echo "✅ Domain resolves successfully"
        dig +short allcattle.farm | head -3
    else
        echo "❌ Domain resolution failed"
    fi
    echo ""
    
    # Check HTTPS response
    echo "HTTPS Test:"
    if curl -s -I https://allcattle.farm | head -1; then
        echo "✅ HTTPS connection successful"
        
        # Check for Cloudflare headers
        echo ""
        echo "Cloudflare Headers:"
        curl -s -I https://allcattle.farm | grep -i "cf-\|cloudflare\|server" || echo "No Cloudflare headers detected"
        
        # SSL certificate info
        echo ""
        echo "SSL Certificate Info:"
        echo | openssl s_client -servername allcattle.farm -connect allcattle.farm:443 2>/dev/null | openssl x509 -noout -issuer -subject -dates 2>/dev/null || echo "Unable to retrieve certificate info"
        
    else
        echo "❌ HTTPS connection failed"
        echo ""
        echo "This could mean:"
        echo "- DNS not pointing to correct server"
        echo "- Server not configured yet"
        echo "- Cloudflare SSL not enabled"
    fi
    echo ""
}

# Function to show SSL grade and security
check_ssl_grade() {
    echo "🔒 SSL Security Analysis"
    echo "----------------------"
    echo ""
    echo "Test your SSL configuration:"
    echo "🌐 https://www.ssllabs.com/ssltest/analyze.html?d=allcattle.farm"
    echo ""
    echo "Expected grades with Cloudflare:"
    echo "📊 SSL Labs Grade: A or A+"
    echo "🔐 TLS Version: 1.2, 1.3"
    echo "🔑 Cipher Suites: Modern, secure"
    echo "✅ Certificate Chain: Valid"
    echo ""
}

# Function to show Cloudflare-specific settings
show_cloudflare_settings() {
    echo "⚙️ Recommended Cloudflare Settings"
    echo "---------------------------------"
    echo ""
    echo "🔐 SSL/TLS Settings:"
    echo "   Encryption Mode: Full"
    echo "   Edge Certificates:"
    echo "     ✅ Always Use HTTPS: ON"
    echo "     ✅ HTTP Strict Transport Security (HSTS): ON"
    echo "     ✅ Minimum TLS Version: 1.2"
    echo "     ✅ TLS 1.3: ON"
    echo "     ✅ Automatic HTTPS Rewrites: ON"
    echo ""
    echo "🛡️ Security Settings:"
    echo "   Security Level: Medium or High"
    echo "   Bot Fight Mode: ON"
    echo "   Browser Integrity Check: ON"
    echo "   Challenge Passage: 30 minutes"
    echo ""
    echo "🚀 Speed Settings:"
    echo "   Auto Minify: CSS, JS, HTML"
    echo "   Brotli: ON"
    echo "   Early Hints: ON"
    echo "   HTTP/2: ON"
    echo "   HTTP/3 (with QUIC): ON"
    echo ""
    echo "📊 Caching Settings:"
    echo "   Caching Level: Standard"
    echo "   Browser Cache TTL: 4 hours"
    echo "   Always Online: ON"
    echo "   Development Mode: OFF (for production)"
    echo ""
}

# Function to verify SSL after deployment
verify_ssl_deployment() {
    echo "✅ SSL Deployment Verification Steps"
    echo "-----------------------------------"
    echo ""
    echo "After running the deployment script, verify:"
    echo ""
    echo "1. 🌐 Test main domain:"
    echo "   curl -I https://allcattle.farm"
    echo ""
    echo "2. 🔍 Test health endpoint:"
    echo "   curl https://allcattle.farm/api/health"
    echo ""
    echo "3. 🔄 Test HTTP to HTTPS redirect:"
    echo "   curl -I http://allcattle.farm"
    echo "   (Should return 301/302 redirect to HTTPS)"
    echo ""
    echo "4. 🔐 Check SSL certificate:"
    echo "   openssl s_client -servername allcattle.farm -connect allcattle.farm:443 -brief"
    echo ""
    echo "5. 📊 Performance test:"
    echo "   curl -w \"Total: %{time_total}s\" -o /dev/null -s https://allcattle.farm"
    echo ""
    echo "Expected results:"
    echo "✅ HTTP 200 responses"
    echo "✅ Cloudflare headers present"
    echo "✅ Fast response times (< 2 seconds)"
    echo "✅ Valid SSL certificate"
    echo "✅ HTTP redirects to HTTPS"
    echo ""
}

# Function to troubleshoot common SSL issues
troubleshoot_ssl() {
    echo "🔧 SSL Troubleshooting Guide"
    echo "---------------------------"
    echo ""
    echo "Common issues and solutions:"
    echo ""
    echo "❌ Problem: 'This site is not secure' warning"
    echo "✅ Solution:"
    echo "   - Check Cloudflare SSL mode is set to 'Full' or 'Full (strict)'"
    echo "   - Verify server has SSL certificate installed"
    echo "   - Clear browser cache and cookies"
    echo ""
    echo "❌ Problem: 'Too many redirects' error"
    echo "✅ Solution:"
    echo "   - Check if Cloudflare SSL mode matches server configuration"
    echo "   - Verify Nginx configuration doesn't force HTTPS redirects"
    echo "   - Disable Cloudflare 'Always Use HTTPS' temporarily"
    echo ""
    echo "❌ Problem: '502 Bad Gateway' error"
    echo "✅ Solution:"
    echo "   - Check if application is running (pm2 status)"
    echo "   - Verify Nginx is running (systemctl status nginx)"
    echo "   - Check server logs (pm2 logs allcattle-farm)"
    echo ""
    echo "❌ Problem: Slow HTTPS response"
    echo "✅ Solution:"
    echo "   - Enable HTTP/2 in Cloudflare"
    echo "   - Check server resources (CPU, memory)"
    echo "   - Optimize Nginx configuration"
    echo "   - Enable Cloudflare caching"
    echo ""
}

# Main execution
echo "🚀 Starting SSL Configuration Analysis..."
echo ""

check_ssl_config
show_cloudflare_settings
verify_ssl_deployment
troubleshoot_ssl
check_ssl_grade

echo ""
echo "📋 SSL Configuration Summary"
echo "============================"
echo ""
echo "1. 🌐 Configure Cloudflare SSL mode to 'Full'"
echo "2. 🔧 Run deployment script: ./deploy-cloudflare.sh"
echo "3. ✅ Verify SSL using the commands above"
echo "4. 📊 Test performance and security"
echo "5. 🔒 Monitor SSL certificate validity"
echo ""
echo "🎯 After configuration, AllCattle Farm will have:"
echo "✅ HTTPS encryption end-to-end"
echo "✅ Cloudflare CDN and security"
echo "✅ Automatic SSL certificate management"
echo "✅ Optimized performance and caching"
echo "✅ DDoS protection and WAF"
echo ""
echo "🌟 Your farm management system will be secure and fast!"
