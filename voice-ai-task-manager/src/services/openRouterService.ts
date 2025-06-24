import { Task, Message, AIResponse, UserMemory } from '../types';

export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  pricing: {
    prompt: number;
    completion: number;
  };
  context_length: number;
  architecture: {
    modality: string;
    tokenizer: string;
    instruct_type?: string;
  };
  top_provider: {
    max_completion_tokens?: number;
    is_moderated: boolean;
  };
  per_request_limits?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

export interface OpenRouterConfig {
  apiKey: string;
  baseUrl: string;
  selectedModel: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
}

export class OpenRouterService {
  private config: OpenRouterConfig;
  private availableModels: OpenRouterModel[] = [];

  constructor(config: OpenRouterConfig) {
    this.config = {
      baseUrl: 'https://openrouter.ai/api/v1',
      ...config
    };
  }

  async getAvailableModels(): Promise<OpenRouterModel[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = await response.json();
      this.availableModels = data.data || [];
      
      // Filter and sort for task management relevant models
      return this.availableModels
        .filter(model => 
          model.architecture.modality === 'text' && 
          model.context_length >= 4000 // Minimum context for task management
        )
        .sort((a, b) => {
          // Prioritize models good for task management
          const taskModels = [
            'anthropic/claude-3', 'openai/gpt-4', 'openai/gpt-3.5',
            'meta-llama/llama-3', 'google/gemini', 'cohere/command'
          ];
          
          const aScore = taskModels.some(prefix => a.id.includes(prefix)) ? 1 : 0;
          const bScore = taskModels.some(prefix => b.id.includes(prefix)) ? 1 : 0;
          
          if (aScore !== bScore) return bScore - aScore;
          return a.name.localeCompare(b.name);
        });
    } catch (error) {
      console.error('Error fetching OpenRouter models:', error);
      return [];
    }
  }

  async processMessage(
    userInput: string,
    conversationHistory: Message[],
    userMemory: UserMemory
  ): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      const systemPrompt = this.buildSystemPrompt(userMemory);
      const messages = this.buildMessages(systemPrompt, conversationHistory, userInput);

      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Incantations AI Task Manager'
        },
        body: JSON.stringify({
          model: this.config.selectedModel,
          messages,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.statusText}`);
      }

      const data = await response.json();
      const aiMessage = data.choices[0]?.message?.content || 'I apologize, but I encountered an error processing your request.';

      // Extract tasks from the response
      const extractedTasks = this.extractTasks(userInput, aiMessage);
      const suggestions = this.generateSuggestions(userInput);
      const intent = this.detectIntent(userInput);

      const processingTime = Date.now() - startTime;

      return {
        message: aiMessage,
        extractedTasks,
        suggestions,
        metadata: {
          confidence: this.calculateConfidence(userInput, extractedTasks),
          processingTime,
          intent,
          model: this.config.selectedModel,
          tokensUsed: data.usage?.total_tokens || 0
        }
      };

    } catch (error) {
      console.error('OpenRouter processing error:', error);
      
      return {
        message: "I'm having trouble connecting to the AI service right now. Please try again in a moment.",
        extractedTasks: [],
        suggestions: ['Check your internet connection', 'Try again in a few moments'],
        metadata: {
          confidence: 0,
          processingTime: Date.now() - startTime,
          intent: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  private buildSystemPrompt(userMemory: UserMemory): string {
    const customPrompt = this.config.systemPrompt;
    
    const basePrompt = `You are an intelligent task management assistant. Your primary role is to help users organize their work and life through natural conversation.

CORE RESPONSIBILITIES:
1. Extract actionable tasks from user conversations
2. Provide helpful, encouraging responses about productivity
3. Remember user patterns and preferences
4. Suggest optimizations for their workflow

TASK EXTRACTION GUIDELINES:
- Look for action items, deadlines, commitments, and goals
- Identify priority levels based on urgency words
- Extract due dates from temporal references
- Create clear, actionable task titles

USER CONTEXT:
- Preferred working hours: ${userMemory.workPatterns.preferredWorkingHours.join(' - ')}
- Common projects: ${userMemory.workPatterns.commonProjects.join(', ')}
- Communication style: ${userMemory.learningData.communicationStyle || 'Professional yet friendly'}

RESPONSE STYLE: Be encouraging, practical, and focused on helping them achieve their goals.`;

    return customPrompt ? `${customPrompt}\n\n${basePrompt}` : basePrompt;
  }
  private buildMessages(systemPrompt: string, history: Message[], newInput: string) {
    const messages = [{ role: 'system', content: systemPrompt }];
    
    // Add recent conversation history (last 10 messages)
    const recentHistory = history.slice(-10);
    recentHistory.forEach(msg => {
      messages.push({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });

    // Add current user input
    messages.push({ role: 'user', content: newInput });

    return messages;
  }

  private extractTasks(userInput: string, aiResponse: string): Partial<Task>[] {
    const tasks: Partial<Task>[] = [];
    
    // Enhanced task extraction patterns
    const taskPatterns = [
      /(?:i need to|have to|should|must|want to|plan to)\s+([^.!?]+)/gi,
      /(?:remind me to|don't forget to|make sure to)\s+([^.!?]+)/gi,
      /(?:deadline|due|finish|complete)\s+([^.!?]+)/gi,
      /(?:schedule|book|arrange)\s+([^.!?]+)/gi,
    ];

    taskPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(userInput)) !== null) {
        const taskText = match[1].trim();
        if (taskText.length > 3) {
          tasks.push({
            title: this.cleanTaskTitle(taskText),
            description: `Extracted from: "${userInput.substring(match.index, match.index + 50)}..."`,
            priority: this.determinePriority(userInput),
            status: 'pending',
            tags: this.extractTags(userInput),
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    });

    return tasks;
  }

  private cleanTaskTitle(title: string): string {
    return title
      .replace(/^(to\s+)?/, '') // Remove leading "to"
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
  }

  private determinePriority(input: string): 'low' | 'medium' | 'high' | 'urgent' {
    const urgentWords = ['urgent', 'asap', 'immediately', 'critical', 'emergency'];
    const highWords = ['important', 'priority', 'deadline', 'soon'];
    const lowWords = ['sometime', 'eventually', 'when possible', 'maybe'];

    const lowerInput = input.toLowerCase();
    
    if (urgentWords.some(word => lowerInput.includes(word))) return 'urgent';
    if (highWords.some(word => lowerInput.includes(word))) return 'high';
    if (lowWords.some(word => lowerInput.includes(word))) return 'low';
    
    return 'medium';
  }

  private extractTags(input: string): string[] {
    const tags: string[] = [];
    
    // Common project tags
    const projectWords = ['work', 'personal', 'health', 'learning', 'finance', 'home'];
    projectWords.forEach(word => {
      if (input.toLowerCase().includes(word)) {
        tags.push(word);
      }
    });

    return tags;
  }

  private generateSuggestions(userInput: string): string[] {
    const suggestions = [
      "Break this down into smaller tasks",
      "Set a specific deadline for better focus",
      "Consider the priority level of this task"
    ];

    // Add contextual suggestions based on input
    if (userInput.toLowerCase().includes('meeting')) {
      suggestions.push("Don't forget to send calendar invites");
    }
    
    if (userInput.toLowerCase().includes('email')) {
      suggestions.push("Draft the email first to save time");
    }

    return suggestions.slice(0, 3);
  }

  private detectIntent(input: string): string {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('schedule') || lowerInput.includes('plan')) return 'scheduling';
    if (lowerInput.includes('remind') || lowerInput.includes('remember')) return 'reminder';
    if (lowerInput.includes('complete') || lowerInput.includes('done')) return 'completion';
    if (lowerInput.includes('help') || lowerInput.includes('how')) return 'help_request';
    
    return 'task_creation';
  }

  private calculateConfidence(input: string, tasks: Partial<Task>[]): number {
    // Base confidence on task extraction success and input clarity
    const baseConfidence = 0.7;
    const taskBonus = Math.min(tasks.length * 0.1, 0.3);
    const lengthPenalty = input.length < 10 ? -0.2 : 0;
    
    return Math.max(0, Math.min(1, baseConfidence + taskBonus + lengthPenalty));
  }

  // Update configuration
  updateConfig(newConfig: Partial<OpenRouterConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current configuration
  getConfig(): OpenRouterConfig {
    return { ...this.config };
  }

  // Test API connection
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('OpenRouter connection test failed:', error);
      return false;
    }
  }
}
