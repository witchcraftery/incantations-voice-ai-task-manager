import React, { useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

interface FloatingChatBubbleProps {
  onClick: () => void;
  className?: string;
}

export function FloatingChatBubble({ onClick, className }: FloatingChatBubbleProps) {
  // Add keyboard shortcut Ctrl+Shift+C
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'C') {
        event.preventDefault();
        onClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClick]);

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Button
              onClick={onClick}
              size="lg"
              className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
              aria-label="Open chat (Ctrl+Shift+C)"
            >
              <MessageSquare className="h-6 w-6 text-white" />
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          <p>Open Chat</p>
          <p className="text-xs text-muted-foreground">Ctrl+Shift+C</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
