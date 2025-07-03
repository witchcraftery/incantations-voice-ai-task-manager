export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  location?: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  created: string;
  updated: string;
  htmlLink: string;
}

export interface CalendarConfig {
  clientId: string;
  apiKey: string;
  discoveryDoc: string;
  scopes: string[];
}

export class GoogleCalendarService {
  private gapi: any = null;
  private isInitialized = false;
  private isSignedIn = false;
  private config: CalendarConfig;

  constructor(config: CalendarConfig) {
    this.config = {
      discoveryDoc:
        'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
      ...config,
    };
  }

  async initialize(): Promise<boolean> {
    try {
      // Load Google API script if not already loaded
      if (!window.gapi) {
        await this.loadGoogleAPI();
      }

      this.gapi = window.gapi;

      // Initialize the API
      await this.gapi.load('client:auth2', async () => {
        await this.gapi.client.init({
          apiKey: this.config.apiKey,
          clientId: this.config.clientId,
          discoveryDocs: [this.config.discoveryDoc],
          scope: this.config.scopes.join(' '),
        });

        this.isInitialized = true;
        this.isSignedIn = this.gapi.auth2.getAuthInstance().isSignedIn.get();
      });

      return this.isInitialized;
    } catch (error) {
      console.error('Failed to initialize Google Calendar:', error);
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
      console.error('Google Calendar sign-in failed:', error);
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
      console.error('Google Calendar sign-out failed:', error);
    }
  }

  async getEvents(
    timeMin?: Date,
    timeMax?: Date,
    maxResults: number = 50
  ): Promise<CalendarEvent[]> {
    if (!this.isSignedIn) {
      throw new Error('Not signed in to Google Calendar');
    }

    try {
      const now = new Date();
      const params: any = {
        calendarId: 'primary',
        timeMin: (timeMin || now).toISOString(),
        timeMax: (
          timeMax || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        ).toISOString(),
        showDeleted: false,
        singleEvents: true,
        maxResults,
        orderBy: 'startTime',
      };

      const response = await this.gapi.client.calendar.events.list(params);
      return response.result.items || [];
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
      return [];
    }
  }

  async getTodaysEvents(): Promise<CalendarEvent[]> {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    );

    return this.getEvents(startOfDay, endOfDay);
  }

  async getUpcomingEvents(days: number = 7): Promise<CalendarEvent[]> {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return this.getEvents(now, future);
  }

  // Extract actionable tasks from calendar events
  extractTasksFromEvents(events: CalendarEvent[]): Array<{
    title: string;
    description: string;
    dueDate: Date;
    priority: 'low' | 'medium' | 'high';
    tags: string[];
    project?: string;
  }> {
    const tasks: Array<any> = [];

    events.forEach(event => {
      const eventDate = new Date(
        event.start.dateTime || event.start.date || ''
      );

      // Extract preparation tasks for meetings
      if (this.isMeeting(event)) {
        tasks.push({
          title: `Prepare for ${event.summary}`,
          description: `Prepare for meeting: ${event.summary}${event.description ? ` - ${event.description}` : ''}`,
          dueDate: new Date(eventDate.getTime() - 30 * 60 * 1000), // 30 minutes before
          priority: this.determinePriority(event),
          tags: ['meeting', 'preparation'],
          project: 'Meetings',
        });
      }

      // Extract follow-up tasks
      if (this.isMeeting(event) && eventDate < new Date()) {
        tasks.push({
          title: `Follow up on ${event.summary}`,
          description: `Send follow-up after meeting: ${event.summary}`,
          dueDate: new Date(eventDate.getTime() + 24 * 60 * 60 * 1000), // Next day
          priority: 'medium',
          tags: ['follow-up', 'meeting'],
          project: 'Meetings',
        });
      }

      // Extract deadline-based tasks
      if (this.isDeadlineEvent(event)) {
        tasks.push({
          title: event.summary.replace(/deadline|due/i, '').trim(),
          description: `Deadline: ${event.summary}${event.description ? ` - ${event.description}` : ''}`,
          dueDate: eventDate,
          priority: 'high',
          tags: ['deadline'],
          project: 'Deadlines',
        });
      }
    });

    return tasks;
  }

  private isMeeting(event: CalendarEvent): boolean {
    return (
      !!(event.attendees && event.attendees.length > 0) ||
      event.summary.toLowerCase().includes('meeting') ||
      event.summary.toLowerCase().includes('call') ||
      event.summary.toLowerCase().includes('sync')
    );
  }

  private isDeadlineEvent(event: CalendarEvent): boolean {
    const summary = event.summary.toLowerCase();
    return (
      summary.includes('deadline') ||
      summary.includes('due') ||
      summary.includes('submit') ||
      summary.includes('deliver')
    );
  }

  private determinePriority(event: CalendarEvent): 'low' | 'medium' | 'high' {
    const summary = event.summary.toLowerCase();
    const attendeeCount = event.attendees?.length || 0;

    if (summary.includes('urgent') || summary.includes('critical'))
      return 'high';
    if (attendeeCount > 5) return 'high';
    if (attendeeCount > 2) return 'medium';

    return 'low';
  }

  // Check for conflicts with task due dates
  async checkForConflicts(taskDueDate: Date): Promise<CalendarEvent[]> {
    const startTime = new Date(taskDueDate.getTime() - 60 * 60 * 1000); // 1 hour before
    const endTime = new Date(taskDueDate.getTime() + 60 * 60 * 1000); // 1 hour after

    const events = await this.getEvents(startTime, endTime);
    return events.filter(event => {
      const eventStart = new Date(
        event.start.dateTime || event.start.date || ''
      );
      const eventEnd = new Date(event.end.dateTime || event.end.date || '');

      return eventStart <= taskDueDate && eventEnd >= taskDueDate;
    });
  }

  // Getters for status
  get initialized(): boolean {
    return this.isInitialized;
  }

  get signedIn(): boolean {
    return this.isSignedIn;
  }

  get userEmail(): string | null {
    if (!this.isSignedIn) return null;

    try {
      const profile = this.gapi.auth2
        .getAuthInstance()
        .currentUser.get()
        .getBasicProfile();
      return profile.getEmail();
    } catch (error) {
      console.error('Failed to get user email:', error);
      return null;
    }
  }
}
