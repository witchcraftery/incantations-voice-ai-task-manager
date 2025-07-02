import React, { useState } from 'react';
import { 
  BookOpen, 
  X, 
  Mic, 
  Brain, 
  Bell, 
  Mail, 
  Calendar, 
  Zap, 
  MessageSquare, 
  CheckCircle,
  Keyboard,
  Globe,
  Settings,
  Users
} from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { motion } from 'framer-motion';

export function DocumentationModal() {
  const [isOpen, setIsOpen] = useState(false);

  const features = {
    voice: {
      icon: Mic,
      title: "Voice-First Experience",
      description: "Natural conversation with your AI assistant",
      capabilities: [
        {
          name: "Auto-Send Conversations",
          description: "Speak naturally, pause 2.5 seconds, message auto-sends",
          example: "Say: 'I need to finish the quarterly report and schedule a team meeting' → Pause → AI responds → Continue talking"
        },
        {
          name: "Keyboard Shortcuts", 
          description: "Lightning-fast voice control without touching mouse",
          example: "Ctrl+Shift+V (toggle) • Space (push-to-talk) • Escape (stop)"
        },
        {
          name: "Network Recovery",
          description: "Seamless auto-restart on connection issues",
          example: "Long conversations continue uninterrupted even with network hiccups"
        }
      ]
    },
    ai: {
      icon: Brain,
      title: "Intelligent Task Processing",
      description: "Advanced AI that understands context and extracts actionable items",
      capabilities: [
        {
          name: "Multi-Model Support",
          description: "Choose from Claude, GPT-4, Llama, Gemini, or local simulation",
          example: "Switch to Claude for creative tasks, GPT-4 for analysis, or local mode for privacy"
        },
        {
          name: "Context Awareness",
          description: "Remembers conversation history and builds on previous discussions",
          example: "You: 'Working on website' → Later: 'Need design help' → AI: 'For your website project, I can help with...'"
        },
        {
          name: "Smart Task Extraction",
          description: "Automatically identifies tasks, deadlines, priorities, and dependencies",
          example: "From: 'I need to review the Johnson proposal by Friday and get Sarah's feedback' → Creates task with deadline and stakeholder"
        }
      ]
    },
    notifications: {
      icon: Bell,
      title: "Proactive Notifications",
      description: "Smart alerts that keep you on track",
      capabilities: [
        {
          name: "Daily Agenda",
          description: "AI-optimized task ordering delivered at 9 AM",
          example: "Good morning! Today's focus: 3 high-priority tasks, 2 quick wins, and prep for the 2 PM client call"
        },
        {
          name: "Pattern-Based Suggestions",
          description: "Learns your habits and suggests optimal timing",
          example: "You usually tackle creative work Tuesday mornings - should I protect that time for the design project?"
        },
        {
          name: "Achievement Celebrations",
          description: "Voice notifications for completed tasks",
          example: "Hell yeah! You crushed that quarterly report! 🎉"
        }
      ]
    },
    integrations: {
      icon: Globe,
      title: "Connected Productivity",
      description: "Seamless integration with your existing tools",
      capabilities: [
        {
          name: "Gmail Integration",
          description: "Monitors inbox and extracts actionable items from emails",
          example: "New email from client with project feedback → Auto-creates 'Review client feedback' task with email link"
        },
        {
          name: "Google Calendar",
          description: "Syncs with calendar events and suggests preparation",
          example: "Upcoming meeting about Project Alpha in 30 minutes → 'Need me to pull up the latest project docs?'"
        },
        {
          name: "Multiple Voice Engines",
          description: "Web Speech API + Deepgram TTS for natural responses",
          example: "Choose from 15+ voices including premium Deepgram AI voices for high-quality audio"
        }
      ]
    }
  };

  const FeatureCard = ({ feature, icon: Icon }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">{feature.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {feature.capabilities.map((capability, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">{capability.name}</h4>
              <Badge variant="outline" className="text-xs">Feature</Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{capability.description}</p>
            <div className="bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-400 dark:border-blue-600 p-3 rounded">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Example:</strong> {capability.example}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <BookOpen className="h-4 w-4" />
          Documentation
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            Incantations Voice AI Task Manager
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Documentation
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="voice">Voice</TabsTrigger>
            <TabsTrigger value="ai">AI Engine</TabsTrigger>
            <TabsTrigger value="notifications">Alerts</TabsTrigger>
            <TabsTrigger value="integrations">Connections</TabsTrigger>
          </TabsList>

          <div className="mt-4 max-h-[60vh] overflow-y-auto">
            <TabsContent value="overview" className="space-y-6">
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center"
                >
                  <Brain className="h-10 w-10 text-white" />
                </motion.div>
                
                <div>
                  <h2 className="text-2xl font-bold mb-2">The Future of Task Management</h2>
                  <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    Transform overwhelming complexity into clear, achievable progress through natural conversation 
                    with an AI that thinks like your perfect productivity partner.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    Voice-First Design
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Speak naturally about your work. No rigid commands or button mashing - just conversation 
                    that flows like talking to a thinking partner who never forgets.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Zap className="h-4 w-4 text-purple-600" />
                    Proactive Intelligence
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Learns your patterns, anticipates needs, and makes intelligent decisions within trusted 
                    boundaries. Your cognitive extension, not just a task tracker.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-600" />
                    Connected Workflow
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Integrates seamlessly with Gmail, Google Calendar, and multiple AI models. 
                    Works with your existing tools, not against them.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-orange-600" />
                    Emotional Partnership
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Celebrates victories, provides gentle accountability, and adapts communication style 
                    to your energy levels. Success feels rewarding, not mechanical.
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg p-6 border">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Keyboard className="h-4 w-4" />
                  Quick Start
                </h3>
                <div className="space-y-2 text-sm">
                  <p><strong>1. Voice:</strong> Click mic or press Ctrl+Shift+V to start talking</p>
                  <p><strong>2. Natural:</strong> "I need to finish the quarterly report by Friday"</p>
                  <p><strong>3. Auto-send:</strong> Pause 2.5 seconds, AI responds and creates tasks</p>
                  <p><strong>4. Continue:</strong> Keep talking to refine, add details, or switch topics</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="voice">
              <FeatureCard feature={features.voice} icon={features.voice.icon} />
            </TabsContent>

            <TabsContent value="ai">
              <FeatureCard feature={features.ai} icon={features.ai.icon} />
            </TabsContent>

            <TabsContent value="notifications">
              <FeatureCard feature={features.notifications} icon={features.notifications.icon} />
            </TabsContent>

            <TabsContent value="integrations">
              <FeatureCard feature={features.integrations} icon={features.integrations.icon} />
            </TabsContent>
          </div>
        </Tabs>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Built with ❤️ for the future of productivity
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">v1.0.0</Badge>
              <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
