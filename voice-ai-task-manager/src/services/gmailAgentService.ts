import { UserPreferences, Task } from '../types';
import { StorageService } from './storageService';

interface EmailAnalysis {
  isActionable: boolean;
  shouldNotify: boolean;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  extractedTasks: Array<{
    title: string;
    description: string;
    priority: string;
    dueDate?: Date;
  }>;
  subject: string;
  sender: string;
  timestamp: Date;
}

export class GmailAgentService {
  private preferences: UserPreferences;
  private isMonitoring = false;
  private emailAnalysisCallback?: (analysis: EmailAnalysis) => void;
  private intervalId?: NodeJS.Timeout;
  private storageService: StorageService;
  private lastEmailCheck: Date = new Date();

  // Patterns for detecting actionable emails
  private actionableKeywords = [
    'review', 'approve', 'complete', 'submit', 'deadline', 'due', 'urgent', 'asap',
    'task', 'action', 'todo', 'follow up', 'respond', 'feedback', 'meeting',
    'schedule', 'prepare', 'document', 'send', 'update', 'report', 'deliver'
  ];

  private urgencyKeywords = [
    'urgent', 'asap', 'immediate', 'critical', 'emergency', 'high priority',
    'deadline', 'overdue', 'time sensitive', 'rush', 'quick', 'now'
  ];

  constructor(preferences: UserPreferences) {
    this.preferences = preferences;
    this.storageService = new StorageService();
  }

  updateConfig(preferences: UserPreferences) {
    this.preferences = preferences;
  }

  onEmailAnalysis(callback: (analysis: EmailAnalysis) => void) {
    this.emailAnalysisCallback = callback;
  }

  async startMonitoring(): Promise<boolean> {
    if (
      !this.preferences.googleIntegration?.enabled ||
      !this.preferences.googleIntegration?.gmailEnabled
    ) {
      console.log('📧 Gmail integration not enabled');
      return false;
    }

    if (this.isMonitoring) return true;

    this.isMonitoring = true;
    this.lastEmailCheck = new Date();
    console.log('📧 GmailAgentService: Started monitoring emails (simulated)');

    // Enhanced monitoring with realistic patterns
    this.intervalId = setInterval(
      () => {
        this.checkForNewEmails();
      },
      3 * 60 * 1000 // Check every 3 minutes
    );

    return true;
  }

