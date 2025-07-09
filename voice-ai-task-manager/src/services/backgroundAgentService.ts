import { UserPreferences, Task, TaskAnalytics, ProductivityPattern } from '../types';
import { StorageService } from './storageService';
import { AnalyticsService } from './analyticsService';

export class BackgroundAgentService {
  private preferences: UserPreferences;
  private notificationCallback?: (message: string, type: string) => void;
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;
  private storageService: StorageService;
  private analyticsService: AnalyticsService;
  private lastTaskCheck: Date = new Date();
  private checkCount = 0;

  constructor(preferences: UserPreferences) {
    this.preferences = preferences;
    this.storageService = new StorageService();
    this.analyticsService = new AnalyticsService();
  }

  updatePreferences(preferences: UserPreferences) {
    this.preferences = preferences;
  }

  onNotification(callback: (message: string, type: string) => void) {
    this.notificationCallback = callback;
  }

  start(options: {
    enabled: boolean;
    checkInterval: number;
    aggressiveness: string;
  }) {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastTaskCheck = new Date();
    console.log('🤖 BackgroundAgentService: Started monitoring tasks and productivity');

    // Real background monitoring implementation
    this.intervalId = setInterval(() => {
      this.performBackgroundAnalysis(options.aggressiveness);
    }, options.checkInterval);

    // Initial analysis
    this.performBackgroundAnalysis(options.aggressiveness);
  }

  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    console.log('🤖 BackgroundAgentService: Stopped monitoring');
  }

  async performBackgroundAnalysis(aggressiveness: string = 'normal') {
    try {
      this.checkCount++;
      const now = new Date();
      
      console.log(`🤖 BackgroundAgentService: Performing analysis #${this.checkCount}`);

      // Get current tasks and analytics
      const tasks = this.storageService.loadTasks();
      const patterns = this.analyticsService.calculateProductivityPatterns();
      const energyWindows = this.analyticsService.detectEnergyWindows();

      // Run all analysis functions
      await Promise.all([
        this.analyzeTaskStagnation(tasks, now),
        this.analyzeWorkloadBalance(tasks, patterns, now),
        this.analyzeEnergyAlignment(tasks, energyWindows, now),
        this.analyzeUpcomingDeadlines(tasks, now),
        this.analyzeProductivityPatterns(tasks, patterns, now),
        this.checkForLongInactivePeriods(now),
        this.analyzeTaskComplexity(tasks, now, aggressiveness)
      ]);

      this.lastTaskCheck = now;
    } catch (error) {
      console.error('🤖 BackgroundAgentService: Analysis failed:', error);
    }
  }

  private async analyzeTaskStagnation(tasks: Task[], now: Date) {
    const stagnantTasks = tasks.filter(task => {
      if (task.status !== 'in-progress') return false;
      
      const daysSinceUpdate = (now.getTime() - task.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate > 2; // 2+ days without update
    });

    if (stagnantTasks.length > 0) {
      const taskTitles = stagnantTasks.map(t => t.title).join(', ');
      this.notificationCallback?.(
        `You have ${stagnantTasks.length} task${stagnantTasks.length > 1 ? 's' : ''} that haven't been updated in 2+ days: ${taskTitles}. Need help breaking them down?`,
        'coaching'
      );
    }
  }

  private async analyzeWorkloadBalance(tasks: Task[], patterns: ProductivityPattern[], now: Date) {
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const highPriorityTasks = pendingTasks.filter(t => t.priority === 'high' || t.priority === 'urgent');
    
    if (highPriorityTasks.length > 5) {
      this.notificationCallback?.(
        `You have ${highPriorityTasks.length} high-priority tasks. Consider reviewing priorities or breaking larger tasks into smaller ones.`,
        'suggestion'
      );
    }

    // Check for task overload based on historical patterns
    const avgCompletionTime = patterns.reduce((sum, p) => sum + p.avgCompletionTime, 0) / patterns.length;
    const estimatedWorkload = pendingTasks.reduce((sum, task) => sum + (task.estimatedMinutes || avgCompletionTime), 0);
    
    if (estimatedWorkload > 480) { // 8 hours
      this.notificationCallback?.(
        `Your current workload is estimated at ${Math.round(estimatedWorkload / 60)} hours. Consider deferring some tasks or blocking time for deep work.`,
        'alert'
      );
    }
  }

  private async analyzeEnergyAlignment(tasks: Task[], energyWindows: any[], now: Date) {
    const currentHour = now.getHours();
    const currentEnergyWindow = energyWindows.find(w => 
      currentHour >= w.startHour && currentHour <= w.endHour
    );

    if (currentEnergyWindow) {
      const pendingTasks = tasks.filter(t => t.status === 'pending');
      
      if (currentEnergyWindow.energyLevel === 'high') {
        const complexTasks = pendingTasks.filter(t => t.priority === 'high' || t.priority === 'urgent');
        if (complexTasks.length > 0) {
          this.notificationCallback?.(
            `You're in a high-energy window. Perfect time to tackle: ${complexTasks[0].title}`,
            'suggestion'
          );
        }
      } else if (currentEnergyWindow.energyLevel === 'low') {
        const simpleTasks = pendingTasks.filter(t => t.priority === 'low' && (t.estimatedMinutes || 0) < 30);
        if (simpleTasks.length > 0) {
          this.notificationCallback?.(
            `Low energy detected. Consider knocking out some quick tasks: ${simpleTasks.slice(0, 2).map(t => t.title).join(', ')}`,
            'suggestion'
          );
        }
      }
    }
  }

  private async analyzeUpcomingDeadlines(tasks: Task[], now: Date) {
    const upcomingTasks = tasks.filter(task => {
      if (!task.dueDate || task.status === 'completed') return false;
      
      const dueDate = new Date(task.dueDate);
      const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      return hoursUntilDue > 0 && hoursUntilDue <= 24; // Due within 24 hours
    });

    if (upcomingTasks.length > 0) {
      const sortedTasks = upcomingTasks.sort((a, b) => 
        new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
      );
      
      this.notificationCallback?.(
        `Deadline alert: ${sortedTasks[0].title} is due ${this.formatTimeUntilDue(sortedTasks[0].dueDate!, now)}`,
        'alert'
      );
    }
  }

  private async analyzeProductivityPatterns(tasks: Task[], patterns: ProductivityPattern[], now: Date) {
    const currentHour = now.getHours();
    const currentPattern = patterns.find(p => p.hourOfDay === currentHour);
    
    if (currentPattern && currentPattern.completionRate > 0.8) {
      const pendingTasks = tasks.filter(t => t.status === 'pending');
      if (pendingTasks.length > 0) {
        this.notificationCallback?.(
          `You typically complete ${Math.round(currentPattern.completionRate * 100)}% of tasks at this time. Great moment to focus on: ${pendingTasks[0].title}`,
          'coaching'
        );
      }
    }
  }

  private async checkForLongInactivePeriods(now: Date) {
    const hoursSinceLastCheck = (now.getTime() - this.lastTaskCheck.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLastCheck > 4) { // 4+ hours inactive
      const tasks = this.storageService.loadTasks();
      const pendingTasks = tasks.filter(t => t.status === 'pending');
      
      if (pendingTasks.length > 0) {
        this.notificationCallback?.(
          `Welcome back! You've been away for ${Math.round(hoursSinceLastCheck)} hours. Ready to tackle some tasks?`,
          'suggestion'
        );
      }
    }
  }

  private async analyzeTaskComplexity(tasks: Task[], now: Date, aggressiveness: string) {
    if (aggressiveness === 'subtle') return;

    const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
    const tasksWithTimeEntries = inProgressTasks.filter(t => t.timeEntries.length > 0);
    
    for (const task of tasksWithTimeEntries) {
      const totalTime = task.totalTimeSpent || 0;
      const estimated = task.estimatedMinutes || 60;
      
      if (totalTime > estimated * 1.5) { // 50% over estimate
        this.notificationCallback?.(
          `Task "${task.title}" is taking longer than expected. Consider breaking it down or adjusting the scope.`,
          'coaching'
        );
      }
    }
  }

  private formatTimeUntilDue(dueDate: Date, now: Date): string {
    const hours = Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (hours < 1) return 'in less than an hour';
    if (hours === 1) return 'in 1 hour';
    if (hours < 24) return `in ${hours} hours`;
    
    const days = Math.round(hours / 24);
    return `in ${days} day${days > 1 ? 's' : ''}`;
  }
}
