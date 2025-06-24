import { VoiceState } from '../types';

export class VoiceService {
  private recognition: any | null = null;
  private synthesis: SpeechSynthesis;
  private isInitialized = false;
  private kokoroApiUrl = 'http://0.0.0.0:8880';
  private kokoroVoices = [
    'af_aoede', 'af_jadzia', 'hf_alpha',
    'af', 'af_bella', 'af_nicole', 'af_sarah', 'af_sky', 'am_adam', 'am_michael', 
    'bf_emma', 'bf_isabella', 'bm_george', 'bm_lewis', 'us_male', 'us_female'
  ];

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.initializeSpeechRecognition();
  }

  private initializeSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;
    
    this.isInitialized = true;
  }

  startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (error: string) => void,
    onStart: () => void,
    onEnd: () => void
  ): boolean {
    if (!this.recognition || !this.isInitialized) {
      onError('Speech recognition not available');
      return false;
    }

    try {
      this.recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        onResult(finalTranscript || interimTranscript, !!finalTranscript);
      };

      this.recognition.onerror = (event) => {
        onError(`Speech recognition error: ${event.error}`);
      };

      this.recognition.onstart = onStart;
      this.recognition.onend = onEnd;

      this.recognition.start();
      return true;
    } catch (error) {
      onError(`Failed to start speech recognition: ${error}`);
      return false;
    }
  }

  stopListening() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  async speak(
    text: string,
    options: {
      rate?: number;
      pitch?: number;
      volume?: number;
      voice?: string;
      useKokoro?: boolean;
    } = {}
  ): Promise<void> {
    // Try Kokoro first if enabled and voice is Kokoro voice
    if (options.useKokoro && this.isKokoroVoice(options.voice)) {
      try {
        await this.speakWithKokoro(text, options.voice, options);
        return;
      } catch (error) {
        console.warn('Kokoro TTS failed, falling back to Web Speech API:', error);
        // Fall through to Web Speech API
      }
    }

    // Web Speech API fallback
    return this.speakWithWebAPI(text, options);
  }

  private async speakWithKokoro(
    text: string, 
    voice: string = 'af_bella',
    options: any = {}
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(`${this.kokoroApiUrl}/v1/audio/speech`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'kokoro',
            input: text,
            voice: voice,
            response_format: 'wav',
            speed: options.rate || 1.0
          })
        });

        if (!response.ok) {
          throw new Error(`Kokoro API error: ${response.status}`);
        }

        const audioBlob = await response.blob();
        const audio = new Audio(URL.createObjectURL(audioBlob));
        
        audio.onended = () => resolve();
        audio.onerror = () => reject(new Error('Audio playback failed'));
        
        audio.volume = options.volume || 1;
        await audio.play();
      } catch (error) {
        reject(error);
      }
    });
  }

  private speakWithWebAPI(
    text: string,
    options: {
      rate?: number;
      pitch?: number;
      volume?: number;
      voice?: string;
    } = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not available'));
        return;
      }

      // Cancel any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      utterance.rate = options.rate || 1;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;

      if (options.voice && !this.isKokoroVoice(options.voice)) {
        const voices = this.synthesis.getVoices();
        const selectedVoice = voices.find(voice => voice.name === options.voice);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`));

      this.synthesis.speak(utterance);
    });
  }

  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  getAvailableVoices(): Array<{name: string, displayName: string, type: 'web' | 'kokoro'}> {
    const webVoices = this.synthesis ? this.synthesis.getVoices().map(voice => ({
      name: voice.name,
      displayName: `${voice.name} (${voice.lang})`,
      type: 'web' as const
    })) : [];

    const kokoroVoicesFormatted = this.kokoroVoices.map(voice => ({
      name: voice,
      displayName: `${voice.replace('_', ' ')} (Kokoro)`,
      type: 'kokoro' as const
    }));

    return [...kokoroVoicesFormatted, ...webVoices];
  }

  getKokoroVoices(): string[] {
    return this.kokoroVoices;
  }

  private isKokoroVoice(voice?: string): boolean {
    return voice ? this.kokoroVoices.includes(voice) : false;
  }

  async testKokoroConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.kokoroApiUrl}/docs`, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  isSupported(): boolean {
    return this.isInitialized && !!this.synthesis;
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
