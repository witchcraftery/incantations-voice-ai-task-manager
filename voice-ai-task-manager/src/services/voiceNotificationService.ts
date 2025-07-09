import { UserPreferences } from '../types';
import { VoiceService } from './voiceService';

export class VoiceNotificationService {
  private preferences: UserPreferences;
  private isEnabled = false;
  private voiceService: VoiceService;

  constructor(preferences: UserPreferences) {
    this.preferences = preferences;
    this.isEnabled = preferences.voiceEnabled ?? false;
    this.voiceService = new VoiceService();
  }

  updateConfig(preferences: UserPreferences) {
    this.preferences = preferences;
    this.isEnabled = preferences.voiceEnabled ?? false;
  }

  async playBackgroundSuggestion(message: string, type: string) {
    if (!this.isEnabled) return;

    console.log(`🔊 Voice Notification (${type}): ${message}`);
    
    // Use actual TTS for background suggestions
    try {
      await this.voiceService.speak(message, {
        rate: 0.9,
        pitch: 1.0,
        volume: 0.7,
        voice: this.preferences.voiceSettings.useDeepgram 
          ? this.preferences.voiceSettings.deepgramVoice 
          : this.preferences.voiceSettings.voice,
        useDeepgram: this.preferences.voiceSettings.useDeepgram
      });
      
      // Play notification sound after TTS
      this.playNotificationSound(type);
    } catch (error) {
      console.error('TTS failed for background suggestion:', error);
      // Fallback to sound only
      this.playNotificationSound(type);
    }
  }

  async playEmailNotification(taskCount: number) {
    if (!this.isEnabled) return;

    const message = `You have ${taskCount} new task${taskCount > 1 ? 's' : ''} from emails`;
    console.log(`🔊 Email Notification: ${message}`);
    
    try {
      await this.voiceService.speak(message, {
        rate: 1.0,
        pitch: 1.1,
        volume: 0.8,
        voice: this.preferences.voiceSettings.useDeepgram 
          ? this.preferences.voiceSettings.deepgramVoice 
          : this.preferences.voiceSettings.voice,
        useDeepgram: this.preferences.voiceSettings.useDeepgram
      });
      
      this.playNotificationSound('email');
    } catch (error) {
      console.error('TTS failed for email notification:', error);
      this.playNotificationSound('email');
    }
  }

  async playPriorityAlert() {
    if (!this.isEnabled) return;

    const message = 'Important email received that requires your attention';
    console.log('🔊 Priority Alert: Important email received');
    
    try {
      await this.voiceService.speak(message, {
        rate: 1.0,
        pitch: 1.2,
        volume: 0.9,
        voice: this.preferences.voiceSettings.useDeepgram 
          ? this.preferences.voiceSettings.deepgramVoice 
          : this.preferences.voiceSettings.voice,
        useDeepgram: this.preferences.voiceSettings.useDeepgram
      });
      
      this.playNotificationSound('priority');
    } catch (error) {
      console.error('TTS failed for priority alert:', error);
      this.playNotificationSound('priority');
    }
  }

  async playCelebration(taskTitle: string) {
    if (!this.isEnabled) return;

    const celebrationMessages = [
      `Excellent work! You completed ${taskTitle}`,
      `Great job finishing ${taskTitle}!`,
      `Well done! ${taskTitle} is complete`,
      `Amazing! You crushed ${taskTitle}`,
      `Fantastic! ${taskTitle} is done and dusted`
    ];
    
    const message = celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)];
    console.log(`🔊 Celebration: ${message}`);
    
    try {
      await this.voiceService.speak(message, {
        rate: 1.1,
        pitch: 1.3,
        volume: 0.9,
        voice: this.preferences.voiceSettings.useDeepgram 
          ? this.preferences.voiceSettings.deepgramVoice 
          : this.preferences.voiceSettings.voice,
        useDeepgram: this.preferences.voiceSettings.useDeepgram
      });
      
      this.playNotificationSound('celebration');
    } catch (error) {
      console.error('TTS failed for celebration:', error);
      this.playNotificationSound('celebration');
    }
  }

  async testAllNotifications() {
    console.log('🔊 Testing all voice notifications...');

    await this.playBackgroundSuggestion(
      'This is a test suggestion from your AI assistant',
      'suggestion'
    );
    await new Promise(resolve => setTimeout(resolve, 2000));

    await this.playEmailNotification(3);
    await new Promise(resolve => setTimeout(resolve, 2000));

    await this.playPriorityAlert();
    await new Promise(resolve => setTimeout(resolve, 2000));

    await this.playCelebration('Test Task');
  }

  private playNotificationSound(type: string) {
    // Enhanced notification sounds based on type
    try {
      let frequency: number;
      let duration: number;
      
      switch (type) {
        case 'celebration':
          // Play celebratory ascending tones
          this.playTone(523, 100); // C
          setTimeout(() => this.playTone(659, 100), 100); // E
          setTimeout(() => this.playTone(784, 200), 200); // G
          break;
        case 'priority':
          // Play urgent double beep
          this.playTone(800, 150);
          setTimeout(() => this.playTone(800, 150), 200);
          break;
        case 'email':
          // Play gentle notification tone
          this.playTone(600, 200);
          break;
        case 'suggestion':
          // Play soft chime
          this.playTone(520, 150);
          break;
        default:
          // Default notification sound
          this.playTone(440, 200);
      }
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }

  private playTone(frequency: number, duration: number) {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.error('Failed to create audio tone:', error);
    }
  }
}
