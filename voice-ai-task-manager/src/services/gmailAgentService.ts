// Temporary simplified version for deployment
export class GmailAgentService {
  private preferences: any;
  private config: any;

  constructor(preferences: any) {
    this.preferences = preferences;
    this.config = {
      enabled: false,
      autoExtract: false,
      smartFiltering: true,
      responseGeneration: false,
      monitoringInterval: 5 * 60 * 1000
    };
  }

  async startMonitoring() {
    console.log('📧 Gmail Agent (simplified) - monitoring disabled for deployment');
    return false;
  }

  stopMonitoring() {
    console.log('📧 Gmail Agent stopped');
  }

  onEmailAnalysis(callback: any) {
    // Simplified callback registration
  }

  async manualEmailCheck() {
    return [];
  }

  async getActionableEmails() {
    return [];
  }

  async getEmailTasks() {
    return [];
  }

  updateConfig(preferences: any) {
    this.preferences = preferences;
  }

  async connect() {
    return false;
  }

  async disconnect() {
    // Disconnect logic
  }

  isConnected() {
    return false;
  }

  getStats() {
    return {
      enabled: this.config.enabled,
      connected: false,
      monitoring: false,
      lastCheck: new Date(),
      autoExtract: this.config.autoExtract
    };
  }
}
