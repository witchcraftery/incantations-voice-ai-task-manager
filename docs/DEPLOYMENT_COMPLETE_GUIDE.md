# 🚀 Complete Deployment Guide - From Zero to Production

**Use this guide for:** Rebuilding infrastructure, new server setup, disaster recovery, or new team member deployment.

**For daily updates:** See `DEPLOYMENT_PROTECTION_GUIDE.md` to keep infrastructure safe.

---

## 🎯 **DEPLOYMENT OVERVIEW**

**From:** Fresh DigitalOcean droplet  
**To:** `https://incantations.witchcraftery.io` with SSL

**Stack:** Docker + Nginx + Let's Encrypt + React + Node.js + PostgreSQL + Redis

---

## 📋 **PHASE 1: SERVER PREPARATION**

### **1.1: Create DigitalOcean Droplet**
- **Size:** 4GB RAM minimum (for Docker + builds)
- **OS:** Ubuntu 22.04 LTS
- **Datacenter:** Choose closest to users
- **SSH Keys:** Add your public SSH key during creation

### **1.2: Initial Server Setup**
```bash
# SSH into your droplet
ssh root@YOUR_DROPLET_IP

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Install Git
apt install git -y

# Install Nginx
apt install nginx -y

# Install SSL tools
apt install snapd -y
snap install core; snap refresh core
snap install --classic certbot
ln -s /snap/bin/certbot /usr/bin/certbot

# Configure firewall
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable
```

---

## 📋 **PHASE 2: APPLICATION DEPLOYMENT**

### **2.1: Clone Repository**
```bash
cd /root
git clone https://github.com/witchcraftery/incantations-voice-ai-task-manager.git
cd incantations-voice-ai-task-manager
```

### **2.2: Environment Configuration**
```bash
# Copy environment template
cp .env.docker.template .env.docker

# Edit environment variables
nano .env.docker
```

**Required .env.docker variables:**
```env
NODE_ENV=production
FRONTEND_PORT=5174
BACKEND_PORT=3001

# Database
POSTGRES_DB=incantations_db
POSTGRES_USER=incantations_user
POSTGRES_PASSWORD=your_secure_password

# Redis
REDIS_PASSWORD=your_redis_password

# API Keys (add your actual keys)
OPENROUTER_API_KEY=your_openrouter_key
DEEPGRAM_API_KEY=your_deepgram_key

# CORS Origins (update with your domain)
CORS_ORIGINS=https://incantations.witchcraftery.io,https://witchcraftery.io
```

### **2.3: Build and Start Services**
```bash
# Build containers
docker-compose build

# Start services
docker-compose up -d

# Verify services are running
docker-compose ps

# Test backend health
curl http://localhost:3001/api/health

# Test frontend
curl http://localhost:5174
```

---

## 📋 **PHASE 3: DOMAIN & DNS SETUP**

### **3.1: Configure DNS**
**In your domain registrar (where you manage your domain):**

1. **Add A Record:**
   - **Name:** `incantations` 
   - **Type:** `A`
   - **Value:** `YOUR_DROPLET_IP`
   - **TTL:** `300` (5 minutes)

2. **Optional - Add wildcard (for future subdomains):**
   - **Name:** `*`
   - **Type:** `A` 
   - **Value:** `YOUR_DROPLET_IP`
   - **TTL:** `300`

### **3.2: Verify DNS Propagation**
```bash
# Test DNS resolution (run from your local machine)
nslookup incantations.witchcraftery.io
# Should return: YOUR_DROPLET_IP

# Wait 5-15 minutes if DNS hasn't propagated yet
```

---

## 📋 **PHASE 4: NGINX & SSL CONFIGURATION**

### **4.1: Initial Nginx Setup (HTTP Only)**
```bash
# Create nginx configuration
cat > /etc/nginx/sites-available/witchcraftery.io << 'EOF'
# Initial HTTP configuration
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
        proxy_pass http://localhost:3001/;
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
EOF

# Enable site
rm -f /etc/nginx/sites-enabled/default
ln -s /etc/nginx/sites-available/witchcraftery.io /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Start nginx
systemctl start nginx
systemctl enable nginx

# Test HTTP access
curl -I http://incantations.witchcraftery.io
```

### **4.2: SSL Certificate Generation**

**Option A: Single Domain Certificate (Easier)**
```bash
certbot --nginx -d incantations.witchcraftery.io -d witchcraftery.io
```

**Option B: Wildcard Certificate (More Flexible)**
```bash
certbot certonly --manual --preferred-challenges=dns \
  -d witchcraftery.io -d *.witchcraftery.io \
  --server https://acme-v02.api.letsencrypt.org/directory

# Follow DNS challenge instructions
# Add TXT records as prompted
# Wait for DNS propagation
# Continue when ready
```

### **4.3: Update Nginx for HTTPS**
**After SSL certificate is generated:**
```bash
# Update nginx configuration for HTTPS
cat > /etc/nginx/sites-available/witchcraftery.io << 'EOF'
# HTTP to HTTPS redirects
server {
    listen 80;
    server_name witchcraftery.io incantations.witchcraftery.io;
    return 301 https://$host$request_uri;
}

# Main domain HTTPS - redirects to incantations
server {
    listen 443 ssl http2;
    server_name witchcraftery.io;

    # SSL Certificate
    ssl_certificate /etc/letsencrypt/live/witchcraftery.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/witchcraftery.io/privkey.pem;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Redirect to incantations subdomain
    location / {
        return 301 https://incantations.witchcraftery.io$request_uri;
    }
}

# Incantations subdomain HTTPS - main app
server {
    listen 443 ssl http2;
    server_name incantations.witchcraftery.io;

    # Same SSL certificate
    ssl_certificate /etc/letsencrypt/live/witchcraftery.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/witchcraftery.io/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend
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

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001/;
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
EOF

# Test and reload nginx
nginx -t && systemctl reload nginx
```

