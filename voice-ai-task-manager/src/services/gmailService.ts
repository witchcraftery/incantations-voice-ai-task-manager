export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    headers: Array<{
      name: string;
      value: string;
    }>;
    body?: {
      data?: string;
    };
    parts?: Array<{
      mimeType: string;
      body: {
        data?: string;
      };
    }>;
  };
  internalDate: string;
  labelIds: string[];
}

export interface EmailTask {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  tags: string[];
  sourceEmail: {
    messageId: string;
    subject: string;
    sender: string;
    date: Date;
  };
}

export interface GmailConfig {
  clientId: string;
  apiKey: string;
  scopes: string[];
}

export class GmailService {
  private gapi: any = null;
  private isInitialized = false;
  private isSignedIn = false;
  private config: GmailConfig;

  constructor(config: GmailConfig) {
    this.config = {
      scopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify'
      ],
      ...config
    };
  }

  async initialize(): Promise<boolean> {
    try {
      if (!window.gapi) {
        await this.loadGoogleAPI();
      }

      this.gapi = window.gapi;
      
      await this.gapi.load('client:auth2', async () => {
        await this.gapi.client.init({
          apiKey: this.config.apiKey,
          clientId: this.config.clientId,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'],
          scope: this.config.scopes.join(' ')
        });

        this.isInitialized = true;
        this.isSignedIn = this.gapi.auth2.getAuthInstance().isSignedIn.get();
      });

      return this.isInitialized;
    } catch (error) {
      console.error('Failed to initialize Gmail:', error);
      return false;
    }
  }

  private loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google API'));
      document.head.appendChild(script);
    });
  }

  async signIn(): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const authInstance = this.gapi.auth2.getAuthInstance();
      await authInstance.signIn();
      this.isSignedIn = true;
      return true;
    } catch (error) {
      console.error('Gmail sign-in failed:', error);
      return false;
    }
  }

  async signOut(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      const authInstance = this.gapi.auth2.getAuthInstance();
      await authInstance.signOut();
      this.isSignedIn = false;
    } catch (error) {
      console.error('Gmail sign-out failed:', error);
    }
  }

  async getRecentMessages(maxResults: number = 20): Promise<GmailMessage[]> {
    if (!this.isSignedIn) {
      throw new Error('Not signed in to Gmail');
    }

    try {
      const response = await this.gapi.client.gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: 'is:unread OR newer_than:3d', // Unread or from last 3 days
      });

      const messages = response.result.messages || [];
      const fullMessages: GmailMessage[] = [];

      // Get full message details
      for (const message of messages.slice(0, 10)) { // Limit to avoid rate limits
        try {
          const fullMessage = await this.gapi.client.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
          });
          fullMessages.push(fullMessage.result);
        } catch (error) {
          console.error('Failed to fetch message details:', error);
        }
      }

      return fullMessages;
    } catch (error) {
      console.error('Failed to fetch Gmail messages:', error);
      return [];
    }
  }

  async searchMessages(query: string, maxResults: number = 10): Promise<GmailMessage[]> {
    if (!this.isSignedIn) {
      throw new Error('Not signed in to Gmail');
    }

    try {
      const response = await this.gapi.client.gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: query,
      });

      const messages = response.result.messages || [];
      const fullMessages: GmailMessage[] = [];

      for (const message of messages) {
        try {
          const fullMessage = await this.gapi.client.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
          });
          fullMessages.push(fullMessage.result);
        } catch (error) {
          console.error('Failed to fetch message details:', error);
        }
      }

      return fullMessages;
    } catch (error) {
      console.error('Failed to search Gmail messages:', error);
      return [];
    }
  }

  // Extract actionable tasks from emails
  extractTasksFromEmails(messages: GmailMessage[]): EmailTask[] {
    const tasks: EmailTask[] = [];

    messages.forEach(message => {
      const subject = this.getHeader(message, 'Subject') || '';
      const sender = this.getHeader(message, 'From') || '';
      const date = new Date(parseInt(message.internalDate));
      const body = this.getMessageBody(message);

      // Extract tasks using patterns
      const extractedTasks = this.extractTasksFromText(body || message.snippet, subject);

      extractedTasks.forEach(task => {
        tasks.push({
          ...task,
          sourceEmail: {
            messageId: message.id,
            subject,
            sender,
            date
          }
        });
      });

      // Check for action-required emails
      if (this.isActionRequired(subject, body || message.snippet)) {
        tasks.push({
          title: `Respond to: ${subject}`,
          description: `Email from ${sender}: ${message.snippet}`,
          priority: this.determinePriorityFromEmail(subject, sender),
          dueDate: this.extractDueDateFromEmail(body || message.snippet),
          tags: ['email', 'response-needed'],
          sourceEmail: {
            messageId: message.id,
            subject,
            sender,
            date
          }
        });
      }
    });

    return tasks;
  }

  private extractTasksFromText(text: string, subject: string): Omit<EmailTask, 'sourceEmail'>[] {
    const tasks: Omit<EmailTask, 'sourceEmail'>[] = [];
    
    // Task extraction patterns
    const patterns = [
      /(?:please|could you|can you|need you to|would you)\s+([^.!?]*)/gi,
      /(?:action item|todo|task):\s*([^.!?\n]*)/gi,
      /(?:deadline|due|by)\s+([^.!?\n]*)/gi,
      /(?:schedule|book|arrange)\s+([^.!?\n]*)/gi,
      /(?:review|check|verify|confirm)\s+([^.!?\n]*)/gi,
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const taskText = match[1].trim();
        if (taskText.length > 5) {
          tasks.push({
            title: this.cleanTaskTitle(taskText),
            description: `From email: ${subject.substring(0, 50)}...`,
            priority: this.determinePriorityFromText(text),
            dueDate: this.extractDueDateFromEmail(text),
            tags: this.extractTagsFromEmail(text, subject)
          });
        }
      }
    });

    return tasks;
  }

  private isActionRequired(subject: string, body: string): boolean {
    const actionWords = [
      'urgent', 'asap', 'please respond', 'action required', 'deadline',
      'review', 'approve', 'sign', 'confirm', 'reply', 'rsvp'
    ];

    const text = (subject + ' ' + body).toLowerCase();
    return actionWords.some(word => text.includes(word));
  }

  private determinePriorityFromEmail(subject: string, sender: string): 'low' | 'medium' | 'high' | 'urgent' {
    const text = subject.toLowerCase();
    
    if (text.includes('urgent') || text.includes('asap') || text.includes('critical')) {
      return 'urgent';
    }
    
    if (text.includes('important') || text.includes('priority')) {
      return 'high';
    }
    
    if (sender.includes('boss') || sender.includes('manager') || text.includes('deadline')) {
      return 'high';
    }
    
    return 'medium';
  }

  private determinePriorityFromText(text: string): 'low' | 'medium' | 'high' | 'urgent' {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('urgent') || lowerText.includes('asap')) return 'urgent';
    if (lowerText.includes('important') || lowerText.includes('priority')) return 'high';
    if (lowerText.includes('when possible') || lowerText.includes('sometime')) return 'low';
    
    return 'medium';
  }

  private extractDueDateFromEmail(text: string): Date | undefined {
    const datePatterns = [
      /by\s+(\w+\s+\d{1,2}(?:st|nd|rd|th)?)/i,
      /deadline\s+(\w+\s+\d{1,2}(?:st|nd|rd|th)?)/i,
      /due\s+(\w+\s+\d{1,2}(?:st|nd|rd|th)?)/i,
      /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
      /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          const dateStr = match[1];
          const parsedDate = new Date(dateStr);
          if (!isNaN(parsedDate.getTime())) {
            return parsedDate;
          }
        } catch (error) {
          // Continue to next pattern
        }
      }
    }

    return undefined;
  }

  private extractTagsFromEmail(text: string, subject: string): string[] {
    const tags = ['email'];
    const fullText = (text + ' ' + subject).toLowerCase();

    const tagMap = {
      'meeting': ['meeting', 'call', 'sync', 'standup'],
      'review': ['review', 'feedback', 'check'],
      'urgent': ['urgent', 'asap', 'critical'],
      'deadline': ['deadline', 'due', 'submit'],
      'document': ['document', 'file', 'attachment', 'pdf'],
      'approval': ['approve', 'sign', 'authorize'],
    };

    Object.entries(tagMap).forEach(([tag, keywords]) => {
      if (keywords.some(keyword => fullText.includes(keyword))) {
        tags.push(tag);
      }
    });

    return tags;
  }

  private cleanTaskTitle(title: string): string {
    return title
      .replace(/^(to\s+|please\s+)?/, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^./, str => str.toUpperCase());
  }

  private getHeader(message: GmailMessage, headerName: string): string | undefined {
    const header = message.payload.headers.find(h => h.name.toLowerCase() === headerName.toLowerCase());
    return header?.value;
  }

  private getMessageBody(message: GmailMessage): string | undefined {
    // Try to get plain text body
    if (message.payload.body?.data) {
      return atob(message.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    }

    // Check parts for text/plain
    if (message.payload.parts) {
      for (const part of message.payload.parts) {
        if (part.mimeType === 'text/plain' && part.body.data) {
          return atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        }
      }
    }

    return undefined;
  }

  // Smart email categorization
  async categorizeEmails(): Promise<{
    actionRequired: GmailMessage[];
    newsletters: GmailMessage[];
    meetings: GmailMessage[];
    deadlines: GmailMessage[];
  }> {
    const messages = await this.getRecentMessages(50);
    
    const actionRequired = messages.filter(msg => {
      const subject = this.getHeader(msg, 'Subject') || '';
      const body = this.getMessageBody(msg) || msg.snippet;
      return this.isActionRequired(subject, body);
    });

    const newsletters = messages.filter(msg => {
      const sender = this.getHeader(msg, 'From') || '';
      return sender.includes('noreply') || sender.includes('newsletter') || msg.snippet.includes('unsubscribe');
    });

    const meetings = messages.filter(msg => {
      const subject = this.getHeader(msg, 'Subject') || '';
      return subject.toLowerCase().includes('meeting') || 
             subject.toLowerCase().includes('call') ||
             subject.toLowerCase().includes('calendar');
    });

    const deadlines = messages.filter(msg => {
      const text = (this.getHeader(msg, 'Subject') + ' ' + msg.snippet).toLowerCase();
      return text.includes('deadline') || text.includes('due') || text.includes('submit');
    });

    return { actionRequired, newsletters, meetings, deadlines };
  }

  // Getters
  get initialized(): boolean {
    return this.isInitialized;
  }

  get signedIn(): boolean {
    return this.isSignedIn;
  }

  get userEmail(): string | null {
    if (!this.isSignedIn) return null;
    
    try {
      const profile = this.gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();
      return profile.getEmail();
    } catch (error) {
      console.error('Failed to get user email:', error);
      return null;
    }
  }
}
