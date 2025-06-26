import { useState, useEffect, useCallback } from 'react';
import { BackgroundAgentService } from '../services/backgroundAgentService';
import { VoiceNotificationService } from '../services/voiceNotificationService';
import { GmailAgentService } from '../services/gmailAgentService';
import { UserPreferences } from '../types';
import { useToast } from './use-toast';

interface UseBackgroundAgentOptions {
  enabled: boolean;
  aggressiveness: 'subtle' | 'normal' | 'proactive';
  checkInterval: number; // milliseconds
}

interface BackgroundAgentState {
  isRunning: boolean;
  lastSuggestion: string | null;
  suggestionCount: number;
  emailMonitoring: boolean;
  error: string | null;
}

export function useBackgroundAgent(
  preferences: UserPreferences, 
  options: UseBackgroundAgentOptions = {
    enabled: true,
    aggressiveness: 'normal',
    checkInterval: 5 * 60 * 1000 // 5 minutes
  }
) {
  const { toast } = useToast();
  
  const [state, setState] = useState<BackgroundAgentState>({
    isRunning: false,
    lastSuggestion: null,
    suggestionCount: 0,
    emailMonitoring: false,
    error: null
  });

  const [services] = useState(() => ({
    backgroundAgent: new BackgroundAgentService(preferences),
    voiceNotifications: new VoiceNotificationService(preferences),
    gmailAgent: new GmailAgentService(preferences)
  }));

  // Update services when preferences change
  useEffect(() => {
    services.backgroundAgent.updatePreferences(preferences);
    services.voiceNotifications.updateConfig(preferences);
    services.gmailAgent.updateConfig(preferences);
  }, [preferences, services]);

  // Setup notification callbacks
  useEffect(() => {
    // Background agent suggestions
    services.backgroundAgent.onNotification(async (message, type) => {
      console.log(`🤖 Background Agent: ${type} - ${message}`);
      
      setState(prev => ({
        ...prev,
        lastSuggestion: message,
        suggestionCount: prev.suggestionCount + 1
      }));

      // Show toast notification
      toast({
        title: type === 'alert' ? '🚨 Alert' : type === 'coaching' ? '💪 Coaching' : '💡 Suggestion',
        description: message,
        duration: 5000,
      });

      // Play voice notification
      await services.voiceNotifications.playBackgroundSuggestion(message, type);
    });

    // Gmail agent email analysis
    services.gmailAgent.onEmailAnalysis(async (analysis) => {
      console.log('📧 Email Analysis:', analysis);
      
      if (analysis.shouldNotify) {
        const taskCount = analysis.extractedTasks.length;
        
        if (taskCount > 0) {
          toast({
            title: '📧 New Email Tasks',
            description: `${taskCount} actionable item${taskCount > 1 ? 's' : ''} found in recent emails`,
            duration: 4000,
          });
          
          await services.voiceNotifications.playEmailNotification(taskCount);
        } else if (analysis.urgency === 'urgent' || analysis.urgency === 'high') {
          toast({
            title: '📧 Important Email',
            description: `${analysis.urgency} priority email received`,
            duration: 4000,
          });
          
          await services.voiceNotifications.playPriorityAlert();
        }
      }
    });
  }, [services, toast]);

  // Start background monitoring
  const startAgent = useCallback(async () => {
    if (!options.enabled) return false;

    try {
      setState(prev => ({ ...prev, isRunning: true, error: null }));

      // Start background agent
      services.backgroundAgent.start({
        enabled: true,
        checkInterval: options.checkInterval,
        aggressiveness: options.aggressiveness
      });

      // Start Gmail monitoring if enabled
      if (preferences.googleIntegration?.enabled && preferences.googleIntegration?.gmailEnabled) {
        const gmailStarted = await services.gmailAgent.startMonitoring();
        setState(prev => ({ ...prev, emailMonitoring: gmailStarted }));
        
        if (gmailStarted) {
          toast({
            title: '📧 Gmail Agent Started',
            description: 'Now monitoring emails for actionable items',
            duration: 3000,
          });
        }
      }

      toast({
        title: '🤖 Background Agent Started',
        description: `Monitoring every ${Math.floor(options.checkInterval / 60000)} minutes`,
        duration: 3000,
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ 
        ...prev, 
        isRunning: false, 
        error: errorMessage 
      }));
      
      toast({
        title: '❌ Agent Start Failed',
        description: errorMessage,
        variant: 'destructive',
        duration: 4000,
      });
      
      return false;
    }
  }, [options, preferences, services, toast]);

  // Stop background monitoring
  const stopAgent = useCallback(() => {
    services.backgroundAgent.stop();
    services.gmailAgent.stopMonitoring();
    
    setState(prev => ({
      ...prev,
      isRunning: false,
      emailMonitoring: false,
      error: null
    }));

    toast({
      title: '🤖 Background Agent Stopped',
      description: 'Monitoring disabled',
      duration: 2000,
    });
  }, [services, toast]);

  // Manual trigger functions
  const triggerManualCheck = useCallback(async () => {
    if (!state.isRunning) return;

    try {
      // Trigger background agent analysis
      await (services.backgroundAgent as any).performBackgroundAnalysis();
      
      toast({
        title: '🔄 Manual Check Complete',
        description: 'Background analysis triggered',
        duration: 2000,
      });
    } catch (error) {
      console.error('Manual check failed:', error);
    }
  }, [state.isRunning, services, toast]);

  const triggerEmailCheck = useCallback(async () => {
    if (!state.emailMonitoring) return [];

    try {
      const analyses = await services.gmailAgent.manualEmailCheck();
      const actionable = analyses.filter(a => a.isActionable);
      
      if (actionable.length > 0) {
        toast({
          title: '📧 Email Check Complete',
          description: `Found ${actionable.length} actionable email${actionable.length > 1 ? 's' : ''}`,
          duration: 3000,
        });
      }
      
      return actionable;
    } catch (error) {
      console.error('Email check failed:', error);
      return [];
    }
  }, [state.emailMonitoring, services, toast]);

  const getEmailTasks = useCallback(async () => {
    if (!state.emailMonitoring) return [];
    
    try {
      return await services.gmailAgent.getEmailTasks();
    } catch (error) {
      console.error('Get email tasks failed:', error);
      return [];
    }
  }, [state.emailMonitoring, services]);

  // Test functions
  const testVoiceNotifications = useCallback(async () => {
    await services.voiceNotifications.testAllNotifications();
  }, [services]);

  const playCustomCelebration = useCallback(async (taskTitle: string) => {
    await services.voiceNotifications.playCelebration(taskTitle);
  }, [services]);

  // Auto-start on mount if enabled
  useEffect(() => {
    if (options.enabled && !state.isRunning) {
      startAgent();
    }
    
    return () => {
      stopAgent();
    };
  }, [options.enabled]); // Only trigger on enabled change

  return {
    // State
    state,
    
    // Control methods
    startAgent,
    stopAgent,
    
    // Manual triggers
    triggerManualCheck,
    triggerEmailCheck,
    getEmailTasks,
    
    // Voice testing
    testVoiceNotifications,
    playCustomCelebration,
    
    // Service access
    services
  };
}
