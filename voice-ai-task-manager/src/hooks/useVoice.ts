import { useState, useEffect, useCallback, useRef } from 'react';
import { VoiceState, UserPreferences } from '../types';
import { VoiceService } from '../services/voiceService';

export function useVoice(preferences: UserPreferences) {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    transcript: '',
    confidence: 0
  });

  const voiceServiceRef = useRef<VoiceService | null>(null);
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    if (preferences.voiceEnabled) {
      voiceServiceRef.current = new VoiceService();
    }
  }, [preferences.voiceEnabled]);

  const startListening = useCallback(() => {
    if (!voiceServiceRef.current || !preferences.voiceEnabled) return false;

    const success = voiceServiceRef.current.startListening(
      (transcript, isFinal) => {
        setVoiceState(prev => ({
          ...prev,
          transcript: isFinal ? transcript : transcript,
          confidence: isFinal ? 0.9 : 0.5
        }));

        if (isFinal) {
          finalTranscriptRef.current = transcript;
        }
      },
      (error) => {
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
        setVoiceState(prev => ({
          ...prev,
          isListening: false
        }));
      }
    );

    return success;
  }, [preferences.voiceEnabled]);

  const stopListening = useCallback(() => {
    if (voiceServiceRef.current) {
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
    const transcript = finalTranscriptRef.current;
    finalTranscriptRef.current = '';
    return transcript;
  }, []);

  const clearError = useCallback(() => {
    setVoiceState(prev => ({ ...prev, error: undefined }));
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
