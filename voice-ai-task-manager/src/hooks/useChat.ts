import { useState, useCallback, useRef, useEffect } from 'react';
import { Message, Conversation, UserMemory, Task } from '../types';
import { AIService } from '../services/aiService';
import { StorageService } from '../services/storageService';
import { v4 as uuidv4 } from 'uuid';

export function useChat() {
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState<Task[]>([]);

  const aiServiceRef = useRef<AIService | null>(null);
  const storageServiceRef = useRef<StorageService>(new StorageService());

  useEffect(() => {
    // Load data on mount
    const loadedConversations = storageServiceRef.current.loadConversations();
    setConversations(loadedConversations);

    // Initialize AI service with user memory
    const userMemory = storageServiceRef.current.loadUserMemory();
    aiServiceRef.current = new AIService(userMemory);

    // Create initial conversation if none exist
    if (loadedConversations.length === 0) {
      startNewConversation();
    } else {
      setCurrentConversation(loadedConversations[0]);
    }
  }, []);

  const startNewConversation = useCallback(() => {
    const newConversation: Conversation = {
      id: uuidv4(),
      title: `Conversation ${new Date().toLocaleDateString()}`,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setCurrentConversation(newConversation);
    setConversations(prev => [newConversation, ...prev]);
    
    // Save to storage
    const updatedConversations = [newConversation, ...conversations];
    storageServiceRef.current.saveConversations(updatedConversations);
  }, [conversations]);

  const sendMessage = useCallback(async (content: string, isVoiceInput = false): Promise<string> => {
    if (!currentConversation || !aiServiceRef.current) {
      throw new Error('No active conversation or AI service');
    }

    setIsProcessing(true);

    try {
      // Create user message
      const userMessage: Message = {
        id: uuidv4(),
        type: 'user',
        content,
        timestamp: new Date(),
        isVoiceInput,
        extractedTasks: []
      };

      // Update conversation with user message
      const updatedConversation = {
        ...currentConversation,
        messages: [...currentConversation.messages, userMessage],
        updatedAt: new Date()
      };

      setCurrentConversation(updatedConversation);

      // Process with AI
      const aiResponse = await aiServiceRef.current.processMessage(
        content,
        updatedConversation.messages
      );

      // Create assistant message
      const assistantMessage: Message = {
        id: uuidv4(),
        type: 'assistant',
        content: aiResponse.message,
        timestamp: new Date(),
        extractedTasks: aiResponse.extractedTasks.map(task => task.id!),
        metadata: aiResponse.metadata
      };

      // Convert extracted tasks to full Task objects
      const newTasks: Task[] = aiResponse.extractedTasks.map(partialTask => ({
        ...partialTask,
        id: partialTask.id || uuidv4(),
        title: partialTask.title || 'Untitled Task',
        priority: partialTask.priority || 'medium',
        status: partialTask.status || 'pending',
        tags: partialTask.tags || [],
        createdAt: partialTask.createdAt || new Date(),
        updatedAt: partialTask.updatedAt || new Date(),
        extractedFrom: userMessage.id
      })) as Task[];

      // Update extracted tasks
      setExtractedTasks(prev => [...prev, ...newTasks]);

      // Save tasks to storage
      const allTasks = [...storageServiceRef.current.loadTasks(), ...newTasks];
      storageServiceRef.current.saveTasks(allTasks);

      // Update conversation with assistant message
      const finalConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, assistantMessage],
        updatedAt: new Date()
      };

      setCurrentConversation(finalConversation);

      // Update conversations list
      setConversations(prev => {
        const updated = prev.map(conv => 
          conv.id === finalConversation.id ? finalConversation : conv
        );
        storageServiceRef.current.saveConversations(updated);
        return updated;
      });

      return aiResponse.message;
    } catch (error) {
      console.error('Failed to process message:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [currentConversation]);

  const selectConversation = useCallback((conversationId: string) => {
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (conversation) {
      setCurrentConversation(conversation);
    }
  }, [conversations]);

  const deleteConversation = useCallback((conversationId: string) => {
    setConversations(prev => {
      const updated = prev.filter(conv => conv.id !== conversationId);
      storageServiceRef.current.saveConversations(updated);
      return updated;
    });

    if (currentConversation?.id === conversationId) {
      if (conversations.length > 1) {
        const remaining = conversations.filter(conv => conv.id !== conversationId);
        setCurrentConversation(remaining[0]);
      } else {
        startNewConversation();
      }
    }
  }, [conversations, currentConversation, startNewConversation]);

  const clearCurrentConversation = useCallback(() => {
    if (currentConversation) {
      const clearedConversation = {
        ...currentConversation,
        messages: [],
        updatedAt: new Date()
      };

      setCurrentConversation(clearedConversation);
      setConversations(prev => {
        const updated = prev.map(conv =>
          conv.id === clearedConversation.id ? clearedConversation : conv
        );
        storageServiceRef.current.saveConversations(updated);
        return updated;
      });
    }
  }, [currentConversation]);

  const updateConversationTitle = useCallback((conversationId: string, title: string) => {
    setConversations(prev => {
      const updated = prev.map(conv =>
        conv.id === conversationId ? { ...conv, title, updatedAt: new Date() } : conv
      );
      storageServiceRef.current.saveConversations(updated);
      return updated;
    });

    if (currentConversation?.id === conversationId) {
      setCurrentConversation(prev => prev ? { ...prev, title } : null);
    }
  }, [currentConversation]);

  const getConversationSummary = useCallback((conversationId: string): string => {
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (!conversation || conversation.messages.length === 0) {
      return 'Empty conversation';
    }

    const userMessages = conversation.messages
      .filter(msg => msg.type === 'user')
      .slice(0, 3);

    if (userMessages.length === 0) {
      return 'No user messages';
    }

    const summary = userMessages
      .map(msg => msg.content.slice(0, 50))
      .join(', ');

    return summary.length > 100 ? summary.slice(0, 100) + '...' : summary;
  }, [conversations]);

  return {
    currentConversation,
    conversations,
    isProcessing,
    extractedTasks,
    sendMessage,
    startNewConversation,
    selectConversation,
    deleteConversation,
    clearCurrentConversation,
    updateConversationTitle,
    getConversationSummary
  };
}
