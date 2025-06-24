# 🔗 Integration & Connection Guide

## 🎯 **Current Integrations Status**

### **✅ IMPLEMENTED INTEGRATIONS**

**OpenRouter API Integration**
- **Status**: ✅ Fully Implemented
- **API Endpoint**: `https://openrouter.ai/api/v1`
- **Models Supported**: Claude 3.5 Sonnet, GPT-4o, GPT-4o Mini, Llama 3.1 70B, Gemini Pro 1.5
- **Configuration**: Temperature (0.0-1.0), Max Tokens (100-4000), Custom System Prompts
- **Fallback**: Automatic fallback to local simulation if API fails
- **Required**: OpenRouter API Key (get from https://openrouter.ai/keys)

**Browser Notifications API**
- **Status**: ✅ Fully Implemented  
- **Permissions**: Automatic permission request workflow
- **Features**: Task deadlines, overdue alerts, completion celebrations, daily agenda
- **Scheduling**: Smart timing based on user patterns
- **Settings**: Granular on/off controls for each notification type

**Web Speech API**
- **Status**: ✅ Enhanced Implementation
- **Features**: Speech-to-text, text-to-speech with voice selection
- **Voices**: Enhanced with af_aoede, af_jadzia, hf_alpha Kokoro voices
- **Fallback**: Graceful degradation for unsupported browsers

### **🔄 PLANNED INTEGRATIONS (Phase 4)**

**Google Calendar API**
- **Status**: 🚧 Next Priority
- **Features**: Calendar event visibility, meeting context extraction, time blocking
- **Requirements**: Google OAuth 2.0, Calendar API enabled
- **Benefits**: Task-calendar synchronization, conflict detection

**Gmail API**  
- **Status**: 🚧 Next Priority
- **Features**: Email monitoring, task extraction from emails, task-email linking
- **Requirements**: Gmail API access, OAuth 2.0 setup
- **Benefits**: Automatic actionable item detection from inbox

## 🛠️ **Setup Requirements**

### **OpenRouter Integration Setup**
1. **Get API Key**: Visit https://openrouter.ai/keys
2. **Add to Settings**: AI Behavior tab → Enable OpenRouter → Enter API key
3. **Select Model**: Choose from Claude, GPT-4, Llama, or Gemini
4. **Configure**: Set temperature (creativity) and max tokens (response length)
5. **Test**: Status indicator shows connection status

### **Notification Setup**
1. **Enable Permissions**: Settings → Notifications → Enable Notifications button
2. **Configure Types**: Toggle daily agenda, task reminders, celebrations, suggestions
3. **Browser Settings**: Ensure notifications allowed in browser settings
4. **Test**: Complete a task to see celebration notification

### **Voice Setup**
1. **Enable Voice**: Settings → Voice → Voice Features toggle
2. **Select Voice**: Choose between Web Speech API or Kokoro voices
3. **Configure Kokoro**: Enable Kokoro toggle → Select voice (af_aoede, af_jadzia, hf_alpha)
4. **Test**: Use voice test button in settings

## 📊 **API Usage & Costs**

### **OpenRouter Pricing** (Approximate)
- **Claude 3.5 Sonnet**: ~$3/million input tokens, ~$15/million output tokens
- **GPT-4o**: ~$5/million input tokens, ~$15/million output tokens  
- **GPT-4o Mini**: ~$0.15/million input tokens, ~$0.60/million output tokens
- **Llama 3.1 70B**: ~$0.88/million input tokens, ~$0.88/million output tokens
- **Gemini Pro 1.5**: ~$1.25/million input tokens, ~$5/million output tokens

### **Usage Estimates** (Per Day)
- **Light Usage** (10 conversations): $0.01-0.05
- **Medium Usage** (50 conversations): $0.05-0.25  
- **Heavy Usage** (200 conversations): $0.20-1.00

### **Free Tier**
- **Local Simulation**: Unlimited free usage with built-in task extraction
- **Notifications**: Free browser API usage
- **Voice**: Free Web Speech API usage

## 🔐 **Security & Privacy**

### **Data Storage**
- **Local Storage**: All tasks, conversations, and preferences stored locally
- **No Server Storage**: No data transmitted to our servers
- **API Communication**: Only sent to selected AI service (OpenRouter)

### **API Key Security**
- **Local Storage**: API keys stored in browser localStorage only
- **No Transmission**: Keys never sent to our servers
- **User Control**: User can remove/change keys anytime

### **Privacy Features**
- **Offline Mode**: Full functionality without internet (simulation mode)
- **Data Export**: User can export all data anytime
- **Clear Data**: Complete data clearing available in settings

## 🚨 **Troubleshooting**

### **OpenRouter Issues**
- **"Connection Failed"**: Check API key, internet connection, OpenRouter status
- **"Model Not Available"**: Try different model, check OpenRouter model availability
- **"Rate Limited"**: Reduce usage frequency or upgrade OpenRouter plan

### **Notification Issues**
- **No Notifications**: Check browser permissions, notification settings enabled
- **Permission Denied**: Enable in browser settings: Settings → Privacy → Notifications
- **Not Triggering**: Check notification preferences, ensure deadlines set on tasks

### **Voice Issues**
- **No Recognition**: Check microphone permissions, supported browser
- **Kokoro Not Working**: Verify Kokoro server running on localhost:8880
- **Poor Quality**: Adjust microphone settings, reduce background noise

## 🔄 **Coming Soon Integrations**

### **Phase 4: Google Suite**
- **Google Calendar**: Event visibility, meeting prep tasks
- **Gmail**: Email task extraction, priority detection
- **Google Drive**: Document task linking

### **Phase 5: Advanced Automation**
- **Slack/Teams**: Message monitoring, team task coordination
- **GitHub**: Issue/PR task tracking
- **Notion**: Database synchronization

### **Phase 6: AI Agents**
- **Background Monitoring**: 24/7 intelligent task watching
- **Autonomous Execution**: Self-completing simple tasks
- **Predictive Planning**: AI-suggested task scheduling
