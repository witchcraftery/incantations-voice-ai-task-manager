import { useEffect, useCallback } from 'react';

interface UseKeyboardShortcutsProps {
  onToggleVoice?: () => void;
  onStopVoice?: () => void;
  isVoiceActive?: boolean;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onToggleVoice,
  onStopVoice,
  isVoiceActive = false,
  enabled = true
}: UseKeyboardShortcutsProps) {

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Ignore if user is typing in an input field
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      return;
    }

    // Ctrl/Cmd + Shift + V = Toggle voice recording
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'v') {
      event.preventDefault();
      onToggleVoice?.();
      return;
    }

    // Space bar = Push-to-talk (hold to record, release to auto-send)
    if (event.code === 'Space' && !event.repeat) {
      event.preventDefault();
      if (!isVoiceActive) {
        onToggleVoice?.();
      }
      return;
    }

    // Escape = Stop recording immediately
    if (event.key === 'Escape' && isVoiceActive) {
      event.preventDefault();
      onStopVoice?.();
      return;
    }
  }, [enabled, onToggleVoice, onStopVoice, isVoiceActive]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      return;
    }

    // Release space bar = Stop recording (triggers auto-send)
    if (event.code === 'Space' && isVoiceActive) {
      event.preventDefault();
      onStopVoice?.();
      return;
    }
  }, [enabled, onStopVoice, isVoiceActive]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp, enabled]);

  return {
    shortcuts: {
      toggle: 'Ctrl/Cmd + Shift + V',
      pushToTalk: 'Space (hold)',
      stop: 'Escape'
    }
  };
}
