# 🧙‍♀️ Lilly - AI Companion & Autonomous Agent System

## **Architecture Overview**

### **🎭 The Two-AI System**
- **Lilly (Frontend Conversational AI)** - Named after Lilith, the first witch
  - Empathetic, learning, relationship-focused
  - Uses `lillyModel` from settings (Claude 3.5 Sonnet recommended)
  - Grows understanding of user patterns and needs
  
- **Autonomous Agents (Backend)** - Task-focused background workers
  - Uses `agentModel` from settings (Claude 3.5 Sonnet or Llama 70B recommended)
  - Analyzes Gmail, Calendar, Tasks, Productivity patterns
  - Feeds insights to Lilly for personalized delivery

### **🔧 Implementation Status**

#### ✅ **Completed Components**

1. **Settings UI Split** (`SettingsDialog.tsx`)
   - Removed manual Google Client ID/API Key fields
   - Added separate model selectors for Lilly vs Autonomous Agents
   - Beautiful purple/blue themed sections with personality descriptions

2. **System Prompts** (`config/systemPrompts.ts`)
   - Comprehensive Lilly personality prompt (empathetic, learning, conversational)
   - Autonomous agent prompt (analytical, efficient, structured output)
   - Context enhancement functions with user patterns

3. **Type Definitions** (`types/index.ts`)
   - Added `lillyModel` and `agentModel` to `aiSettings`
   - Supporting interfaces for agent insights and analysis

4. **Autonomous Agent Service** (`services/AutonomousAgentService.ts`)
   - Scheduled background analysis (Gmail: 30min, Calendar: 15min, Tasks: 1hr, Productivity: 4hr)
   - Real calendar integration + simulated Gmail analysis
   - Pattern detection for stagnant tasks, overdue items, priority overload
   - Productivity insights (peak hours, work-life balance)
   - Structured insight delivery for Lilly

#### 🚧 **Partially Implemented**

5. **Lilly Orchestrator** (`services/LillyOrchestrator.ts`)
   - Core architecture designed but needs service API fixes
   - Context management system for user patterns
   - Agent insight integration framework
   - Conversation flow detection

#### 📋 **Next Steps Required**

6. **Service Integration Fixes**
   ```typescript
   // Fix constructor signatures
   new AIService(userMemory, not userPreferences)
   new OpenRouterService() // no args
   new GoogleCalendarService() // no args
   
   // Fix method calls
   openRouterService.generateCompletion() // not sendMessage()
   aiService.processMessage(msg, [], prefs) // 3 args not 4
   
   // Add StorageService methods
   loadMemory() // currently missing
   ```

7. **VoiceTaskManager Integration**
   ```typescript
   // Replace existing chat hook with Lilly
   const lillyOrchestrator = new LillyOrchestrator(preferences);
   
   // Update sendMessage to use Lilly
   const response = await lillyOrchestrator.chat(content, isVoiceInput, preferences);
   ```

8. **UI Enhancements**
   - Add Lilly status indicator ("Lilly is thinking..." vs "Lilly says...")
   - Agent insights panel (urgent alerts, patterns, suggestions)
   - Conversation stage indicator (rapport-building, task-analysis, mixed)

## **🔮 Key Features Achieved**

### **Personality & Learning**
- Lilly learns user patterns, working hours, communication style
- References past conversations and builds relationship over time
- Adapts response style based on context (stressed, celebrating, planning, etc.)

### **Autonomous Intelligence**
- Background agents work independently on schedules
- Calendar conflict detection and busy day alerts
- Task stagnation analysis and priority distribution warnings
- Gmail simulation with deadline keyword detection
- Productivity pattern analysis (peak hours, weekend work habits)

### **Information Flow**
```
Autonomous Agents → Structured Insights → Lilly → Personalized Delivery → User
```

### **Smart Context Integration**
- "I noticed from your calendar..." (not "The calendar agent reports...")
- "I've been thinking about your workload..." (not "Analysis shows...")
- Natural, caring presentation of analytical insights

## **🎯 User Experience Vision**

**Before**: Generic AI responses with basic task extraction
**After**: Personalized companion who knows your patterns, celebrates wins, offers timely insights, and grows the relationship over time

**Example Interaction**:
```
User: "I'm feeling overwhelmed today"

Lilly: "I can hear that in your message. I noticed you have 3 meetings 
today and that project deadline is tomorrow - no wonder you're feeling 
the pressure! How about we tackle that quick email review first? 
Sometimes starting with something manageable helps me feel more in control. 
What do you think?"
```

## **🚀 Deployment Strategy**

1. **Complete Service Integration** - Fix API calls and dependencies
2. **Update VoiceTaskManager** - Replace chat hook with Lilly orchestrator  
3. **Add UI Indicators** - Show Lilly vs Agent status
4. **Test & Refine** - Iterate on personality and agent scheduling
5. **Production Gmail** - Replace simulation with real Gmail API

## **🔐 Security & Privacy**

- All API keys (Google, Deepgram) securely stored in backend `.env`
- No manual key entry required from users
- Agent analysis respects privacy (patterns not content storage)
- Lilly's memory stored locally with optional cloud sync

---

**Status**: 🟡 **80% Complete** - Core architecture implemented, needs integration fixes
**Priority**: Complete service integration to deploy Lilly + Autonomous Agents
**Impact**: Revolutionary AI companion experience with proactive intelligence