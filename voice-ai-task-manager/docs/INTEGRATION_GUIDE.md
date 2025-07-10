# 🔧 Lilly Integration Guide

**Step-by-step guide to complete the Lilly AI system integration.**

## 🎯 **Current Status**

### ✅ **What's Complete**
- **Settings UI** - Beautiful dual-AI model selection
- **System Prompts** - Lilly personality & autonomous agent prompts  
- **Autonomous Agent Service** - Background analysis with real calendar integration
- **Type System** - Complete interfaces for dual AI architecture
- **Documentation** - Architecture and implementation guides

### 🚧 **What Needs Completion**
- **Service API Integration** - Constructor signatures and method calls
- **LillyOrchestrator** - Main coordination service  
- **VoiceTaskManager Integration** - Connect Lilly to chat interface

---

## 🛠️ **Step 1: Fix Service API Issues**

### **Constructor Signature Fixes**

```typescript
// Fix: src/services/AutonomousAgentService.ts
constructor(
  private storageService: StorageService,
  private calendarService: GoogleCalendarService, 
  private aiService: AIService
) {
  // AIService constructor needs UserMemory, not UserPreferences
  // Check aiService.ts constructor signature
}
```

### **Method Call Fixes**

```typescript
// Fix OpenRouterService usage
// Current: openRouterService.sendMessage()
// Correct: openRouterService.generateCompletion()

// Fix AIService usage  
// Current: aiService.processMessage(msg, [], prefs, prompt) // 4 args
// Correct: aiService.processMessage(msg, [], prefs) // 3 args
```

### **Missing StorageService Methods**

```typescript
// Add to src/services/storageService.ts
loadMemory(): UserMemory {
  try {
    const stored = localStorage.getItem(this.MEMORY_KEY);
    if (!stored) {
      const defaultMemory = this.getDefaultMemory();
      this.saveMemory(defaultMemory);
      return defaultMemory;
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load memory:', error);
    return this.getDefaultMemory();
  }
}

saveMemory(memory: UserMemory): void {
  try {
    localStorage.setItem(this.MEMORY_KEY, JSON.stringify(memory));
  } catch (error) {
    console.error('Failed to save memory:', error);
  }
}
```

---

## 🧙‍♀️ **Step 2: Complete LillyOrchestrator**

### **Create Working Implementation**

```typescript
// src/services/LillyOrchestrator.ts
import { getSystemPrompt } from '../config/systemPrompts';
import { AutonomousAgentService } from './AutonomousAgentService';
import { StorageService } from './storageService';
import { GoogleCalendarService } from './googleCalendarService';
import { AIService } from './aiService';
import { OpenRouterService } from './openRouterService';
import { UserPreferences, AIResponse } from '../types';

export class LillyOrchestrator {
  private storageService: StorageService;
  private autonomousAgent: AutonomousAgentService;
  private aiService: AIService;
  private openRouterService: OpenRouterService;
  private calendarService: GoogleCalendarService;

  constructor(preferences: UserPreferences) {
    this.storageService = new StorageService();
    this.calendarService = new GoogleCalendarService();
    
    // Fix: Get UserMemory for AIService constructor
    const userMemory = this.storageService.loadMemory();
    this.aiService = new AIService(userMemory);
    this.openRouterService = new OpenRouterService();
    
    this.autonomousAgent = new AutonomousAgentService(
      this.storageService,
      this.calendarService,
      this.aiService
    );
  }

  async chat(
    message: string,
    isVoiceInput: boolean = false,
    preferences: UserPreferences
  ): Promise<AIResponse> {
    try {
      // Get agent insights
      const agentInsights = this.autonomousAgent.getInsightsForLilly(3);
      
      // Build enhanced system prompt
      const systemPrompt = getSystemPrompt('lilly', {
        agentInsights,
        energyLevel: this.determineEnergyLevel()
      });
      
      // Get model
      const model = preferences.aiSettings.lillyModel || preferences.aiSettings.selectedModel;
      
      // Send to appropriate AI service
      if (preferences.aiSettings.useOpenRouter) {
        return await this.openRouterService.generateCompletion(
          message,
          systemPrompt,
          {
            model,
            temperature: preferences.aiSettings.temperature,
            maxTokens: preferences.aiSettings.maxTokens,
          }
        );
      } else {
        return await this.aiService.processMessage(
          message,
          [], // Recent messages - integrate with conversation system
          preferences
        );
      }
    } catch (error) {
      console.error('Lilly chat error:', error);
      return this.getErrorResponse(error);
    }
  }
  
  private determineEnergyLevel(): 'high' | 'medium' | 'low' {
    const hour = new Date().getHours();
    if (hour >= 8 && hour <= 11) return 'high';
    if (hour >= 12 && hour <= 17) return 'medium';
    return 'low';
  }
  
  private getErrorResponse(error: any): AIResponse {
    return {
      message: "I'm having a moment of technical difficulty, but I'm still here for you. Could you try that again?",
      extractedTasks: [],
      suggestions: [],
      metadata: {
        confidence: 0,
        processingTime: 0,
        intent: 'error',
        service: 'Lilly',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}
```

