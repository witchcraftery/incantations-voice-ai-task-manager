#!/bin/bash
echo "🔧 Applying Digital Ocean deployment fixes..."

# 1. Check if .env.docker exists, if not create from template
if [ ! -f .env.docker ]; then
    if [ -f .env.docker.template ]; then
        echo "📝 Creating .env.docker from template..."
        cp .env.docker.template .env.docker
        echo "❗ IMPORTANT: Edit .env.docker and add your actual API keys!"
        echo "❗ Required: DEEPGRAM_API_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET"
        read -p "Press Enter after you've updated .env.docker with your API keys..."
    else
        echo "❌ Neither .env.docker nor .env.docker.template found!"
        exit 1
    fi
fi

# 2. Stop existing containers
echo "📦 Stopping containers..."
docker-compose down

# 3. Clean up any hanging resources
echo "🧹 Cleaning up..."
docker system prune -f

# 4. Rebuild with fixes (no cache to ensure fresh build)
echo "🔨 Rebuilding containers..."
docker-compose build --no-cache

# 5. Start services
echo "🚀 Starting services..."
docker-compose up -d

# 6. Wait for startup
echo "⏳ Waiting for services to start..."
sleep 45

# 7. Check status
echo "📊 Service Status:"
docker-compose ps

echo "📝 Backend Logs (last 10 lines):"
docker-compose logs backend | tail -10

echo "📝 Frontend Logs (last 5 lines):"
docker-compose logs frontend | tail -5

echo "✅ Deployment complete!"
echo "🌐 Frontend: http://your-droplet-ip:5174"
echo "🔌 Backend: http://your-droplet-ip:3001"

# 8. Optional: Check resource usage
echo "💾 Current resource usage:"
docker stats --no-stream | head -5
