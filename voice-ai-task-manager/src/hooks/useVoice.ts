import { useState, useEffect, useCallback, useRef } from 'react';
import { VoiceState, UserPreferences } from '../types';
import { VoiceService } from '../services/voiceService';

export function useVoice(preferences: UserPreferences, onAutoSend?: (transcript: string) => void) {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    transcript: '',
    confidence: 0
  });

  const voiceServiceRef = useRef<VoiceService | null>(null);
  const finalTranscriptRef = useRef('');
  const accumulatedTranscriptRef = useRef('');
  const isSessionActiveRef = useRef(false);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoSendDelayMs = 2500; // 2.5 seconds of silence triggers auto-send

  useEffect(() => {
    if (preferences.voiceEnabled) {
      voiceServiceRef.current = new VoiceService();
    }
  }, [preferences.voiceEnabled]);

  const startListening = useCallback(() => {
    if (!voiceServiceRef.current || !preferences.voiceEnabled) return false;

    // Reset transcript state for new session
    accumulatedTranscriptRef.current = '';
    finalTranscriptRef.current = '';
    isSessionActiveRef.current = true;

    // Clear any existing timeout
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    const success = voiceServiceRef.current.startListening(
      (transcript, isFinal) => {
        if (!isSessionActiveRef.current) return;

        // Clear existing silence timeout
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }

        if (isFinal) {
          // Accumulate final results with proper spacing
          const cleanTranscript = transcript.trim();
          if (cleanTranscript) {
            accumulatedTranscriptRef.current = accumulatedTranscriptRef.current 
              ? `${accumulatedTranscriptRef.current} ${cleanTranscript}`
              : cleanTranscript;
            
            finalTranscriptRef.current = accumulatedTranscriptRef.current;
          }

          // Update state with accumulated result
          setVoiceState(prev => ({
            ...prev,
            transcript: accumulatedTranscriptRef.current,
            confidence: 0.9
          }));

          // Start auto-send timeout after final transcript
          if (accumulatedTranscriptRef.current.trim()) {
            silenceTimeoutRef.current = setTimeout(() => {
              if (isSessionActiveRef.current && accumulatedTranscriptRef.current.trim()) {
                console.log('🤖 Auto-sending after silence timeout');
                const transcriptToSend = accumulatedTranscriptRef.current.trim();
                
                // Clear the transcript
                accumulatedTranscriptRef.current = '';
                finalTranscriptRef.current = '';
                
                // Clear UI
                setVoiceState(prev => ({
                  ...prev,
                  transcript: '',
                  confidence: 0
                }));

                // Trigger auto-send callback
                if (onAutoSend) {
                  onAutoSend(transcriptToSend);
                }
              }
            }, autoSendDelayMs);
          }
        } else {
          // Show real-time interim with accumulated context
          const interimDisplay = accumulatedTranscriptRef.current 
            ? `${accumulatedTranscriptRef.current} ${transcript}`
            : transcript;

          setVoiceState(prev => ({
            ...prev,
            transcript: interimDisplay,
            confidence: 0.5
          }));
        }
      },
      (error) => {
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
        isSessionActiveRef.current = false;
        setVoiceState(prev => ({
          ...prev,
          error,
          isListening: false
        }));
      },
      () => {
        setVoiceState(prev => ({
          ...prev,
          isListening: true,
          error: undefined
        }));
      },
      () => {
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
        isSessionActiveRef.current = false;
        setVoiceState(prev => ({
          ...prev,
          isListening: false
        }));
      }
    );

    return success;
  }, [preferences.voiceEnabled, onAutoSend]);

  const stopListening = useCallback(() => {
    if (voiceServiceRef.current) {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      isSessionActiveRef.current = false;
      voiceServiceRef.current.stopListening();
    }
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!voiceServiceRef.current || !preferences.voiceEnabled || !preferences.autoSpeak) {
      return;
    }

    try {
      setVoiceState(prev => ({ ...prev, isSpeaking: true }));
      
      await voiceServiceRef.current.speak(text, {
        rate: preferences.voiceSettings.rate,
        pitch: preferences.voiceSettings.pitch,
        volume: preferences.voiceSettings.volume,
        voice: preferences.voiceSettings.useKokoro 
          ? preferences.voiceSettings.kokoroVoice 
          : preferences.voiceSettings.voice,
        useKokoro: preferences.voiceSettings.useKokoro
      });
    } catch (error) {
      console.error('Speech synthesis failed:', error);
    } finally {
      setVoiceState(prev => ({ ...prev, isSpeaking: false }));
    }
  }, [preferences]);

  const stopSpeaking = useCallback(() => {
    if (voiceServiceRef.current) {
      voiceServiceRef.current.stopSpeaking();
      setVoiceState(prev => ({ ...prev, isSpeaking: false }));
    }
  }, []);

  const getAvailableVoices = useCallback(() => {
    return voiceServiceRef.current?.getAvailableVoices() || [];
  }, []);

  const isSupported = useCallback(() => {
    return voiceServiceRef.current?.isSupported() || false;
  }, []);

  const getFinalTranscript = useCallback(() => {
    const transcript = finalTranscriptRef.current || accumulatedTranscriptRef.current;
    
    // Clear refs after retrieval
    finalTranscriptRef.current = '';
    accumulatedTranscriptRef.current = '';
    
    return transcript.trim();
  }, []);

  const clearError = useCallback(() => {
    setVoiceState(prev => ({ ...prev, error: undefined }));
  }, []);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, []);

  return {
    voiceState,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    getAvailableVoices,
    isSupported,
    getFinalTranscript,
    clearError
  };
}
