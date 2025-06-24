import { Task, Conversation, Project, UserPreferences, UserMemory } from '../types';
import { SampleDataService } from './sampleDataService';

export class StorageService {
  private readonly TASKS_KEY = 'voice_task_manager_tasks';
  private readonly CONVERSATIONS_KEY = 'voice_task_manager_conversations';
  private readonly PROJECTS_KEY = 'voice_task_manager_projects';
  private readonly PREFERENCES_KEY = 'voice_task_manager_preferences';
  private readonly MEMORY_KEY = 'voice_task_manager_memory';

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
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined
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
      
      return { ...this.getDefaultPreferences(), ...JSON.parse(stored) };
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
        useKokoro: false,
        kokoroVoice: 'af_bella'
      },
      aiSettings: {
        responseStyle: 'friendly',
        taskExtractionSensitivity: 'medium'
      },
      notificationSettings: {
        enabled: false,
        dailyAgenda: true,
        taskReminders: true,
        celebrateCompletions: true,
        smartSuggestions: true
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
      }
    };
  }

  // Utility methods
  clearAllData(): void {
    try {
      localStorage.removeItem(this.TASKS_KEY);
      localStorage.removeItem(this.CONVERSATIONS_KEY);
      localStorage.removeItem(this.PROJECTS_KEY);
      localStorage.removeItem(this.PREFERENCES_KEY);
      localStorage.removeItem(this.MEMORY_KEY);
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
      for (let key in localStorage) {
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
