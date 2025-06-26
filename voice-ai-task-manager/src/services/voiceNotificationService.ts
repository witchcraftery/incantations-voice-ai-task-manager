import { VoiceService } from './voiceService';
import { UserPreferences } from '../types';

interface VoiceNotificationConfig {
  enabled: boolean;
  useKokoro: boolean;
  kokoroVoice: string;
  volume: number;
  celebrationSounds: boolean;
}

export class VoiceNotificationService {
  private voiceService: VoiceService;
  private config: VoiceNotificationConfig;
  
  // Notification sound library
  private notifications = {
    // Cheerful alerts
    updates: [
      "Hey! Updates are here!",
      "You've got updates!",
      "Fresh updates just dropped!",
      "Something new for you!"
    ],
    
    // Email notifications  
    email: [
      "Mail call!",
      "You've got mail!",
      "New email just landed!",
      "Inbox update!"
    ],
    
    // Priority alerts
    priority: [
      "You're going to want to see this...",
      "High priority item!",
      "This needs your attention!",
      "Important update!"
    ],
    
    // Task completions
    celebration: [
      "Hell yeah!",
      "Boom! Task crushed!",
      "Another one bites the dust!",
      "Victory achieved!",
      "You're on fire!",
      "Task mastery!",
      "Productivity legend!"
    ],
    
    // Coaching/motivation
    coaching: [
      "You've got this!",
      "Time to shine!",
      "Let's make it happen!",
      "Productivity mode: activated!",
      "Focus time!"
    ],
    
    // Time-based
    morning: [
      "Good morning, productivity champion!",
      "Time to conquer the day!",
      "Morning momentum awaits!",
      "Let's start strong!"
    ],
    
    afternoon: [
      "Afternoon focus time!",
      "Deep work mode engaged!",
      "Time for the important stuff!",
      "Let's tackle this!"
    ],
    
    evening: [
      "Final stretch time!",
      "Let's finish strong!",
      "End of day push!",
      "Wrap it up!"
    ]
  };

  constructor(preferences: UserPreferences) {
    this.voiceService = new VoiceService();
    this.config = {
      enabled: preferences.voiceEnabled && preferences.notificationSettings?.enabled,
      useKokoro: preferences.voiceSettings.useKokoro,
      kokoroVoice: preferences.voiceSettings.kokoroVoice,
      volume: preferences.voiceSettings.volume,
      celebrationSounds: preferences.notificationSettings?.celebrateCompletions || false
    };
  }

  // Update configuration
  updateConfig(preferences: UserPreferences) {
    this.config = {
      enabled: preferences.voiceEnabled && preferences.notificationSettings?.enabled,
      useKokoro: preferences.voiceSettings.useKokoro,
      kokoroVoice: preferences.voiceSettings.kokoroVoice,
      volume: preferences.voiceSettings.volume,
      celebrationSounds: preferences.notificationSettings?.celebrateCompletions || false
    };
  }

  // Main notification methods
  async playUpdateNotification() {
    if (!this.config.enabled) return;
    const message = this.getRandomMessage('updates');
    await this.speak(message);
  }

  async playEmailNotification(emailCount?: number) {
    if (!this.config.enabled) return;
    const baseMessage = this.getRandomMessage('email');
    const message = emailCount ? `${baseMessage} ${emailCount} new message${emailCount > 1 ? 's' : ''}!` : baseMessage;
    await this.speak(message);
  }

  async playPriorityAlert(taskTitle?: string) {
    if (!this.config.enabled) return;
    const baseMessage = this.getRandomMessage('priority');
    const message = taskTitle ? `${baseMessage} ${taskTitle}` : baseMessage;
    await this.speak(message);
  }

  async playCelebration(taskTitle?: string) {
    if (!this.config.enabled || !this.config.celebrationSounds) return;
    
    const celebration = this.getRandomMessage('celebration');
    const message = taskTitle ? `${celebration} "${taskTitle}" is done!` : celebration;
    await this.speak(message);
  }

  async playCoachingMessage(message: string) {
    if (!this.config.enabled) return;
    const encouragement = this.getRandomMessage('coaching');
    const fullMessage = `${encouragement} ${message}`;
    await this.speak(fullMessage);
  }

  // Time-based notifications
  async playMorningGreeting() {
    if (!this.config.enabled) return;
    const message = this.getRandomMessage('morning');
    await this.speak(message);
  }

  async playAfternoonFocus() {
    if (!this.config.enabled) return;
    const message = this.getRandomMessage('afternoon');
    await this.speak(message);
  }

  async playEveningWrapup() {
    if (!this.config.enabled) return;
    const message = this.getRandomMessage('evening');
    await this.speak(message);
  }

  // Custom message
  async playCustomMessage(text: string, type: 'normal' | 'celebration' | 'alert' = 'normal') {
    if (!this.config.enabled) return;
    
    let prefix = '';
    if (type === 'celebration') {
      prefix = this.getRandomMessage('celebration') + ' ';
    } else if (type === 'alert') {
      prefix = this.getRandomMessage('priority') + ' ';
    }
    
    await this.speak(prefix + text);
  }

  // Background agent integration
  async playBackgroundSuggestion(suggestion: string, type: 'coaching' | 'suggestion' | 'alert') {
    if (!this.config.enabled) return;
    
    switch (type) {
      case 'coaching':
        await this.playCoachingMessage(suggestion);
        break;
      case 'alert':
        await this.playPriorityAlert(suggestion);
        break;
      case 'suggestion':
        await this.speak(`💡 ${suggestion}`);
        break;
    }
  }

  // Utility methods
  private getRandomMessage(category: keyof typeof this.notifications): string {
    const messages = this.notifications[category];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  private async speak(text: string) {
    try {
      await this.voiceService.speak(text, {
        useKokoro: this.config.useKokoro,
        voice: this.config.useKokoro ? this.config.kokoroVoice : undefined,
        volume: this.config.volume,
        rate: 1.0,
        pitch: 1.0
      });
    } catch (error) {
      console.error('❌ Voice notification failed:', error);
    }
  }

  // Test all notification types
  async testAllNotifications() {
    if (!this.config.enabled) {
      console.log('Voice notifications disabled');
      return;
    }

    console.log('🔊 Testing voice notifications...');
    
    await this.playUpdateNotification();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await this.playEmailNotification(3);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await this.playCelebration('Test Task');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await this.playCoachingMessage('You can knock out 3 quick tasks!');
    
    console.log('✅ Voice notification test complete');
  }
}
