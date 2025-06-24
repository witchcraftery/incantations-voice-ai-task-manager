import { Task, Message, AIResponse, UserMemory, UserPreferences } from '../types';
import { AIService } from './aiService';
import { OpenRouterService, OpenRouterConfig } from './openRouterService';

export class EnhancedAIService {
  private simulationService: AIService;
  private openRouterService: OpenRouterService | null = null;
  private preferences: UserPreferences;

  constructor(preferences: UserPreferences, userMemory: UserMemory) {
    this.preferences = preferences;
    this.simulationService = new AIService(userMemory);
    
    if (this.preferences.aiSettings.useOpenRouter && this.preferences.aiSettings.openRouterApiKey) {
      this.initializeOpenRouter();
    }
  }

  private initializeOpenRouter(): void {
    if (!this.preferences.aiSettings.openRouterApiKey) {
      console.warn('OpenRouter API key not provided');
      return;
    }

    const config: OpenRouterConfig = {
      apiKey: this.preferences.aiSettings.openRouterApiKey,
      baseUrl: 'https://openrouter.ai/api/v1',
      selectedModel: this.preferences.aiSettings.selectedModel,
      temperature: this.preferences.aiSettings.temperature,
      maxTokens: this.preferences.aiSettings.maxTokens,
      systemPrompt: this.preferences.aiSettings.systemPrompt
    };

    this.openRouterService = new OpenRouterService(config);
  }

  async processMessage(
    userInput: string,
    conversationHistory: Message[],
    userMemory: UserMemory
  ): Promise<AIResponse> {
    // Use OpenRouter if enabled and configured
    if (this.preferences.aiSettings.useOpenRouter && 
        this.openRouterService && 
        this.preferences.aiSettings.selectedModel !== 'simulation') {
      
      try {
        const response = await this.openRouterService.processMessage(
          userInput, 
          conversationHistory, 
          userMemory
        );
        
        // Add enhancement metadata
        response.metadata = {
          ...response.metadata,
          service: 'openrouter',
          model: this.preferences.aiSettings.selectedModel,
          enhanced: true
        };
        
        return response;
      } catch (error) {
        console.error('OpenRouter service failed, falling back to simulation:', error);
        // Fall back to simulation service
      }
    }

    // Use simulation service as default/fallback
    const response = await this.simulationService.processMessage(userInput, conversationHistory);
    response.metadata = {
      ...response.metadata,
      service: 'simulation',
      model: 'local-simulation',
      enhanced: false
    };
    
    return response;
  }

  async getAvailableModels() {
    if (this.openRouterService) {
      try {
        return await this.openRouterService.getAvailableModels();
      } catch (error) {
        console.error('Failed to fetch OpenRouter models:', error);
      }
    }
    
    return [
      {
        id: 'simulation',
        name: 'Local Simulation',
        description: 'Built-in task extraction simulation (Free)',
        pricing: { prompt: 0, completion: 0 },
        context_length: 4000,
        architecture: { modality: 'text', tokenizer: 'local' },
        top_provider: { is_moderated: false }
      }
    ];
  }

  async testConnection(): Promise<{ success: boolean; service: string; error?: string }> {
    if (this.preferences.aiSettings.useOpenRouter && this.openRouterService) {
      try {
        const success = await this.openRouterService.testConnection();
        return { 
          success, 
          service: 'openrouter',
          error: success ? undefined : 'Failed to connect to OpenRouter API' 
        };
      } catch (error) {
        return { 
          success: false, 
          service: 'openrouter', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    }
    
    // Simulation service is always available
    return { success: true, service: 'simulation' };
  }

  updatePreferences(newPreferences: UserPreferences): void {
    this.preferences = newPreferences;
    
    // Reinitialize OpenRouter if settings changed
    if (this.preferences.aiSettings.useOpenRouter && this.preferences.aiSettings.openRouterApiKey) {
      this.initializeOpenRouter();
    } else {
      this.openRouterService = null;
    }
  }

  getCurrentService(): 'simulation' | 'openrouter' {
    return (this.preferences.aiSettings.useOpenRouter && 
            this.openRouterService && 
            this.preferences.aiSettings.selectedModel !== 'simulation') 
      ? 'openrouter' 
      : 'simulation';
  }

  getServiceInfo(): {
    current: string;
    model: string;
    enhanced: boolean;
    connected: boolean;
  } {
    const current = this.getCurrentService();
    return {
      current,
      model: current === 'openrouter' 
        ? this.preferences.aiSettings.selectedModel 
        : 'local-simulation',
      enhanced: current === 'openrouter',
      connected: this.openRouterService !== null
    };
  }
}
