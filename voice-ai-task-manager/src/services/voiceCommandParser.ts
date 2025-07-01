import { Task } from '../types';

export interface VoiceCommand {
  type: 'quick_task' | 'mark_complete' | 'change_priority' | 'search_tasks' | 'start_timer' | 'show_agenda' | 'edit_title' | 'edit_description' | 'edit_project' | 'edit_tags' | 'edit_due_date' | 'edit_status' | 'none';
  action: string;
  parameters: Record<string, any>;
  confidence: number;
  originalText: string;
}

export interface QuickTaskResult {
  title: string;
  priority: Task['priority'];
  project?: string;
  tags: string[];
}

export interface TaskUpdateResult {
  taskIdentifier: string;
  updateType: 'complete' | 'priority' | 'status';
  newValue: any;
}

export interface TaskEditResult {
  taskIdentifier: string;
  editType: 'title' | 'description' | 'project' | 'tags' | 'due_date' | 'status';
  newValue: any;
  originalValue?: any;
  action?: 'add' | 'remove' | 'set';
  dueDateText?: string;
}

export class VoiceCommandParser {
  private readonly QUICK_COMMANDS = {
    // Quick task creation
    QUICK_TASK: [
      /^(?:quick task|create task|new task|add task)[\s:]+(.+)$/i,
      /^(?:task)[\s:]+(.+)$/i,
      /^(?:remember to|remind me to)[\s:]+(.+)$/i
    ],
    
    // Mark tasks complete
    MARK_COMPLETE: [
      /^(?:mark complete|complete|done|finished)[\s:]+(.+)$/i,
      /^(?:check off|tick off)[\s:]+(.+)$/i,
      /^(.+)\s+(?:is done|is complete|is finished)$/i
    ],
    
    // Change priority
    CHANGE_PRIORITY: [
      /^(?:set priority|priority|make)[\s:]+(.+?)\s+(?:to\s+)?(urgent|high|medium|low)$/i,
      /^(?:urgent|high|medium|low)\s+priority[\s:]+(.+)$/i,
      /^(.+?)\s+(?:is|should be)\s+(urgent|high|medium|low)\s+priority$/i
    ],

    // Edit task title
    EDIT_TITLE: [
      /^(?:change|update|edit|rename)[\s]+(?:the\s+)?title[\s]+(?:of\s+)?(.+?)[\s]+(?:to|into)[\s]+(.+)$/i,
      /^rename[\s]+(.+?)[\s]+(?:to|as)[\s]+(.+)$/i,
      /^call[\s]+(.+?)[\s]+(.+)$/i,
      /^(?:change|update)[\s]+(.+?)[\s]+(?:to|into)[\s]+(.+)$/i
    ],

    // Edit task description
    EDIT_DESCRIPTION: [
      /^(?:change|update|edit)[\s]+(?:the\s+)?description[\s]+(?:of\s+)?(.+?)[\s]+(?:to|into)[\s]+(.+)$/i,
      /^(?:set|add)[\s]+description[\s]+(?:for\s+)?(.+?)[\s]+(?:to|as)[\s]+(.+)$/i,
      /^describe[\s]+(.+?)[\s]+as[\s]+(.+)$/i
    ],

    // Edit task project
    EDIT_PROJECT: [
      /^(?:move|assign|put)[\s]+(.+?)[\s]+(?:to|in|under)[\s]+(?:the\s+)?(.+?)[\s]+project$/i,
      /^(?:change|update)[\s]+(?:the\s+)?project[\s]+(?:of\s+)?(.+?)[\s]+(?:to|from.+to)[\s]+(.+)$/i,
      /^(.+?)[\s]+(?:belongs to|is part of)[\s]+(.+)$/i
    ],

    // Edit task status
    EDIT_STATUS: [
      /^(?:mark|set|change)[\s]+(.+?)[\s]+(?:as|to)[\s]+(pending|in-progress|completed|cancelled)$/i,
      /^(.+?)[\s]+(?:is now|should be)[\s]+(pending|in-progress|completed|cancelled)$/i,
      /^(?:start working on|begin)[\s]+(.+)$/i,
      /^(?:pause|stop working on)[\s]+(.+)$/i
    ],

    // Edit task tags
    EDIT_TAGS: [
      /^(?:add|tag|label)[\s]+(.+?)[\s]+(?:with|as)[\s]+(.+)$/i,
      /^(?:remove|untag)[\s]+(.+?)[\s]+(?:from|tag|label)[\s]+(.+)$/i,
      /^(?:set|change)[\s]+(?:the\s+)?tags[\s]+(?:of\s+)?(.+?)[\s]+(?:to|as)[\s]+(.+)$/i
    ],

    // Edit due date
    EDIT_DUE_DATE: [
      /^(?:set|change)[\s]+(?:the\s+)?due date[\s]+(?:of\s+)?(.+?)[\s]+(?:to|for)[\s]+(.+)$/i,
      /^(.+?)[\s]+(?:is due|due)[\s]+(.+)$/i,
      /^(?:schedule|plan)[\s]+(.+?)[\s]+(?:for|on)[\s]+(.+)$/i,
      /^(.+?)[\s]+(?:needs to be done|should be finished)[\s]+(?:by|on)[\s]+(.+)$/i
    ],
    
    // Search tasks
    SEARCH_TASKS: [
      /^(?:search|find|show|list)[\s:]+(?:tasks?\s+)?(.+)$/i,
      /^(?:what tasks|which tasks)[\s:]+(.+)$/i
    ],
    
    // Timer/focus commands
    START_TIMER: [
      /^(?:start timer|timer|focus)[\s:]+(?:for\s+)?(\d+)\s*(?:minutes?|mins?|hours?|hrs?)?(?:\s+for\s+(.+))?$/i,
      /^(?:pomodoro|work session)(?:\s+for\s+(.+))?$/i
    ],
    
    // Show agenda
    SHOW_AGENDA: [
      /^(?:show|what's|what is)\s+(?:my\s+)?(?:agenda|schedule|today|tasks for today)$/i,
      /^(?:daily agenda|today's tasks)$/i
    ]
  };

  private readonly PRIORITY_KEYWORDS = {
    urgent: ['urgent', 'critical', 'asap', 'immediately'],
    high: ['high', 'important', 'priority', 'soon'],
    medium: ['medium', 'normal', 'regular'],
    low: ['low', 'later', 'sometime', 'eventually']
  };

  parseCommand(text: string): VoiceCommand {
    const cleanText = text.trim().toLowerCase();
    
    // Check each command pattern
    for (const [commandType, patterns] of Object.entries(this.QUICK_COMMANDS)) {
      for (const pattern of patterns) {
        const match = cleanText.match(pattern);
        if (match) {
          return this.buildCommand(commandType, match, text);
        }
      }
    }

    return {
      type: 'none',
      action: 'no_command_detected',
      parameters: {},
      confidence: 0,
      originalText: text
    };
  }

  private buildCommand(commandType: string, match: RegExpMatchArray, originalText: string): VoiceCommand {
    const confidence = this.calculateConfidence(match, originalText);
    
    switch (commandType) {
      case 'QUICK_TASK':
        return this.buildQuickTaskCommand(match, originalText, confidence);
      
      case 'MARK_COMPLETE':
        return this.buildMarkCompleteCommand(match, originalText, confidence);
      
      case 'CHANGE_PRIORITY':
        return this.buildChangePriorityCommand(match, originalText, confidence);
      
      case 'SEARCH_TASKS':
        return this.buildSearchCommand(match, originalText, confidence);
      
      case 'START_TIMER':
        return this.buildTimerCommand(match, originalText, confidence);
      
      case 'SHOW_AGENDA':
        return this.buildAgendaCommand(match, originalText, confidence);
      
      case 'EDIT_TITLE':
        return this.buildEditTitleCommand(match, originalText, confidence);
      
      case 'EDIT_DESCRIPTION':
        return this.buildEditDescriptionCommand(match, originalText, confidence);
      
      case 'EDIT_PROJECT':
        return this.buildEditProjectCommand(match, originalText, confidence);
      
      case 'EDIT_STATUS':
        return this.buildEditStatusCommand(match, originalText, confidence);
      
      case 'EDIT_TAGS':
        return this.buildEditTagsCommand(match, originalText, confidence);
      
      case 'EDIT_DUE_DATE':
        return this.buildEditDueDateCommand(match, originalText, confidence);
      
      default:
        return {
          type: 'none',
          action: 'unknown_command',
          parameters: {},
          confidence: 0,
          originalText
        };
    }
  }

  private buildQuickTaskCommand(match: RegExpMatchArray, originalText: string, confidence: number): VoiceCommand {
    const taskText = match[1]?.trim() || '';
    const priority = this.detectPriority(originalText);
    const project = this.detectProject(originalText);
    const tags = this.extractTags(originalText);

    return {
      type: 'quick_task',
      action: 'create_task',
      parameters: {
        title: this.cleanTaskTitle(taskText),
        priority,
        project,
        tags,
        description: taskText
      } as QuickTaskResult,
      confidence,
      originalText
    };
  }

  private buildMarkCompleteCommand(match: RegExpMatchArray, originalText: string, confidence: number): VoiceCommand {
    const taskIdentifier = match[1]?.trim() || '';

    return {
      type: 'mark_complete',
      action: 'complete_task',
      parameters: {
        taskIdentifier,
        updateType: 'complete',
        newValue: 'completed'
      } as TaskUpdateResult,
      confidence,
      originalText
    };
  }

  private buildChangePriorityCommand(match: RegExpMatchArray, originalText: string, confidence: number): VoiceCommand {
    let taskIdentifier = '';
    let priority = 'medium';

    // Different patterns have different capture groups
    if (match[2]) {
      // Pattern: "set priority [task] to [priority]" or "[priority] priority [task]"
      taskIdentifier = match[1]?.trim() || '';
      priority = match[2]?.toLowerCase() || 'medium';
    } else if (match[1] && this.PRIORITY_KEYWORDS[match[1].toLowerCase() as keyof typeof this.PRIORITY_KEYWORDS]) {
      // Pattern: "[task] is [priority] priority"
      priority = match[1]?.toLowerCase() || 'medium';
      taskIdentifier = match[2]?.trim() || '';
    }

    return {
      type: 'change_priority',
      action: 'update_task_priority',
      parameters: {
        taskIdentifier,
        updateType: 'priority',
        newValue: priority
      } as TaskUpdateResult,
      confidence,
      originalText
    };
  }

  private buildSearchCommand(match: RegExpMatchArray, originalText: string, confidence: number): VoiceCommand {
    const searchQuery = match[1]?.trim() || '';

    return {
      type: 'search_tasks',
      action: 'search_tasks',
      parameters: {
        query: searchQuery,
        filters: this.extractSearchFilters(originalText)
      },
      confidence,
      originalText
    };
  }

  private buildTimerCommand(match: RegExpMatchArray, originalText: string, confidence: number): VoiceCommand {
    let duration = 25; // Default pomodoro
    let taskContext = '';

    if (match[1]) {
      duration = parseInt(match[1]) || 25;
      taskContext = match[2]?.trim() || '';
    } else if (originalText.toLowerCase().includes('pomodoro')) {
      duration = 25;
      taskContext = match[1]?.trim() || '';
    }

    return {
      type: 'start_timer',
      action: 'start_focus_timer',
      parameters: {
        duration,
        taskContext,
        type: duration === 25 ? 'pomodoro' : 'custom'
      },
      confidence,
      originalText
    };
  }

  private buildAgendaCommand(match: RegExpMatchArray, originalText: string, confidence: number): VoiceCommand {
    return {
      type: 'show_agenda',
      action: 'show_daily_agenda',
      parameters: {
        timeframe: this.detectTimeframe(originalText),
        includeCompleted: false
      },
      confidence,
      originalText
    };
  }

  private buildEditTitleCommand(match: RegExpMatchArray, originalText: string, confidence: number): VoiceCommand {
    let taskIdentifier = '';
    let newTitle = '';

    // Handle different patterns
    if (match[2]) {
      // Pattern: "change title of [task] to [new title]" or "rename [task] to [new title]"
      taskIdentifier = match[1]?.trim() || '';
      newTitle = match[2]?.trim() || '';
    } else if (originalText.toLowerCase().includes('call')) {
      // Pattern: "call [task] [new title]"
      taskIdentifier = match[1]?.trim() || '';
      newTitle = match[2]?.trim() || '';
    }

    return {
      type: 'edit_title',
      action: 'edit_task_title',
      parameters: {
        taskIdentifier,
        editType: 'title',
        newValue: this.cleanTaskTitle(newTitle)
      } as TaskEditResult,
      confidence,
      originalText
    };
  }

  private buildEditDescriptionCommand(match: RegExpMatchArray, originalText: string, confidence: number): VoiceCommand {
    const taskIdentifier = match[1]?.trim() || '';
    const newDescription = match[2]?.trim() || '';

    return {
      type: 'edit_description',
      action: 'edit_task_description',
      parameters: {
        taskIdentifier,
        editType: 'description',
        newValue: newDescription
      } as TaskEditResult,
      confidence,
      originalText
    };
  }

  private buildEditProjectCommand(match: RegExpMatchArray, originalText: string, confidence: number): VoiceCommand {
    const taskIdentifier = match[1]?.trim() || '';
    const newProject = match[2]?.trim() || '';

    return {
      type: 'edit_project',
      action: 'edit_task_project',
      parameters: {
        taskIdentifier,
        editType: 'project',
        newValue: newProject
      } as TaskEditResult,
      confidence,
      originalText
    };
  }

  private buildEditStatusCommand(match: RegExpMatchArray, originalText: string, confidence: number): VoiceCommand {
    let taskIdentifier = '';
    let newStatus = '';

    if (match[2]) {
      // Pattern: "mark [task] as [status]"
      taskIdentifier = match[1]?.trim() || '';
      newStatus = match[2]?.trim() || '';
    } else if (originalText.toLowerCase().includes('start working on') || originalText.toLowerCase().includes('begin')) {
      // Pattern: "start working on [task]"
      taskIdentifier = match[1]?.trim() || '';
      newStatus = 'in-progress';
    } else if (originalText.toLowerCase().includes('pause') || originalText.toLowerCase().includes('stop working on')) {
      // Pattern: "pause [task]"
      taskIdentifier = match[1]?.trim() || '';
      newStatus = 'pending';
    }

    return {
      type: 'edit_status',
      action: 'edit_task_status',
      parameters: {
        taskIdentifier,
        editType: 'status',
        newValue: newStatus
      } as TaskEditResult,
      confidence,
      originalText
    };
  }

  private buildEditTagsCommand(match: RegExpMatchArray, originalText: string, confidence: number): VoiceCommand {
    const taskIdentifier = match[1]?.trim() || '';
    const tagInput = match[2]?.trim() || '';
    
    // Determine if adding or removing tags
    const isRemoving = originalText.toLowerCase().includes('remove') || originalText.toLowerCase().includes('untag');
    const tags = tagInput.split(/[,\s]+/).map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);

    return {
      type: 'edit_tags',
      action: isRemoving ? 'remove_task_tags' : 'add_task_tags',
      parameters: {
        taskIdentifier,
        editType: 'tags',
        newValue: tags,
        action: isRemoving ? 'remove' : 'add'
      } as TaskEditResult,
      confidence,
      originalText
    };
  }

  private buildEditDueDateCommand(match: RegExpMatchArray, originalText: string, confidence: number): VoiceCommand {
    const taskIdentifier = match[1]?.trim() || '';
    const dueDateText = match[2]?.trim() || '';
    
    const dueDate = this.parseDueDate(dueDateText);

    return {
      type: 'edit_due_date',
      action: 'edit_task_due_date',
      parameters: {
        taskIdentifier,
        editType: 'due_date',
        newValue: dueDate,
        dueDateText
      } as TaskEditResult,
      confidence,
      originalText
    };
  }

  private calculateConfidence(match: RegExpMatchArray, originalText: string): number {
    let confidence = 0.8; // Base confidence for pattern match

    // Increase confidence for exact keyword matches
    const exactKeywords = ['quick task', 'mark complete', 'done', 'priority', 'search', 'timer', 'agenda'];
    const hasExactKeyword = exactKeywords.some(keyword => 
      originalText.toLowerCase().includes(keyword)
    );
    
    if (hasExactKeyword) confidence += 0.1;

    // Decrease confidence for very short or unclear matches
    const capturedText = match[1]?.trim() || '';
    if (capturedText.length < 3) confidence -= 0.3;
    if (originalText.includes('um') || originalText.includes('uh')) confidence -= 0.1;

    // Increase confidence for structured input
    if (originalText.includes(':') || originalText.includes(' to ')) confidence += 0.1;

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  private detectPriority(text: string): Task['priority'] {
    const lowerText = text.toLowerCase();
    
    for (const [priority, keywords] of Object.entries(this.PRIORITY_KEYWORDS)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return priority as Task['priority'];
      }
    }
    
    return 'medium';
  }

  private detectProject(text: string): string | undefined {
    const projectPatterns = [
      /(?:for|on|in)\s+(?:the\s+)?([A-Z][a-zA-Z\s]+?)\s+project/i,
      /(?:project\s+)([A-Z][a-zA-Z\s]+)/i,
      /@([a-zA-Z\s]+)/i // @ProjectName syntax
    ];

    for (const pattern of projectPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  private extractTags(text: string): string[] {
    const tags: string[] = [];
    const tagPatterns = [
      /#(\w+)/g, // Hashtags
      /\b(meeting|call|email|research|review|development|design|testing|documentation|urgent|important)\b/gi
    ];

    tagPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        tags.push(match[1].toLowerCase());
      }
    });

    return [...new Set(tags)]; // Remove duplicates
  }

