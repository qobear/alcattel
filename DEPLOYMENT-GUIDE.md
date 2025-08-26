# AllCattle Farm Production Deployment Guide

## 🌐 Domain: allcattle.farm
**Status**: ✅ Connected to Cloudflare with SSL certificate
**Certificate Valid**: Until November 23, 2025
**Current Response**: HTTP/2 522 (Origin server connection error)

## 📋 Deployment Overview

The domain `allcattle.farm` is already configured with Cloudflare and has a valid SSL certificate. The 522 error indicates that Cloudflare cannot connect to the origin server, which means we need to deploy our application to the server.

## 🚀 Deployment Steps

### Prerequisites
- Server: 139.180.186.21 (Singapore)
- SSH access configured
- Domain pointed to server via Cloudflare

### 1. Update Cloudflare DNS
```
Go to Cloudflare Dashboard > DNS
Update A record:
- Type: A
- Name: @ (or allcattle.farm)
- IPv4 address: 139.180.186.21
- Proxy status: Proxied (orange cloud)
```

### 2. Configure Cloudflare SSL
```
Go to SSL/TLS > Overview
Select: Full (recommended)

Additional settings:
- Always Use HTTPS: ON
- Minimum TLS Version: 1.2
- TLS 1.3: ON
- Automatic HTTPS Rewrites: ON
```

### 3. Run Deployment Script
```bash
./deploy-cloudflare.sh
```

This script will:
- ✅ Install Node.js, PM2, Nginx, PostgreSQL
- ✅ Setup database with production schema
- ✅ Deploy application files
- ✅ Configure Nginx with Cloudflare optimization
- ✅ Generate self-signed SSL for origin
- ✅ Start application with PM2 cluster mode
- ✅ Configure firewall and monitoring

## 🔧 Post-Deployment Verification

### Health Checks
```bash
# Test application directly
curl http://139.180.186.21:3000/api/health

# Test through Cloudflare
curl https://allcattle.farm/api/health

# Check SSL grade
https://www.ssllabs.com/ssltest/analyze.html?d=allcattle.farm
```

### System Status
```bash
# On the server
allcattle-status
pm2 status
systemctl status nginx
```

## 🛡️ Security Configuration

### Cloudflare Security Settings
- Security Level: Medium or High
- Bot Fight Mode: ON
- Browser Integrity Check: ON
- DDoS Protection: Automatic

### Server Security
- UFW Firewall: Configured for SSH, HTTP, HTTPS
- Nginx Rate Limiting: Enabled
- Real IP from Cloudflare: Configured
- Self-signed SSL for origin: Installed

## 📊 Performance Optimization

### Cloudflare Features
- HTTP/2 and HTTP/3: Enabled
- Brotli Compression: ON
- Auto Minify: CSS, JS, HTML
- Caching: Standard level
- Always Online: ON

### Application Performance
- PM2 Cluster Mode: 2 instances
- Memory limit: 1GB per instance
- Auto-restart: Enabled
- Log rotation: Configured

## 🔍 Monitoring

### Application Logs
```bash
# View real-time logs
pm2 logs allcattle-farm

# View combined logs
tail -f /var/www/allcattle/logs/combined.log
```

### System Monitoring
```bash
# System status overview
allcattle-status

# Resource usage
htop
df -h
free -h
```

## 🚨 Troubleshooting

### Common Issues

#### 522 Error (Origin Connection Error)
- Check if application is running: `pm2 status`
- Verify Nginx status: `systemctl status nginx`
- Check firewall: `ufw status`

#### SSL/TLS Errors
- Verify Cloudflare SSL mode is "Full"
- Check origin certificate: `ls -la /etc/ssl/certs/allcattle-selfsigned.crt`
- Test origin SSL: `curl -k https://139.180.186.21`

#### Performance Issues
- Check server resources: `htop`
- Monitor PM2 processes: `pm2 monit`
- Review Nginx logs: `tail -f /var/log/nginx/error.log`

## 🎯 Expected Results

After successful deployment:
- ✅ https://allcattle.farm loads AllCattle Farm application
- ✅ SSL Labs grade: A or A+
- ✅ Response time: < 2 seconds
- ✅ Cloudflare features active (caching, compression, security)
- ✅ Application health check passes
- ✅ Database operations working
- ✅ User authentication functional

## 📞 Support Commands

```bash
# Restart application
pm2 restart allcattle-farm

# Reload Nginx
systemctl reload nginx

# View application status
allcattle-status

# Check database connection
sudo -u postgres psql -d allcattle_production -c "SELECT 1;"

# Test API endpoints
curl https://allcattle.farm/api/health
curl https://allcattle.farm/api/animals
```

## 🌟 Success Indicators

Your AllCattle Farm application is successfully deployed when:
1. 🌐 Domain loads without errors
2. 🔒 SSL certificate shows as valid
3. 📊 Application data displays correctly
4. 🔐 User login/authentication works
5. 📈 Performance metrics are optimal
6. 🛡️ Security headers are present
7. 📱 Mobile responsiveness works

---

**Next Steps**: Execute `./deploy-cloudflare.sh` to begin the automated deployment process!
