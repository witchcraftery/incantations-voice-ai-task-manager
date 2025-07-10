import { AUTONOMOUS_AGENT_SYSTEM_PROMPT } from '../config/systemPrompts';
import { Task, UserPreferences, UserMemory } from '../types';
import { StorageService } from './storageService';
import { GoogleCalendarService } from './googleCalendarService';
import { AIService } from './aiService';

export interface AgentInsight {
  type: 'urgent' | 'important' | 'pattern' | 'recommendation';
  title: string;
  description: string;
  actionItems: string[];
  confidence: number;
  metadata: {
    sourceData: string;
    timeframe: string;
  };
}

export interface AgentAnalysis {
  analysisType: 'gmail' | 'calendar' | 'task' | 'productivity';
  timestamp: string;
  insights: AgentInsight[];
  summary: string;
}

export class AutonomousAgentService {
  private analysisQueue: Array<() => Promise<AgentAnalysis>> = [];
  private isProcessing = false;
  private lastAnalysisTime: Record<string, Date> = {};
  private analysisInterval: NodeJS.Timeout | null = null;
  private insights: AgentAnalysis[] = [];

  constructor(
    private storageService: StorageService,
    private calendarService: GoogleCalendarService,
    private aiService: AIService
  ) {
    this.startAutonomousAnalysis();
  }

  /**
   * Start the autonomous analysis engine
   * Runs different types of analysis on different schedules
   */
  private startAutonomousAnalysis(): void {
    // Run analysis every 15 minutes
    this.analysisInterval = setInterval(() => {
      this.scheduleAnalyses();
    }, 15 * 60 * 1000);

    // Run initial analysis after 30 seconds
    setTimeout(() => {
      this.scheduleAnalyses();
    }, 30000);
  }

  /**
   * Schedule different types of analysis based on time intervals
   */
  private scheduleAnalyses(): void {
    const now = new Date();
    
    // Gmail analysis every 30 minutes
    if (this.shouldRunAnalysis('gmail', 30)) {
      this.queueAnalysis('gmail');
    }

    // Calendar analysis every 15 minutes
    if (this.shouldRunAnalysis('calendar', 15)) {
      this.queueAnalysis('calendar');
    }

    // Task analysis every hour
    if (this.shouldRunAnalysis('task', 60)) {
      this.queueAnalysis('task');
    }

    // Productivity analysis every 4 hours
    if (this.shouldRunAnalysis('productivity', 240)) {
      this.queueAnalysis('productivity');
    }

    this.processQueue();
  }

  private shouldRunAnalysis(type: string, intervalMinutes: number): boolean {
    const lastRun = this.lastAnalysisTime[type];
    if (!lastRun) return true;
    
    const now = new Date();
    const timeDiff = now.getTime() - lastRun.getTime();
    return timeDiff >= intervalMinutes * 60 * 1000;
  }

