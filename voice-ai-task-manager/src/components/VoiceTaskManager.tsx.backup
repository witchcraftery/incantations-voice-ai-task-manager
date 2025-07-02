import React, { useState, useEffect, useCallback } from 'react';
import { Brain, Settings, Mic, CheckCircle2, MessageSquare, Bookmark, BarChart3 } from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { TooltipProvider } from './ui/tooltip';
import { ChatInterface } from './ChatInterface';
import { TaskDashboard } from './TaskDashboard';
import { ConversationSidebar } from './ConversationSidebar';
import { SettingsDialog } from './SettingsDialog';
import { DocumentationModal } from './DocumentationModal';
import { AIStatusIndicator } from './AIStatusIndicator';
import { VoiceCommandIndicator } from './VoiceCommandIndicator';
import { BookmarkPanel } from './BookmarkPanel';
import { BookmarkDialog } from './BookmarkDialog';
import { ProductivityInsights } from './ProductivityInsights';
import { useTheme } from './ThemeProvider';
import { useChat } from '../hooks/useChat';
import { useTasks } from '../hooks/useTasks';
import { useVoice } from '../hooks/useVoice';
import { useNotifications } from '../hooks/useNotifications';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useBookmarks } from '../hooks/useBookmarks';
import { StorageService } from '../services/storageService';
import { UserPreferences, Message, ConversationBookmark } from '../types';
import { VoiceCommand, VoiceCommandParser, TaskEditResult } from '../services/voiceCommandParser';
import { motion } from 'framer-motion';

