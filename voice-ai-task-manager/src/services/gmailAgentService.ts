import { UserPreferences } from '../types';

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

  constructor(preferences: UserPreferences) {
    this.preferences = preferences;
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
    console.log('📧 GmailAgentService: Started monitoring emails');

    // Placeholder monitoring - would implement actual Gmail API integration
    this.intervalId = setInterval(
      () => {
        this.checkForNewEmails();
      },
      5 * 60 * 1000
    ); // Check every 5 minutes

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

    // Placeholder - would implement actual Gmail API call
    const mockAnalyses: EmailAnalysis[] = [
      {
        isActionable: true,
        shouldNotify: true,
        urgency: 'high',
        extractedTasks: [
          {
            title: 'Review project proposal',
            description:
              'Review and provide feedback on the new project proposal by end of week',
            priority: 'high',
          },
        ],
        subject: 'Project Proposal Review Needed',
        sender: 'colleague@company.com',
        timestamp: new Date(),
      },
    ];

    return mockAnalyses;
  }

  async getEmailTasks(): Promise<
    Array<{
      title: string;
      description: string;
      priority: string;
      dueDate?: Date;
    }>
  > {
    console.log('📧 GmailAgentService: Getting email tasks');

    // Placeholder - would extract tasks from recent emails
    return [
      {
        title: 'Follow up on client meeting',
        description: 'Send follow-up email with meeting notes and next steps',
        priority: 'medium',
      },
    ];
  }

  private async checkForNewEmails() {
    if (!this.isMonitoring) return;

    // Placeholder for actual email checking logic
    console.log('📧 Checking for new emails...');

    // Simulate occasional email analysis
    if (Math.random() > 0.9) {
      const mockAnalysis: EmailAnalysis = {
        isActionable: Math.random() > 0.5,
        shouldNotify: true,
        urgency: Math.random() > 0.7 ? 'high' : 'medium',
        extractedTasks: [],
        subject: 'Mock Email Analysis',
        sender: 'test@example.com',
        timestamp: new Date(),
      };

      if (this.emailAnalysisCallback) {
        this.emailAnalysisCallback(mockAnalysis);
      }
    }
  }
}