  private extractSearchFilters(text: string): Record<string, any> {
    const filters: Record<string, any> = {};
    
    // Project filter
    const project = this.detectProject(text);
    if (project) filters.project = project;
    
    // Priority filter
    const priority = this.detectPriority(text);
    if (priority !== 'medium') filters.priority = priority;
    
    // Status filter
    if (text.includes('completed') || text.includes('done')) {
      filters.status = 'completed';
    } else if (text.includes('pending') || text.includes('todo')) {
      filters.status = 'pending';
    } else if (text.includes('in progress') || text.includes('working on')) {
      filters.status = 'in-progress';
    }
    
    // Date filter
    if (text.includes('today')) filters.dueDate = 'today';
    if (text.includes('tomorrow')) filters.dueDate = 'tomorrow';
    if (text.includes('this week')) filters.dueDate = 'this_week';
    if (text.includes('overdue')) filters.dueDate = 'overdue';
    
    return filters;
  }

  private detectTimeframe(text: string): string {
    if (text.includes('today')) return 'today';
    if (text.includes('tomorrow')) return 'tomorrow';
    if (text.includes('this week')) return 'week';
    if (text.includes('this month')) return 'month';
    return 'today'; // Default
  }

  private cleanTaskTitle(title: string): string {
    return title
      .replace(/^(to\s+)?/, '') // Remove leading "to"
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .split('')
      .map((char, index) => index === 0 ? char.toUpperCase() : char)
      .join('');
  }

