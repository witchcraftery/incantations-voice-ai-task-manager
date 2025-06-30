# 🔒 SSL SETUP GUIDE - PROFESSIONAL DEPLOYMENT

## 🎯 **GOAL: Move from IP to Professional Domain with SSL**

**Current:** `http://137.184.13.35:5174`  
**Target:** `https://incantations.witchcraftery.io`

---

## 📋 **STEP 1: DOMAIN CONFIGURATION**

### **DNS Setup (Do this first in your domain registrar):**
1. **Login to your domain registrar** (where witchcraftery.io is managed)
2. **Add A Record:**
   - **Name:** `incantations` 
   - **Type:** `A`
   - **Value:** `137.184.13.35`
   - **TTL:** `300` (5 minutes)

### **Verify DNS Propagation:**
```bash
# Test locally to verify DNS is working
nslookup incantations.witchcraftery.io
# Should return: 137.184.13.35
```

---

## 📋 **STEP 2: SERVER SETUP (Via Digital Ocean Console)**

### **Install Nginx + Certbot:**
```bash
# Update system
apt update && apt upgrade -y

# Install nginx
apt install nginx -y

# Install certbot for Let's Encrypt SSL
apt install snapd -y
snap install core; snap refresh core
snap install --classic certbot
ln -s /snap/bin/certbot /usr/bin/certbot

# Check installations
nginx -v
certbot --version
```

### **Configure Nginx:**
```bash
# Create nginx config for incantations
nano /etc/nginx/sites-available/incantations.witchcraftery.io
```

**Nginx Configuration:**
```nginx
# HTTP server block (temporary, will redirect to HTTPS later)
server {
    listen 80;
    server_name incantations.witchcraftery.io;

    # Frontend proxy
    location / {
        proxy_pass http://localhost:5174;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### **Enable the Site:**
```bash
# Enable the site
ln -s /etc/nginx/sites-available/incantations.witchcraftery.io /etc/nginx/sites-enabled/

# Test nginx configuration
nginx -t

# Start/restart nginx
systemctl start nginx
systemctl enable nginx
systemctl restart nginx

# Check status
systemctl status nginx
```

---

## 📋 **STEP 3: SSL CERTIFICATE GENERATION**

### **Generate Let's Encrypt Certificate:**
```bash
# Generate SSL certificate (make sure DNS is propagated first!)
certbot --nginx -d incantations.witchcraftery.io

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose redirect HTTP to HTTPS (recommended)
```

### **Verify SSL Setup:**
```bash
# Test certificate
certbot certificates

# Test renewal (dry run)
certbot renew --dry-run
```

---

## 📋 **STEP 4: UPDATE APPLICATION CONFIGURATION**

### **Update Backend CORS (via DO Console):**
```bash
cd /root/incantations-voice-ai-task-manager
nano backend/src/index.ts
```

**Find CORS section and update:**
```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://incantations.witchcraftery.io',
        'http://incantations.witchcraftery.io', 
        'http://137.184.13.35:5174'
      ]
    : ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### **Update Frontend API URL:**
```bash
nano voice-ai-task-manager/src/services/voiceService.ts
```

**Update API URL:**
```javascript
private backendApiUrl = process.env.NODE_ENV === 'production' 
  ? 'https://incantations.witchcraftery.io/api' 
  : 'http://localhost:3001';
```

### **Restart Services:**
```bash
docker-compose restart
sleep 15

# Test endpoints
curl https://incantations.witchcraftery.io/api/health
curl https://incantations.witchcraftery.io/api/tts/health
```

---

## 📋 **STEP 5: VERIFICATION & TESTING**

### **SSL Security Check:**
```bash
# Test SSL grade
curl -I https://incantations.witchcraftery.io

# Check SSL certificate details
openssl s_client -connect incantations.witchcraftery.io:443 -servername incantations.witchcraftery.io
```

### **Application Testing:**
1. **Visit:** `https://incantations.witchcraftery.io`
2. **Check SSL certificate** (lock icon in browser)
3. **Test voice features** in settings
4. **Verify all API calls** work over HTTPS

---

## 📋 **STEP 6: CLEANUP & OPTIMIZATION**

### **Firewall Configuration:**
```bash
# Configure UFW firewall
ufw allow 22    # SSH
ufw allow 80    # HTTP (for certbot renewal)
ufw allow 443   # HTTPS
ufw enable

# Check status
ufw status
```

### **SSL Auto-Renewal:**
```bash
# Certbot auto-renewal should be automatic, but verify
systemctl status snap.certbot.renew.timer

# Manual renewal test
certbot renew --dry-run
```

---

## 🎯 **SUCCESS CRITERIA**

### **✅ When SSL Setup is Complete:**
- [ ] Domain resolves: `incantations.witchcraftery.io` → `137.184.13.35`
- [ ] HTTPS working: `https://incantations.witchcraftery.io` loads app
- [ ] SSL certificate valid and trusted (A+ grade preferred)
- [ ] All API calls work over HTTPS
- [ ] Voice features functional with new domain
- [ ] HTTP automatically redirects to HTTPS
- [ ] Certificate auto-renewal configured

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues:**
1. **DNS not propagated** → Wait 15-30 minutes, test with `nslookup`
2. **Certbot fails** → Ensure nginx is running and domain resolves
3. **CORS errors** → Update backend CORS origins
4. **Mixed content** → Ensure all API calls use HTTPS URLs

### **Rollback Plan:**
If issues occur, you can always revert to IP access:
```bash
# Disable nginx temporarily
systemctl stop nginx

# Access app directly: http://137.184.13.35:5174
```

---

**🎊 OUTCOME: Professional HTTPS domain with premium TTS!**

*From: Development IP deployment*  
*To: Production-grade SSL domain* 🚀
