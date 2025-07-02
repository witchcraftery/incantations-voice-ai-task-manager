import { Task, Conversation, Project, UserPreferences, UserMemory, TaskTemplate } from '../types';
import { SampleDataService } from './sampleDataService';

export class StorageService {
  private readonly TASKS_KEY = 'voice_task_manager_tasks';
  private readonly CONVERSATIONS_KEY = 'voice_task_manager_conversations';
  private readonly PROJECTS_KEY = 'voice_task_manager_projects';
  private readonly PREFERENCES_KEY = 'voice_task_manager_preferences';
  private readonly MEMORY_KEY = 'voice_task_manager_memory';
  private readonly TEMPLATES_KEY = 'voice_task_manager_templates';

  // Tasks
  saveTasks(tasks: Task[]): void {
    try {
      localStorage.setItem(this.TASKS_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Failed to save tasks:', error);
    }
  }

  loadTasks(): Task[] {
    try {
      const stored = localStorage.getItem(this.TASKS_KEY);
      if (!stored) {
        // Initialize with sample data if no tasks exist
        const sampleData = SampleDataService.generateSampleData();
        this.saveTasks(sampleData.tasks);
        return sampleData.tasks;
      }
      
      const tasks = JSON.parse(stored);
      return tasks.map((task: any) => ({
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        startedAt: task.startedAt ? new Date(task.startedAt) : undefined,
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
        currentSessionStart: task.currentSessionStart ? new Date(task.currentSessionStart) : undefined,
        // Migrate to new time tracking system
        timeEntries: task.timeEntries || [],
        totalTimeSpent: task.totalTimeSpent || 0,
        isActiveTimer: task.isActiveTimer || false
      }));
    } catch (error) {
      console.error('Failed to load tasks:', error);
      return [];
    }
  }

  // Conversations
  saveConversations(conversations: Conversation[]): void {
    try {
      localStorage.setItem(this.CONVERSATIONS_KEY, JSON.stringify(conversations));
    } catch (error) {
      console.error('Failed to save conversations:', error);
    }
  }

  loadConversations(): Conversation[] {
    try {
      const stored = localStorage.getItem(this.CONVERSATIONS_KEY);
      if (!stored) {
        // Initialize with sample data if no conversations exist
        const sampleData = SampleDataService.generateSampleData();
        this.saveConversations(sampleData.conversations);
        return sampleData.conversations;
      }
      
      const conversations = JSON.parse(stored);
      return conversations.map((conv: any) => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        messages: conv.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
    } catch (error) {
      console.error('Failed to load conversations:', error);
      return [];
    }
  }

  // Projects
  saveProjects(projects: Project[]): void {
    try {
      localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(projects));
    } catch (error) {
      console.error('Failed to save projects:', error);
    }
  }

  loadProjects(): Project[] {
    try {
      const stored = localStorage.getItem(this.PROJECTS_KEY);
      if (!stored) {
        // Initialize with sample data if no projects exist
        const sampleData = SampleDataService.generateSampleData();
        this.saveProjects(sampleData.projects);
        return sampleData.projects;
      }
      
      const projects = JSON.parse(stored);
      return projects.map((project: any) => ({
        ...project,
        createdAt: new Date(project.createdAt)
      }));
    } catch (error) {
      console.error('Failed to load projects:', error);
      return [];
    }
  }

  // User Preferences
  savePreferences(preferences: UserPreferences): void {
    try {
      localStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }

  loadPreferences(): UserPreferences {
    try {
      const stored = localStorage.getItem(this.PREFERENCES_KEY);
      if (!stored) return this.getDefaultPreferences();
      
      const defaultPrefs = this.getDefaultPreferences();
      const storedPrefs = JSON.parse(stored);
      
      // Deep merge to ensure all nested properties are preserved
      return {
        ...defaultPrefs,
        ...storedPrefs,
        aiSettings: {
          ...defaultPrefs.aiSettings,
          ...storedPrefs.aiSettings
        },
        voiceSettings: {
          ...defaultPrefs.voiceSettings,
          ...storedPrefs.voiceSettings
        },
        notificationSettings: {
          ...defaultPrefs.notificationSettings,
          ...storedPrefs.notificationSettings
        },
        googleIntegration: {
          ...defaultPrefs.googleIntegration,
          ...storedPrefs.googleIntegration
        }
      };
    } catch (error) {
      console.error('Failed to load preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  // User Memory
  saveUserMemory(memory: UserMemory): void {
    try {
      localStorage.setItem(this.MEMORY_KEY, JSON.stringify(memory));
    } catch (error) {
      console.error('Failed to save user memory:', error);
    }
  }

  loadUserMemory(): UserMemory {
    try {
      const stored = localStorage.getItem(this.MEMORY_KEY);
      if (!stored) {
        // Initialize with sample data if no memory exists
        const sampleData = SampleDataService.generateSampleData();
        this.saveUserMemory(sampleData.userMemory);
        return sampleData.userMemory;
      }
      
      const memory = JSON.parse(stored);
      return {
        ...this.getDefaultMemory(),
        ...memory,
        learningData: {
          ...this.getDefaultMemory().learningData,
          ...memory.learningData,
          feedbackHistory: memory.learningData?.feedbackHistory?.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp)
          })) || []
        }
      };
    } catch (error) {
      console.error('Failed to load user memory:', error);
      return this.getDefaultMemory();
    }
  }

  // Default values
  private getDefaultPreferences(): UserPreferences {
    return {
      voiceEnabled: true,
      autoSpeak: true,
      theme: 'system',
      language: 'en-US',
      voiceSettings: {
        rate: 1.0,
        pitch: 1.0,
        volume: 0.8,
        useDeepgram: true,
        deepgramVoice: 'aura-asteria-en',
        voice: undefined,
        microphoneId: undefined
      },
      aiSettings: {
        responseStyle: 'friendly',
        taskExtractionSensitivity: 'medium',
        systemPrompt: '', // Add default empty system prompt
        useOpenRouter: false,
        openRouterApiKey: '',
        selectedModel: 'simulation',
        temperature: 0.7,
        maxTokens: 1000
      },
      notificationSettings: {
        enabled: false,
        dailyAgenda: true,
        taskReminders: true,
        celebrateCompletions: true,
        smartSuggestions: true
      },
      googleIntegration: {
        enabled: false,
        calendarEnabled: true,
        gmailEnabled: true,
        autoExtractTasks: true
      }
    };
  }

  private getDefaultMemory(): UserMemory {
    return {
      workPatterns: {
        preferredWorkingHours: ['9:00', '17:00'],
        commonProjects: ['Personal', 'Work', 'Learning'],
        frequentTasks: []
      },
      contextualInfo: {
        currentProjects: [],
        recentTopics: [],
        preferences: {}
      },
      learningData: {
        taskCompletionPatterns: {},
        communicationStyle: 'professional',
        feedbackHistory: []
      },
      conversationFlow: {
        stageHistory: [],
        currentStage: {
          stage: 'rapport-building',
          confidence: 0.8,
          messageCount: 0,
          userEnergyLevel: 'medium',
          topicFocus: 'casual',
          lastStageChange: new Date()
        },
        triggerPhrases: {
          taskAnalysis: ['that\'s all', 'add to my task list', 'add those to my tasks', 'create those tasks', 'let\'s get to work'],
          completion: ['thanks', 'thank you', 'that helps', 'sounds good', 'perfect']
        },
        silentTasks: [],
        sessionStartTime: new Date()
      }
    };
  }

  // Task Templates
  saveTaskTemplates(templates: TaskTemplate[]): void {
    try {
      localStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(templates));
    } catch (error) {
      console.error('Failed to save task templates:', error);
    }
  }

