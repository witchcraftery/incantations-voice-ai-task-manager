# 🎙️ Kokoro-FastAPI Integration Guide

## Quick Setup for Premium AI Voice

Your Incantations app now includes **Kokoro-FastAPI** integration for superior voice quality! Here's how to get it running:

### 🚀 **Start Kokoro Server**

```bash
# In a separate terminal, start Kokoro-FastAPI
cd /path/to/kokoro-fastapi
python -m uvicorn main:app --host 0.0.0.0 --port 8880
```

**Expected API Endpoint**: `http://0.0.0.0:8880`

### 🎯 **Available Kokoro Voices**

Your app supports these premium Kokoro voices:
- `af_bella` - Warm female voice (default)
- `af_nicole` - Clear female voice  
- `af_sarah` - Professional female voice
- `af_aoede` - Youthful thoughtful voice [NEEDS TO BE ADDED TO SETTINGS SELECTIONS]
- `af_sky` - Youthful female voice
- `am_adam` - Professional male voice
- `am_michael` - Warm male voice
- `bf_emma` - British female voice
- `bf_isabella` - Elegant British female
- `bm_george` - British male voice
- `bm_lewis` - Deep British male voice
- `us_male` - American male voice
- `us_female` - American female voice

### ⚙️ **How to Use**

1. **Open Settings** - Click the gear icon in top-right corner
2. **Go to Voice Tab** - First tab in settings dialog
3. **Enable Kokoro** - Toggle "Use Kokoro AI for premium voice quality"
4. **Select Voice** - Choose from available Kokoro voices
5. **Test Voice** - Click "Test Voice" button to preview
6. **Save Settings** - Click "Save Changes"

### 🔄 **Automatic Fallback**

- If Kokoro server is offline: **Gracefully falls back to Web Speech API**
- Connection status shown in settings: **Connected/Offline indicator**
- No interruption to app functionality

### 🎨 **Enhanced Features**

**Smart Voice Routing**:
- Kokoro voices → High-quality AI TTS
- Browser voices → Standard Web Speech API
- Seamless switching between modes

**Voice Settings**:
- **Rate Control** - Adjust speech speed (0.5x - 2.0x)
- **Volume Control** - Set output volume (0% - 100%)
- **Voice Preview** - Test any voice before saving
- **Auto-speak Toggle** - Control when AI responds with voice

### 🛠️ **API Integration Details**

**Endpoint Used**: `POST /v1/audio/speech`

**Request Format**:
```json
{
  "model": "kokoro",
  "input": "Text to speak",
  "voice": "af_aoede",
  "response_format": "wav",
  "speed": 1.0
}
```

**Response**: Audio blob played directly in browser

### 🎉 **What This Enables**

- **Natural Conversations** - High-quality voice responses feel more human
- **Voice Personalities** - Different voices for different contexts
- **Premium Experience** - Studio-quality TTS for professional use
- **Seamless Integration** - Works with existing chat and task flows

### 🔧 **Troubleshooting**

**Kokoro Shows "Offline"**:
- Ensure Kokoro-FastAPI server is running on port 8880
- Check server logs for any startup errors
- Verify API endpoint accessibility

**Voice Test Fails**:
- Check browser console for error messages
- Try switching back to Web Speech API voices
- Refresh page and retry

**Audio Not Playing**:
- Check browser audio permissions
- Ensure volume is not muted
- Try different voice selection

---

**Ready to test?** 🎙️✨

Visit: **http://localhost:5176/** and click the Settings gear icon!

Your voice AI conversations just got a major upgrade!