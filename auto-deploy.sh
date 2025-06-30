#!/bin/bash

# 🚀 AUTOMATED DEPLOYMENT SCRIPT - NO MORE NANO!
# Usage: ./auto-deploy.sh
# Deploys Incantations to production automatically

set -e  # Exit on any error

echo "🚀 Incantations Auto-Deploy Starting..."
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PRODUCTION_SERVER="137.184.13.35"
PRODUCTION_USER="root"
PROJECT_PATH="/root/incantations-voice-ai-task-manager"

echo -e "${YELLOW}📋 Pre-deployment checks...${NC}"

# 1. Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Not in project directory! Run from project root.${NC}"
    exit 1
fi

# 2. Check local git status
if [[ `git status --porcelain` ]]; then
    echo -e "${RED}❌ Uncommitted changes detected!${NC}"
    echo "Please commit your changes first:"
    git status --short
    exit 1
fi

# 3. Test local build
echo -e "${YELLOW}🧪 Testing local build...${NC}"
docker-compose build --quiet
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Local build failed!${NC}"
    exit 1
fi

# 4. Push changes to git
echo -e "${YELLOW}📤 Pushing to git...${NC}"
CURRENT_BRANCH=$(git branch --show-current)
git push origin $CURRENT_BRANCH

echo -e "${GREEN}✅ Pre-checks passed!${NC}"

# 5. Deploy to production
echo -e "${YELLOW}🚀 Deploying to production...${NC}"

ssh -o ConnectTimeout=10 $PRODUCTION_USER@$PRODUCTION_SERVER << EOF
    set -e
    
    echo "📍 Navigating to project directory..."
    cd $PROJECT_PATH
    
    echo "📥 Pulling latest changes..."
    git fetch origin
    git checkout $CURRENT_BRANCH
    git pull origin $CURRENT_BRANCH
    
    echo "🔄 Restarting services..."
    docker-compose restart
    
    echo "⏳ Waiting for services to start..."
    sleep 15
    
    echo "🧪 Testing deployment..."
    curl -f http://localhost:3001/health > /dev/null
    if [ \$? -eq 0 ]; then
        echo "✅ Backend health check passed"
    else
        echo "❌ Backend health check failed"
        exit 1
    fi
    
    curl -f http://localhost:3001/api/tts/health > /dev/null
    if [ \$? -eq 0 ]; then
        echo "✅ TTS health check passed"
    else
        echo "❌ TTS health check failed"
        exit 1
    fi
    
    echo "📊 Container status:"
    docker-compose ps
    
    echo ""
    echo "🎉 Deployment successful!"
    echo "🌐 Frontend: http://$PRODUCTION_SERVER:5174"
    echo "🔌 Backend: http://$PRODUCTION_SERVER:3001"
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎊 DEPLOYMENT COMPLETE!${NC}"
    echo -e "${GREEN}✅ No manual editing required!${NC}"
    echo -e "${GREEN}✅ All services healthy!${NC}"
    echo ""
    echo "🌐 Your app is live at: http://$PRODUCTION_SERVER:5174"
    echo ""
else
    echo -e "${RED}❌ Deployment failed!${NC}"
    echo "Check the logs above for details."
    exit 1
fi
