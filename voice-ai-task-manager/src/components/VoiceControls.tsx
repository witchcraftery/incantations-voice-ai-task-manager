import React from 'react';
import { Mic, MicOff, Volume2, VolumeX, Square, Keyboard } from 'lucide-react';
import { Button } from './ui/button';
import { useVoice } from '../hooks/useVoice';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { UserPreferences } from '../types';
import { motion } from 'framer-motion';

interface VoiceControlsProps {
  preferences: UserPreferences;
  onTranscript: (transcript: string) => void;
  onStartListening?: () => void;
  onStopListening?: () => void;
  onAutoSend?: (transcript: string) => void;
}

export function VoiceControls({
  preferences,
  onTranscript,
  onStartListening,
  onStopListening,
  onAutoSend,
}: VoiceControlsProps) {
  const {
    voiceState,
    startListening,
    stopListening,
    stopSpeaking,
    getFinalTranscript,
    isSupported,
    clearError,
  } = useVoice(preferences, onAutoSend);

  const handleStartListening = () => {
    const success = startListening();
    if (success) {
      onStartListening?.();
    }
  };

  const handleStopListening = () => {
    stopListening();
    onStopListening?.();

    // Get the final transcript with fallback to displayed transcript
    const finalTranscript = getFinalTranscript();
    const transcriptToSend = finalTranscript || voiceState.transcript.trim();

    if (transcriptToSend) {
      console.log('🎤 Sending voice transcript:', transcriptToSend);
      onTranscript(transcriptToSend);
    } else {
      console.warn('⚠️ No transcript captured');
    }
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
  };

  // Keyboard shortcuts for voice control
  const { shortcuts } = useKeyboardShortcuts({
    onToggleVoice: voiceState.isListening
      ? handleStopListening
      : handleStartListening,
    onStopVoice: handleStopListening,
    isVoiceActive: voiceState.isListening,
    enabled: preferences.voiceEnabled && isSupported(),
  });

  if (!preferences.voiceEnabled || !isSupported()) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {/* Voice Status Indicator */}
      {voiceState.transcript && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm max-w-xs truncate"
        >
          {voiceState.transcript}
        </motion.div>
      )}

      {/* Keyboard Shortcuts Hint */}
      {!voiceState.isListening && (
        <div
          className="hidden lg:flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400"
          title="Keyboard shortcuts available"
        >
          <Keyboard className="h-3 w-3" />
          <span>{shortcuts.toggle}</span>
        </div>
      )}

      {/* Listening Button */}
      <Button
        variant={voiceState.isListening ? 'destructive' : 'default'}
        size="icon"
        onClick={
          voiceState.isListening ? handleStopListening : handleStartListening
        }
        disabled={voiceState.isProcessing}
        className="relative"
        title={
          voiceState.isListening
            ? 'Stop recording (Esc)'
            : 'Start recording (Ctrl+Shift+V or Space)'
        }
      >
        {voiceState.isListening ? (
          <>
            <MicOff className="h-4 w-4" />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-red-500"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          </>
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>

      {/* Stop Speaking Button */}
      {voiceState.isSpeaking && (
        <Button
          variant="outline"
          size="icon"
          onClick={handleStopSpeaking}
          className="relative"
        >
          <Square className="h-4 w-4" />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-orange-500"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          />
        </Button>
      )}

      {/* Voice State Indicators */}
      <div className="flex items-center gap-1">
        {voiceState.isSpeaking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1 text-orange-600 dark:text-orange-400"
          >
            <Volume2 className="h-3 w-3" />
            <span className="text-xs">Speaking</span>
          </motion.div>
        )}

        {voiceState.isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1 text-blue-600 dark:text-blue-400"
          >
            <div className="h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Processing</span>
          </motion.div>
        )}

        {voiceState.isListening && !voiceState.transcript && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1 text-green-600 dark:text-green-400"
          >
            <div className="h-2 w-2 bg-green-600 rounded-full animate-pulse" />
            <span className="text-xs">Listening</span>
          </motion.div>
        )}
      </div>

      {/* Error Display */}
      {voiceState.error && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded text-xs cursor-pointer flex items-center gap-1"
          onClick={clearError}
          title="Click to dismiss"
        >
          {voiceState.error.includes('network') && (
            <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse" />
          )}
          <span>
            {voiceState.error.includes('network')
              ? 'Reconnecting...'
              : voiceState.error}
          </span>
        </motion.div>
      )}
    </div>
  );
}