  private parseDueDate(dueDateText: string): Date | null {
    const cleanText = dueDateText.toLowerCase().trim();
    const now = new Date();
    
    // Handle relative dates
    if (cleanText.includes('today')) {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    }
    
    if (cleanText.includes('tomorrow')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59);
    }
    
    if (cleanText.includes('next week')) {
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 23, 59, 59);
    }
    
    if (cleanText.includes('this week') || cleanText.includes('end of week')) {
      const endOfWeek = new Date(now);
      endOfWeek.setDate(endOfWeek.getDate() + (5 - endOfWeek.getDay())); // Friday
      return new Date(endOfWeek.getFullYear(), endOfWeek.getMonth(), endOfWeek.getDate(), 23, 59, 59);
    }
    
    // Handle day names (this week)
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (let i = 0; i < dayNames.length; i++) {
      if (cleanText.includes(dayNames[i])) {
        const targetDay = new Date(now);
        const currentDay = targetDay.getDay();
        const daysUntilTarget = (i - currentDay + 7) % 7;
        if (daysUntilTarget === 0 && !cleanText.includes('this')) {
          // If it's the same day, assume next week unless "this" is specified
          targetDay.setDate(targetDay.getDate() + 7);
        } else {
          targetDay.setDate(targetDay.getDate() + daysUntilTarget);
        }
        return new Date(targetDay.getFullYear(), targetDay.getMonth(), targetDay.getDate(), 23, 59, 59);
      }
    }
    
    // Try to parse as a date string
    try {
      const parsed = new Date(dueDateText);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    } catch (error) {
      // Ignore parsing errors
    }
    
    return null;
  }

  // Enhanced task matching with fuzzy search
  public findTasksByIdentifier(tasks: Task[], identifier: string): Task[] {
    const cleanIdentifier = identifier.toLowerCase().trim();
    const matches: { task: Task; score: number }[] = [];
    
    for (const task of tasks) {
      const score = this.calculateTaskMatchScore(task, cleanIdentifier);
      if (score > 0.3) { // Minimum threshold for matching
        matches.push({ task, score });
      }
    }
    
    // Sort by score (highest first) and return tasks
    return matches
      .sort((a, b) => b.score - a.score)
      .map(match => match.task);
  }
  
  private calculateTaskMatchScore(task: Task, identifier: string): number {
    let score = 0;
    const taskTitle = task.title.toLowerCase();
    const taskDescription = (task.description || '').toLowerCase();
    const taskProject = (task.project || '').toLowerCase();
    
    // Exact substring match in title (highest priority)
    if (taskTitle.includes(identifier)) {
      score += 1.0;
    }
    
    // Word matches in title
    const identifierWords = identifier.split(/\s+/);
    const titleWords = taskTitle.split(/\s+/);
    const matchingWords = identifierWords.filter(word => 
      titleWords.some(titleWord => titleWord.includes(word) || word.includes(titleWord))
    );
    score += (matchingWords.length / identifierWords.length) * 0.8;
    
    // Partial matches in description
    if (taskDescription.includes(identifier)) {
      score += 0.4;
    }
    
    // Project name match
    if (taskProject.includes(identifier)) {
      score += 0.6;
    }
    
    // Tag matches
    const matchingTags = task.tags.filter(tag => 
      tag.toLowerCase().includes(identifier) || identifier.includes(tag.toLowerCase())
    );
    score += (matchingTags.length / Math.max(task.tags.length, 1)) * 0.3;
    
    return Math.min(score, 1.0); // Cap at 1.0
  }

  // Helper method to check if text is likely a quick command
  public isQuickCommand(text: string): boolean {
    const command = this.parseCommand(text);
    return command.type !== 'none' && command.confidence >= 0.6;
  }

  // Helper method to get command suggestions
  public getCommandSuggestions(): string[] {
    return [
      "Try: 'Quick task: Review the project proposal'",
      "Try: 'Mark complete: Send the email'",
      "Try: 'High priority: Fix the bug in login'",
      "Try: 'Rename my presentation task to quarterly review slides'",
      "Try: 'Change the project of the website task to marketing'",
      "Try: 'Set due date of the report to tomorrow'",
      "Try: 'Start working on the development task'",
      "Try: 'Add urgent tag to the bug fix task'",
      "Try: 'Search: tasks due today'",
      "Try: 'Timer: 25 minutes for coding'",
      "Try: 'Show agenda'"
    ];
  }
}