import { ConversationBookmark, Conversation, Message } from '../types';

export class BookmarkService {
  private readonly BOOKMARKS_KEY = 'voice_task_manager_bookmarks';

  // Save bookmarks to localStorage
  saveBookmarks(bookmarks: ConversationBookmark[]): void {
    try {
      localStorage.setItem(this.BOOKMARKS_KEY, JSON.stringify(bookmarks));
    } catch (error) {
      console.error('Failed to save bookmarks:', error);
    }
  }

  // Load bookmarks from localStorage
  loadBookmarks(): ConversationBookmark[] {
    try {
      const stored = localStorage.getItem(this.BOOKMARKS_KEY);
      if (!stored) return [];
      
      const bookmarks = JSON.parse(stored);
      return bookmarks.map((bookmark: any) => ({
        ...bookmark,
        createdAt: new Date(bookmark.createdAt)
      }));
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
      return [];
    }
  }

  // Create a new bookmark
  createBookmark(
    conversationId: string,
    messageId: string,
    title: string,
    description?: string,
    tags: string[] = []
  ): ConversationBookmark {
    const bookmark: ConversationBookmark = {
      id: crypto.randomUUID(),
      conversationId,
      messageId,
      title,
      description,
      createdAt: new Date(),
      tags,
      isStarred: false
    };

    const bookmarks = this.loadBookmarks();
    bookmarks.push(bookmark);
    this.saveBookmarks(bookmarks);

    return bookmark;
  }

  // Update an existing bookmark
  updateBookmark(bookmarkId: string, updates: Partial<ConversationBookmark>): boolean {
    try {
      const bookmarks = this.loadBookmarks();
      const index = bookmarks.findIndex(b => b.id === bookmarkId);
      
      if (index === -1) return false;
      
      bookmarks[index] = { ...bookmarks[index], ...updates };
      this.saveBookmarks(bookmarks);
      return true;
    } catch (error) {
      console.error('Failed to update bookmark:', error);
      return false;
    }
  }

  // Delete a bookmark
  deleteBookmark(bookmarkId: string): boolean {
    try {
      const bookmarks = this.loadBookmarks();
      const filteredBookmarks = bookmarks.filter(b => b.id !== bookmarkId);
      
      if (filteredBookmarks.length === bookmarks.length) return false;
      
      this.saveBookmarks(filteredBookmarks);
      return true;
    } catch (error) {
      console.error('Failed to delete bookmark:', error);
      return false;
    }
  }

  // Get bookmarks for a specific conversation
  getBookmarksForConversation(conversationId: string): ConversationBookmark[] {
    return this.loadBookmarks().filter(b => b.conversationId === conversationId);
  }

  // Get all starred bookmarks
  getStarredBookmarks(): ConversationBookmark[] {
    return this.loadBookmarks().filter(b => b.isStarred);
  }