export function VoiceTaskManager() {
  const { theme, setTheme } = useTheme();
  
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const storage = new StorageService();
    return storage.loadPreferences();
  });
  const [activeTab, setActiveTab] = useState('tasks');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [currentVoiceCommand, setCurrentVoiceCommand] = useState<VoiceCommand | null>(null);
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  const [bookmarkPanelVisible, setBookmarkPanelVisible] = useState(false);
  const [bookmarkDialogOpen, setBookmarkDialogOpen] = useState(false);
  const [selectedMessageForBookmark, setSelectedMessageForBookmark] = useState<Message | null>(null);
  const [bookmarkToEdit, setBookmarkToEdit] = useState<ConversationBookmark | null>(null);

  // Initialize voice command parser
  const voiceCommandParser = new VoiceCommandParser();

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
    selectedTaskIds,
    addTask,
    completeTask,
    reopenTask,
    updateTask,
    deleteTask,
    toggleTaskSelection,
    selectAllTasks,
    clearSelection,
    bulkUpdateTasks,
    bulkDeleteTasks,
    createTaskFromTemplate,
    searchTasks,
    getTasksByStatus,
    startTimer,
    stopTimer,
    getActiveTimers,
    getProductivityPatterns,
    getEnergyWindows,
    getTaskRecommendations
  } = useTasks();

  // We'll create the voice service after defining the handler

  // Voice command handler
  const handleVoiceCommand = useCallback(async (command: VoiceCommand) => {
    console.log('🎯 Processing voice command:', command);
    
    setCurrentVoiceCommand(command);
    setIsProcessingCommand(true);
    
    try {
      switch (command.type) {
        case 'quick_task': {
          const taskData = command.parameters;
          const newTask = addTask({
            title: taskData.title,
            description: taskData.description || taskData.title,
            priority: taskData.priority || 'medium',
            status: 'pending',
            project: taskData.project,
            tags: taskData.tags || [],
            timeEntries: [],
            totalTimeSpent: 0
          });
          
          // Speak confirmation
          if (preferences.autoSpeak && preferences.voiceEnabled) {
            await speak(`Task "${taskData.title}" has been added to your list.`);
          }
          break;
        }

        case 'mark_complete': {
          const taskToComplete = tasks.find(task => 
            task.title.toLowerCase().includes(command.parameters.taskIdentifier.toLowerCase())
          );
          
          if (taskToComplete) {
            completeTask(taskToComplete.id);
            if (preferences.autoSpeak && preferences.voiceEnabled) {
              await speak(`Task "${taskToComplete.title}" has been marked as complete.`);
            }
          } else {
            if (preferences.autoSpeak && preferences.voiceEnabled) {
              await speak(`I couldn't find a task matching "${command.parameters.taskIdentifier}".`);
            }
          }
          break;
        }

        case 'change_priority': {
          const taskToUpdate = tasks.find(task => 
            task.title.toLowerCase().includes(command.parameters.taskIdentifier.toLowerCase())
          );
          
          if (taskToUpdate) {
            updateTask(taskToUpdate.id, { priority: command.parameters.newValue });
            if (preferences.autoSpeak && preferences.voiceEnabled) {
              await speak(`Task "${taskToUpdate.title}" priority set to ${command.parameters.newValue}.`);
            }
          } else {
            if (preferences.autoSpeak && preferences.voiceEnabled) {
              await speak(`I couldn't find a task matching "${command.parameters.taskIdentifier}".`);
            }
          }
          break;
        }

        case 'search_tasks':
          setActiveTab('tasks');
          // The search functionality will be handled by TaskDashboard
          if (preferences.autoSpeak && preferences.voiceEnabled) {
            const matchingTasks = searchTasks(command.parameters.query);
            await speak(`Found ${matchingTasks.length} tasks matching "${command.parameters.query}".`);
          }
          break;

        case 'show_agenda': {
          setActiveTab('tasks');
          const todayTasks = getTasksByStatus('pending').filter(task => {
            if (!task.dueDate) return false;
            const today = new Date();
            const taskDate = new Date(task.dueDate);
            return taskDate.toDateString() === today.toDateString();
          });
          
          if (preferences.autoSpeak && preferences.voiceEnabled) {
            if (todayTasks.length === 0) {
              await speak("You have no tasks scheduled for today. Great job staying on top of things!");
            } else {
              const taskTitles = todayTasks.slice(0, 3).map(task => task.title).join(', ');
              await speak(`You have ${todayTasks.length} tasks today. Your top priorities are: ${taskTitles}.`);
            }
          }
          break;
        }

        case 'start_timer':
          // This would integrate with a timer/pomodoro feature
          if (preferences.autoSpeak && preferences.voiceEnabled) {
            await speak(`Starting a ${command.parameters.duration} minute focus timer.`);
          }
          // TODO: Implement timer functionality
          break;

        case 'edit_title': {
          const editParams = command.parameters as TaskEditResult;
          const matchingTasks = voiceCommandParser.findTasksByIdentifier(tasks, editParams.taskIdentifier);
          
          if (matchingTasks.length === 1) {
            const task = matchingTasks[0];
            updateTask(task.id, { title: editParams.newValue });
            if (preferences.autoSpeak && preferences.voiceEnabled) {
              await speak(`Task title changed to "${editParams.newValue}".`);
            }
          } else if (matchingTasks.length > 1) {
            if (preferences.autoSpeak && preferences.voiceEnabled) {
              await speak(`I found ${matchingTasks.length} tasks matching "${editParams.taskIdentifier}". Please be more specific.`);
            }
          } else {
            if (preferences.autoSpeak && preferences.voiceEnabled) {
              await speak(`I couldn't find a task matching "${editParams.taskIdentifier}".`);
            }
          }
          break;
        }

        case 'edit_description': {
          const editParams = command.parameters as TaskEditResult;
          const matchingTasks = voiceCommandParser.findTasksByIdentifier(tasks, editParams.taskIdentifier);
          
          if (matchingTasks.length === 1) {
            const task = matchingTasks[0];
            updateTask(task.id, { description: editParams.newValue });
            if (preferences.autoSpeak && preferences.voiceEnabled) {
              await speak(`Task description updated for "${task.title}".`);
            }
          } else if (matchingTasks.length > 1) {
            if (preferences.autoSpeak && preferences.voiceEnabled) {
              await speak(`I found ${matchingTasks.length} tasks matching "${editParams.taskIdentifier}". Please be more specific.`);
            }
          } else {
            if (preferences.autoSpeak && preferences.voiceEnabled) {
              await speak(`I couldn't find a task matching "${editParams.taskIdentifier}".`);
            }
          }
          break;
        }

        case 'edit_project': {
          const editParams = command.parameters as TaskEditResult;
          const matchingTasks = voiceCommandParser.findTasksByIdentifier(tasks, editParams.taskIdentifier);
          
          if (matchingTasks.length === 1) {
            const task = matchingTasks[0];
            updateTask(task.id, { project: editParams.newValue });
            if (preferences.autoSpeak && preferences.voiceEnabled) {
              await speak(`Task "${task.title}" moved to ${editParams.newValue} project.`);
            }
          } else if (matchingTasks.length > 1) {
            if (preferences.autoSpeak && preferences.voiceEnabled) {
              await speak(`I found ${matchingTasks.length} tasks matching "${editParams.taskIdentifier}". Please be more specific.`);
            }
          } else {
            if (preferences.autoSpeak && preferences.voiceEnabled) {
              await speak(`I couldn't find a task matching "${editParams.taskIdentifier}".`);
            }
          }
          break;
        }

        case 'edit_status': {
          const editParams = command.parameters as TaskEditResult;
          const matchingTasks = voiceCommandParser.findTasksByIdentifier(tasks, editParams.taskIdentifier);
          
          if (matchingTasks.length === 1) {
            const task = matchingTasks[0];
            updateTask(task.id, { status: editParams.newValue as any });
            if (preferences.autoSpeak && preferences.voiceEnabled) {
              await speak(`Task "${task.title}" status changed to ${editParams.newValue}.`);
            }
          } else if (matchingTasks.length > 1) {
            if (preferences.autoSpeak && preferences.voiceEnabled) {
              await speak(`I found ${matchingTasks.length} tasks matching "${editParams.taskIdentifier}". Please be more specific.`);
            }
          } else {
            if (preferences.autoSpeak && preferences.voiceEnabled) {
              await speak(`I couldn't find a task matching "${editParams.taskIdentifier}".`);
            }
          }
          break;
        }

        case 'edit_tags': {
          const editParams = command.parameters as TaskEditResult;
          const matchingTasks = voiceCommandParser.findTasksByIdentifier(tasks, editParams.taskIdentifier);
          
          if (matchingTasks.length === 1) {
            const task = matchingTasks[0];
            const currentTags = [...task.tags];
            let newTags: string[];
            
            if (editParams.action === 'add') {
              newTags = [...new Set([...currentTags, ...editParams.newValue])];
            } else if (editParams.action === 'remove') {
              newTags = currentTags.filter(tag => !editParams.newValue.includes(tag));
            } else {
              newTags = editParams.newValue;
            }
            
            updateTask(task.id, { tags: newTags });
            if (preferences.autoSpeak && preferences.voiceEnabled) {
              const action = editParams.action === 'add' ? 'added' : editParams.action === 'remove' ? 'removed' : 'updated';
              await speak(`Tags ${action} for task "${task.title}".`);
            }
          } else if (matchingTasks.length > 1) {
            if (preferences.autoSpeak && preferences.voiceEnabled) {
              await speak(`I found ${matchingTasks.length} tasks matching "${editParams.taskIdentifier}". Please be more specific.`);
            }
          } else {
            if (preferences.autoSpeak && preferences.voiceEnabled) {
              await speak(`I couldn't find a task matching "${editParams.taskIdentifier}".`);
            }
          }
          break;
        }

        case 'edit_due_date': {
          const editParams = command.parameters as TaskEditResult;
          const matchingTasks = voiceCommandParser.findTasksByIdentifier(tasks, editParams.taskIdentifier);
          
          if (matchingTasks.length === 1) {
            const task = matchingTasks[0];
            updateTask(task.id, { dueDate: editParams.newValue });
            if (preferences.autoSpeak && preferences.voiceEnabled) {
              const dueDateText = editParams.dueDateText || 'specified date';
              await speak(`Due date for task "${task.title}" set to ${dueDateText}.`);
            }
          } else if (matchingTasks.length > 1) {
            if (preferences.autoSpeak && preferences.voiceEnabled) {
              await speak(`I found ${matchingTasks.length} tasks matching "${editParams.taskIdentifier}". Please be more specific.`);
            }
          } else {
            if (preferences.autoSpeak && preferences.voiceEnabled) {
              await speak(`I couldn't find a task matching "${editParams.taskIdentifier}".`);
            }
          }
          break;
        }

        default:
          console.log('Unknown voice command type:', command.type);
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
      if (preferences.autoSpeak && preferences.voiceEnabled) {
        await speak("Sorry, I had trouble processing that command. Please try again.");
      }
    } finally {
      // Clear the command indicator after a delay
      setTimeout(() => {
        setCurrentVoiceCommand(null);
        setIsProcessingCommand(false);
      }, 2000);
    }
  }, [tasks, addTask, completeTask, updateTask, searchTasks, getTasksByStatus, preferences, setActiveTab]);

  // Initialize voice service with the command handler
  const { speak } = useVoice(preferences, undefined, handleVoiceCommand);

  const {
    bookmarks,
    createSmartBookmark,
    updateBookmark,
    deleteBookmark,
    toggleStar,
    getBookmarksForConversation,
    navigateToBookmark
  } = useBookmarks();

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
        // Celebrate task completion with notification
        await celebrateCompletion(task.title);
      }
    }
  };

  const handleCreateTask = () => {
    // Focus the chat interface to create a new task via voice or text
    setActiveTab('chat');
    // Could also open a task creation modal here
  };

  const handleFocusSearch = () => {
    // Switch to tasks tab and focus search (handled by TaskDashboard)
    setActiveTab('tasks');
  };

  const handleDeleteSelected = () => {
    if (selectedTaskIds.size > 0) {
      const selectedArray = Array.from(selectedTaskIds);
      if (window.confirm(`Delete ${selectedArray.length} selected task(s)?`)) {
        bulkDeleteTasks(selectedArray);
      }
    }
  };

  const handleToggleSelectedComplete = () => {
    if (selectedTaskIds.size > 0) {
      const selectedArray = Array.from(selectedTaskIds);
      bulkUpdateTasks(selectedArray, { status: 'completed' });
      clearSelection();
    }
  };

  const handleBulkSelect = () => {
    if (selectedTaskIds.size === tasks.length) {
      clearSelection();
    } else {
      selectAllTasks();
    }
  };

  // Bookmark handlers
  const handleBookmarkMessage = useCallback((message: Message) => {
    setSelectedMessageForBookmark(message);
    setBookmarkToEdit(null);
    setBookmarkDialogOpen(true);
  }, []);

  const handleEditBookmark = useCallback((bookmark: ConversationBookmark) => {
    setBookmarkToEdit(bookmark);
    setSelectedMessageForBookmark(null);
    setBookmarkDialogOpen(true);
  }, []);

  const handleNavigateToBookmark = useCallback((bookmark: ConversationBookmark) => {
    // Switch to chat tab if not already there
    setActiveTab('chat');
    
    // Select the conversation containing the bookmark
    const conversation = conversations.find(c => c.id === bookmark.conversationId);
    if (conversation) {
      selectConversation(conversation.id);
      
      // Find message index and scroll to it
      const messageIndex = navigateToBookmark(bookmark, conversation);
      if (messageIndex !== -1) {
        // Scroll to message would be handled by the chat interface
        console.log(`Navigating to message ${bookmark.messageId} at index ${messageIndex}`);
      }
    }
  }, [conversations, selectConversation, navigateToBookmark, setActiveTab]);

  const handleSaveBookmark = useCallback(async (
    title: string,
    description: string,
    tags: string[],
    isStarred: boolean
  ) => {
    try {
      if (bookmarkToEdit) {
        // Update existing bookmark
        await updateBookmark(bookmarkToEdit.id, {
          title,
          description,
          tags,
          isStarred
        });
      } else if (selectedMessageForBookmark && currentConversation) {
        // Create new bookmark
        await createSmartBookmark(
          currentConversation.id,
          selectedMessageForBookmark,
          description
        );
      }
    } catch (error) {
      console.error('Failed to save bookmark:', error);
    }
  }, [bookmarkToEdit, selectedMessageForBookmark, currentConversation, updateBookmark, createSmartBookmark]);

  const toggleBookmarkPanel = () => {
    setBookmarkPanelVisible(!bookmarkPanelVisible);
  };

  // Keyboard shortcuts integration
  useKeyboardShortcuts({
    enabled: true,
    onCreateTask: handleCreateTask,
    onFocusSearch: handleFocusSearch,
    onDeleteSelected: handleDeleteSelected,
    onToggleComplete: handleToggleSelectedComplete,
    onBulkSelect: handleBulkSelect
  });

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
      
      {/* Voice Command Indicator */}
      {currentVoiceCommand && (
        <VoiceCommandIndicator 
          command={currentVoiceCommand} 
          isProcessing={isProcessingCommand} 
        />
      )}
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
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleBookmarkPanel}
                className={`flex items-center gap-2 ${
                  bookmarkPanelVisible ? 'bg-blue-100 dark:bg-blue-900' : ''
                }`}
              >
                <Bookmark className="h-4 w-4" />
                Bookmarks
              </Button>
              <DocumentationModal />
              <SettingsDialog 
                preferences={preferences}
                onPreferencesChange={setPreferences}
              />
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
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="chat" className="h-full m-0">
                <div className="flex h-full">
                  <div className="flex-1">
                    <ChatInterface
                      messages={currentConversation?.messages || []}
                      isProcessing={isProcessing}
                      preferences={preferences}
                      onSendMessage={handleSendMessage}
                      onSpeak={speak}
                      onBookmarkMessage={handleBookmarkMessage}
                    />
                  </div>
                  
                  {/* Bookmark Panel */}
                  <BookmarkPanel
                    bookmarks={bookmarks}
                    conversations={conversations}
                    onNavigateToBookmark={handleNavigateToBookmark}
                    onEditBookmark={handleEditBookmark}
                    onDeleteBookmark={deleteBookmark}
                    onToggleStar={toggleStar}
                    isVisible={bookmarkPanelVisible}
                  />
                </div>
              </TabsContent>

              <TabsContent value="tasks" className="h-full m-0">
                <TaskDashboard
                  tasks={tasks}
                  selectedTaskIds={selectedTaskIds}
                  onToggleComplete={handleToggleComplete}
                  onEditTask={updateTask}
                  onDeleteTask={deleteTask}
                  onStartTimer={startTimer}
                  onStopTimer={stopTimer}
                  onCreateTask={handleCreateTask}
                  onCreateTaskFromTemplate={createTaskFromTemplate}
                  onToggleTaskSelection={toggleTaskSelection}
                  onSelectAllTasks={selectAllTasks}
                  onClearSelection={clearSelection}
                  onBulkUpdateTasks={bulkUpdateTasks}
                  onBulkDeleteTasks={bulkDeleteTasks}
                />
              </TabsContent>

              <TabsContent value="analytics" className="h-full m-0 p-4">
                <ProductivityInsights
                  patterns={getProductivityPatterns()}
                  energyWindows={getEnergyWindows()}
                  recommendations={getTaskRecommendations()}
                  tasks={tasks}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
      
      {/* Bookmark Dialog */}
      <BookmarkDialog
        isOpen={bookmarkDialogOpen}
        onClose={() => setBookmarkDialogOpen(false)}
        onSave={handleSaveBookmark}
        bookmark={bookmarkToEdit}
        message={selectedMessageForBookmark}
        mode={bookmarkToEdit ? 'edit' : 'create'}
      />
    </div>
    </TooltipProvider>
  );
}
