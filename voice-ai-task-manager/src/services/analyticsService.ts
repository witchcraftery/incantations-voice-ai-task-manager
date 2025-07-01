import { Task, TaskAnalytics, ProductivityPattern, EnergyWindow, TaskEstimation } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class AnalyticsService {
  private readonly ANALYTICS_KEY = 'voice_task_manager_analytics';

  // Save analytics data
  saveTaskAnalytics(analytics: TaskAnalytics[]): void {
    try {
      localStorage.setItem(this.ANALYTICS_KEY, JSON.stringify(analytics));
    } catch (error) {
      console.error('Failed to save analytics:', error);
    }
  }

  // Load analytics data
  loadTaskAnalytics(): TaskAnalytics[] {
    try {
      const stored = localStorage.getItem(this.ANALYTICS_KEY);
      if (!stored) return [];
      
      const analytics = JSON.parse(stored);
      return analytics.map((item: any) => ({
        ...item,
        completedAt: new Date(item.completedAt)
      }));
    } catch (error) {
      console.error('Failed to load analytics:', error);
      return [];
    }
  }

  // Track task completion
  trackTaskCompletion(task: Task): void {
    if (task.status !== 'completed' || !task.completedAt || !task.startedAt) return;

    const actualMinutes = Math.round((task.completedAt.getTime() - task.startedAt.getTime()) / (1000 * 60));
    
    const analytics: TaskAnalytics = {
      id: uuidv4(),
      taskId: task.id,
      actualMinutes,
      completedAt: task.completedAt,
      priority: task.priority,
      tags: task.tags,
      project: task.project,
      hourOfDay: task.completedAt.getHours(),
      dayOfWeek: task.completedAt.getDay()
    };

    const existingAnalytics = this.loadTaskAnalytics();
    existingAnalytics.push(analytics);
    this.saveTaskAnalytics(existingAnalytics);
  }

  // Calculate productivity patterns by hour
  calculateProductivityPatterns(): ProductivityPattern[] {
    const analytics = this.loadTaskAnalytics();
    const patterns: Record<number, { total: number; count: number; completed: number }> = {};

    // Initialize all hours
    for (let hour = 0; hour < 24; hour++) {
      patterns[hour] = { total: 0, count: 0, completed: 0 };
    }

    // Aggregate data by hour
    analytics.forEach(item => {
      const hour = item.hourOfDay;
      patterns[hour].total += item.actualMinutes;
      patterns[hour].count += 1;
      patterns[hour].completed += 1; // All analytics items are completed tasks
    });

    // Convert to ProductivityPattern array
    return Object.entries(patterns).map(([hour, data]) => ({
      hourOfDay: parseInt(hour),
      completionRate: data.count > 0 ? data.completed / data.count : 0,
      avgCompletionTime: data.count > 0 ? data.total / data.count : 0,
      taskCount: data.count
    }));
  }

  // Detect energy windows based on completion patterns
  detectEnergyWindows(): EnergyWindow[] {
    const patterns = this.calculateProductivityPatterns();
    const windows: EnergyWindow[] = [];

    // Find high-energy periods (high completion rate + low avg time)
    const avgCompletionRate = patterns.reduce((sum, p) => sum + p.completionRate, 0) / patterns.length;
    const avgCompletionTime = patterns.filter(p => p.taskCount > 0)
      .reduce((sum, p) => sum + p.avgCompletionTime, 0) / patterns.filter(p => p.taskCount > 0).length;

    let currentWindow: { start: number; end: number; level: 'high' | 'medium' | 'low' } | null = null;

    patterns.forEach((pattern, hour) => {
      if (pattern.taskCount === 0) return;

      let energyLevel: 'high' | 'medium' | 'low' = 'medium';
      
      if (pattern.completionRate > avgCompletionRate * 1.2 && pattern.avgCompletionTime < avgCompletionTime * 0.8) {
        energyLevel = 'high';
      } else if (pattern.completionRate < avgCompletionRate * 0.8 || pattern.avgCompletionTime > avgCompletionTime * 1.2) {
        energyLevel = 'low';
      }

      if (!currentWindow || currentWindow.level !== energyLevel) {
        if (currentWindow) {
          windows.push({
            startHour: currentWindow.start,
            endHour: currentWindow.end,
            energyLevel: currentWindow.level,
            confidence: Math.min(1, patterns[currentWindow.start].taskCount / 10)
          });
        }
        currentWindow = { start: hour, end: hour, level: energyLevel };
      } else {
        currentWindow.end = hour;
      }
    });

    if (currentWindow) {
      windows.push({
        startHour: currentWindow.start,
        endHour: currentWindow.end,
        energyLevel: currentWindow.level,
        confidence: Math.min(1, patterns[currentWindow.start].taskCount / 10)
      });
    }

    return windows;
  }

  // Estimate task completion time
  estimateTaskTime(task: Partial<Task>): TaskEstimation {
    const analytics = this.loadTaskAnalytics();
    let estimatedMinutes = 30; // Default estimate
    let confidence = 0.3;
    const basedOnSimilar: string[] = [];
    const factors = {
      priority: 1,
      complexity: 1,
      projectFamiliarity: 1,
      tagSimilarity: 1
    };

    if (analytics.length === 0) {
      return {
        taskId: task.id || '',
        estimatedMinutes,
        confidence,
        basedOnSimilar,
        factors
      };
    }

    // Find similar tasks
    const similarTasks = analytics.filter(item => {
      let similarity = 0;
      
      // Priority match
      if (item.priority === task.priority) {
        similarity += 0.3;
        factors.priority = 1.2;
      }
      
      // Project match
      if (task.project && item.project === task.project) {
        similarity += 0.3;
        factors.projectFamiliarity = 1.3;
      }
      
      // Tag similarity
      if (task.tags && task.tags.length > 0) {
        const commonTags = task.tags.filter(tag => item.tags.includes(tag));
        const tagSimilarity = commonTags.length / Math.max(task.tags.length, item.tags.length);
        similarity += tagSimilarity * 0.4;
        factors.tagSimilarity = 1 + tagSimilarity;
      }

      return similarity > 0.3; // At least 30% similarity
    });

    if (similarTasks.length > 0) {
      // Calculate weighted average based on similarity
      const totalTime = similarTasks.reduce((sum, item) => sum + item.actualMinutes, 0);
      estimatedMinutes = Math.round(totalTime / similarTasks.length);
      confidence = Math.min(0.9, 0.4 + (similarTasks.length * 0.1));
      basedOnSimilar.push(...similarTasks.map(t => t.taskId).slice(0, 5));
    } else {
      // Use priority-based estimation
      const priorityEstimates = {
        low: 20,
        medium: 45,
        high: 75,
        urgent: 120
      };
      estimatedMinutes = priorityEstimates[task.priority || 'medium'];
      confidence = 0.4;
    }

    // Apply complexity factor based on title/description length
    const titleLength = (task.title || '').length;
    const descLength = (task.description || '').length;
    if (titleLength + descLength > 100) {
      factors.complexity = 1.4;
      estimatedMinutes = Math.round(estimatedMinutes * factors.complexity);
    } else if (titleLength + descLength < 30) {
      factors.complexity = 0.7;
      estimatedMinutes = Math.round(estimatedMinutes * factors.complexity);
    }

    return {
      taskId: task.id || '',
      estimatedMinutes: Math.max(5, estimatedMinutes), // Minimum 5 minutes
      confidence,
      basedOnSimilar,
      factors
    };
  }

  // Get optimal time suggestions for a task
  getOptimalTimeSuggestions(task: Task): { hour: number; energyLevel: string; confidence: number }[] {
    const energyWindows = this.detectEnergyWindows();
    const suggestions: { hour: number; energyLevel: string; confidence: number }[] = [];

    // Suggest high-energy periods for important tasks
    const isImportant = task.priority === 'high' || task.priority === 'urgent';
    const targetEnergyLevel = isImportant ? 'high' : 'medium';

    energyWindows
      .filter(window => window.energyLevel === targetEnergyLevel || (targetEnergyLevel === 'high' && window.energyLevel === 'medium'))
      .forEach(window => {
        for (let hour = window.startHour; hour <= window.endHour; hour++) {
          suggestions.push({
            hour,
            energyLevel: window.energyLevel,
            confidence: window.confidence
          });
        }
      });

    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  }

  // Calculate task reordering recommendations
  calculateTaskOrder(tasks: Task[]): { taskId: string; score: number; reasons: string[] }[] {
    const now = new Date();
    const currentHour = now.getHours();
    const energyWindows = this.detectEnergyWindows();
    const currentEnergyLevel = this.getCurrentEnergyLevel(currentHour, energyWindows);

    return tasks
      .filter(task => task.status === 'pending')
      .map(task => {
        let score = 0;
        const reasons: string[] = [];

        // Priority scoring
        const priorityScores = { low: 1, medium: 2, high: 3, urgent: 4 };
        score += priorityScores[task.priority] * 25;
        reasons.push(`Priority: ${task.priority}`);

        // Deadline urgency
        if (task.dueDate) {
          const hoursUntilDue = (task.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
          if (hoursUntilDue < 24) {
            score += 30;
            reasons.push('Due within 24 hours');
          } else if (hoursUntilDue < 72) {
            score += 15;
            reasons.push('Due within 3 days');
          }
        }

        // Energy level matching
        if (currentEnergyLevel === 'high' && (task.priority === 'high' || task.priority === 'urgent')) {
          score += 20;
          reasons.push('High energy period - good for important tasks');
        } else if (currentEnergyLevel === 'low' && task.priority === 'low') {
          score += 10;
          reasons.push('Low energy period - good for simple tasks');
        }

        // Estimated completion time vs available time
        const estimation = this.estimateTaskTime(task);
        if (estimation.estimatedMinutes <= 30) {
          score += 10;
          reasons.push('Quick task - easy to complete');
        }

        return {
          taskId: task.id,
          score,
          reasons
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  private getCurrentEnergyLevel(hour: number, energyWindows: EnergyWindow[]): 'high' | 'medium' | 'low' {
    const window = energyWindows.find(w => hour >= w.startHour && hour <= w.endHour);
    return window?.energyLevel || 'medium';
  }
}