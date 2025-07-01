import React, { useState, useEffect } from 'react';
import { Brain, Settings, Mic, CheckCircle2, MessageSquare, Bot } from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { TooltipProvider } from './ui/tooltip';
import { ChatInterface } from './ChatInterface';
import { TaskDashboard } from './TaskDashboard';
import { ConversationSidebar } from './ConversationSidebar';
import { SettingsDialog } from './SettingsDialog';
import { DocumentationModal } from './DocumentationModal';
import { ProductivityInsights } from './ProductivityInsights';
import { AIStatusIndicator } from './AIStatusIndicator';
import { LoginButton } from './auth/LoginButton';
import { UserMenu } from './auth/UserMenu';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from './ThemeProvider';
import { useChat } from '../hooks/useChat';
import { useTasks } from '../hooks/useTasks';
import { useVoice } from '../hooks/useVoice';
import { useNotifications } from '../hooks/useNotifications';
// import { useBackgroundAgent } from '../hooks/useBackgroundAgent';
import { StorageService } from '../services/storageService';
import { AnalyticsService } from '../services/analyticsService';
import { UserPreferences } from '../types';
import { motion } from 'framer-motion';

export function VoiceTaskManager() {
  const { theme, setTheme } = useTheme();
  const { user, loading: authLoading, updatePreferences: updateCloudPreferences } = useAuth();
  
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const storage = new StorageService();
    return storage.loadPreferences();
  });
  const [activeTab, setActiveTab] = useState('tasks');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);

  // Enhanced preferences handler that syncs to cloud if authenticated
  const handlePreferencesChange = async (newPreferences: UserPreferences) => {
    setPreferences(newPreferences);
    
    // Save to localStorage for offline access
    const storage = new StorageService();
    storage.savePreferences(newPreferences);
    
    // If user is authenticated, also save to cloud
    if (user) {
      try {
        await updateCloudPreferences(newPreferences);
      } catch (error) {
        console.error('Failed to sync preferences to cloud:', error);
        // Could show a toast notification here
      }
    }
  };

  // Auto-minimize sidebar on Tasks view, expand on Chat view
  useEffect(() => {
    setSidebarMinimized(activeTab === 'tasks');
  }, [activeTab]);

  const {
    currentConversation,
    conversations,
    isProcessing,
    sendMessage,
    startNewConversation,
    selectConversation,
    deleteConversation,
    updateConversationTitle,
    getConversationSummary,
    getServiceInfo
  } = useChat(preferences);

  const {
    tasks,
    completeTask,
    reopenTask,
    updateTask,
    deleteTask
  } = useTasks();

  const { speak } = useVoice(preferences);

  // Analytics service for productivity insights
  const analyticsService = new AnalyticsService();
  const patterns = analyticsService.calculateProductivityPatterns();
  const energyWindows = analyticsService.detectEnergyWindows();
  const recommendations = analyticsService.calculateTaskOrder(tasks);

  // Initialize background agent
  // const backgroundAgent = useBackgroundAgent(preferences, {
  //   enabled: preferences.notificationSettings?.enabled || false,
  //   aggressiveness: 'normal',
  //   checkInterval: 5 * 60 * 1000 // 5 minutes
  // });

  const {
    requestPermission: requestNotificationPermission,
    sendDailyAgenda,
    celebrateCompletion,
    sendSuggestion,
    hasPermission: hasNotificationPermission
  } = useNotifications(tasks, { enabled: true });

  // Save preferences when they change
  useEffect(() => {
    const storage = new StorageService();
    storage.savePreferences(preferences);
  }, [preferences]);

  // Sync theme with preferences (one-way only)
  useEffect(() => {
    setTheme(preferences.theme);
  }, [preferences.theme, setTheme]);

  // Remove the circular sync - let preferences control theme, not vice versa

  // Daily agenda notification (9 AM daily)
  useEffect(() => {
    const scheduleAgenda = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(9, 0, 0, 0);
      
      // If it's past 9 AM today, schedule for tomorrow
      if (now > target) {
        target.setDate(target.getDate() + 1);
      }
      
      const timeUntilTarget = target.getTime() - now.getTime();
      
      setTimeout(() => {
        sendDailyAgenda();
        // Schedule next day
        scheduleAgenda();
      }, timeUntilTarget);
    };

    scheduleAgenda();
  }, [sendDailyAgenda]);

  // Smart suggestions based on task patterns
  useEffect(() => {
    const checkForSuggestions = () => {
      const now = new Date();
      const hour = now.getHours();
      
      // Morning productivity suggestion (10 AM)
      if (hour === 10) {
        const pendingTasks = tasks.filter(t => t.status === 'pending');
        const quickTasks = pendingTasks.filter(t => t.priority === 'low').slice(0, 3);
        
        if (quickTasks.length >= 3) {
          sendSuggestion(`You could knock out ${quickTasks.length} quick tasks now to build momentum!`);
        }
      }
      
      // End of day reminder (5 PM)
      if (hour === 17) {
        const todayTasks = tasks.filter(task => {
          if (!task.dueDate) return false;
          const taskDate = new Date(task.dueDate);
          return taskDate.toDateString() === now.toDateString() && task.status !== 'completed';
        });
        
        if (todayTasks.length > 0) {
          sendSuggestion(`You have ${todayTasks.length} tasks due today. Need a final push?`);
        }
      }
    };

    // Check every hour
    const interval = setInterval(checkForSuggestions, 60 * 60 * 1000);
    
    // Initial check
    checkForSuggestions();
    
    return () => clearInterval(interval);
  }, [tasks, sendSuggestion]);

  const handleSendMessage = async (content: string, isVoiceInput = false) => {
    try {
      const response = await sendMessage(content, isVoiceInput);
      
      // Auto-speak AI responses if enabled
      if (preferences.autoSpeak && preferences.voiceEnabled) {
        await speak(response);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleToggleComplete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      if (task.status === 'completed') {
        reopenTask(taskId);
      } else {
        completeTask(taskId);
        // Celebrate task completion with notification AND voice
        await celebrateCompletion(task.title);
        // await backgroundAgent.playCustomCelebration(task.title);
      }
    }
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const stats = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    totalConversations: conversations.length,
    messagesCount: conversations.reduce((sum, conv) => sum + conv.messages.length, 0)
  };

  return (
    <TooltipProvider>
      <div className="h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden">
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ 
          x: sidebarVisible ? 0 : (sidebarMinimized ? -240 : -320),
          width: sidebarMinimized ? 80 : 320 
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="absolute left-0 top-0 h-full z-10 md:relative md:z-0"
      >
        <ConversationSidebar
          conversations={conversations}
          currentConversationId={currentConversation?.id}
          onSelectConversation={selectConversation}
          onNewConversation={startNewConversation}
          onDeleteConversation={deleteConversation}
          onUpdateTitle={updateConversationTitle}
          getConversationSummary={getConversationSummary}
          minimized={sidebarMinimized}
          onToggleMinimized={() => setSidebarMinimized(!sidebarMinimized)}
          settingsComponent={
            <SettingsDialog 
              preferences={preferences}
              onPreferencesChange={handlePreferencesChange}
            />
          }
          docsComponent={<DocumentationModal />}
        />
      </motion.div>

      {/* Overlay for mobile */}
      {sidebarVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-0 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="md:hidden"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Voice AI Task Manager
                  </h1>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Conversational task management powered by AI
                    </p>
                    <AIStatusIndicator 
                      {...getServiceInfo()} 
                      className="ml-2" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="hidden lg:flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-gray-600 dark:text-gray-400">
                  {stats.completedTasks}/{stats.totalTasks} tasks
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <span className="text-gray-600 dark:text-gray-400">
                  {stats.messagesCount} messages
                </span>
              </div>
              {preferences.voiceEnabled && (
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-purple-600" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Voice enabled
                  </span>
                </div>
              )}
              {/* {backgroundAgent.state.isRunning && (
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-orange-600" />
                  <span className="text-gray-600 dark:text-gray-400">
                    AI Agent active
                  </span>
                  {backgroundAgent.state.emailMonitoring && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Gmail
                    </span>
                  )}
                </div>
              )} */}
            </div>

            <div className="flex items-center gap-3">
              {/* Auth Components */}
              {!authLoading && (
                <>
                  {user ? (
                    <UserMenu />
                  ) : (
                    <div className="w-48">
                      <LoginButton />
                    </div>
                  )}
                </>
              )}
              {/* Removed Settings and Docs from header - moved to sidebar */}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="border-b bg-white dark:bg-gray-950 px-4">
              <TabsList className="grid w-full max-w-lg grid-cols-3">
                <TabsTrigger value="chat" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="tasks" className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Tasks ({stats.totalTasks})
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-2">
                  <Brain className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="chat" className="h-full m-0">
                <ChatInterface
                  messages={currentConversation?.messages || []}
                  isProcessing={isProcessing}
                  preferences={preferences}
                  onSendMessage={handleSendMessage}
                  onSpeak={speak}
                />
              </TabsContent>

              <TabsContent value="tasks" className="h-full m-0">
                <TaskDashboard
                  tasks={tasks}
                  onToggleComplete={handleToggleComplete}
                  onEditTask={updateTask}
                  onDeleteTask={deleteTask}
                />
              </TabsContent>

              <TabsContent value="analytics" className="h-full m-0">
                <ProductivityInsights 
                  tasks={tasks}
                  patterns={patterns}
                  energyWindows={energyWindows}
                  recommendations={recommendations}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
}
