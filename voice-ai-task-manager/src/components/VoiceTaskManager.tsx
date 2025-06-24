import React, { useState, useEffect } from 'react';
import { Brain, Settings, Mic, CheckCircle2, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ChatInterface } from './ChatInterface';
import { TaskDashboard } from './TaskDashboard';
import { ConversationSidebar } from './ConversationSidebar';
import { SettingsDialog } from './SettingsDialog';
import { useTheme } from './ThemeProvider';
import { useChat } from '../hooks/useChat';
import { useTasks } from '../hooks/useTasks';
import { useVoice } from '../hooks/useVoice';
import { StorageService } from '../services/storageService';
import { UserPreferences } from '../types';
import { motion } from 'framer-motion';

export function VoiceTaskManager() {
  const { theme, setTheme } = useTheme();
  
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const storage = new StorageService();
    return storage.loadPreferences();
  });
  const [activeTab, setActiveTab] = useState('tasks');
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const {
    currentConversation,
    conversations,
    isProcessing,
    sendMessage,
    startNewConversation,
    selectConversation,
    deleteConversation,
    updateConversationTitle,
    getConversationSummary
  } = useChat();

  const {
    tasks,
    completeTask,
    reopenTask,
    updateTask,
    deleteTask
  } = useTasks();

  const { speak } = useVoice(preferences);

  // Save preferences when they change
  useEffect(() => {
    const storage = new StorageService();
    storage.savePreferences(preferences);
  }, [preferences]);

  // Sync theme with preferences
  useEffect(() => {
    setTheme(preferences.theme);
  }, [preferences.theme, setTheme]);

  // Sync preferences when theme changes externally
  useEffect(() => {
    if (theme !== preferences.theme) {
      setPreferences(prev => ({ ...prev, theme }));
    }
  }, [theme, preferences.theme]);

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

  const handleToggleComplete = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      if (task.status === 'completed') {
        reopenTask(taskId);
      } else {
        completeTask(taskId);
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
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden">
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ x: sidebarVisible ? 0 : -320 }}
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Conversational task management powered by AI
                  </p>
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
            </div>

            <SettingsDialog 
              preferences={preferences}
              onPreferencesChange={setPreferences}
            />
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="border-b bg-white dark:bg-gray-950 px-4">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="chat" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="tasks" className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Tasks ({stats.totalTasks})
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
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
