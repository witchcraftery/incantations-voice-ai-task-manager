#!/bin/bash
# Kokoro-FastAPI Quick Setup Script

echo "🎙️ Setting up Kokoro-FastAPI for Incantations..."

# Option 1: Quick Docker Run (CPU Version - Fast Setup)
echo "Starting Kokoro-FastAPI CPU version..."
docker run -d \
  --name kokoro-fastapi \
  -p 8880:8880 \
  ghcr.io/remsky/kokoro-fastapi-cpu:latest

echo "✅ Kokoro-FastAPI starting on http://localhost:8880"
echo "🌐 Web UI available at: http://localhost:8880/web"
echo "📚 API docs at: http://localhost:8880/docs"

# Wait for startup
echo "⏳ Waiting for server to start..."
sleep 10

# Test the connection
echo "🧪 Testing API connection..."
curl -s http://localhost:8880/v1/audio/voices || echo "❌ Server not ready yet, give it a moment"

echo ""
echo "🎯 Next Steps:"
echo "1. Visit http://localhost:5176/ (your Incantations app)"
echo "2. Click Settings gear icon"
echo "3. Enable Kokoro in Voice tab"
echo "4. Test premium voices!"
echo ""
echo "🛑 To stop: docker stop kokoro-fastapi"
echo "🗑️ To remove: docker rm kokoro-fastapi"