---

## 📋 **PHASE 5: APPLICATION CONFIGURATION**

### **5.1: Update Frontend for HTTPS**
```bash
cd /root/incantations-voice-ai-task-manager

# Update vite.config.ts to allow production domain
nano voice-ai-task-manager/vite.config.ts
```

**Add to server config:**
```typescript
server: {
  host: true,
  port: 5174,
  allowedHosts: ["incantations.witchcraftery.io", "witchcraftery.io", "localhost"],
  // ... rest of config
}
```

### **5.2: Update Backend CORS**
```bash
# Update backend CORS configuration
nano backend/src/index.ts
```

**Update CORS origins:**
```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://incantations.witchcraftery.io',
        'https://witchcraftery.io',
        'http://localhost:5174'  // For testing
      ]
    : ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### **5.3: Restart Services**
```bash
# Restart containers to apply changes
docker-compose restart

# Wait for services to start
sleep 30

# Verify services
docker-compose ps
```

---

## 📋 **PHASE 6: TESTING & VERIFICATION**

### **6.1: Test All Endpoints**
```bash
# Test HTTPS main domain
curl -I https://witchcraftery.io
# Should: 301 redirect to incantations

# Test HTTPS app domain  
curl -I https://incantations.witchcraftery.io
# Should: 200 OK

# Test API endpoint
curl https://incantations.witchcraftery.io/api/health
# Should: {"status":"ok","timestamp":"...","version":"1.0.0"}

# Test TTS endpoint
curl https://incantations.witchcraftery.io/api/tts/health
# Should: API health response

# Check SSL certificate
openssl s_client -connect incantations.witchcraftery.io:443 -servername incantations.witchcraftery.io < /dev/null
# Should: Show valid certificate
```

### **6.2: Browser Testing**
1. **Visit:** `https://incantations.witchcraftery.io`
2. **Check:** SSL certificate (lock icon in browser)
3. **Test:** Voice features in settings
4. **Verify:** All API calls work over HTTPS
5. **Test:** Task creation and management

---

## 📋 **PHASE 7: MAINTENANCE & MONITORING**

### **7.1: SSL Auto-Renewal**
```bash
# Test certificate renewal
certbot renew --dry-run

# Check renewal timer
systemctl status snap.certbot.renew.timer

# Manual renewal if needed
certbot renew --force-renewal
```

### **7.2: Backup Strategy**
```bash
# Create backup script
cat > /root/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups"

mkdir -p $BACKUP_DIR

# Backup application
tar -czf $BACKUP_DIR/app-$DATE.tar.gz /root/incantations-voice-ai-task-manager

# Backup nginx config
cp /etc/nginx/sites-enabled/witchcraftery.io $BACKUP_DIR/nginx-$DATE.conf

# Backup SSL certificates
tar -czf $BACKUP_DIR/ssl-$DATE.tar.gz /etc/letsencrypt/live/

# Backup database (if needed)
docker exec incantations-postgres pg_dump -U incantations_user incantations_db > $BACKUP_DIR/db-$DATE.sql

echo "Backup completed: $BACKUP_DIR/"
EOF

chmod +x /root/backup.sh

# Run backup
./backup.sh
```

### **7.3: Monitoring Commands**
```bash
# Check container status
docker-compose ps

# Check nginx status
systemctl status nginx

# Check SSL certificate expiry
certbot certificates

# Check logs
docker-compose logs backend
docker-compose logs frontend

# Check disk space
df -h

# Check memory usage
free -h
```

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues:**

**SSL Certificate Problems:**
```bash
# Check certificate exists
ls -la /etc/letsencrypt/live/witchcraftery.io/

# Regenerate if needed
certbot delete --cert-name witchcraftery.io
certbot --nginx -d witchcraftery.io -d incantations.witchcraftery.io
```

**Docker Issues:**
```bash
# Restart all services
docker-compose down && docker-compose up -d

# Rebuild containers
docker-compose build --no-cache
docker-compose up -d

# Check logs
docker-compose logs
```

**Nginx Issues:**
```bash
# Test configuration
nginx -t

# Check nginx status
systemctl status nginx

# Restart nginx
systemctl restart nginx
```

**DNS Issues:**
```bash
# Check DNS propagation
nslookup incantations.witchcraftery.io 8.8.8.8

# Flush local DNS cache (on local machine)
sudo dscacheutil -flushcache  # macOS
sudo systemctl restart systemd-resolved  # Ubuntu
```

---

## 🎯 **SUCCESS CRITERIA**

**✅ Deployment Complete When:**
- `https://incantations.witchcraftery.io` loads the app
- SSL certificate shows valid (A+ grade)
- All API endpoints respond over HTTPS
- Voice features work in production
- HTTP automatically redirects to HTTPS
- Certificate auto-renewal is configured
- All Docker containers are healthy

---

## 📋 **POST-DEPLOYMENT CHECKLIST**

- [ ] Domain resolves correctly
- [ ] SSL certificate is valid and trusted
- [ ] All services running in Docker
- [ ] Nginx proxying correctly
- [ ] API endpoints responding
- [ ] Frontend loads without errors
- [ ] Voice features functional
- [ ] HTTP → HTTPS redirects working
- [ ] Certificate auto-renewal tested
- [ ] Backup strategy implemented
- [ ] Monitoring commands documented
- [ ] Firewall configured
- [ ] SSH access working

---

**🎊 RESULT: Production-ready HTTPS deployment with professional security!**

*From zero to production-grade voice AI task manager in one comprehensive guide.* 🚀