  private queueAnalysis(type: 'gmail' | 'calendar' | 'task' | 'productivity'): void {
    switch (type) {
      case 'gmail':
        this.analysisQueue.push(() => this.analyzeGmail());
        break;
      case 'calendar':
        this.analysisQueue.push(() => this.analyzeCalendar());
        break;
      case 'task':
        this.analysisQueue.push(() => this.analyzeTasks());
        break;
      case 'productivity':
        this.analysisQueue.push(() => this.analyzeProductivity());
        break;
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.analysisQueue.length === 0) return;
    
    this.isProcessing = true;
    
    try {
      while (this.analysisQueue.length > 0) {
        const analysis = this.analysisQueue.shift();
        if (analysis) {
          try {
            const result = await analysis();
            this.insights.push(result);
            
            // Keep only last 50 insights
            if (this.insights.length > 50) {
              this.insights = this.insights.slice(-50);
            }
          } catch (error) {
            console.error('Agent analysis failed:', error);
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Analyze Gmail for actionable items
   */
  private async analyzeGmail(): Promise<AgentAnalysis> {
    this.lastAnalysisTime['gmail'] = new Date();
    
    try {
      // Simulate Gmail analysis (in production, this would connect to Gmail API)
      const emailInsights = this.generateGmailInsights();
      
      return {
        analysisType: 'gmail',
        timestamp: new Date().toISOString(),
        insights: emailInsights,
        summary: `Analyzed recent emails. Found ${emailInsights.length} actionable items.`
      };
    } catch (error) {
      return {
        analysisType: 'gmail',
        timestamp: new Date().toISOString(),
        insights: [],
        summary: 'Gmail analysis failed - will retry next cycle.'
      };
    }
  }

  /**
   * Analyze Calendar for upcoming events and time conflicts
   */
  private async analyzeCalendar(): Promise<AgentAnalysis> {
    this.lastAnalysisTime['calendar'] = new Date();
    
    try {
      const events = await this.calendarService.getUpcomingEvents(7); // Next 7 days
      const insights: AgentInsight[] = [];
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      
      // Check for conflicts in next 2 hours
      const upcomingEvents = events.filter(event => {
        const eventStart = new Date(event.start.dateTime || event.start.date!);
        return eventStart <= new Date(now.getTime() + 2 * 60 * 60 * 1000) && eventStart > now;
      });

      if (upcomingEvents.length > 0) {
        insights.push({
          type: 'urgent',
          title: 'Upcoming Events',
          description: `You have ${upcomingEvents.length} event(s) in the next 2 hours`,
          actionItems: upcomingEvents.map(e => `Prepare for: ${e.summary}`),
          confidence: 0.95,
          metadata: {
            sourceData: 'Google Calendar upcoming events',
            timeframe: 'Next 2 hours'
          }
        });
      }

      // Check for busy day tomorrow
      const tomorrowEvents = events.filter(event => {
        const eventStart = new Date(event.start.dateTime || event.start.date!);
        return eventStart >= tomorrow && eventStart < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
      });

      if (tomorrowEvents.length >= 4) {
        insights.push({
          type: 'important',
          title: 'Busy Day Tomorrow',
          description: `Tomorrow has ${tomorrowEvents.length} scheduled events`,
          actionItems: [
            'Review tomorrow\'s schedule',
            'Prepare materials for meetings',
            'Consider meal planning',
            'Block time for breaks'
          ],
          confidence: 0.90,
          metadata: {
            sourceData: 'Google Calendar daily schedule',
            timeframe: 'Tomorrow'
          }
        });
      }
      
      return {
        analysisType: 'calendar',
        timestamp: new Date().toISOString(),
        insights,
        summary: `Analyzed calendar. ${upcomingEvents.length} upcoming events, ${tomorrowEvents.length} events tomorrow.`
      };
    } catch (error) {
      return {
        analysisType: 'calendar',
        timestamp: new Date().toISOString(),
        insights: [],
        summary: 'Calendar analysis failed - will retry next cycle.'
      };
    }
  }

  /**
   * Analyze task patterns and productivity
   */
  private async analyzeTasks(): Promise<AgentAnalysis> {
    this.lastAnalysisTime['task'] = new Date();
    
    try {
      const tasks = this.storageService.loadTasks();
      const insights: AgentInsight[] = [];
      
      // Find stagnant tasks (no updates in 2+ days)
      const stagnantTasks = tasks.filter(task => {
        if (task.status === 'completed' || task.status === 'cancelled') return false;
        const daysSinceUpdate = (Date.now() - task.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceUpdate >= 2;
      });

      if (stagnantTasks.length > 0) {
        insights.push({
          type: 'pattern',
          title: 'Stagnant Tasks Detected',
          description: `${stagnantTasks.length} tasks haven't been updated in 2+ days`,
          actionItems: stagnantTasks.slice(0, 3).map(t => `Review: ${t.title}`),
          confidence: 0.85,
          metadata: {
            sourceData: 'Task update timestamps',
            timeframe: 'Last 2 days'
          }
        });
      }

      // Check for overdue tasks
      const overdueTasks = tasks.filter(task => {
        if (task.status === 'completed' || task.status === 'cancelled' || !task.dueDate) return false;
        return task.dueDate < new Date();
      });

      if (overdueTasks.length > 0) {
        insights.push({
          type: 'urgent',
          title: 'Overdue Tasks',
          description: `${overdueTasks.length} tasks are past their due date`,
          actionItems: overdueTasks.slice(0, 3).map(t => `Complete: ${t.title}`),
          confidence: 0.95,
          metadata: {
            sourceData: 'Task due dates',
            timeframe: 'Overdue'
          }
        });
      }

      // Analyze priority distribution
      const highPriorityTasks = tasks.filter(t => t.priority === 'high' || t.priority === 'urgent');
      const totalActiveTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length;
      
      if (highPriorityTasks.length > totalActiveTasks * 0.5) {
        insights.push({
          type: 'recommendation',
          title: 'Priority Overload',
          description: 'Over 50% of your tasks are marked high/urgent priority',
          actionItems: [
            'Review task priorities',
            'Consider breaking down complex tasks',
            'Delegate or defer non-essential items'
          ],
          confidence: 0.80,
          metadata: {
            sourceData: 'Task priority distribution',
            timeframe: 'Current active tasks'
          }
        });
      }
      
      return {
        analysisType: 'task',
        timestamp: new Date().toISOString(),
        insights,
        summary: `Analyzed ${tasks.length} tasks. Found ${stagnantTasks.length} stagnant, ${overdueTasks.length} overdue.`
      };
    } catch (error) {
      return {
        analysisType: 'task',
        timestamp: new Date().toISOString(),
        insights: [],
        summary: 'Task analysis failed - will retry next cycle.'
      };
    }
  }

  /**
   * Analyze productivity patterns
   */
  private async analyzeProductivity(): Promise<AgentAnalysis> {
    this.lastAnalysisTime['productivity'] = new Date();
    
    try {
      const tasks = this.storageService.loadTasks();
      const completedTasks = tasks.filter(t => t.status === 'completed');
      const insights: AgentInsight[] = [];
      
      // Analyze completion patterns by hour
      const hourlyCompletions: Record<number, number> = {};
      completedTasks.forEach(task => {
        if (task.completedAt) {
          const hour = task.completedAt.getHours();
          hourlyCompletions[hour] = (hourlyCompletions[hour] || 0) + 1;
        }
      });

      // Find peak productivity hours
      const peakHour = Object.entries(hourlyCompletions)
        .sort(([,a], [,b]) => b - a)[0];
      
      if (peakHour && hourlyCompletions[parseInt(peakHour[0])] >= 3) {
        insights.push({
          type: 'pattern',
          title: 'Peak Productivity Time',
          description: `You complete most tasks around ${peakHour[0]}:00`,
          actionItems: [
            'Schedule important tasks during peak hours',
            'Block this time for focused work',
            'Consider protecting this time from meetings'
          ],
          confidence: 0.75,
          metadata: {
            sourceData: 'Historical task completion times',
            timeframe: 'All time'
          }
        });
      }

      // Check for work-life balance
      const weekendWork = completedTasks.filter(task => {
        if (!task.completedAt) return false;
        const day = task.completedAt.getDay();
        return day === 0 || day === 6; // Sunday or Saturday
      });

      if (weekendWork.length > completedTasks.length * 0.3) {
        insights.push({
          type: 'recommendation',
          title: 'Weekend Work Pattern',
          description: 'You\'re completing tasks on weekends frequently',
          actionItems: [
            'Consider setting weekend boundaries',
            'Review workload distribution',
            'Plan better during weekdays'
          ],
          confidence: 0.70,
          metadata: {
            sourceData: 'Task completion days',
            timeframe: 'Recent activity'
          }
        });
      }
      
      return {
        analysisType: 'productivity',
        timestamp: new Date().toISOString(),
        insights,
        summary: `Analyzed productivity patterns. Peak hour: ${peakHour?.[0] || 'unknown'}, Weekend work: ${Math.round(weekendWork.length / completedTasks.length * 100)}%`
      };
    } catch (error) {
      return {
        analysisType: 'productivity',
        timestamp: new Date().toISOString(),
        insights: [],
        summary: 'Productivity analysis failed - will retry next cycle.'
      };
    }
  }

  /**
   * Generate simulated Gmail insights (replace with real Gmail API in production)
   */
  private generateGmailInsights(): AgentInsight[] {
    const insights: AgentInsight[] = [];
    const hour = new Date().getHours();
    
    // Simulate business hours email patterns
    if (hour >= 9 && hour <= 17) {
      if (Math.random() > 0.7) {
        insights.push({
          type: 'urgent',
          title: 'Time-Sensitive Email',
          description: 'Email with deadline keywords detected',
          actionItems: ['Review email requiring response by EOD'],
          confidence: 0.80,
          metadata: {
            sourceData: 'Email content analysis',
            timeframe: 'Last hour'
          }
        });
      }
      
      if (Math.random() > 0.8) {
        insights.push({
          type: 'important',
          title: 'Meeting Request',
          description: 'New meeting invitation requires response',
          actionItems: ['Accept or decline meeting request', 'Block calendar time'],
          confidence: 0.90,
          metadata: {
            sourceData: 'Calendar invitations',
            timeframe: 'Last 30 minutes'
          }
        });
      }
    }
    
    return insights;
  }

  /**
   * Get insights for Lilly to present to the user
   */
  public getInsightsForLilly(maxInsights: number = 5): AgentAnalysis[] {
    // Return recent insights, prioritizing urgent and important ones
    const sortedInsights = this.insights
      .sort((a, b) => {
        // Prioritize by urgency and recency
        const aUrgency = a.insights.some(i => i.type === 'urgent') ? 3 :
                        a.insights.some(i => i.type === 'important') ? 2 : 1;
        const bUrgency = b.insights.some(i => i.type === 'urgent') ? 3 :
                        b.insights.some(i => i.type === 'important') ? 2 : 1;
        
        if (aUrgency !== bUrgency) return bUrgency - aUrgency;
        
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
    
    return sortedInsights.slice(0, maxInsights);
  }

  /**
   * Check if there are urgent insights that need immediate attention
   */
  public hasUrgentInsights(): boolean {
    const recentInsights = this.insights.filter(insight => {
      const age = Date.now() - new Date(insight.timestamp).getTime();
      return age < 30 * 60 * 1000; // Last 30 minutes
    });
    
    return recentInsights.some(analysis => 
      analysis.insights.some(insight => insight.type === 'urgent')
    );
  }

  /**
   * Stop autonomous analysis
   */
  public stop(): void {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
  }

  /**
   * Force a specific type of analysis to run now
   */
  public async runAnalysisNow(type: 'gmail' | 'calendar' | 'task' | 'productivity'): Promise<AgentAnalysis> {
    this.queueAnalysis(type);
    await this.processQueue();
    
    return this.insights[this.insights.length - 1];
  }
}