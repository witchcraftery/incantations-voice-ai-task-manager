# 🎤 Deepgram TTS Setup Guide

## 🔓 **Why is Deepgram locked?**

The Deepgram TTS toggle appears locked because the backend is missing the `DEEPGRAM_API_KEY` environment variable. This is normal for local development!

## 🆓 **Quick Setup (Free Tier Available)**

### **Step 1: Get Deepgram API Key**
1. Go to https://deepgram.com/
2. Sign up for a free account
3. Navigate to your dashboard
4. Copy your API key

### **Step 2: Configure Backend**
1. Go to `backend/` directory
2. Create/edit `.env` file:
```bash
# Add this line to backend/.env
DEEPGRAM_API_KEY=your_actual_deepgram_api_key_here
```

### **Step 3: Restart Backend**
```bash
cd backend
npm run dev
```

### **Step 4: Test Connection**
1. Go to `http://localhost:5174`
2. Open Settings → Voice Settings
3. The Deepgram toggle should now be unlocked! 🎉

## 🔄 **Alternative: Use Web Speech API**

If you don't want to set up Deepgram right now, the app still works great with the built-in Web Speech API:

- **Voice Recognition**: ✅ Works perfectly
- **Text-to-Speech**: ✅ Uses browser's built-in voices
- **All Features**: ✅ Fully functional

## 🎯 **Deepgram Benefits**

Once configured, you get:
- **🎙️ Professional Voice Quality** - Studio-grade synthesis
- **🎭 Multiple Voice Options** - 10 different voices (male/female)
- **⚡ Better Performance** - Faster and more reliable than browser TTS
- **🔊 Premium Audio** - Higher quality audio output

## 🐛 **Troubleshooting**

### **Toggle Still Locked?**
1. Check backend logs for errors
2. Verify API key is correct
3. Ensure backend is running on port 3001
4. Try hitting `http://localhost:3001/api/tts/health` directly

### **Connection Test**
```bash
curl http://localhost:3001/api/tts/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "provider": "deepgram", 
  "voices_available": 10
}
```

## 🎊 **Success!**
Once configured, you'll have premium voice synthesis with 10 professional voices to choose from!