  loadTaskTemplates(): TaskTemplate[] {
    try {
      const stored = localStorage.getItem(this.TEMPLATES_KEY);
      if (!stored) {
        // Initialize with default templates
        const defaultTemplates = this.getDefaultTemplates();
        this.saveTaskTemplates(defaultTemplates);
        return defaultTemplates;
      }
      
      const templates = JSON.parse(stored);
      return templates.map((template: any) => ({
        ...template,
        createdAt: new Date(template.createdAt),
        updatedAt: new Date(template.updatedAt)
      }));
    } catch (error) {
      console.error('Failed to load task templates:', error);
      return this.getDefaultTemplates();
    }
  }

  private getDefaultTemplates(): TaskTemplate[] {
    const now = new Date();
    return [
      {
        id: 'template-1',
        name: 'Meeting Follow-up',
        description: 'Task for following up on meeting action items',
        title: 'Follow up on [Meeting Name]',
        taskDescription: 'Review meeting notes and complete assigned action items',
        priority: 'medium' as const,
        project: 'Meetings',
        tags: ['meeting', 'follow-up'],
        estimatedDuration: 30,
        isDefault: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'template-2',
        name: 'Code Review',
        description: 'Task for conducting code reviews',
        title: 'Review PR: [PR Title]',
        taskDescription: 'Review code changes, provide feedback, and approve if ready',
        priority: 'high' as const,
        project: 'Development',
        tags: ['code-review', 'development'],
        estimatedDuration: 45,
        isDefault: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'template-3',
        name: 'Research Task',
        description: 'General research and investigation task',
        title: 'Research [Topic]',
        taskDescription: 'Gather information and analyze findings on the specified topic',
        priority: 'medium' as const,
        tags: ['research', 'investigation'],
        estimatedDuration: 60,
        isDefault: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'template-4',
        name: 'Bug Fix',
        description: 'Task for fixing software bugs',
        title: 'Fix: [Bug Description]',
        taskDescription: 'Investigate, reproduce, and fix the reported bug',
        priority: 'high' as const,
        project: 'Development',
        tags: ['bug', 'fix', 'development'],
        estimatedDuration: 90,
        isDefault: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'template-5',
        name: 'Weekly Planning',
        description: 'Weekly planning and goal setting',
        title: 'Weekly Planning - [Week of Date]',
        taskDescription: 'Review previous week, set priorities, and plan upcoming week',
        priority: 'medium' as const,
        project: 'Planning',
        tags: ['planning', 'weekly', 'goals'],
        estimatedDuration: 45,
        isDefault: true,
        createdAt: now,
        updatedAt: now
      }
    ];
  }