  // Search bookmarks by title or description
  searchBookmarks(query: string): ConversationBookmark[] {
    const lowerQuery = query.toLowerCase();
    return this.loadBookmarks().filter(bookmark =>
      bookmark.title.toLowerCase().includes(lowerQuery) ||
      bookmark.description?.toLowerCase().includes(lowerQuery) ||
      bookmark.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  // Toggle star status
  toggleStar(bookmarkId: string): boolean {
    const bookmarks = this.loadBookmarks();
    const bookmark = bookmarks.find(b => b.id === bookmarkId);
    
    if (!bookmark) return false;
    
    return this.updateBookmark(bookmarkId, { isStarred: !bookmark.isStarred });
  }

  // Get bookmark context (message and surrounding messages)
  getBookmarkContext(
    bookmark: ConversationBookmark, 
    conversation: Conversation,
    contextSize: number = 2
  ): { messages: Message[]; targetMessage: Message | null } {
    const messageIndex = conversation.messages.findIndex(m => m.id === bookmark.messageId);
    
    if (messageIndex === -1) {
      return { messages: [], targetMessage: null };
    }

    const targetMessage = conversation.messages[messageIndex];
    const startIndex = Math.max(0, messageIndex - contextSize);
    const endIndex = Math.min(conversation.messages.length, messageIndex + contextSize + 1);
    
    const contextMessages = conversation.messages.slice(startIndex, endIndex);

    return { messages: contextMessages, targetMessage };
  }

  // Auto-generate bookmark title from message content
  generateBookmarkTitle(message: Message, maxLength: number = 50): string {
    const content = message.content.trim();
    
    // Remove common filler words and extract key phrases
    const cleanContent = content
      .replace(/^(well|so|um|uh|okay|alright|now|let me|i think|i need to|i want to|can you|could you)\s+/i, '')
      .replace(/\s+/g, ' ');

    if (cleanContent.length <= maxLength) {
      return cleanContent;
    }

    // Try to find a sentence break
    const sentences = cleanContent.split(/[.!?]+/);
    if (sentences[0] && sentences[0].length <= maxLength) {
      return sentences[0].trim();
    }

    // Truncate at word boundary
    const words = cleanContent.split(' ');
    let title = '';
    
    for (const word of words) {
      if ((title + ' ' + word).length > maxLength) {
        break;
      }
      title += (title ? ' ' : '') + word;
    }

    return title + (title.length < cleanContent.length ? '...' : '');
  }

  // Extract relevant tags from message content
  extractBookmarkTags(message: Message): string[] {
    const content = message.content.toLowerCase();
    const tags: string[] = [];
    
    // Common topic patterns
    const topicPatterns = {
      'task': /\b(task|todo|need to|have to|remind|deadline)\b/,
      'project': /\b(project|work on|working on|development)\b/,
      'meeting': /\b(meeting|call|discuss|presentation)\b/,
      'planning': /\b(plan|schedule|organize|strategy)\b/,
      'idea': /\b(idea|thought|concept|brainstorm)\b/,
      'question': /\b(question|ask|wonder|clarify)\b/,
      'decision': /\b(decide|decision|choose|option)\b/,
      'priority': /\b(urgent|important|priority|critical)\b/
    };

    Object.entries(topicPatterns).forEach(([tag, pattern]) => {
      if (pattern.test(content)) {
        tags.push(tag);
      }
    });

    // Extract hashtags
    const hashtags = content.match(/#(\w+)/g);
    if (hashtags) {
      tags.push(...hashtags.map(tag => tag.slice(1)));
    }

    // Extract @mentions as project tags
    const mentions = content.match(/@(\w+)/g);
    if (mentions) {
      tags.push(...mentions.map(mention => mention.slice(1)));
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  // Get bookmark statistics
  getBookmarkStats(): {
    total: number;
    starred: number;
    byConversation: Record<string, number>;
    recentCount: number;
  } {
    const bookmarks = this.loadBookmarks();
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const byConversation: Record<string, number> = {};
    let starred = 0;
    let recentCount = 0;

    bookmarks.forEach(bookmark => {
      // Count by conversation
      byConversation[bookmark.conversationId] = (byConversation[bookmark.conversationId] || 0) + 1;
      
      // Count starred
      if (bookmark.isStarred) starred++;
      
      // Count recent
      if (bookmark.createdAt >= weekAgo) recentCount++;
    });

    return {
      total: bookmarks.length,
      starred,
      byConversation,
      recentCount
    };
  }

  // Export bookmarks
  exportBookmarks(): any {
    return {
      bookmarks: this.loadBookmarks(),
      exportDate: new Date().toISOString()
    };
  }

  // Import bookmarks
  importBookmarks(data: any): boolean {
    try {
      if (data.bookmarks && Array.isArray(data.bookmarks)) {
        const bookmarks = data.bookmarks.map((bookmark: any) => ({
          ...bookmark,
          createdAt: new Date(bookmark.createdAt)
        }));
        this.saveBookmarks(bookmarks);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import bookmarks:', error);
      return false;
    }
  }

  // Clear all bookmarks
  clearAllBookmarks(): void {
    try {
      localStorage.removeItem(this.BOOKMARKS_KEY);
    } catch (error) {
      console.error('Failed to clear bookmarks:', error);
    }
  }
}