import { Task, Conversation, Message, Project, UserMemory } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class SampleDataService {
  static generateSampleData() {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Sample messages for conversations
    const sampleMessages: Array<{user: string, assistant: string, timestamp: Date}> = [
      {
        user: "I need to prepare for the product launch meeting tomorrow. We should review the marketing materials and check with the development team about any last-minute issues.",
        assistant: "I've identified a couple of tasks from your message. Let me help you organize them. I found 2 tasks that I can add to your list.",
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000)
      },
      {
        user: "Don't forget to follow up with Sarah about the design mockups. Also, we need to schedule a team retrospective for next week.",
        assistant: "Great! I've extracted some action items from your conversation. I found 2 tasks that I can add to your list.",
        timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000)
      },
      {
        user: "I want to learn React hooks better and practice with some personal projects. Maybe build something with voice recognition.",
        assistant: "Sounds like an interesting project! Tell me more about what needs to be done. I found 2 tasks that I can add to your list.",
        timestamp: yesterday
      }
    ];

    // Generate sample tasks
    const sampleTasks: Task[] = [
      {
        id: uuidv4(),
        title: "Review marketing materials for product launch",
        description: "Check all marketing materials, presentations, and promotional content for accuracy and consistency before tomorrow's launch meeting.",
        priority: 'high',
        status: 'pending',
        dueDate: tomorrow,
        project: 'Product Launch',
        tags: ['marketing', 'review', 'launch'],
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        extractedFrom: uuidv4(),
        timeEntries: [],
        totalTimeSpent: 0,
        isActiveTimer: false
      },
      {
        id: uuidv4(),
        title: "Check with development team about last-minute issues",
        description: "Coordinate with the dev team to ensure no critical bugs or issues before the product launch.",
        priority: 'urgent',
        status: 'in-progress',
        dueDate: tomorrow,
        project: 'Product Launch',
        tags: ['development', 'coordination', 'bugs'],
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 30 * 60 * 1000),
        extractedFrom: uuidv4(),
        timeEntries: [],
        totalTimeSpent: 0,
        isActiveTimer: false
      },
      {
        id: uuidv4(),
        title: "Follow up with Sarah about design mockups",
        description: "Contact Sarah to get the latest design mockups and review them for the project.",
        priority: 'medium',
        status: 'pending',
        project: 'Design Review',
        tags: ['design', 'follow-up', 'mockups'],
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        extractedFrom: uuidv4(),
        timeEntries: [],
        totalTimeSpent: 0,
        isActiveTimer: false
      },
      {
        id: uuidv4(),
        title: "Schedule team retrospective for next week",
        description: "Organize and schedule the team retrospective meeting to discuss recent project outcomes and improvements.",
        priority: 'medium',
        status: 'pending',
        dueDate: nextWeek,
        project: 'Team Management',
        tags: ['meeting', 'retrospective', 'team'],
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        extractedFrom: uuidv4(),
        timeEntries: [],
        totalTimeSpent: 0,
        isActiveTimer: false
      },
      {
        id: uuidv4(),
        title: "Learn React hooks in depth",
        description: "Study React hooks documentation, watch tutorials, and practice implementing custom hooks.",
        priority: 'low',
        status: 'pending',
        project: 'Personal Learning',
        tags: ['learning', 'react', 'hooks', 'development'],
        createdAt: yesterday,
        updatedAt: yesterday,
        extractedFrom: uuidv4(),
        timeEntries: [],
        totalTimeSpent: 0,
        isActiveTimer: false
      },
      {
        id: uuidv4(),
        title: "Build personal project with voice recognition",
        description: "Create a personal project that incorporates voice recognition technology, possibly using Web Speech API.",
        priority: 'low',
        status: 'pending',
        project: 'Personal Learning',
        tags: ['project', 'voice', 'recognition', 'development'],
        createdAt: yesterday,
        updatedAt: yesterday,
        extractedFrom: uuidv4(),
        timeEntries: [],
        totalTimeSpent: 0,
        isActiveTimer: false
      },
      {
        id: uuidv4(),
        title: "Complete weekly report",
        description: "Finish and submit the weekly progress report covering all current projects and milestones.",
        priority: 'medium',
        status: 'completed',
        dueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        project: 'Administration',
        tags: ['report', 'weekly', 'documentation'],
        createdAt: lastWeek,
        updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        timeEntries: [],
        totalTimeSpent: 0,
        isActiveTimer: false
      }
    ];

    // Generate sample conversations
    const conversations: Conversation[] = [
      {
        id: uuidv4(),
        title: "Product Launch Preparation",
        messages: [
          {
            id: uuidv4(),
            type: 'user',
            content: sampleMessages[0].user,
            timestamp: sampleMessages[0].timestamp,
            isVoiceInput: true,
            extractedTasks: [sampleTasks[0].id, sampleTasks[1].id]
          },
          {
            id: uuidv4(),
            type: 'assistant',
            content: sampleMessages[0].assistant,
            timestamp: new Date(sampleMessages[0].timestamp.getTime() + 2000),
            extractedTasks: [sampleTasks[0].id, sampleTasks[1].id],
            metadata: {
              confidence: 0.92,
              processingTime: 1200
            }
          }
        ],
        createdAt: sampleMessages[0].timestamp,
        updatedAt: new Date(sampleMessages[0].timestamp.getTime() + 2000)
      },
      {
        id: uuidv4(),
        title: "Team Coordination Tasks",
        messages: [
          {
            id: uuidv4(),
            type: 'user',
            content: sampleMessages[1].user,
            timestamp: sampleMessages[1].timestamp,
            isVoiceInput: false,
            extractedTasks: [sampleTasks[2].id, sampleTasks[3].id]
          },
          {
            id: uuidv4(),
            type: 'assistant',
            content: sampleMessages[1].assistant,
            timestamp: new Date(sampleMessages[1].timestamp.getTime() + 1800),
            extractedTasks: [sampleTasks[2].id, sampleTasks[3].id],
            metadata: {
              confidence: 0.88,
              processingTime: 980
            }
          }
        ],
        createdAt: sampleMessages[1].timestamp,
        updatedAt: new Date(sampleMessages[1].timestamp.getTime() + 1800)
      },
      {
        id: uuidv4(),
        title: "Learning and Development",
        messages: [
          {
            id: uuidv4(),
            type: 'user',
            content: sampleMessages[2].user,
            timestamp: sampleMessages[2].timestamp,
            isVoiceInput: true,
            extractedTasks: [sampleTasks[4].id, sampleTasks[5].id]
          },
          {
            id: uuidv4(),
            type: 'assistant',
            content: sampleMessages[2].assistant,
            timestamp: new Date(sampleMessages[2].timestamp.getTime() + 2200),
            extractedTasks: [sampleTasks[4].id, sampleTasks[5].id],
            metadata: {
              confidence: 0.85,
              processingTime: 1400
            }
          }
        ],
        createdAt: sampleMessages[2].timestamp,
        updatedAt: new Date(sampleMessages[2].timestamp.getTime() + 2200)
      }
    ];

    // Generate sample projects
    const projects: Project[] = [
      {
        id: uuidv4(),
        name: 'Product Launch',
        description: 'Coordinating the launch of our new product with marketing and development teams',
        color: '#3B82F6',
        taskIds: [sampleTasks[0].id, sampleTasks[1].id],
        createdAt: lastWeek,
        isActive: true
      },
      {
        id: uuidv4(),
        name: 'Design Review',
        description: 'Ongoing design review and feedback collection process',
        color: '#10B981',
        taskIds: [sampleTasks[2].id],
        createdAt: lastWeek,
        isActive: true
      },
      {
        id: uuidv4(),
        name: 'Team Management',
        description: 'Team coordination, meetings, and administrative tasks',
        color: '#8B5CF6',
        taskIds: [sampleTasks[3].id, sampleTasks[6].id],
        createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        isActive: true
      },
      {
        id: uuidv4(),
        name: 'Personal Learning',
        description: 'Self-improvement and skill development activities',
        color: '#F59E0B',
        taskIds: [sampleTasks[4].id, sampleTasks[5].id],
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        isActive: true
      }
    ];

    // Generate sample user memory
    const userMemory: UserMemory = {
      workPatterns: {
        preferredWorkingHours: ['9:00', '17:00'],
        commonProjects: ['Product Launch', 'Design Review', 'Team Management', 'Personal Learning'],
        frequentTasks: ['Review', 'Follow up', 'Schedule', 'Learn', 'Check']
      },
      contextualInfo: {
        currentProjects: ['Product Launch', 'Design Review'],
        recentTopics: ['product launch', 'design mockups', 'team retrospective', 'react hooks', 'voice recognition'],
        preferences: {
          communicationStyle: 'professional',
          taskDetailLevel: 'detailed',
          reminderFrequency: 'daily'
        }
      },
      learningData: {
        taskCompletionPatterns: {
          'morning': 0.7,
          'afternoon': 0.8,
          'evening': 0.4
        },
        communicationStyle: 'professional',
        feedbackHistory: [
          {
            action: 'task_extraction',
            feedback: 'positive',
            timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000)
          },
          {
            action: 'priority_detection',
            feedback: 'positive',
            timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000)
          }
        ]
      },
      conversationFlow: {
        stageHistory: [],
        currentStage: {
          stage: 'rapport-building',
          confidence: 0.8,
          messageCount: 0,
          userEnergyLevel: 'medium',
          topicFocus: 'casual',
          lastStageChange: new Date()
        },
        triggerPhrases: {
          taskAnalysis: ['that\'s all', 'add to my task list', 'add those to my tasks', 'create those tasks', 'let\'s get to work'],
          completion: ['thanks', 'thank you', 'that helps', 'sounds good', 'perfect']
        },
        silentTasks: [],
        sessionStartTime: new Date()
      }
    };

    return {
      tasks: sampleTasks,
      conversations,
      projects,
      userMemory
    };
  }
}
