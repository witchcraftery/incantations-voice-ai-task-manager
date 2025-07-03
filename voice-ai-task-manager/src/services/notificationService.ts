import { UserPreferences } from '../types';

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  badge?: string;
  data?: any;
  requireInteraction?: boolean;
  silent?: boolean;
}

export class NotificationService {
  private isEnabled = false;
  private permission: NotificationPermission = 'default';

  constructor() {
    this.permission = this.getPermission();
    this.isEnabled = this.permission === 'granted';
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      this.permission = await Notification.requestPermission();
      this.isEnabled = this.permission === 'granted';
      return this.isEnabled;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  private getPermission(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  async showNotification(options: NotificationOptions): Promise<boolean> {
    if (!this.isEnabled) {
      console.warn('Notifications not enabled');
      return false;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag,
        badge: options.badge,
        data: options.data,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
      });

      // Auto-close after 5 seconds unless requireInteraction is true
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }

  // Specific notification types for task management
  async notifyTaskDue(taskTitle: string, dueTime: string): Promise<boolean> {
    return this.showNotification({
      title: '⏰ Task Due Soon!',
      body: `"${taskTitle}" is due ${dueTime}`,
      tag: 'task-due',
      requireInteraction: true,
      data: { type: 'task-due', taskTitle },
    });
  }

  async notifyTaskOverdue(taskTitle: string): Promise<boolean> {
    return this.showNotification({
      title: '🚨 Overdue Task!',
      body: `"${taskTitle}" is overdue and needs attention`,
      tag: 'task-overdue',
      requireInteraction: true,
      data: { type: 'task-overdue', taskTitle },
    });
  }

  async notifyDailyAgenda(taskCount: number): Promise<boolean> {
    return this.showNotification({
      title: '📋 Daily Agenda Ready!',
      body: `You have ${taskCount} tasks planned for today. Ready to be productive?`,
      tag: 'daily-agenda',
      data: { type: 'daily-agenda', taskCount },
    });
  }

  async notifyTaskCompleted(taskTitle: string): Promise<boolean> {
    return this.showNotification({
      title: '✅ Task Completed!',
      body: `Great job finishing "${taskTitle}"!`,
      tag: 'task-completed',
      data: { type: 'task-completed', taskTitle },
    });
  }

  async notifySmartSuggestion(suggestion: string): Promise<boolean> {
    return this.showNotification({
      title: '💡 Smart Suggestion',
      body: suggestion,
      tag: 'smart-suggestion',
      data: { type: 'suggestion', suggestion },
    });
  }

  // Check if notifications are supported and enabled
  get isSupported(): boolean {
    return 'Notification' in window;
  }

  get hasPermission(): boolean {
    return this.permission === 'granted';
  }

  get permissionStatus(): NotificationPermission {
    return this.permission;
  }
}

export const notificationService = new NotificationService();
