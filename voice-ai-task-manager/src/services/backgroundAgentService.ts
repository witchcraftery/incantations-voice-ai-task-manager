// Temporary simplified version for deployment
export class BackgroundAgentService {
  private preferences: any;

  constructor(preferences: any) {
    this.preferences = preferences;
  }

  start(config: any) {
    console.log('🤖 Background Agent (simplified) started');
  }

  stop() {
    console.log('🤖 Background Agent stopped');
  }

  onNotification(callback: any) {
    // Simplified callback registration
  }

  updatePreferences(preferences: any) {
    this.preferences = preferences;
  }
}
