export interface TimeEntry {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
}

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
  estimatedMinutes?: number; // AI-estimated completion time
  actualMinutes?: number; // Legacy: total time from first start to completion
  startedAt?: Date; // Legacy: when task was first started
  completedAt?: Date; // When task was completed
  // New multi-session time tracking
  timeEntries: TimeEntry[];
  totalTimeSpent: number; // calculated from all time entries
  isActiveTimer?: boolean; // currently being timed
  currentSessionStart?: Date; // for active session
}

export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  title: string;
  taskDescription?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  project?: string;
  tags: string[];
  estimatedDuration?: number; // in minutes
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
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

export interface ConversationBookmark {
  id: string;
  conversationId: string;
  messageId: string; // Message at which the bookmark was created
  title: string;
  description?: string;
  createdAt: Date;
  tags: string[];
  isStarred: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  summary?: string;
  bookmarks?: ConversationBookmark[];
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
    useDeepgram: boolean;
    deepgramVoice: string;
    microphoneId?: string;
  };
  aiSettings: {
    responseStyle: 'concise' | 'detailed' | 'friendly';
    taskExtractionSensitivity: 'low' | 'medium' | 'high';
    systemPrompt?: string;
    useOpenRouter: boolean;
    openRouterApiKey?: string;
    selectedModel: string;
    temperature: number;
    maxTokens: number;
  };
  notificationSettings: {
    enabled: boolean;
    dailyAgenda: boolean;
    taskReminders: boolean;
    celebrateCompletions: boolean;
    smartSuggestions: boolean;
  };
  googleIntegration: {
    enabled: boolean;
    clientId?: string;
    apiKey?: string;
    calendarEnabled: boolean;
    gmailEnabled: boolean;
    autoExtractTasks: boolean;
  };
}

export interface ConversationStage {
  stage: 'rapport-building' | 'task-analysis' | 'mixed';
  confidence: number;
  messageCount: number;
  lastTaskExtraction?: Date;
  userEnergyLevel: 'high' | 'medium' | 'low';
  topicFocus: 'casual' | 'work' | 'planning';
  lastStageChange?: Date;
}

export interface ConversationFlow {
  stageHistory: ConversationStage[];
  currentStage: ConversationStage;
  triggerPhrases: {
    taskAnalysis: string[];
    completion: string[];
  };
  silentTasks: Partial<Task>[]; // Tasks logged but not discussed yet
  sessionStartTime: Date;
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
  conversationFlow: ConversationFlow;
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
    service?: string;
    model?: string;
    enhanced?: boolean;
    tokensUsed?: number;
    error?: string;
    conversationStage?: 'rapport-building' | 'task-analysis' | 'mixed';
    silentTasksCount?: number;
    energyLevel?: 'high' | 'medium' | 'low';
  };
}

export interface TaskAnalytics {
  id: string;
  taskId: string;
  actualMinutes: number;
  completedAt: Date;
  priority: Task['priority'];
  tags: string[];
  project?: string;
  hourOfDay: number; // 0-23
  dayOfWeek: number; // 0-6 (Sunday=0)
}

export interface ProductivityPattern {
  hourOfDay: number;
  completionRate: number; // 0-1
  avgCompletionTime: number; // minutes
  taskCount: number;
}

export interface EnergyWindow {
  startHour: number;
  endHour: number;
  energyLevel: 'high' | 'medium' | 'low';
  confidence: number;
}

export interface TaskEstimation {
  taskId: string;
  estimatedMinutes: number;
  confidence: number;
  basedOnSimilar: string[]; // Similar task IDs used for estimation
  factors: {
    priority: number;
    complexity: number;
    projectFamiliarity: number;
    tagSimilarity: number;
  };
}
