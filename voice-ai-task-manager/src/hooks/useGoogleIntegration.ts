import { useState, useEffect, useCallback } from 'react';
import { GoogleCalendarService, CalendarEvent } from '../services/googleCalendarService';
import { GmailService, GmailMessage, EmailTask } from '../services/gmailService';
import { Task } from '../types';

interface GoogleConfig {
  clientId: string;
  apiKey: string;
  enabled: boolean;
}

interface GoogleIntegrationState {
  calendar: {
    connected: boolean;
    events: CalendarEvent[];
    todaysEvents: CalendarEvent[];
    loading: boolean;
    error?: string;
  };
  gmail: {
    connected: boolean;
    messages: GmailMessage[];
    emailTasks: EmailTask[];
    loading: boolean;
    error?: string;
  };
}

export function useGoogleIntegration(config: GoogleConfig) {
  const [calendarService] = useState(() => new GoogleCalendarService({
    clientId: config.clientId,
    apiKey: config.apiKey,
    discoveryDoc: 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
    scopes: ['https://www.googleapis.com/auth/calendar.readonly']
  }));

  const [gmailService] = useState(() => new GmailService({
    clientId: config.clientId,
    apiKey: config.apiKey,
    scopes: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify'
    ]
  }));

  const [state, setState] = useState<GoogleIntegrationState>({
    calendar: {
      connected: false,
      events: [],
      todaysEvents: [],
      loading: false
    },
    gmail: {
      connected: false,
      messages: [],
      emailTasks: [],
      loading: false
    }
  });

  // Initialize services
  useEffect(() => {
    if (!config.enabled) return;

    const initializeServices = async () => {
      try {
        // Initialize calendar
        const calendarInitialized = await calendarService.initialize();
        if (calendarInitialized && calendarService.signedIn) {
          setState(prev => ({
            ...prev,
            calendar: { ...prev.calendar, connected: true }
          }));
          loadCalendarData();
        }

        // Initialize Gmail
        const gmailInitialized = await gmailService.initialize();
        if (gmailInitialized && gmailService.signedIn) {
          setState(prev => ({
            ...prev,
            gmail: { ...prev.gmail, connected: true }
          }));
          loadGmailData();
        }
      } catch (error) {
        console.error('Failed to initialize Google services:', error);
      }
    };

    initializeServices();
  }, [config.enabled, config.clientId, config.apiKey]);

  const connectCalendar = useCallback(async () => {
    if (!config.enabled) return false;

    setState(prev => ({
      ...prev,
      calendar: { ...prev.calendar, loading: true, error: undefined }
    }));

    try {
      const success = await calendarService.signIn();
      
      setState(prev => ({
        ...prev,
        calendar: {
          ...prev.calendar,
          connected: success,
          loading: false,
          error: success ? undefined : 'Failed to connect to Google Calendar'
        }
      }));

      if (success) {
        await loadCalendarData();
      }

      return success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        calendar: {
          ...prev.calendar,
          connected: false,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
      return false;
    }
  }, [config.enabled]);

  const connectGmail = useCallback(async () => {
    if (!config.enabled) return false;

    setState(prev => ({
      ...prev,
      gmail: { ...prev.gmail, loading: true, error: undefined }
    }));

    try {
      const success = await gmailService.signIn();
      
      setState(prev => ({
        ...prev,
        gmail: {
          ...prev.gmail,
          connected: success,
          loading: false,
          error: success ? undefined : 'Failed to connect to Gmail'
        }
      }));

      if (success) {
        await loadGmailData();
      }

      return success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        gmail: {
          ...prev.gmail,
          connected: false,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
      return false;
    }
  }, [config.enabled]);

  const loadCalendarData = useCallback(async () => {
    if (!state.calendar.connected) return;

    setState(prev => ({
      ...prev,
      calendar: { ...prev.calendar, loading: true }
    }));

    try {
      // Get today's events and upcoming events
      const [todaysEvents, upcomingEvents] = await Promise.all([
        calendarService.getTodaysEvents(),
        calendarService.getUpcomingEvents(7)
      ]);

      setState(prev => ({
        ...prev,
        calendar: {
          ...prev.calendar,
          events: upcomingEvents,
          todaysEvents,
          loading: false,
          error: undefined
        }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        calendar: {
          ...prev.calendar,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load calendar data'
        }
      }));
    }
  }, [state.calendar.connected]);

  const loadGmailData = useCallback(async () => {
    if (!state.gmail.connected) return;

    setState(prev => ({
      ...prev,
      gmail: { ...prev.gmail, loading: true }
    }));

    try {
      const messages = await gmailService.getRecentMessages(20);
      const emailTasks = gmailService.extractTasksFromEmails(messages);

      setState(prev => ({
        ...prev,
        gmail: {
          ...prev.gmail,
          messages,
          emailTasks,
          loading: false,
          error: undefined
        }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        gmail: {
          ...prev.gmail,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load Gmail data'
        }
      }));
    }
  }, [state.gmail.connected]);

  const disconnectCalendar = useCallback(async () => {
    await calendarService.signOut();
    setState(prev => ({
      ...prev,
      calendar: {
        connected: false,
        events: [],
        todaysEvents: [],
        loading: false,
        error: undefined
      }
    }));
  }, []);

  const disconnectGmail = useCallback(async () => {
    await gmailService.signOut();
    setState(prev => ({
      ...prev,
      gmail: {
        connected: false,
        messages: [],
        emailTasks: [],
        loading: false,
        error: undefined
      }
    }));
  }, []);

  // Extract tasks from calendar events
  const getCalendarTasks = useCallback((): Partial<Task>[] => {
    if (!state.calendar.connected || state.calendar.events.length === 0) {
      return [];
    }

    const extractedTasks = calendarService.extractTasksFromEvents(state.calendar.events);
    
    return extractedTasks.map(task => ({
      id: `cal-${Date.now()}-${Math.random()}`,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: 'pending' as const,
      dueDate: task.dueDate,
      tags: task.tags,
      project: task.project,
      createdAt: new Date(),
      updatedAt: new Date(),
      extractedFrom: 'google-calendar'
    }));
  }, [state.calendar.connected, state.calendar.events]);

  // Convert email tasks to regular tasks
  const getEmailTasks = useCallback((): Partial<Task>[] => {
    if (!state.gmail.connected || state.gmail.emailTasks.length === 0) {
      return [];
    }

    return state.gmail.emailTasks.map(emailTask => ({
      id: `email-${emailTask.sourceEmail.messageId}`,
      title: emailTask.title,
      description: emailTask.description,
      priority: emailTask.priority,
      status: 'pending' as const,
      dueDate: emailTask.dueDate,
      tags: emailTask.tags,
      project: 'Email Tasks',
      createdAt: new Date(),
      updatedAt: new Date(),
      extractedFrom: 'gmail'
    }));
  }, [state.gmail.connected, state.gmail.emailTasks]);

  // Check for conflicts between tasks and calendar events
  const checkTaskConflicts = useCallback(async (taskDueDate: Date) => {
    if (!state.calendar.connected) return [];
    
    try {
      return await calendarService.checkForConflicts(taskDueDate);
    } catch (error) {
      console.error('Failed to check for conflicts:', error);
      return [];
    }
  }, [state.calendar.connected]);

  // Refresh data
  const refreshCalendarData = useCallback(() => {
    if (state.calendar.connected) {
      loadCalendarData();
    }
  }, [state.calendar.connected, loadCalendarData]);

  const refreshGmailData = useCallback(() => {
    if (state.gmail.connected) {
      loadGmailData();
    }
  }, [state.gmail.connected, loadGmailData]);

  const refreshAllData = useCallback(() => {
    refreshCalendarData();
    refreshGmailData();
  }, [refreshCalendarData, refreshGmailData]);

  // Get summary information
  const getSummary = useCallback(() => {
    const calendarTasks = getCalendarTasks();
    const emailTasks = getEmailTasks();
    
    return {
      calendar: {
        connected: state.calendar.connected,
        eventsToday: state.calendar.todaysEvents.length,
        eventsWeek: state.calendar.events.length,
        extractedTasks: calendarTasks.length
      },
      gmail: {
        connected: state.gmail.connected,
        unreadMessages: state.gmail.messages.length,
        extractedTasks: emailTasks.length
      },
      totalExtractedTasks: calendarTasks.length + emailTasks.length
    };
  }, [state, getCalendarTasks, getEmailTasks]);

  return {
    // State
    state,
    
    // Connection methods
    connectCalendar,
    connectGmail,
    disconnectCalendar,
    disconnectGmail,
    
    // Data methods
    refreshCalendarData,
    refreshGmailData,
    refreshAllData,
    
    // Task extraction
    getCalendarTasks,
    getEmailTasks,
    checkTaskConflicts,
    
    // Utilities
    getSummary,
    
    // Services (for advanced usage)
    calendarService,
    gmailService
  };
}