---

## 🔗 **Step 3: Integrate with VoiceTaskManager**

### **Update Chat Hook**

```typescript
// src/components/VoiceTaskManager.tsx
import { LillyOrchestrator } from '../services/LillyOrchestrator';

export function VoiceTaskManager() {
  // Add Lilly orchestrator
  const [lillyOrchestrator] = useState(() => new LillyOrchestrator(preferences));
  
  // Update sendMessage to use Lilly
  const handleSendMessage = async (content: string, isVoiceInput = false) => {
    try {
      const response = await lillyOrchestrator.chat(content, isVoiceInput, preferences);

      // Auto-speak AI responses if enabled
      if (preferences.autoSpeak && preferences.voiceEnabled) {
        await speak(response.message);
      }
      
      // Handle extracted tasks
      if (response.extractedTasks && response.extractedTasks.length > 0) {
        // Add tasks to task list
        response.extractedTasks.forEach(taskData => {
          // Integrate with existing task creation system
        });
      }
      
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };
}
```

### **Add Lilly Status Indicators**

```typescript
// Add to header section
<div className="flex items-center gap-2">
  <div className="h-2 w-2 bg-purple-500 rounded-full animate-pulse"></div>
  <span className="text-sm text-purple-600 dark:text-purple-400">
    Lilly is {isProcessing ? 'thinking' : 'ready'}
  </span>
</div>

// Show agent insights if urgent
{lillyOrchestrator.hasUrgentInsights() && (
  <div className="flex items-center gap-2 text-orange-600">
    <AlertCircle className="h-4 w-4" />
    <span className="text-sm">Urgent insights available</span>
  </div>
)}
```

---

## 🎨 **Step 4: Enhance UI Integration**

### **Agent Insights Panel**

```typescript
// src/components/AgentInsightsPanel.tsx
export function AgentInsightsPanel({ insights }: { insights: AgentAnalysis[] }) {
  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
      <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
        🤖 Agent Insights
      </h3>
      {insights.map(analysis => (
        <div key={analysis.timestamp} className="mb-2">
          <div className="text-sm font-medium">{analysis.analysisType}</div>
          <div className="text-xs text-blue-700 dark:text-blue-300">
            {analysis.summary}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### **Conversation Stage Indicator**

```typescript
// Show conversation flow stage
<div className="flex items-center gap-2 text-xs">
  <div className={`h-2 w-2 rounded-full ${
    conversationStage === 'rapport-building' ? 'bg-green-500' :
    conversationStage === 'task-analysis' ? 'bg-blue-500' : 'bg-purple-500'
  }`} />
  <span className="capitalize">{conversationStage.replace('-', ' ')}</span>
</div>
```

---

## 🧪 **Step 5: Testing & Validation**

### **Test Scenarios**

1. **Model Selection**
   - Settings → AI tab → Select different models for Lilly vs Agents
   - Verify both selections are saved and used correctly

2. **Agent Background Processing**
   - Check browser console for agent analysis logs
   - Verify calendar integration works (upcoming events)
   - Test task pattern detection with sample data

3. **Lilly Conversation**
   - Chat with various conversation styles (casual, stressed, work-focused)
   - Verify Lilly's personality comes through
   - Check agent insights are naturally integrated

4. **Voice Integration**
   - Test voice input with Lilly responses
   - Verify TTS works with Lilly's conversational style
   - Check celebration notifications work

---

## 🚀 **Step 6: Production Deployment**

### **Environment Setup**

```bash
# backend/.env
DEEPGRAM_API_KEY=your_deepgram_key
GOOGLE_CLIENT_ID=your_google_client_id  
GOOGLE_CLIENT_SECRET=your_google_client_secret
OPENROUTER_API_KEY=your_openrouter_key
```

### **Build & Deploy**

```bash
npm run build
docker build -t incantations-lilly .
docker run -p 80:80 incantations-lilly
```

### **Monitoring**

```typescript
// Add logging for Lilly interactions
console.log('[Lilly]', {
  agentInsightsUsed: agentInsights.length,
  conversationStage,
  energyLevel,
  model: model,
  responseTime: processingTime
});
```

---

## 🎯 **Success Criteria**

### **Functional Requirements**
- [x] Dual AI model selection works in settings
- [ ] Lilly responds with personality and context
- [ ] Autonomous agents run background analysis  
- [ ] Agent insights are naturally integrated into conversations
- [ ] Voice integration works seamlessly

### **User Experience Goals**
- [ ] Conversations feel natural and empathetic
- [ ] Users notice Lilly "remembering" patterns
- [ ] Agent insights feel helpful, not robotic
- [ ] Overall experience is more engaging than before

### **Technical Performance**
- [ ] No errors in browser console
- [ ] Response times under 2 seconds
- [ ] Agent analysis runs on schedule
- [ ] Memory and storage work correctly

---

**🧙‍♀️ Once completed, users will have the most sophisticated AI companion experience ever built!** ✨