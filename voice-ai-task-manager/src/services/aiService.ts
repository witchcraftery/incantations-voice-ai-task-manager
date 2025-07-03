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
    await new Promise(resolve =>
      setTimeout(resolve, 800 + Math.random() * 1200)
    );

    // Analyze conversation flow and current stage
    const conversationFlow = this.userMemory.conversationFlow;
    const currentStage = conversationFlow.currentStage;

    // Check for trigger phrases that switch conversation stage
    const triggerDetected = this.detectTriggerPhrases(
      userInput,
      conversationFlow.triggerPhrases
    );

    // Extract tasks (always extract, but handle them based on stage)
    const extractedTasks = this.extractTasks(userInput);
    const intent = this.detectIntent(userInput);

    // Update conversation stage based on context
    const newStage = this.updateConversationStage(
      userInput,
      currentStage,
      triggerDetected,
      extractedTasks.length > 0
    );

    // Generate response based on current stage
    const response = this.generateStageAwareResponse(
      userInput,
      intent,
      extractedTasks,
      conversationHistory,
      newStage
    );
    const suggestions = this.generateSuggestions(userInput, intent);

    // Handle task extraction based on stage
    let tasksToReturn: Partial<Task>[] = [];
    let silentTasksCount = 0;

    if (newStage.stage === 'rapport-building' && extractedTasks.length > 0) {
      // Silently log tasks, don't return them for immediate creation
      conversationFlow.silentTasks.push(...extractedTasks);
      silentTasksCount = extractedTasks.length;
    } else if (
      newStage.stage === 'task-analysis' ||
      triggerDetected?.type === 'taskAnalysis'
    ) {
      // Return both newly extracted tasks and any previously silent tasks
      tasksToReturn = [...conversationFlow.silentTasks, ...extractedTasks];
      conversationFlow.silentTasks = []; // Clear silent tasks
    } else if (newStage.stage === 'mixed') {
      // In mixed mode, return new tasks but keep building rapport
      tasksToReturn = extractedTasks;
    }

    // Update user memory with new conversation stage
    this.userMemory.conversationFlow.currentStage = newStage;
    this.userMemory.conversationFlow.stageHistory.push(newStage);

    const processingTime = Date.now() - startTime;

    return {
      message: response,
      extractedTasks: tasksToReturn,
      suggestions,
      metadata: {
        confidence: this.calculateConfidence(userInput, extractedTasks),
        processingTime,
        intent,
        conversationStage: newStage.stage,
        silentTasksCount,
        energyLevel: newStage.userEnergyLevel,
      },
    };
  }

  private extractTasks(input: string): Partial<Task>[] {
    const tasks: Partial<Task>[] = [];
    const taskIndicators = [
      'need to',
      'have to',
      'should',
      'must',
      'want to',
      'going to',
      'plan to',
      'remind me to',
      "don't forget to",
      'make sure to',
      'schedule',
      'deadline',
      'due',
      'finish',
      'complete',
      'work on',
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
      /(.+?)\s+(?:is due|due|deadline)\s+(?:by|on|at|in)\s+(.+?)(?:\.|$|,)/gi,
    ];

    const hasTaskIndicator = taskIndicators.some(indicator =>
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
              updatedAt: new Date(),
            });
          }
        }
      });
    }

    return tasks;
  }

  private detectIntent(input: string): string {
    const intentPatterns = {
      task_creation:
        /(?:need to|have to|should|must|want to|plan to|remind me|don't forget)/i,
      task_query:
        /(?:what|show me|list|find|search|where|which)\s+(?:tasks|todo|work)/i,
      task_update: /(?:mark|update|change|modify|edit|complete|done|finished)/i,
      project_discussion: /(?:project|working on|focus on|switch to)/i,
      status_check: /(?:how|what's|status|progress|update)/i,
      casual_conversation:
        /(?:hello|hi|how are you|thanks|thank you|goodbye|bye)/i,
      help_request: /(?:help|how do|can you|what can)/i,
    };

    for (const [intent, pattern] of Object.entries(intentPatterns)) {
      if (pattern.test(input)) {
        return intent;
      }
    }

    return 'general_conversation';
  }

  private detectTriggerPhrases(
    input: string,
    triggerPhrases: { taskAnalysis: string[]; completion: string[] }
  ): { type: 'taskAnalysis' | 'completion'; phrase: string } | null {
    const lowerInput = input.toLowerCase();

    for (const phrase of triggerPhrases.taskAnalysis) {
      if (lowerInput.includes(phrase.toLowerCase())) {
        return { type: 'taskAnalysis', phrase };
      }
    }

    for (const phrase of triggerPhrases.completion) {
      if (lowerInput.includes(phrase.toLowerCase())) {
        return { type: 'completion', phrase };
      }
    }

    return null;
  }

  private updateConversationStage(
    input: string,
    currentStage: any,
    triggerDetected: any,
    hasNewTasks: boolean
  ): any {
    const newStage = { ...currentStage };
    newStage.messageCount += 1;

    // Detect user energy level
    newStage.userEnergyLevel = this.detectUserEnergyLevel(input);

    // Detect topic focus
    newStage.topicFocus = this.detectTopicFocus(input);

    // Update stage based on triggers and context
    if (triggerDetected?.type === 'taskAnalysis') {
      newStage.stage = 'task-analysis';
      newStage.confidence = 0.9;
      newStage.lastStageChange = new Date();
    } else if (
      newStage.messageCount >= 2 &&
      (hasNewTasks || newStage.topicFocus === 'work')
    ) {
      // After 2+ messages, if work-focused or has tasks, move to mixed mode
      newStage.stage = 'mixed';
      newStage.confidence = 0.7;
      if (currentStage.stage !== 'mixed') {
        newStage.lastStageChange = new Date();
      }
    } else if (
      newStage.messageCount >= 4 &&
      newStage.stage === 'rapport-building'
    ) {
      // After 4+ messages of rapport building, transition to mixed
      newStage.stage = 'mixed';
      newStage.confidence = 0.6;
      newStage.lastStageChange = new Date();
    }

    return newStage;
  }

  private detectUserEnergyLevel(input: string): 'high' | 'medium' | 'low' {
    const lowerInput = input.toLowerCase();
    const highEnergyWords = [
      'excited',
      'awesome',
      'amazing',
      'fantastic',
      'perfect',
      'incredible',
      'love',
    ];
    const lowEnergyWords = [
      'tired',
      'overwhelmed',
      'stressed',
      'busy',
      'exhausted',
      'struggling',
    ];

    const hasHighEnergy = highEnergyWords.some(word =>
      lowerInput.includes(word)
    );
    const hasLowEnergy = lowEnergyWords.some(word => lowerInput.includes(word));

    if (hasHighEnergy) return 'high';
    if (hasLowEnergy) return 'low';
    return 'medium';
  }

  private detectTopicFocus(input: string): 'casual' | 'work' | 'planning' {
    const lowerInput = input.toLowerCase();
    const workWords = [
      'project',
      'task',
      'work',
      'deadline',
      'meeting',
      'development',
    ];
    const planningWords = [
      'plan',
      'schedule',
      'organize',
      'goal',
      'strategy',
      'timeline',
    ];

    const hasWorkFocus = workWords.some(word => lowerInput.includes(word));
    const hasPlanningFocus = planningWords.some(word =>
      lowerInput.includes(word)
    );

    if (hasPlanningFocus) return 'planning';
    if (hasWorkFocus) return 'work';
    return 'casual';
  }

  private generateStageAwareResponse(
    input: string,
    intent: string,
    extractedTasks: Partial<Task>[],
    history: Message[],
    stage: any
  ): string {
    if (stage.stage === 'rapport-building') {
      return this.generateRapportBuildingResponse(
        input,
        intent,
        extractedTasks,
        history,
        stage
      );
    } else if (stage.stage === 'task-analysis') {
      return this.generateTaskAnalysisResponse(
        input,
        intent,
        extractedTasks,
        history,
        stage
      );
    } else {
      return this.generateMixedResponse(
        input,
        intent,
        extractedTasks,
        history,
        stage
      );
    }
  }

  private generateRapportBuildingResponse(
    input: string,
    intent: string,
    extractedTasks: Partial<Task>[],
    history: Message[],
    stage: any
  ): string {
    const userEnergy = stage.userEnergyLevel;
    const silentTasksCount = extractedTasks.length;

    let response = this.buildRapportResponse(
      input,
      intent,
      userEnergy,
      stage.messageCount
    );

    if (silentTasksCount > 0) {
      response += ` I'm taking note of some things you mentioned that we might want to tackle.`;
    }

    response += ` ${this.generateEnergyMatchedFollowUp(userEnergy, stage.topicFocus)}`;

    return response;
  }

  private generateTaskAnalysisResponse(
    input: string,
    intent: string,
    extractedTasks: Partial<Task>[],
    history: Message[],
    stage: any
  ): string {
    return this.generateResponse(input, intent, extractedTasks, history);
  }

  private generateMixedResponse(
    input: string,
    intent: string,
    extractedTasks: Partial<Task>[],
    history: Message[],
    stage: any
  ): string {
    const baseResponse = this.generateResponse(
      input,
      intent,
      extractedTasks,
      history
    );
    const rapportElement = this.generateEnergyMatchedFollowUp(
      stage.userEnergyLevel,
      stage.topicFocus
    );

    return baseResponse + ` ${rapportElement}`;
  }

  private buildRapportResponse(
    input: string,
    intent: string,
    userEnergy: string,
    messageCount: number
  ): string {
    const energyResponses = {
      high: [
        "I love your enthusiasm! That's exactly the kind of energy that gets things done.",
        "Your excitement is contagious! I can tell you're ready to tackle some serious work.",
        "That's the spirit! I'm getting excited just thinking about what we can accomplish together.",
      ],
      medium: [
        "I appreciate you sharing that with me. I'm here to help make things easier for you.",
        "That sounds really thoughtful. I'm curious to learn more about what's on your mind.",
        "Thanks for the context! I'm starting to get a picture of what you're working with.",
      ],
      low: [
        "I hear you, and I'm here to help however I can. Sometimes talking through things can make them feel more manageable.",
        "That sounds like a lot to handle. Let's see if we can find some ways to make things smoother for you.",
        'I appreciate you sharing that. Sometimes the best first step is just getting things out of your head.',
      ],
    };

    const responses =
      energyResponses[userEnergy as keyof typeof energyResponses] ||
      energyResponses.medium;
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private generateEnergyMatchedFollowUp(
    userEnergy: string,
    topicFocus: string
  ): string {
    const followUps = {
      high: {
        casual: 'What else is exciting you today?',
        work: "What's the coolest project you're working on right now?",
        planning: 'What big goals are you most fired up about?',
      },
      medium: {
        casual: "What's been on your mind lately?",
        work: "Tell me about what you're focusing on these days.",
        planning: 'What are you hoping to accomplish?',
      },
      low: {
        casual: 'What would help make your day a little better?',
        work: "What's feeling most overwhelming right now?",
        planning: 'What would feel good to get organized?',
      },
    };

    const energyFollowUps =
      followUps[userEnergy as keyof typeof followUps] || followUps.medium;
    return (
      energyFollowUps[topicFocus as keyof typeof energyFollowUps] ||
      energyFollowUps.casual
    );
  }

  private generateResponse(
    input: string,
    intent: string,
    extractedTasks: Partial<Task>[],
    history: Message[]
  ): string {
    // Enhanced conversation context analysis
    const recentHistory = history.slice(-10); // More context for better responses
    const hasRecentContext = recentHistory.length > 0;
    const lastAssistantMessage = recentHistory
      .filter(m => m.type === 'assistant')
      .pop();
    const conversationThemes = this.extractConversationThemes(recentHistory);
    const workPatterns = this.analyzeWorkPatterns(recentHistory);

    // Generate contextual insights and analysis
    const insights = this.generateProductivityInsights(
      extractedTasks,
      recentHistory,
      workPatterns
    );
    const strategicSuggestions = this.generateStrategicSuggestions(
      extractedTasks,
      conversationThemes
    );
    const followUpQuestions = this.generateFollowUpQuestions(
      intent,
      extractedTasks,
      conversationThemes
    );

    let response = this.buildMainResponse(
      intent,
      extractedTasks,
      hasRecentContext,
      conversationThemes,
      lastAssistantMessage
    );

    // Add detailed task analysis if tasks were extracted
    if (extractedTasks.length > 0) {
      response += this.buildTaskAnalysis(
        extractedTasks,
        workPatterns,
        hasRecentContext
      );
    }

    // Add productivity insights
    if (insights.length > 0) {
      response += `\n\n${insights.join(' ')}`;
    }

    // Add strategic suggestions
    if (strategicSuggestions.length > 0) {
      response += `\n\n${strategicSuggestions.join(' ')}`;
    }

    // Add contextual project information
    if (this.userMemory.contextualInfo.currentProjects.length > 0) {
      response += this.buildProjectContext(
        extractedTasks,
        conversationThemes,
        hasRecentContext
      );
    }

    // Add follow-up questions to encourage deeper conversation
    if (followUpQuestions.length > 0) {
      response += `\n\n${followUpQuestions.join(' ')}`;
    }

    return response;
  }

  private buildMainResponse(
    intent: string,
    extractedTasks: Partial<Task>[],
    hasRecentContext: boolean,
    conversationThemes: string[],
    lastAssistantMessage?: Message
  ): string {
    const responses = {
      task_creation: [
        hasRecentContext && conversationThemes.includes('project')
          ? "Perfect! I can see how these new tasks integrate with what we've been discussing about your project. Let me analyze the workflow and priorities."
          : "Excellent! I've identified several actionable items from your message. Let me break down what I found and suggest some optimizations.",

        hasRecentContext && conversationThemes.includes('deadline')
          ? "Great timing! These tasks fit well into the timeline we've been mapping out. I'll help you sequence them optimally."
          : "I love how you're thinking through these action items! Let me help you organize them strategically.",

        extractedTasks.length > 2
          ? "Wow, you're really planning ahead! I found multiple tasks here, and I can already see some interesting patterns in how they might work together."
          : "Got it! I've captured some clear action items from what you shared. Let me give you some context on what I see.",
      ],
      task_query: [
        hasRecentContext
          ? "Let me give you a comprehensive update on everything we've been tracking, plus some insights into your current workload patterns."
          : "I'll analyze your current task landscape and provide you with strategic insights about your priorities and workflow.",

        'Great question! Let me dive into your task data and provide some analytical insights about your current projects and priorities.',
        "I'll examine your tasks from multiple angles - status, priorities, patterns, and potential optimizations.",
      ],
      project_discussion: [
        hasRecentContext && lastAssistantMessage?.content.includes('project')
          ? "Fantastic! Building on our project discussion, I'm starting to see the bigger picture of what you're trying to accomplish. This project seems to have some interesting complexities."
          : "This sounds like a substantial project! I'm already thinking about how to help you break this down into manageable, strategic phases.",

        hasRecentContext
          ? 'I love how this project is evolving from our earlier conversation. Let me help you think through the workflow and identify any potential bottlenecks or opportunities.'
          : 'Project discussions are my favorite! I can help you think strategically about timelines, dependencies, and optimal task sequencing.',

        'This project has some really interesting dimensions! Let me help you approach this systematically and identify the critical path forward.',
      ],
      casual_conversation: [
        hasRecentContext
          ? "Thanks for the context! I'm building a better understanding of your work style and priorities. What else is on your mind for today's productivity?"
          : "Hello! I'm excited to help you tackle whatever's on your plate. I'm particularly good at helping you think strategically about your work and identifying productivity opportunities.",

        hasRecentContext && conversationThemes.length > 0
          ? `Good to continue our ${conversationThemes[0]} discussion! I'm tracking the themes in our conversation and can offer some strategic insights.`
          : 'Hi there! Ready to dive into some productive planning? I love helping people optimize their workflows and achieve their goals.',

        "Hey! I'm here to be your productivity partner. Whether you need help organizing tasks, thinking through complex projects, or optimizing your workflow, I'm ready to dig in!",
      ],
      help_request: [
        "I'm your AI productivity strategist! Beyond just capturing tasks, I analyze your work patterns, suggest optimizations, help with project planning, and act as your strategic thinking partner. I'm designed to understand the bigger picture of what you're trying to accomplish.",
        hasRecentContext
          ? "I specialize in strategic task management and productivity optimization. As you can see from our conversation, I don't just track tasks - I help you think through workflows, identify patterns, suggest improvements, and act as your planning partner."
          : "I'm much more than a task tracker! I'm your strategic work companion. I analyze productivity patterns, help with complex project planning, suggest workflow optimizations, and ask the right questions to help you think through challenges systematically.",
        'Think of me as your productivity strategist and planning partner! I help you capture tasks naturally, but more importantly, I analyze your work patterns, suggest strategic improvements, help break down complex projects, and provide insights you might not have considered.',
      ],
    };

    const responseArray =
      responses[intent as keyof typeof responses] ||
      responses.casual_conversation;
    return responseArray[Math.floor(Math.random() * responseArray.length)];
  }

  private buildTaskAnalysis(
    extractedTasks: Partial<Task>[],
    workPatterns: any,
    hasRecentContext: boolean
  ): string {
    const taskCount = extractedTasks.length;
    let analysis = '';

    if (taskCount === 1) {
      const task = extractedTasks[0];
      analysis += `\n\nI found one key task: "${task.title}". `;

      if (task.priority && task.priority !== 'medium') {
        analysis += `I've marked this as ${task.priority} priority based on your language. `;
      }

      if (task.dueDate) {
        analysis += `The timeline suggests this should be completed soon. `;
      }

      if (task.project) {
        analysis += `This appears to be part of your ${task.project} project. `;
      }
    } else if (taskCount > 1) {
      analysis += `\n\nI identified ${taskCount} distinct tasks. Here's my analysis: `;

      const priorities = extractedTasks.map(t => t.priority).filter(Boolean);
      const uniquePriorities = [...new Set(priorities)];

      if (uniquePriorities.length > 1) {
        analysis += `I see a mix of priority levels, which suggests good strategic thinking about what's most important. `;
      }

      const projects = extractedTasks.map(t => t.project).filter(Boolean);
      const uniqueProjects = [...new Set(projects)];

      if (uniqueProjects.length > 1) {
        analysis += `These tasks span ${uniqueProjects.length} different projects, so you might want to consider batch processing by project. `;
      } else if (uniqueProjects.length === 1) {
        analysis += `All tasks are focused on the ${uniqueProjects[0]} project, which is great for maintaining focus. `;
      }
    }

    return analysis;
  }

  private generateProductivityInsights(
    extractedTasks: Partial<Task>[],
    history: Message[],
    workPatterns: any
  ): string[] {
    const insights: string[] = [];

    // Analyze task timing patterns
    if (extractedTasks.length > 0) {
      const currentHour = new Date().getHours();

      if (currentHour < 10 && extractedTasks.some(t => t.priority === 'high')) {
        insights.push(
          "I notice you're planning high-priority work early in the day - that's typically when cognitive energy is highest!"
        );
      } else if (
        currentHour > 15 &&
        extractedTasks.some(t => t.priority === 'urgent')
      ) {
        insights.push(
          "You're identifying urgent tasks later in the day. Consider if any of these could be tackled tomorrow morning when you're fresh."
        );
      }
    }

    // Analyze conversation patterns
    if (history.length > 5) {
      const recentTaskCounts = history
        .slice(-5)
        .map(m => m.extractedTasks?.length || 0);
      const avgTasksPerMessage =
        recentTaskCounts.reduce((a, b) => a + b, 0) / recentTaskCounts.length;

      if (avgTasksPerMessage > 2) {
        insights.push(
          "You've been generating a lot of tasks in our conversation. That's great planning, but consider prioritizing which ones to tackle first."
        );
      }
    }

    // Analyze work patterns
    const hasDeadlinePattern =
      extractedTasks.some(t => t.dueDate) ||
      history.some(m => m.content.toLowerCase().includes('deadline'));
    if (hasDeadlinePattern) {
      insights.push(
        "I see you're thinking about deadlines - would it help to map out a timeline and work backwards from your due dates?"
      );
    }

    return insights;
  }

  private generateStrategicSuggestions(
    extractedTasks: Partial<Task>[],
    conversationThemes: string[]
  ): string[] {
    const suggestions: string[] = [];

    if (extractedTasks.length > 3) {
      suggestions.push(
        'With multiple tasks identified, consider using time-blocking to batch similar activities together for better focus.'
      );
    }

    if (conversationThemes.includes('project') && extractedTasks.length > 1) {
      suggestions.push(
        "For project work like this, I often recommend the 'cascade approach' - identify which tasks unlock others and sequence them strategically."
      );
    }

    if (
      conversationThemes.includes('deadline') ||
      extractedTasks.some(t => t.priority === 'urgent')
    ) {
      suggestions.push(
        "Given the time sensitivity, consider identifying the minimum viable scope for each task - what's the 80% solution that gets you to done?"
      );
    }

    if (conversationThemes.includes('meeting') && extractedTasks.length > 0) {
      suggestions.push(
        'Since meetings are involved, consider preparing agenda items or follow-up tasks in advance to maximize the collaborative time.'
      );
    }

    return suggestions;
  }

  private generateFollowUpQuestions(
    intent: string,
    extractedTasks: Partial<Task>[],
    conversationThemes: string[]
  ): string[] {
    const questions: string[] = [];

    if (intent === 'task_creation' && extractedTasks.length > 0) {
      if (extractedTasks.some(t => !t.dueDate)) {
        questions.push(
          'Are there any specific deadlines or time constraints I should know about for these tasks?'
        );
      }

      if (extractedTasks.some(t => !t.project)) {
        questions.push(
          "Do these tasks belong to a particular project or initiative you're working on?"
        );
      }

      if (extractedTasks.length > 2) {
        questions.push(
          'Which of these tasks would you like to tackle first, or should we prioritize them based on dependencies?'
        );
      }
    }

    if (intent === 'project_discussion') {
      questions.push(
        "What's the ultimate goal or outcome you're aiming for with this project?"
      );
      questions.push(
        'Are there any dependencies or constraints that might affect how we sequence these tasks?'
      );
    }

    if (conversationThemes.includes('deadline')) {
      questions.push(
        'How much time do you typically like to build in as a buffer before deadlines?'
      );
    }

    if (conversationThemes.includes('meeting')) {
      questions.push(
        'What outcomes do you want to achieve from these meetings, and what preparation would make them most effective?'
      );
    }

    return questions.slice(0, 2); // Return up to 2 follow-up questions
  }

  private buildProjectContext(
    extractedTasks: Partial<Task>[],
    conversationThemes: string[],
    hasRecentContext: boolean
  ): string {
    const currentProjects = this.userMemory.contextualInfo.currentProjects;
    let context = '';

    if (currentProjects.length > 0) {
      const relevantProject =
        currentProjects.find(
          project =>
            extractedTasks.some(task =>
              task.project?.toLowerCase().includes(project.toLowerCase())
            ) || conversationThemes.some(theme => theme.includes('project'))
        ) || currentProjects[0];

      if (extractedTasks.some(t => t.project)) {
        context += `\n\nI can see this connects to your ${relevantProject} project work. `;
      } else {
        context += `\n\nThis might relate to your ongoing ${relevantProject} project. `;
      }

      if (hasRecentContext) {
        context +=
          "Based on our conversation, I'm starting to see how these pieces fit together strategically.";
      } else {
        context +=
          'Would it be helpful to explore how this fits into your broader project goals?';
      }
    }

    return context;
  }

  private analyzeWorkPatterns(history: Message[]): any {
    // Analyze user's work patterns from conversation history
    const patterns = {
      taskComplexity: 'medium',
      planningStyle: 'detailed',
      urgencyPreference: 'balanced',
      projectFocus: 'multi-project',
    };

    const content = history.map(m => m.content.toLowerCase()).join(' ');

    // Analyze planning style
    if (
      content.includes('detail') ||
      content.includes('specific') ||
      content.includes('exactly')
    ) {
      patterns.planningStyle = 'detailed';
    } else if (
      content.includes('quick') ||
      content.includes('rough') ||
      content.includes('general')
    ) {
      patterns.planningStyle = 'high-level';
    }

    // Analyze urgency patterns
    const urgencyWords =
      content.match(/urgent|asap|immediately|rush|deadline/g) || [];
    if (urgencyWords.length > 2) {
      patterns.urgencyPreference = 'high-urgency';
    }

    return patterns;
  }

  private extractConversationThemes(history: Message[]): string[] {
    const themes: string[] = [];
    const content = history.map(m => m.content.toLowerCase()).join(' ');

    const themePatterns = {
      project: /project|development|build|create|design/,
      deadline: /deadline|due|urgent|asap|rush|deadline/,
      meeting: /meeting|call|discuss|presentation|demo/,
      planning: /plan|schedule|organize|strategy|roadmap/,
      review: /review|feedback|check|evaluate|assess/,
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
        "Let's explore the timeline and dependencies for these tasks",
        'Would you like help breaking any of these down into smaller steps?',
        'Should we discuss the strategic priority and sequencing?',
        'What resources or support might you need for these tasks?',
        'Are there any potential obstacles we should plan around?'
      );
    } else if (intent === 'project_discussion') {
      suggestions.push(
        'Tell me about the key milestones and success metrics',
        "What's the critical path and biggest risks?",
        'Who are the key stakeholders and what do they need?',
        'What would an ideal timeline look like?',
        'How does this project connect to your broader goals?'
      );
    } else if (intent === 'task_query') {
      suggestions.push(
        "Let's analyze your workload and identify optimization opportunities",
        'What patterns do you see in your current task mix?',
        'Are there any tasks that could be automated or streamlined?',
        "What's working well in your current workflow?"
      );
    } else if (intent === 'general_conversation') {
      suggestions.push(
        "What's your biggest strategic challenge right now?",
        "Tell me about a project that's going really well",
        'What would make your workday feel more productive and fulfilling?',
        'Are there any recurring tasks that eat up your time?',
        'What are you most excited to accomplish this week?'
      );
    }

    return suggestions.slice(0, 3); // Return up to 3 strategic suggestions
  }

  private detectPriority(input: string): 'low' | 'medium' | 'high' | 'urgent' {
    const urgentWords = [
      'urgent',
      'asap',
      'immediately',
      'critical',
      'emergency',
    ];
    const highWords = ['important', 'priority', 'soon', 'quickly', 'deadline'];
    const lowWords = [
      'later',
      'eventually',
      'when possible',
      'low priority',
      'sometime',
    ];

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
      /(?:by|before|on|at|in)\s+(next week|this week|next month)/i,
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
      /(?:project\s+)([A-Z][a-zA-Z\s]+)/i,
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
      /\b(meeting|call|email|research|review|development|design|testing|documentation)\b/gi,
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
    return (
      title
        .replace(/^(to\s+)?/, '') // Remove leading "to"
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim()
        .charAt(0)
        .toUpperCase() + title.slice(1)
    ); // Capitalize first letter
  }

  private generateTaskDescription(
    taskTitle: string,
    originalInput: string
  ): string {
    // Extract relevant context around the task
    const sentences = originalInput.split(/[.!?]+/);
    const relevantSentence = sentences.find(sentence =>
      sentence.toLowerCase().includes(taskTitle.toLowerCase())
    );

    return relevantSentence?.trim() || taskTitle;
  }

  private calculateConfidence(
    input: string,
    extractedTasks: Partial<Task>[]
  ): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on task indicators
    const taskIndicators = [
      'need to',
      'have to',
      'should',
      'must',
      'remind me',
    ];
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
