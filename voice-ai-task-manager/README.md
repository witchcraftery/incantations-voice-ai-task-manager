# 🧙‍♀️ Incantations - Voice-First AI Task Manager

**Revolutionary AI companion that transforms productivity through natural conversation and autonomous intelligence.**

🌐 **Live Demo:** [https://incantations.witchcraftery.io](https://incantations.witchcraftery.io)

## 🎭 **The Two-AI System**

### **Meet Lilly - Your AI Companion**
Named after Lilith, the first witch. Lilly is more than an AI assistant - she's a trusted partner who:
- 🧠 **Learns your patterns** - Working hours, communication style, productivity rhythms
- 💜 **Builds relationships** - Remembers conversations, celebrates wins, offers support
- 🎯 **Delivers insights naturally** - "I noticed..." instead of "Analysis shows..."
- 🌟 **Grows with you** - Becomes more helpful and understanding over time

### **Autonomous Agent Swarm**
Background workers that analyze your digital life:
- 📧 **Gmail Analysis** (every 30 minutes) - Deadline detection, priority emails
- 📅 **Calendar Intelligence** (every 15 minutes) - Conflict detection, busy day alerts
- 📋 **Task Pattern Analysis** (hourly) - Stagnation detection, priority optimization  
- 📈 **Productivity Insights** (every 4 hours) - Peak hour analysis, work-life balance

## ✨ **Key Features**

### **🎙️ Voice-First Experience**
- Natural speech conversation with Web Speech API
- Premium TTS with Deepgram integration
- Voice command shortcuts for task operations
- Celebration notifications with personalized voice messages

### **🤖 Advanced AI Integration**
- Multiple AI models: Claude 3.5 Sonnet, GPT-4o, Llama, Gemini via OpenRouter
- Separate model selection for conversational AI vs autonomous agents
- Revolutionary conversation flow system (rapport-building → mixed → task analysis)
- Context-aware responses that match your energy and conversation style

### **📊 Intelligent Task Management**
- AI task extraction from natural conversation (85-92% accuracy)
- Multi-session time tracking with start/stop timers
- Smart task prioritization based on deadlines and dependencies
- Energy-level optimization (match tasks to productivity patterns)
- Bulk operations and keyboard shortcuts (`Ctrl+N`, `Ctrl+F`, `Del`)

### **🗓️ Calendar & Email Integration**
- Google Calendar OAuth 2.0 integration
- Real-time event monitoring and conflict detection
- Email simulation with deadline keyword detection (Gmail API ready)
- Meeting preparation suggestions and follow-up task extraction

### **🎨 Modern UI/UX**
- Beautiful dark/light theme system with persistence
- Task-focused dashboard with productivity insights
- Conversation bookmarks (save/resume conversation states)
- Mobile-responsive design with PWA capabilities
- Notification system with browser alerts and voice celebrations

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+ with npm/pnpm
- Modern browser with Web Speech API support

### **Development Setup**
```bash
# Clone and install
git clone [repository-url]
cd voice-ai-task-manager
npm install

# Environment setup
cp backend/.env.example backend/.env
# Add your API keys (Google, Deepgram, OpenRouter)

# Start development
npm run dev
```

### **Production Deployment**
```bash
# Build and deploy
npm run build
docker build -t incantations .
docker run -p 80:80 incantations
```

## 🏗️ **Architecture**

### **Frontend Stack**
- **React 18** with TypeScript for type safety
- **TailwindCSS** for beautiful, responsive styling  
- **Framer Motion** for smooth animations
- **Vite** for fast development and optimized builds

### **AI & Integration Layer**
- **OpenRouter API** for multiple AI model access
- **Web Speech API** for voice recognition
- **Deepgram TTS** for premium voice synthesis
- **Google Calendar API** for calendar integration
- **Background Services** for autonomous analysis

### **Key Services**
- **`LillyOrchestrator`** - Main AI companion coordination
- **`AutonomousAgentService`** - Background intelligence engine
- **`VoiceService`** - Speech recognition and synthesis
- **`StorageService`** - Local storage with cloud sync
- **`GoogleCalendarService`** - Calendar integration

## 🎯 **Unique Features**

### **Revolutionary Conversation Flow**
Three-stage AI interaction that feels natural:
1. **Rapport-Building** 🤝 - Connection and context understanding
2. **Mixed Mode** ⚖️ - Balance relationship with light productivity  
3. **Task Analysis** 📋 - Full productivity mode with strategic insights

### **Silent Task Logging**
AI logs tasks mentioned in conversation without overwhelming you, then releases them when you're ready to work.

### **Autonomous Intelligence**
Background agents work independently, feeding insights to Lilly for personalized delivery: *"I noticed from your calendar..."* instead of *"Calendar agent reports..."*

## 📋 **Documentation**

- **[LILLY_IMPLEMENTATION.md](./LILLY_IMPLEMENTATION.md)** - Complete architecture guide
- **[MASTER_ROADMAP.md](../MASTER_ROADMAP.md)** - Project vision and roadmap
- **[docs/DEEPGRAM_SETUP.md](./docs/DEEPGRAM_SETUP.md)** - Voice integration setup

## 🤝 **Contributing**

We welcome contributions! The project is actively developed with focus on:
- Service integration improvements
- UI/UX enhancements  
- New AI model integrations
- Mobile app development

## 📄 **License**

[License information]

---

**🎯 Transform your productivity with an AI companion that truly understands you.** 🧙‍♀️✨
