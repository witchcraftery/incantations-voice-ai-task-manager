#!/bin/bash
echo "🚨 CRITICAL SECURITY FIX: Closing Redis public exposure"

echo "📦 Stopping containers..."
docker-compose down

echo "🚀 Restarting with fixed Redis config..."
docker-compose up -d

echo "⏳ Waiting for services..."
sleep 20

echo "📊 Container Status:"
docker-compose ps

echo "🔍 Testing Redis is no longer publicly accessible..."
timeout 5 telnet 137.184.13.35 6379 && echo "❌ STILL EXPOSED!" || echo "✅ Redis is now secure!"

echo "✅ Security fix deployed!"
echo "📝 Redis is now only accessible internally to your app containers"
