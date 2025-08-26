#!/bin/bash

# DNS Configuration and Verification Script for AllCattle Farm
# Domain: allcattle.farm

set -e

DOMAIN="allcattle.farm"
SERVER_IP="139.180.186.21"

echo "🌐 AllCattle Farm DNS Configuration Guide"
echo "=========================================="
echo ""
echo "Domain: $DOMAIN"
echo "Server IP: $SERVER_IP"
echo ""

echo "📋 Required DNS Records:"
echo "------------------------"
echo ""
echo "Add these DNS records to your domain registrar:"
echo ""
echo "A Record:"
echo "  Name: @"
echo "  Value: $SERVER_IP"
echo "  TTL: 300"
echo ""
echo "A Record (www subdomain):"
echo "  Name: www"
echo "  Value: $SERVER_IP"
echo "  TTL: 300"
echo ""
echo "Optional CAA Record (for SSL security):"
echo "  Name: @"
echo "  Value: 0 issue \"letsencrypt.org\""
echo "  TTL: 300"
echo ""

echo "🔍 DNS Verification:"
echo "-------------------"
echo ""

# Function to check DNS propagation
check_dns() {
    local record_type=$1
    local hostname=$2
    local expected_ip=$3
    
    echo "Checking $record_type record for $hostname..."
    
    # Try multiple DNS servers
    dns_servers=("8.8.8.8" "1.1.1.1" "208.67.222.222")
    
    for dns in "${dns_servers[@]}"; do
        echo -n "  $dns: "
        result=$(dig @$dns +short $hostname A 2>/dev/null || echo "FAILED")
        if [[ "$result" == "$expected_ip" ]]; then
            echo "✅ $result"
        elif [[ "$result" == "FAILED" ]]; then
            echo "❌ DNS query failed"
        else
            echo "⚠️  $result (expected: $expected_ip)"
        fi
    done
    echo ""
}

# Check main domain
check_dns "A" "$DOMAIN" "$SERVER_IP"

# Check www subdomain
check_dns "A" "www.$DOMAIN" "$SERVER_IP"

echo "🔧 Troubleshooting Commands:"
echo "---------------------------"
echo ""
echo "Check DNS propagation globally:"
echo "  curl \"https://www.whatsmydns.net/#A/$DOMAIN\""
echo ""
echo "Manual DNS lookup:"
echo "  dig $DOMAIN A"
echo "  nslookup $DOMAIN"
echo ""
echo "Check if server is reachable:"
echo "  ping $SERVER_IP"
echo "  telnet $SERVER_IP 80"
echo "  telnet $SERVER_IP 443"
echo ""

echo "⏰ DNS Propagation Timeline:"
echo "---------------------------"
echo "- Local ISP: 5-30 minutes"
echo "- Regional: 30-60 minutes"  
echo "- Global: 2-24 hours"
echo ""

# Run actual checks
echo "🚀 Running Live DNS Checks:"
echo "---------------------------"
echo ""

# Check if domain resolves
echo "1. Testing domain resolution..."
if host_result=$(host "$DOMAIN" 2>/dev/null); then
    echo "✅ $DOMAIN resolves to: $(echo "$host_result" | grep "has address" | awk '{print $4}')"
else
    echo "❌ $DOMAIN does not resolve yet"
fi
echo ""

# Check www subdomain
echo "2. Testing www subdomain..."
if www_result=$(host "www.$DOMAIN" 2>/dev/null); then
    echo "✅ www.$DOMAIN resolves to: $(echo "$www_result" | grep "has address" | awk '{print $4}')"
else
    echo "❌ www.$DOMAIN does not resolve yet"
fi
echo ""

# Check HTTP connectivity
echo "3. Testing HTTP connectivity..."
if curl -s --connect-timeout 10 "http://$DOMAIN" > /dev/null 2>&1; then
    echo "✅ HTTP connection successful"
else
    echo "❌ HTTP connection failed"
fi
echo ""

# Check HTTPS connectivity
echo "4. Testing HTTPS connectivity..."
if curl -s --connect-timeout 10 "https://$DOMAIN" > /dev/null 2>&1; then
    echo "✅ HTTPS connection successful"
else
    echo "❌ HTTPS connection failed (SSL may not be configured yet)"
fi
echo ""

echo "📊 SSL Certificate Check:"
echo "------------------------"
if command -v openssl >/dev/null 2>&1; then
    echo "Certificate details:"
    echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "❌ No SSL certificate found"
else
    echo "OpenSSL not available for certificate check"
fi
echo ""

echo "🎯 Next Steps:"
echo "-------------"
echo "1. Configure DNS records with your domain registrar"
echo "2. Wait for DNS propagation (check every 15 minutes)"
echo "3. Run deployment script: ./deploy-production.sh"
echo "4. Test the application at https://$DOMAIN"
echo ""

echo "💡 Quick Test Commands:"
echo "----------------------"
echo "Check if ready for deployment:"
echo "  ping $SERVER_IP && host $DOMAIN"
echo ""
echo "Monitor DNS propagation:"
echo "  watch -n 30 \"dig +short $DOMAIN A\""
echo ""
