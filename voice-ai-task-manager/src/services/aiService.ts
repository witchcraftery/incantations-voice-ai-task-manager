import { Task, Message, AIResponse, UserMemory } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class AIService {
  private userMemory: UserMemory;

  constructor(userMemory: UserMemory) {
    this.userMemory = userMemory;
  }

  async processMessage(
    userInput: string,
    conversationHistory: Message[]
  ): Promise<AIResponse> {
    const startTime = Date.now();
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

    const extractedTasks = this.extractTasks(userInput);
    const intent = this.detectIntent(userInput);
    const response = this.generateResponse(userInput, intent, extractedTasks, conversationHistory);
    const suggestions = this.generateSuggestions(userInput, intent);

    const processingTime = Date.now() - startTime;

    return {
      message: response,
      extractedTasks,
      suggestions,
      metadata: {
        confidence: this.calculateConfidence(userInput, extractedTasks),
        processingTime,
        intent
      }
    };
  }

  private extractTasks(input: string): Partial<Task>[] {
    const tasks: Partial<Task>[] = [];
    const taskIndicators = [
      'need to', 'have to', 'should', 'must', 'want to', 'going to',
      'plan to', 'remind me to', 'don\'t forget to', 'make sure to',
      'schedule', 'deadline', 'due', 'finish', 'complete', 'work on'
    ];

    // Enhanced task detection patterns
    const patterns = [
      // Direct task statements
      /(?:i (?:need to|have to|should|must|want to|plan to)\s+)(.+?)(?:\.|$|,|\s+(?:by|before|on|at|in))/gi,
      // Reminder patterns
      /(?:remind me to\s+)(.+?)(?:\.|$|,|\s+(?:by|before|on|at|in))/gi,
      // Project work patterns
      /(?:work on|working on|continue|finish|complete)\s+(.+?)(?:\.|$|,|\s+(?:by|before|on|at|in))/gi,
      // Meeting patterns
      /(?:meeting|call|discussion)\s+(?:with|about)\s+(.+?)(?:\.|$|,|\s+(?:at|on|in))/gi,
      // Deadline patterns
      /(.+?)\s+(?:is due|due|deadline)\s+(?:by|on|at|in)\s+(.+?)(?:\.|$|,)/gi
    ];

    let hasTaskIndicator = taskIndicators.some(indicator => 
      input.toLowerCase().includes(indicator)
    );

    if (hasTaskIndicator) {
      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(input)) !== null) {
          const taskDescription = match[1]?.trim();
          if (taskDescription && taskDescription.length > 3) {
            const priority = this.detectPriority(input);
            const dueDate = this.extractDueDate(input);
            const project = this.detectProject(input);

            tasks.push({
              id: uuidv4(),
              title: this.cleanTaskTitle(taskDescription),
              description: this.generateTaskDescription(taskDescription, input),
              priority,
              status: 'pending',
              dueDate,
              project,
              tags: this.extractTags(input),
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        }
      });
    }

    return tasks;
  }

  private detectIntent(input: string): string {
    const intentPatterns = {
      'task_creation': /(?:need to|have to|should|must|want to|plan to|remind me|don't forget)/i,
      'task_query': /(?:what|show me|list|find|search|where|which)\s+(?:tasks|todo|work)/i,
      'task_update': /(?:mark|update|change|modify|edit|complete|done|finished)/i,
      'project_discussion': /(?:project|working on|focus on|switch to)/i,
      'status_check': /(?:how|what's|status|progress|update)/i,
      'casual_conversation': /(?:hello|hi|how are you|thanks|thank you|goodbye|bye)/i,
      'help_request': /(?:help|how do|can you|what can)/i
    };

    for (const [intent, pattern] of Object.entries(intentPatterns)) {
      if (pattern.test(input)) {
        return intent;
      }
    }

    return 'general_conversation';
  }

  private generateResponse(
    input: string, 
    intent: string, 
    extractedTasks: Partial<Task>[], 
    history: Message[]
  ): string {
    // Check conversation context
    const recentHistory = history.slice(-6); // Last 6 messages for context
    const hasRecentContext = recentHistory.length > 0;
    const lastAssistantMessage = recentHistory.filter(m => m.type === 'assistant').pop();
    const conversationThemes = this.extractConversationThemes(recentHistory);

    const responses = {
      task_creation: [
        hasRecentContext && conversationThemes.includes('project') 
          ? "Adding those tasks to what we were discussing. I can see how they fit into your project."
          : "I've identified some tasks from what you said. Let me help you organize them.",
        
        hasRecentContext && recentHistory.length > 2
          ? "Great! Building on our conversation, I've extracted a few more action items."
          : "Great! I've extracted a few action items from your message.",
        
        hasRecentContext && conversationThemes.includes('deadline')
          ? "Perfect, more tasks to add to your timeline. I'll add them to your list."
          : "Perfect, I can see some tasks here. I'll add them to your list.",
        
        "Got it! I've found some actionable items in your conversation."
      ],
      task_query: [
        hasRecentContext 
          ? "Let me update you on the tasks we've been discussing, plus anything else relevant."
          : "Let me check your current tasks and provide you with an update.",
        
        "I'll look through your task list and show you what's relevant.",
        "Here's what I found in your current projects and tasks."
      ],
      project_discussion: [
        hasRecentContext && lastAssistantMessage?.content.includes('project')
          ? "Continuing with that project - tell me more about what specific tasks need to be done."
          : "Sounds like an interesting project! Tell me more about what needs to be done.",
        
        hasRecentContext 
          ? "Building on what you mentioned earlier - what specific tasks or goals do you have for this project?"
          : "I'm listening. What specific tasks or goals do you have for this project?",
        
        "Great project discussion! What are the next steps you'd like to focus on?"
      ],
      casual_conversation: [
        hasRecentContext 
          ? "Thanks for the additional context! What else can I help you accomplish?"
          : "Hello! I'm here to help you manage your tasks and stay organized. What's on your mind?",
        
        hasRecentContext && recentHistory.some(m => m.extractedTasks && m.extractedTasks.length > 0)
          ? "Good to continue our task planning! What else would you like to work on?"
          : "Hi there! Ready to tackle some tasks together?",
        
        "Hey! What can I help you accomplish today?"
      ],
      help_request: [
        "I'm your AI task assistant! I can help you capture tasks from conversations, organize your work, and keep track of your projects. Just speak naturally about what you need to do.",
        hasRecentContext 
          ? "I specialize in understanding your tasks and helping you stay organized. As we've been discussing, you can talk to me about your work, projects, or anything you need to remember."
          : "I specialize in understanding your tasks and helping you stay organized. You can talk to me about your work, projects, or anything you need to remember.",
        "I'm here to make task management effortless! Just speak naturally about your work and I'll help extract and organize your tasks."
      ]
    };

    const responseArray = responses[intent as keyof typeof responses] || responses.casual_conversation;
    let response = responseArray[Math.floor(Math.random() * responseArray.length)];

    // Add task-specific information if tasks were extracted
    if (extractedTasks.length > 0) {
      const taskCount = extractedTasks.length;
      const contextualTaskMessage = hasRecentContext && recentHistory.some(m => m.extractedTasks && m.extractedTasks.length > 0)
        ? ` I found ${taskCount} more ${taskCount === 1 ? 'task' : 'tasks'} to add to what we've been working on.`
        : ` I found ${taskCount} ${taskCount === 1 ? 'task' : 'tasks'} that I can add to your list.`;
      
      response += contextualTaskMessage;
    }

    // Add contextual information based on user memory and conversation
    if (this.userMemory.contextualInfo.currentProjects.length > 0 && intent === 'project_discussion') {
      const currentProject = this.userMemory.contextualInfo.currentProjects[0];
      response += hasRecentContext 
        ? ` This fits well with your ongoing ${currentProject} project.`
        : ` This seems related to your ${currentProject} project.`;
    }

    // Add conversation continuity
    if (hasRecentContext && conversationThemes.length > 0) {
      const theme = conversationThemes[0];
      if (!response.toLowerCase().includes(theme)) {
        response += ` I'm keeping track of our ${theme} discussion.`;
      }
    }

    return response;
  }

  private extractConversationThemes(history: Message[]): string[] {
    const themes: string[] = [];
    const content = history.map(m => m.content.toLowerCase()).join(' ');
    
    const themePatterns = {
      'project': /project|development|build|create|design/,
      'deadline': /deadline|due|urgent|asap|rush|deadline/,
      'meeting': /meeting|call|discuss|presentation|demo/,
      'planning': /plan|schedule|organize|strategy|roadmap/,
      'review': /review|feedback|check|evaluate|assess/
    };

    Object.entries(themePatterns).forEach(([theme, pattern]) => {
      if (pattern.test(content)) {
        themes.push(theme);
      }
    });

    return themes;
  }

  private generateSuggestions(input: string, intent: string): string[] {
    const suggestions: string[] = [];

    if (intent === 'task_creation') {
      suggestions.push(
        "Would you like to set a deadline for any of these tasks?",
        "Should I assign these to a specific project?",
        "Would you like to set priority levels for these tasks?"
      );
    } else if (intent === 'project_discussion') {
      suggestions.push(
        "Tell me more about the project timeline",
        "What are the main deliverables?",
        "Who else is involved in this project?"
      );
    } else if (intent === 'general_conversation') {
      suggestions.push(
        "What projects are you working on today?",
        "Tell me about your upcoming deadlines",
        "What's your biggest priority right now?"
      );
    }

    return suggestions.slice(0, 3); // Return up to 3 suggestions
  }

  private detectPriority(input: string): 'low' | 'medium' | 'high' | 'urgent' {
    const urgentWords = ['urgent', 'asap', 'immediately', 'critical', 'emergency'];
    const highWords = ['important', 'priority', 'soon', 'quickly', 'deadline'];
    const lowWords = ['later', 'eventually', 'when possible', 'low priority', 'sometime'];

    const lowerInput = input.toLowerCase();

    if (urgentWords.some(word => lowerInput.includes(word))) return 'urgent';
    if (highWords.some(word => lowerInput.includes(word))) return 'high';
    if (lowWords.some(word => lowerInput.includes(word))) return 'low';

    return 'medium';
  }

  private extractDueDate(input: string): Date | undefined {
    const datePatterns = [
      /(?:by|before|on|at|in)\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
      /(?:by|before|on|at|in)\s+(\d{1,2}\/\d{1,2})/i,
      /(?:by|before|on|at|in)\s+(next week|this week|next month)/i
    ];

    for (const pattern of datePatterns) {
      const match = input.match(pattern);
      if (match) {
        return this.parseRelativeDate(match[1]);
      }
    }

    return undefined;
  }

  private parseRelativeDate(dateString: string): Date {
    const now = new Date();
    const lowerDate = dateString.toLowerCase();

    switch (lowerDate) {
      case 'today':
        return now;
      case 'tomorrow':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'next week':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'this week':
        const endOfWeek = new Date(now);
        endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
        return endOfWeek;
      case 'next month':
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      default:
        // Try to parse as date
        const parsed = new Date(dateString);
        return isNaN(parsed.getTime()) ? now : parsed;
    }
  }

  private detectProject(input: string): string | undefined {
    const projectKeywords = this.userMemory.workPatterns.commonProjects;
    const lowerInput = input.toLowerCase();

    for (const project of projectKeywords) {
      if (lowerInput.includes(project.toLowerCase())) {
        return project;
      }
    }

    // Check for project indicators
    const projectPatterns = [
      /(?:for|on|in)\s+(?:the\s+)?([A-Z][a-zA-Z\s]+?)\s+project/i,
      /(?:project\s+)([A-Z][a-zA-Z\s]+)/i
    ];

    for (const pattern of projectPatterns) {
      const match = input.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  private extractTags(input: string): string[] {
    const tags: string[] = [];
    const tagPatterns = [
      /#(\w+)/g, // Hashtags
      /\b(meeting|call|email|research|review|development|design|testing|documentation)\b/gi
    ];

    tagPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(input)) !== null) {
        tags.push(match[1].toLowerCase());
      }
    });

    return [...new Set(tags)]; // Remove duplicates
  }

  private cleanTaskTitle(title: string): string {
    return title
      .replace(/^(to\s+)?/, '') // Remove leading "to"
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .charAt(0).toUpperCase() + title.slice(1); // Capitalize first letter
  }

  private generateTaskDescription(taskTitle: string, originalInput: string): string {
    // Extract relevant context around the task
    const sentences = originalInput.split(/[.!?]+/);
    const relevantSentence = sentences.find(sentence => 
      sentence.toLowerCase().includes(taskTitle.toLowerCase())
    );

    return relevantSentence?.trim() || taskTitle;
  }

  private calculateConfidence(input: string, extractedTasks: Partial<Task>[]): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on task indicators
    const taskIndicators = ['need to', 'have to', 'should', 'must', 'remind me'];
    const hasIndicators = taskIndicators.some(indicator => 
      input.toLowerCase().includes(indicator)
    );

    if (hasIndicators) confidence += 0.2;
    if (extractedTasks.length > 0) confidence += 0.2;

    // Decrease confidence for very short or unclear input
    if (input.length < 10) confidence -= 0.3;
    if (input.includes('um') || input.includes('uh')) confidence -= 0.1;

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  updateUserMemory(newMemory: Partial<UserMemory>) {
    this.userMemory = { ...this.userMemory, ...newMemory };
  }
}