  // Utility methods
  clearAllData(): void {
    try {
      localStorage.removeItem(this.TASKS_KEY);
      localStorage.removeItem(this.CONVERSATIONS_KEY);
      localStorage.removeItem(this.PROJECTS_KEY);
      localStorage.removeItem(this.PREFERENCES_KEY);
      localStorage.removeItem(this.MEMORY_KEY);
      localStorage.removeItem(this.TEMPLATES_KEY);
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }

  exportData(): any {
    return {
      tasks: this.loadTasks(),
      conversations: this.loadConversations(),
      projects: this.loadProjects(),
      preferences: this.loadPreferences(),
      memory: this.loadUserMemory(),
      templates: this.loadTaskTemplates(),
      exportDate: new Date().toISOString()
    };
  }

  importData(data: any): boolean {
    try {
      if (data.tasks) this.saveTasks(data.tasks);
      if (data.conversations) this.saveConversations(data.conversations);
      if (data.projects) this.saveProjects(data.projects);
      if (data.preferences) this.savePreferences(data.preferences);
      if (data.memory) this.saveUserMemory(data.memory);
      if (data.templates) this.saveTaskTemplates(data.templates);
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  getStorageInfo(): { used: number; available: number; percentage: number } {
    try {
      const testKey = 'storage_test';
      let used = 0;
      
      // Calculate used space
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }

      // Test available space (rough estimate)
      let available = 0;
      try {
        const testData = '0'.repeat(1024); // 1KB test
        while (true) {
          localStorage.setItem(testKey, testData.repeat(available + 1));
          available += 1024;
        }
      } catch {
        localStorage.removeItem(testKey);
      }

      const total = used + available;
      const percentage = total > 0 ? (used / total) * 100 : 0;

      return { used, available, percentage };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { used: 0, available: 0, percentage: 0 };
    }
  }
}
