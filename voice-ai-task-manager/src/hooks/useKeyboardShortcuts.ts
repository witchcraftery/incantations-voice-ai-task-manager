import { useEffect, useCallback } from 'react';

interface UseKeyboardShortcutsProps {
  onToggleVoice?: () => void;
  onStopVoice?: () => void;
  isVoiceActive?: boolean;
  enabled?: boolean;
  // Task operation callbacks
  onCreateTask?: () => void;
  onFocusSearch?: () => void;
  onDeleteSelected?: () => void;
  onToggleComplete?: () => void;
  onBulkSelect?: () => void;
}

export function useKeyboardShortcuts({
  onToggleVoice,
  onStopVoice,
  isVoiceActive = false,
  enabled = true,
  onCreateTask,
  onFocusSearch,
  onDeleteSelected,
  onToggleComplete,
  onBulkSelect
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

    // Task Management Shortcuts
    // Ctrl/Cmd + N = Create new task
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') {
      event.preventDefault();
      onCreateTask?.();
      return;
    }

    // Ctrl/Cmd + F = Focus search
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      onFocusSearch?.();
      return;
    }

    // Delete = Delete selected tasks
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      onDeleteSelected?.();
      return;
    }

    // Enter = Toggle completion for selected task
    if (event.key === 'Enter') {
      event.preventDefault();
      onToggleComplete?.();
      return;
    }

    // Ctrl/Cmd + A = Select all tasks
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      onBulkSelect?.();
      return;
    }
  }, [enabled, onToggleVoice, onStopVoice, isVoiceActive, onCreateTask, onFocusSearch, onDeleteSelected, onToggleComplete, onBulkSelect]);

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
      // Voice shortcuts
      toggle: 'Ctrl/Cmd + Shift + V',
      pushToTalk: 'Space (hold)',
      stop: 'Escape',
      // Task shortcuts
      createTask: 'Ctrl/Cmd + N',
      focusSearch: 'Ctrl/Cmd + F',
      deleteSelected: 'Delete/Backspace',
      toggleComplete: 'Enter',
      selectAll: 'Ctrl/Cmd + A'
    }
  };
}
