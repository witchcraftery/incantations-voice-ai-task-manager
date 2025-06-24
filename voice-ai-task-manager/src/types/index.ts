export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  dueDate?: Date;
  project?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  extractedFrom?: string; // Message ID that created this task
}

export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isVoiceInput?: boolean;
  extractedTasks?: string[]; // Task IDs extracted from this message
  metadata?: {
    confidence?: number;
    processingTime?: number;
  };
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  summary?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  taskIds: string[];
  createdAt: Date;
  isActive: boolean;
}

export interface UserPreferences {
  voiceEnabled: boolean;
  autoSpeak: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
  voiceSettings: {
    rate: number;
    pitch: number;
    volume: number;
    voice?: string;
    useKokoro: boolean;
    kokoroVoice: string;
  };
  aiSettings: {
    responseStyle: 'concise' | 'detailed' | 'friendly';
    taskExtractionSensitivity: 'low' | 'medium' | 'high';
    systemPrompt?: string;
  };
  notificationSettings: {
    enabled: boolean;
    dailyAgenda: boolean;
    taskReminders: boolean;
    celebrateCompletions: boolean;
    smartSuggestions: boolean;
  };
}

export interface UserMemory {
  workPatterns: {
    preferredWorkingHours: string[];
    commonProjects: string[];
    frequentTasks: string[];
  };
  contextualInfo: {
    currentProjects: string[];
    recentTopics: string[];
    preferences: Record<string, any>;
  };
  learningData: {
    taskCompletionPatterns: Record<string, number>;
    communicationStyle: string;
    feedbackHistory: Array<{
      action: string;
      feedback: 'positive' | 'negative';
      timestamp: Date;
    }>;
  };
}

export interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  error?: string;
  transcript: string;
  confidence: number;
}

export interface AIResponse {
  message: string;
  extractedTasks: Partial<Task>[];
  suggestions: string[];
  metadata: {
    confidence: number;
    processingTime: number;
    intent: string;
  };
}
