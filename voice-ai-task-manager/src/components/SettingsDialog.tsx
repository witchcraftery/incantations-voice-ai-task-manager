import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { notificationService } from '../services/notificationService';
import { Settings, Volume2, Mic, Zap, Play, Check, X } from 'lucide-react';
import { UserPreferences } from '../types';
import { VoiceService } from '../services/voiceService';
import { useToast } from '../hooks/use-toast';

interface SettingsDialogProps {
  preferences: UserPreferences;
  onPreferencesChange: (preferences: UserPreferences) => void;
}

export function SettingsDialog({ preferences, onPreferencesChange }: SettingsDialogProps) {
  const [localPreferences, setLocalPreferences] = useState<UserPreferences>(preferences);
  const [availableVoices, setAvailableVoices] = useState<Array<{name: string, displayName: string, type: 'web' | 'deepgram'}>>([]);
  const [availableAudioInputs, setAvailableAudioInputs] = useState<Array<{deviceId: string, label: string}>>([]);
  const [deepgramConnected, setDeepgramConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(notificationService.permissionStatus);
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const voiceService = new VoiceService();
  const { toast } = useToast();

  useEffect(() => {
    loadVoices();
    loadAudioInputs();
    testDeepgramConnection();
  }, []);

  const loadAudioInputs = async () => {
    const inputs = await voiceService.getAvailableAudioInputs();
    setAvailableAudioInputs(inputs);
  };

  // Auto-save changes with proper change detection and smarter notifications
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const hasChanges = JSON.stringify(localPreferences) !== JSON.stringify(preferences);
      if (hasChanges) {
        console.log('Auto-saving preferences:', localPreferences);
        onPreferencesChange(localPreferences);
        setHasUnsavedChanges(false);
        
        // Only show toast notification if user made actual meaningful changes
        const changedFields = Object.keys(localPreferences).filter(key => 
          JSON.stringify(localPreferences[key as keyof UserPreferences]) !== 
          JSON.stringify(preferences[key as keyof UserPreferences])
        );
        
        if (changedFields.length > 0) {
          toast({
            title: "Settings saved!",
            description: `Updated: ${changedFields.join(', ')}`,
            duration: 2000,
          });
        }
      }
    }, 500); // 500ms debounce for auto-save

    return () => clearTimeout(timeoutId);
  }, [localPreferences, preferences, onPreferencesChange, toast]);

  // Track unsaved changes for UI feedback
  useEffect(() => {
    const hasChanges = JSON.stringify(localPreferences) !== JSON.stringify(preferences);
    setHasUnsavedChanges(hasChanges);
  }, [localPreferences, preferences]);

  // Remove manual save keyboard shortcut since we auto-save
  // useEffect(() => {
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     if ((e.metaKey || e.ctrlKey) && e.key === 's' && hasUnsavedChanges && !isSaving) {
  //       e.preventDefault();
  //       savePreferences();
  //     }
  //   };

  //   document.addEventListener('keydown', handleKeyDown);
  //   return () => document.removeEventListener('keydown', handleKeyDown);
  // }, [hasUnsavedChanges, isSaving]);

  const loadVoices = () => {
    const voices = voiceService.getAvailableVoices();
    setAvailableVoices(voices);
  };

  const testDeepgramConnection = async () => {
    const connected = await voiceService.testDeepgramConnection();
    setDeepgramConnected(connected);
  };

  const handlePreferenceChange = (path: string[], value: any) => {
    const newPreferences = { ...localPreferences };
    let current: any = newPreferences;
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    
    setLocalPreferences(newPreferences);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    // Update local preferences immediately
    const updatedPreferences = {
      ...localPreferences,
      theme: newTheme
    };
    setLocalPreferences(updatedPreferences);
    
    // Apply theme change immediately (no wait for auto-save)
    onPreferencesChange(updatedPreferences);
    
    toast({
      title: "Theme updated!",
      description: `Switched to ${newTheme} mode.`,
      duration: 2000,
    });
  };

  const testVoice = async () => {
    if (isTesting) return;
    setIsTesting(true);
    
    try {
      const testText = "Hello! This is a voice preview test.";
      await voiceService.speak(testText, {
        ...localPreferences.voiceSettings,
        voice: localPreferences.voiceSettings.useDeepgram 
          ? localPreferences.voiceSettings.deepgramVoice 
          : localPreferences.voiceSettings.voice,
        useDeepgram: localPreferences.voiceSettings.useDeepgram
      });
    } catch (error) {
      console.error('Voice test failed:', error);
    } finally {
      setIsTesting(false);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const granted = await notificationService.requestPermission();
      setNotificationPermission(notificationService.permissionStatus);
      
      if (granted) {
        toast({
          title: "Notifications Enabled!",
          description: "You'll now receive task reminders and productivity suggestions.",
        });
        
        // Auto-enable notification settings when permission is granted
        handlePreferenceChange(['notificationSettings', 'enabled'], true);
      } else {
        toast({
          title: "Notifications Blocked",
          description: "Enable notifications in your browser settings to get task reminders.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: "Error",
        description: "Failed to request notification permission.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Settings">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Customize your voice AI task manager experience
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="voice" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="voice">Voice</TabsTrigger>
            <TabsTrigger value="ai">AI Behavior</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="google">Google</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
          </TabsList>

          <TabsContent value="voice" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="voice-enabled">Voice Features</Label>
                  <p className="text-sm text-gray-500">Enable voice input and output</p>
                </div>
                <Switch
                  id="voice-enabled"
                  checked={localPreferences.voiceEnabled}
                  onCheckedChange={(checked) => handlePreferenceChange(['voiceEnabled'], checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-speak">Auto-speak Responses</Label>
                  <p className="text-sm text-gray-500">Automatically speak AI responses</p>
                </div>
                <Switch
                  id="auto-speak"
                  checked={localPreferences.autoSpeak}
                  onCheckedChange={(checked) => handlePreferenceChange(['autoSpeak'], checked)}
                />
              </div>

              {/* Microphone Selection */}
              <div className="space-y-3">
                <Label htmlFor="microphone">Microphone Input</Label>
                <Select
                  value={localPreferences.voiceSettings.microphoneId || 'default'}
                  onValueChange={(value) => {
                    handlePreferenceChange(['voiceSettings', 'microphoneId'], value === 'default' ? undefined : value);
                    voiceService.setAudioInput(value === 'default' ? undefined : value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select microphone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">System Default</SelectItem>
                    {availableAudioInputs.map((input) => (
                      <SelectItem key={input.deviceId} value={input.deviceId}>
                        {input.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Choose which microphone to use for voice input
                </p>
              </div>

              {/* Deepgram TTS Section */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <Label className="font-medium">Deepgram AI TTS</Label>
                  {deepgramConnected ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Connected</span>
                  ) : (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Offline</span>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Use Deepgram AI for premium voice quality</p>
                    <p className="text-xs text-gray-500">Cloud-based neural TTS with 10 voices</p>
                  </div>
                  <Switch
                    checked={localPreferences.voiceSettings.useDeepgram}
                    onCheckedChange={(checked) => handlePreferenceChange(['voiceSettings', 'useDeepgram'], checked)}
                    disabled={!deepgramConnected}
                  />
                </div>

                {localPreferences.voiceSettings.useDeepgram && (
                  <div className="space-y-3">
                    <Label htmlFor="deepgram-voice">Deepgram Voice</Label>
                    <Select
                      value={localPreferences.voiceSettings.deepgramVoice}
                      onValueChange={(value) => handlePreferenceChange(['voiceSettings', 'deepgramVoice'], value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableVoices
                          .filter(voice => voice.type === 'deepgram')
                          .map((voice) => (
                            <SelectItem key={voice.name} value={voice.name}>
                              {voice.displayName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Web Speech API Section */}
              {!localPreferences.voiceSettings.useKokoro && (
                <div className="space-y-3">
                  <Label htmlFor="web-voice">Browser Voice</Label>
                  <Select
                    value={localPreferences.voiceSettings.voice || ''}
                    onValueChange={(value) => handlePreferenceChange(['voiceSettings', 'voice'], value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVoices
                        .filter(voice => voice.type === 'web')
                        .map((voice) => (
                          <SelectItem key={voice.name} value={voice.name}>
                            {voice.displayName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Voice Controls */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Speech Rate: {localPreferences.voiceSettings.rate}</Label>
                  <Slider
                    value={[localPreferences.voiceSettings.rate]}
                    onValueChange={([value]) => handlePreferenceChange(['voiceSettings', 'rate'], value)}
                    min={0.5}
                    max={2}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Volume: {Math.round(localPreferences.voiceSettings.volume * 100)}%</Label>
                  <Slider
                    value={[localPreferences.voiceSettings.volume]}
                    onValueChange={([value]) => handlePreferenceChange(['voiceSettings', 'volume'], value)}
                    min={0}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                {!localPreferences.voiceSettings.useKokoro && (
                  <div className="space-y-2">
                    <Label>Pitch: {localPreferences.voiceSettings.pitch}</Label>
                    <Slider
                      value={[localPreferences.voiceSettings.pitch]}
                      onValueChange={([value]) => handlePreferenceChange(['voiceSettings', 'pitch'], value)}
                      min={0.5}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              {/* Voice Test */}
              <Button 
                onClick={testVoice} 
                disabled={isTesting || !localPreferences.voiceEnabled}
                className="w-full"
                variant="outline"
              >
                <Play className="h-4 w-4 mr-2" />
                {isTesting ? 'Testing Voice...' : 'Test Voice'}
              </Button>

              {/* Voice Notifications Test */}
              <Button 
                onClick={async () => {
                  if (!localPreferences.voiceEnabled) return;
                  setIsTesting(true);
                  try {
                    // Test celebration notification
                    await voiceService.speak("Hell yeah! Task mastery achieved!", {
                      ...localPreferences.voiceSettings,
                      voice: localPreferences.voiceSettings.useKokoro 
                        ? localPreferences.voiceSettings.kokoroVoice 
                        : localPreferences.voiceSettings.voice,
                      useKokoro: localPreferences.voiceSettings.useKokoro
                    });
                  } catch (error) {
                    console.error('Voice notification test failed:', error);
                  } finally {
                    setIsTesting(false);
                  }
                }} 
                disabled={isTesting || !localPreferences.voiceEnabled}
                className="w-full"
                variant="outline"
              >
                <Volume2 className="h-4 w-4 mr-2" />
                {isTesting ? 'Testing Notification...' : 'Test Voice Notification'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="response-style">AI Response Style</Label>
                <Select
                  value={localPreferences.aiSettings.responseStyle}
                  onValueChange={(value: any) => handlePreferenceChange(['aiSettings', 'responseStyle'], value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concise">Concise</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="extraction-sensitivity">Task Extraction Sensitivity</Label>
                <Select
                  value={localPreferences.aiSettings.taskExtractionSensitivity}
                  onValueChange={(value: any) => handlePreferenceChange(['aiSettings', 'taskExtractionSensitivity'], value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Only obvious tasks</SelectItem>
                    <SelectItem value="medium">Medium - Balanced detection</SelectItem>
                    <SelectItem value="high">High - Detect subtle hints</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="system-prompt">Custom System Prompt</Label>
                <textarea
                  id="system-prompt"
                  className="w-full h-32 p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Customize how your AI assistant behaves. For example: 'You are a productivity-focused assistant who is encouraging but direct. Always prioritize actionable advice.'"
                  value={localPreferences.aiSettings.systemPrompt || ''}
                  onChange={(e) => {
                    console.log('System prompt changed:', e.target.value);
                    handlePreferenceChange(['aiSettings', 'systemPrompt'], e.target.value);
                  }}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Define your AI's personality and response style. Leave empty for default behavior.
                </p>
              </div>

              {/* AI Model Selection */}
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="use-openrouter">Use OpenRouter API</Label>
                    <p className="text-sm text-gray-500">Access multiple AI models for enhanced task extraction</p>
                  </div>
                  <Switch
                    id="use-openrouter"
                    checked={localPreferences.aiSettings.useOpenRouter || false}
                    onCheckedChange={(checked) => handlePreferenceChange(['aiSettings', 'useOpenRouter'], checked)}
                  />
                </div>

                {localPreferences.aiSettings.useOpenRouter && (
                  <>
                    <div className="space-y-3">
                      <Label htmlFor="openrouter-api-key">OpenRouter API Key</Label>
                      <input
                        id="openrouter-api-key"
                        type="password"
                        className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        placeholder="sk-or-..."
                        value={localPreferences.aiSettings.openRouterApiKey || ''}
                        onChange={(e) => handlePreferenceChange(['aiSettings', 'openRouterApiKey'], e.target.value)}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Get your API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">openrouter.ai/keys</a>
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="selected-model">AI Model</Label>
                      <Select
                        value={localPreferences.aiSettings.selectedModel}
                        onValueChange={(value) => handlePreferenceChange(['aiSettings', 'selectedModel'], value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-96">
                          <SelectItem value="simulation">
                            <div className="flex flex-col">
                              <span>Local Simulation</span>
                              <span className="text-xs text-gray-500">FREE • Offline fallback</span>
                            </div>
                          </SelectItem>
                          
                          {/* Popular Models Section */}
                          <div className="px-2 py-1 text-xs font-semibold text-gray-500 border-b">
                            ⭐ Popular Models
                          </div>
                          <SelectItem value="anthropic/claude-3.5-sonnet">
                            <div className="flex flex-col">
                              <span>Claude 3.5 Sonnet</span>
                              <span className="text-xs text-gray-500">200K context • $3/M tokens • ⭐ Popular</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="openai/gpt-4o">
                            <div className="flex flex-col">
                              <span>GPT-4o</span>
                              <span className="text-xs text-gray-500">128K context • $2.50/M tokens • ⭐ Popular</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="openai/gpt-4o-mini">
                            <div className="flex flex-col">
                              <span>GPT-4o Mini</span>
                              <span className="text-xs text-gray-500">128K context • $0.15/M tokens • ⭐ Popular</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="anthropic/claude-3-haiku">
                            <div className="flex flex-col">
                              <span>Claude 3 Haiku</span>
                              <span className="text-xs text-gray-500">200K context • $0.25/M tokens • ⭐ Popular</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="google/gemini-flash-1.5">
                            <div className="flex flex-col">
                              <span>Gemini Flash 1.5</span>
                              <span className="text-xs text-gray-500">1M context • $0.075/M tokens • ⭐ Popular</span>
                            </div>
                          </SelectItem>

                          {/* Free Models Section */}
                          <div className="px-2 py-1 text-xs font-semibold text-gray-500 border-b border-t">
                            💰 Free Models
                          </div>
                          <SelectItem value="meta-llama/llama-3.1-8b-instruct:free">
                            <div className="flex flex-col">
                              <span>Llama 3.1 8B Instruct</span>
                              <span className="text-xs text-green-600">128K context • FREE</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="mistralai/mistral-7b-instruct:free">
                            <div className="flex flex-col">
                              <span>Mistral 7B Instruct</span>
                              <span className="text-xs text-green-600">32K context • FREE</span>
                            </div>
                          </SelectItem>

                          {/* Other Models Section */}
                          <div className="px-2 py-1 text-xs font-semibold text-gray-500 border-b border-t">
                            🔧 Other Models
                          </div>
                          <SelectItem value="meta-llama/llama-3.1-70b-instruct">
                            <div className="flex flex-col">
                              <span>Llama 3.1 70B Instruct</span>
                              <span className="text-xs text-gray-500">128K context • $0.35/M tokens</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="google/gemini-pro-1.5">
                            <div className="flex flex-col">
                              <span>Gemini Pro 1.5</span>
                              <span className="text-xs text-gray-500">2M context • $1.25/M tokens</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="cohere/command-r-plus">
                            <div className="flex flex-col">
                              <span>Command R+</span>
                              <span className="text-xs text-gray-500">128K context • $2.50/M tokens</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        ⭐ Popular models are optimized for task management. 💰 Free models have usage limits.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label htmlFor="temperature">Temperature: {localPreferences.aiSettings.temperature?.toFixed(1) || '0.7'}</Label>
                        <Slider
                          value={[localPreferences.aiSettings.temperature || 0.7]}
                          onValueChange={([value]) => handlePreferenceChange(['aiSettings', 'temperature'], value)}
                          max={1.0}
                          min={0.0}
                          step={0.1}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500">Higher = more creative, Lower = more focused</p>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="max-tokens">Max Tokens: {localPreferences.aiSettings.maxTokens || 1000}</Label>
                        <Slider
                          value={[localPreferences.aiSettings.maxTokens || 1000]}
                          onValueChange={([value]) => handlePreferenceChange(['aiSettings', 'maxTokens'], value)}
                          max={4000}
                          min={100}
                          step={100}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500">Response length limit</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6 mt-6">
            <div className="space-y-4">
              {/* Notification Permission Section */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-blue-900 dark:text-blue-100">Browser Notification Permission</Label>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {notificationPermission === 'granted' 
                        ? 'Notifications are enabled and ready to use!'
                        : notificationPermission === 'denied'
                        ? 'Notifications are blocked. Enable them in browser settings.'
                        : 'Grant permission to receive task reminders and updates.'
                      }
                    </p>
                  </div>
                  {notificationPermission !== 'granted' && (
                    <Button 
                      onClick={requestNotificationPermission}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {notificationPermission === 'denied' ? 'Check Settings' : 'Enable Notifications'}
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notifications-enabled">Enable Notifications</Label>
                  <p className="text-sm text-gray-500">Allow browser notifications for task reminders</p>
                </div>
                <Switch
                  id="notifications-enabled"
                  checked={localPreferences.notificationSettings?.enabled || false}
                  onCheckedChange={(checked) => handlePreferenceChange(['notificationSettings', 'enabled'], checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="daily-agenda">Daily Agenda</Label>
                  <p className="text-sm text-gray-500">Get a morning summary of your tasks</p>
                </div>
                <Switch
                  id="daily-agenda"
                  checked={localPreferences.notificationSettings?.dailyAgenda || false}
                  onCheckedChange={(checked) => handlePreferenceChange(['notificationSettings', 'dailyAgenda'], checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="task-reminders">Task Reminders</Label>
                  <p className="text-sm text-gray-500">Get notified about due and overdue tasks</p>
                </div>
                <Switch
                  id="task-reminders"
                  checked={localPreferences.notificationSettings?.taskReminders || false}
                  onCheckedChange={(checked) => handlePreferenceChange(['notificationSettings', 'taskReminders'], checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="celebrate-completions">Celebrate Completions</Label>
                  <p className="text-sm text-gray-500">Get celebration notifications when you complete tasks</p>
                </div>
                <Switch
                  id="celebrate-completions"
                  checked={localPreferences.notificationSettings?.celebrateCompletions || false}
                  onCheckedChange={(checked) => handlePreferenceChange(['notificationSettings', 'celebrateCompletions'], checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="smart-suggestions">Smart Suggestions</Label>
                  <p className="text-sm text-gray-500">Receive AI-powered productivity suggestions</p>
                </div>
                <Switch
                  id="smart-suggestions"
                  checked={localPreferences.notificationSettings?.smartSuggestions || false}
                  onCheckedChange={(checked) => handlePreferenceChange(['notificationSettings', 'smartSuggestions'], checked)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="google" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="google-integration">Enable Google Integration</Label>
                  <p className="text-sm text-gray-500">Connect Calendar and Gmail for enhanced task management</p>
                </div>
                <Switch
                  id="google-integration"
                  checked={localPreferences.googleIntegration?.enabled || false}
                  onCheckedChange={(checked) => handlePreferenceChange(['googleIntegration', 'enabled'], checked)}
                />
              </div>

              {localPreferences.googleIntegration?.enabled && (
                <>
                  <div className="space-y-3">
                    <Label htmlFor="google-client-id">Google Client ID</Label>
                    <input
                      id="google-client-id"
                      type="text"
                      className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      placeholder="123456789-abcdefghijklmnop.apps.googleusercontent.com"
                      value={localPreferences.googleIntegration?.clientId || ''}
                      onChange={(e) => handlePreferenceChange(['googleIntegration', 'clientId'], e.target.value)}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Get from <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Google Cloud Console</a>
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="google-api-key">Google API Key</Label>
                    <input
                      id="google-api-key"
                      type="password"
                      className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      placeholder="AIzaSyA..."
                      value={localPreferences.googleIntegration?.apiKey || ''}
                      onChange={(e) => handlePreferenceChange(['googleIntegration', 'apiKey'], e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="calendar-enabled">Calendar Integration</Label>
                        <p className="text-xs text-gray-500">Extract tasks from calendar events</p>
                      </div>
                      <Switch
                        id="calendar-enabled"
                        checked={localPreferences.googleIntegration?.calendarEnabled || false}
                        onCheckedChange={(checked) => handlePreferenceChange(['googleIntegration', 'calendarEnabled'], checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="gmail-enabled">Gmail Integration</Label>
                        <p className="text-xs text-gray-500">Extract tasks from emails</p>
                      </div>
                      <Switch
                        id="gmail-enabled"
                        checked={localPreferences.googleIntegration?.gmailEnabled || false}
                        onCheckedChange={(checked) => handlePreferenceChange(['googleIntegration', 'gmailEnabled'], checked)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-extract-tasks">Auto-Extract Tasks</Label>
                      <p className="text-sm text-gray-500">Automatically create tasks from emails and calendar events</p>
                    </div>
                    <Switch
                      id="auto-extract-tasks"
                      checked={localPreferences.googleIntegration?.autoExtractTasks || false}
                      onCheckedChange={(checked) => handlePreferenceChange(['googleIntegration', 'autoExtractTasks'], checked)}
                    />
                  </div>

                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">Setup Required</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                      To use Google integration, you'll need to set up OAuth credentials in Google Cloud Console:
                    </p>
                    <ol className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1 list-decimal list-inside">
                      <li>Go to Google Cloud Console → APIs & Services → Credentials</li>
                      <li>Create OAuth 2.0 Client ID for web application</li>
                      <li>Add your domain to authorized origins</li>
                      <li>Enable Calendar and Gmail APIs</li>
                      <li>Copy Client ID and API Key to settings above</li>
                    </ol>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="general" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={localPreferences.theme}
                  onValueChange={(value: any) => handleThemeChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={localPreferences.language}
                  onValueChange={(value) => handlePreferenceChange(['language'], value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="en-GB">English (UK)</SelectItem>
                    <SelectItem value="es-ES">Spanish</SelectItem>
                    <SelectItem value="fr-FR">French</SelectItem>
                    <SelectItem value="de-DE">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex items-center gap-2 text-sm">
            {hasUnsavedChanges ? (
              <span className="flex items-center gap-1 text-orange-600">
                <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse" />
                Unsaved changes
              </span>
            ) : (
              <span className="flex items-center gap-1 text-green-600">
                <Check className="w-3 h-3" />
                All changes saved
              </span>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setLocalPreferences(preferences);
                setHasUnsavedChanges(false);
                toast({
                  title: "Settings reset",
                  description: "Preferences restored to saved state.",
                  duration: 2000,
                });
              }}
            >
              Reset Changes
            </Button>
            <DialogClose asChild>
              <Button 
                onClick={() => {
                  setIsOpen(false);
                  setHasUnsavedChanges(false);
                }}
                className="min-w-[120px]"
              >
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Close
                </div>
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}