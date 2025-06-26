#!/bin/bash

echo "🎯 Starting Incantations Voice AI Task Manager with Network Access..."
echo "📍 Location: $(pwd)"
echo ""

cd voice-ai-task-manager

echo "🚀 Option 1: Using npm script (recommended)"
npm run dev:network

# Alternative if above doesn't work:
# echo "🚀 Option 2: Direct vite command"
# npx vite --host 0.0.0.0

echo "🌐 Server started! Access from any device on your network."