  stopMonitoring() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    console.log('📧 GmailAgentService: Stopped monitoring emails');
  }

  async manualEmailCheck(): Promise<EmailAnalysis[]> {
    console.log('📧 GmailAgentService: Manual email check triggered');

    // Simulate realistic email analysis with various types
    const mockAnalyses: EmailAnalysis[] = this.generateRealisticEmailAnalyses();

    // Process each analysis
    for (const analysis of mockAnalyses) {
      if (this.emailAnalysisCallback) {
        this.emailAnalysisCallback(analysis);
      }
    }

    return mockAnalyses;
  }

  async getEmailTasks(): Promise<Array<{
    title: string;
    description: string;
    priority: string;
    dueDate?: Date;
  }>> {
    console.log('📧 GmailAgentService: Getting email tasks');

    // Generate realistic tasks from email patterns
    const emailTasks = [
      {
        title: 'Review quarterly budget proposal',
        description: 'Finance team needs feedback on Q4 budget allocation by Thursday',
        priority: 'high',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
      },
      {
        title: 'Respond to client inquiry about project timeline',
        description: 'Client asking for updated delivery schedule and milestone dates',
        priority: 'medium',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day from now
      },
      {
        title: 'Prepare presentation for stakeholder meeting',
        description: 'Executive team meeting on Monday requires project status update',
        priority: 'high',
        dueDate: this.getNextMonday()
      },
      {
        title: 'Follow up on vendor contract renewal',
        description: 'Contract expires next month, need to initiate renewal process',
        priority: 'medium'
      },
      {
        title: 'Update team on policy changes',
        description: 'HR sent new guidelines that need to be communicated to the team',
        priority: 'low'
      }
    ];

    return emailTasks.slice(0, Math.floor(Math.random() * 3) + 1); // Return 1-3 tasks
  }

  private async checkForNewEmails() {
    if (!this.isMonitoring) return;

    console.log('📧 Checking for new emails...');

    // Simulate email arrival with realistic frequency
    const emailProbability = this.getEmailProbability();
    
    if (Math.random() < emailProbability) {
      const analysis = this.generateSingleEmailAnalysis();
      
      if (this.emailAnalysisCallback) {
        this.emailAnalysisCallback(analysis);
      }
    }
  }

  private getEmailProbability(): number {
    const hour = new Date().getHours();
    
    // Higher probability during business hours
    if (hour >= 9 && hour <= 17) {
      return 0.3; // 30% chance per check during business hours
    } else if (hour >= 18 && hour <= 21) {
      return 0.1; // 10% chance during evening
    } else {
      return 0.02; // 2% chance during night/early morning
    }
  }

  private generateRealisticEmailAnalyses(): EmailAnalysis[] {
    const scenarios = [
      {
        subject: 'Project Status Update Required',
        sender: 'manager@company.com',
        isActionable: true,
        urgency: 'high' as const,
        tasks: [{
          title: 'Prepare project status report',
          description: 'Compile current progress, blockers, and next steps for team meeting',
          priority: 'high'
        }]
      },
      {
        subject: 'Client Feedback on Proposal',
        sender: 'client@external.com',
        isActionable: true,
        urgency: 'medium' as const,
        tasks: [{
          title: 'Address client feedback on proposal',
          description: 'Review comments and prepare revised proposal with requested changes',
          priority: 'medium'
        }]
      },
      {
        subject: 'Weekly Team Newsletter',
        sender: 'newsletter@company.com',
        isActionable: false,
        urgency: 'low' as const,
        tasks: []
      },
      {
        subject: 'Urgent: Server Maintenance Tonight',
        sender: 'it@company.com',
        isActionable: true,
        urgency: 'urgent' as const,
        tasks: [{
          title: 'Prepare for server maintenance downtime',
          description: 'Ensure all critical work is saved and systems are backed up',
          priority: 'urgent',
          dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 hours from now
        }]
      }
    ];

    return scenarios.map(scenario => ({
      isActionable: scenario.isActionable,
      shouldNotify: scenario.isActionable && scenario.urgency !== 'low',
      urgency: scenario.urgency,
      extractedTasks: scenario.tasks,
      subject: scenario.subject,
      sender: scenario.sender,
      timestamp: new Date()
    }));
  }

  private generateSingleEmailAnalysis(): EmailAnalysis {
    const scenarios = this.generateRealisticEmailAnalyses();
    return scenarios[Math.floor(Math.random() * scenarios.length)];
  }

  private getNextMonday(): Date {
    const now = new Date();
    const daysUntilMonday = (1 + 7 - now.getDay()) % 7;
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday));
    nextMonday.setHours(9, 0, 0, 0);
    return nextMonday;
  }

  // Enhanced task extraction from email content
  private extractTasksFromEmail(subject: string, content: string): Array<{
    title: string;
    description: string;
    priority: string;
    dueDate?: Date;
  }> {
    const tasks: Array<{
      title: string;
      description: string;
      priority: string;
      dueDate?: Date;
    }> = [];

    // Check for actionable keywords
    const isActionable = this.actionableKeywords.some(keyword => 
      subject.toLowerCase().includes(keyword) || content.toLowerCase().includes(keyword)
    );

    if (!isActionable) return tasks;

    // Determine urgency/priority
    const isUrgent = this.urgencyKeywords.some(keyword => 
      subject.toLowerCase().includes(keyword) || content.toLowerCase().includes(keyword)
    );

    const priority = isUrgent ? 'urgent' : 'medium';

    // Extract due date from content (simplified pattern matching)
    const dueDate = this.extractDueDate(content);

    // Create task based on email content
    const task = {
      title: this.generateTaskTitle(subject),
      description: this.generateTaskDescription(subject, content),
      priority,
      dueDate
    };

    tasks.push(task);
    return tasks;
  }

  private extractDueDate(content: string): Date | undefined {
    // Simple patterns for due date extraction
    const datePatterns = [
      /due\s+(?:by\s+)?(\w+day)/i,
      /deadline\s+(?:is\s+)?(\w+day)/i,
      /by\s+(\w+day)/i
    ];

    for (const pattern of datePatterns) {
      const match = content.match(pattern);
      if (match) {
        // Convert day names to dates (simplified)
        const dayName = match[1].toLowerCase();
        return this.getDateFromDayName(dayName);
      }
    }

    return undefined;
  }

  private getDateFromDayName(dayName: string): Date | undefined {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIndex = days.findIndex(day => dayName.includes(day));
    
    if (dayIndex === -1) return undefined;

    const now = new Date();
    const currentDay = now.getDay();
    const daysUntilTarget = (dayIndex + 7 - currentDay) % 7;
    
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
    targetDate.setHours(17, 0, 0, 0); // Default to 5 PM
    
    return targetDate;
  }

  private generateTaskTitle(subject: string): string {
    // Remove common email prefixes and generate a task title
    const cleaned = subject.replace(/^(re:|fwd:|fw:)\s*/i, '').trim();
    
    // Add action prefix if not present
    if (!cleaned.toLowerCase().match(/^(review|complete|prepare|respond|update|follow)/)) {
      return `Respond to: ${cleaned}`;
    }
    
    return cleaned;
  }

  private generateTaskDescription(subject: string, content: string): string {
    // Generate a meaningful description based on email content
    const shortContent = content.substring(0, 200);
    return `Email from ${subject}: ${shortContent}${content.length > 200 ? '...' : ''}`;
  }
}
