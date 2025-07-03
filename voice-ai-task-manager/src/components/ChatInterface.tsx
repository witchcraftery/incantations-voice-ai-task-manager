import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Mic, Bookmark } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { VoiceControls } from './VoiceControls';
import { Message, UserPreferences } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface ChatInterfaceProps {
  messages: Message[];
  isProcessing: boolean;
  preferences: UserPreferences;
  onSendMessage: (content: string, isVoiceInput?: boolean) => Promise<void>;
  onSpeak: (text: string) => Promise<void>;
  onBookmarkMessage?: (message: Message) => void;
}

export function ChatInterface({
  messages,
  isProcessing,
  preferences,
  onSendMessage,
  onSpeak,
  onBookmarkMessage,
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const [isVoiceInputMode, setIsVoiceInputMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    const message = inputValue.trim();
    setInputValue('');

    try {
      await onSendMessage(message, false);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleVoiceTranscript = async (transcript: string) => {
    if (!transcript.trim()) return;

    console.log('🎤 Manual voice transcript:', transcript);
    try {
      await onSendMessage(transcript, true);
    } catch (error) {
      console.error('Failed to send voice message:', error);
    }
  };

  const handleVoiceAutoSend = async (transcript: string) => {
    if (!transcript.trim()) return;

    console.log('🤖 Auto-sending voice transcript:', transcript);
    try {
      await onSendMessage(transcript, true);
    } catch (error) {
      console.error('Failed to auto-send voice message:', error);
    }
  };

  const handleVoiceInputToggle = () => {
    setIsVoiceInputMode(!isVoiceInputMode);
  };

  const handleMessageSpeak = (content: string) => {
    onSpeak(content);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-white dark:bg-gray-950 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                AI Task Assistant
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Voice-first task management
              </p>
            </div>
          </div>

          {preferences.voiceEnabled && (
            <VoiceControls
              preferences={preferences}
              onTranscript={handleVoiceTranscript}
              onAutoSend={handleVoiceAutoSend}
              onStartListening={() => setIsVoiceInputMode(true)}
              onStopListening={() => setIsVoiceInputMode(false)}
            />
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <AnimatePresence>
            {messages.map(message => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex gap-3 ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.type === 'assistant' && (
                  <div className="flex-shrink-0 p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="whitespace-pre-wrap">{message.content}</p>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {message.type === 'assistant' &&
                        preferences.voiceEnabled && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMessageSpeak(message.content)}
                            className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                            title="Read aloud"
                          >
                            <Mic className="h-3 w-3" />
                          </Button>
                        )}

                      {onBookmarkMessage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onBookmarkMessage(message)}
                          className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                          title="Bookmark this message"
                        >
                          <Bookmark className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span
                      className={`text-xs ${
                        message.type === 'user'
                          ? 'text-blue-200'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {formatDistanceToNow(message.timestamp, {
                        addSuffix: true,
                      })}
                    </span>

                    {message.isVoiceInput && (
                      <div
                        className={`flex items-center gap-1 text-xs ${
                          message.type === 'user'
                            ? 'text-blue-200'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        <Mic className="h-3 w-3" />
                        <span>Voice</span>
                      </div>
                    )}

                    {message.extractedTasks &&
                      message.extractedTasks.length > 0 && (
                        <div
                          className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                            message.type === 'user'
                              ? 'bg-blue-500 text-blue-100'
                              : 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                          }`}
                        >
                          <span>{message.extractedTasks.length} task(s)</span>
                        </div>
                      )}
                  </div>

                  {message.metadata && (
                    <div className="mt-2 text-xs opacity-75">
                      <span>
                        Confidence:{' '}
                        {Math.round(message.metadata.confidence * 100)}%
                      </span>
                      <span className="ml-2">
                        Processing: {message.metadata.processingTime}ms
                      </span>
                    </div>
                  )}
                </div>

                {message.type === 'user' && (
                  <div className="flex-shrink-0 p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="flex-shrink-0 p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    AI is thinking...
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t bg-white dark:bg-gray-950 p-4">
        {isVoiceInputMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border-2 border-blue-200 dark:border-blue-800"
          >
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Mic className="h-4 w-4" />
              <span className="text-sm font-medium">
                Listening for voice input...
              </span>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Speak naturally about your tasks and projects
            </p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Tell me about your tasks, or use voice input..."
            disabled={isProcessing}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!inputValue.trim() || isProcessing}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>

        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {preferences.voiceEnabled
            ? 'Type, use voice input, or try keyboard shortcuts: Ctrl+Shift+V (toggle) • Space (hold) • Esc (stop)'
            : 'Type to describe your tasks naturally'}
        </div>
      </div>
    </div>
  );
}
