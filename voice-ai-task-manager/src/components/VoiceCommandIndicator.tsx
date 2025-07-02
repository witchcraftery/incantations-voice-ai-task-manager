import React from 'react';
import { Command, Zap, CheckCircle2, Search, Timer, Calendar } from 'lucide-react';
import { Badge } from './ui/badge';
import { VoiceCommand } from '../services/voiceCommandParser';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceCommandIndicatorProps {
  command?: VoiceCommand;
  isProcessing?: boolean;
}

export function VoiceCommandIndicator({ command, isProcessing }: VoiceCommandIndicatorProps) {
  if (!command || command.type === 'none') {
    return null;
  }

  const getCommandIcon = (type: string) => {
    switch (type) {
      case 'quick_task':
        return <Zap className="h-3 w-3" />;
      case 'mark_complete':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'change_priority':
        return <Command className="h-3 w-3" />;
      case 'search_tasks':
        return <Search className="h-3 w-3" />;
      case 'start_timer':
        return <Timer className="h-3 w-3" />;
      case 'show_agenda':
        return <Calendar className="h-3 w-3" />;
      default:
        return <Command className="h-3 w-3" />;
    }
  };

  const getCommandLabel = (type: string) => {
    switch (type) {
      case 'quick_task':
        return 'Creating Task';
      case 'mark_complete':
        return 'Marking Complete';
      case 'change_priority':
        return 'Updating Priority';
      case 'search_tasks':
        return 'Searching Tasks';
      case 'start_timer':
        return 'Starting Timer';
      case 'show_agenda':
        return 'Loading Agenda';
      default:
        return 'Processing Command';
    }
  };

  const getCommandColor = (type: string) => {
    switch (type) {
      case 'quick_task':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'mark_complete':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'change_priority':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      case 'search_tasks':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'start_timer':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'show_agenda':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const confidenceLevel = command.confidence;
  const confidenceColor = confidenceLevel >= 0.8 ? 'text-green-600' : 
                         confidenceLevel >= 0.6 ? 'text-yellow-600' : 'text-red-600';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -10 }}
        transition={{ duration: 0.2 }}
        className="fixed top-4 right-4 z-50"
      >
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-3 shadow-lg max-w-sm">
          <div className="flex items-center gap-3">
            <Badge className={`${getCommandColor(command.type)} flex items-center gap-1`}>
              {getCommandIcon(command.type)}
              {getCommandLabel(command.type)}
            </Badge>
            
            {isProcessing && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            )}
          </div>
          
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="font-medium truncate">
              "{command.originalText}"
            </div>
            
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500">
                Confidence: <span className={confidenceColor}>
                  {Math.round(confidenceLevel * 100)}%
                </span>
              </span>
              
              {command.parameters && Object.keys(command.parameters).length > 0 && (
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  {command.action}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}