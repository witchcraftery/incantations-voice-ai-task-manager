#!/bin/bash

echo "🚀 Deploying Incantations Voice AI Task Manager to Witchcraftery.io"
echo "=================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DROPLET_IP="your_droplet_ip"
DOMAIN="incantations.witchcraftery.io"
API_DOMAIN="api.incantations.witchcraftery.io"

echo -e "${BLUE}📋 Deployment Checklist:${NC}"
echo "1. Digital Ocean Droplet (Ubuntu 22.04)"
echo "2. Domain DNS configured"
echo "3. PostgreSQL installed"
echo "4. Redis installed"
echo "5. Nginx configured"
echo "6. SSL certificates"
echo "7. Environment variables set"

echo -e "\n${YELLOW}🔧 Step 1: Building Frontend${NC}"
cd voice-ai-task-manager
npm run build

echo -e "\n${YELLOW}🔧 Step 2: Building Backend${NC}"
cd ../backend
npm install
npm run build

echo -e "\n${YELLOW}📦 Step 3: Creating deployment package${NC}"
mkdir -p ../deploy
cp -r dist/ ../deploy/backend/
cp package.json ../deploy/backend/
cp -r ../voice-ai-task-manager/dist/ ../deploy/frontend/

echo -e "\n${YELLOW}🚀 Step 4: Upload to server${NC}"
echo "Run these commands to deploy:"
echo ""
echo -e "${GREEN}# 1. Upload files${NC}"
echo "scp -r deploy/ root@${DROPLET_IP}:/var/www/"
echo ""
echo -e "${GREEN}# 2. SSH to server${NC}"
echo "ssh root@${DROPLET_IP}"
echo ""
echo -e "${GREEN}# 3. Setup backend${NC}"
echo "cd /var/www/deploy/backend"
echo "npm ci --production"
echo "pm2 start dist/index.js --name incantations-api"
echo ""
echo -e "${GREEN}# 4. Setup frontend${NC}"
echo "cp -r /var/www/deploy/frontend/* /var/www/incantations/"
echo ""
echo -e "${GREEN}# 5. Restart services${NC}"
echo "pm2 restart incantations-api"
echo "systemctl reload nginx"

echo -e "\n${BLUE}📋 Manual Steps Required:${NC}"
echo "1. Create PostgreSQL database and user"
echo "2. Run database migrations"
echo "3. Set environment variables"
echo "4. Configure Nginx"
echo "5. Setup SSL certificates"
echo "6. Configure Google OAuth"

echo -e "\n${YELLOW}📄 Sample Nginx Config:${NC}"
cat << 'EOF'
# Frontend
server {
    listen 80;
    server_name incantations.witchcraftery.io;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name incantations.witchcraftery.io;

    ssl_certificate /etc/letsencrypt/live/incantations.witchcraftery.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/incantations.witchcraftery.io/privkey.pem;

    root /var/www/incantations;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Backend API
server {
    listen 443 ssl http2;
    server_name api.incantations.witchcraftery.io;

    ssl_certificate /etc/letsencrypt/live/incantations.witchcraftery.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/incantations.witchcraftery.io/privkey.pem;

    location / {
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
EOF

echo -e "\n${YELLOW}🔐 Sample Environment Variables:${NC}"
cat << 'EOF'
# /var/www/deploy/backend/.env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://incantations:PASSWORD@localhost/incantations_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_super_secret_jwt_key_here
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=https://incantations.witchcraftery.io
EOF

echo -e "\n${GREEN}✅ Deployment package ready!${NC}"
echo -e "Next: Upload to server and configure environment"
