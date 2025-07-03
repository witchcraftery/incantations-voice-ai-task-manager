import { useState, useEffect, useCallback } from 'react';
import { ConversationBookmark, Conversation, Message } from '../types';
import { BookmarkService } from '../services/bookmarkService';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<ConversationBookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const bookmarkService = new BookmarkService();

  // Load bookmarks on mount
  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = useCallback(async () => {
    try {
      setIsLoading(true);
      const loadedBookmarks = bookmarkService.loadBookmarks();
      setBookmarks(loadedBookmarks);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new bookmark
  const createBookmark = useCallback(
    async (
      conversationId: string,
      messageId: string,
      title?: string,
      description?: string,
      tags?: string[]
    ): Promise<ConversationBookmark | null> => {
      try {
        // If no title provided, we'll need the message to generate one
        const finalTitle =
          title || `Bookmark ${new Date().toLocaleDateString()}`;

        const bookmark = bookmarkService.createBookmark(
          conversationId,
          messageId,
          finalTitle,
          description,
          tags
        );

        setBookmarks(prev => [...prev, bookmark]);
        return bookmark;
      } catch (error) {
        console.error('Failed to create bookmark:', error);
        return null;
      }
    },
    []
  );

  // Create bookmark with auto-generated title and tags
  const createSmartBookmark = useCallback(
    async (
      conversationId: string,
      message: Message,
      description?: string
    ): Promise<ConversationBookmark | null> => {
      try {
        const title = bookmarkService.generateBookmarkTitle(message);
        const tags = bookmarkService.extractBookmarkTags(message);

        return await createBookmark(
          conversationId,
          message.id,
          title,
          description,
          tags
        );
      } catch (error) {
        console.error('Failed to create smart bookmark:', error);
        return null;
      }
    },
    [createBookmark]
  );

  // Update a bookmark
  const updateBookmark = useCallback(
    async (
      bookmarkId: string,
      updates: Partial<ConversationBookmark>
    ): Promise<boolean> => {
      try {
        const success = bookmarkService.updateBookmark(bookmarkId, updates);
        if (success) {
          setBookmarks(prev =>
            prev.map(bookmark =>
              bookmark.id === bookmarkId
                ? { ...bookmark, ...updates }
                : bookmark
            )
          );
        }
        return success;
      } catch (error) {
        console.error('Failed to update bookmark:', error);
        return false;
      }
    },
    []
  );

  // Delete a bookmark
  const deleteBookmark = useCallback(
    async (bookmarkId: string): Promise<boolean> => {
      try {
        const success = bookmarkService.deleteBookmark(bookmarkId);
        if (success) {
          setBookmarks(prev =>
            prev.filter(bookmark => bookmark.id !== bookmarkId)
          );
        }
        return success;
      } catch (error) {
        console.error('Failed to delete bookmark:', error);
        return false;
      }
    },
    []
  );

  // Toggle star status
  const toggleStar = useCallback(
    async (bookmarkId: string): Promise<boolean> => {
      try {
        const bookmark = bookmarks.find(b => b.id === bookmarkId);
        if (!bookmark) return false;

        return await updateBookmark(bookmarkId, {
          isStarred: !bookmark.isStarred,
        });
      } catch (error) {
        console.error('Failed to toggle star:', error);
        return false;
      }
    },
    [bookmarks, updateBookmark]
  );

  // Get bookmarks for a conversation
  const getBookmarksForConversation = useCallback(
    (conversationId: string) => {
      return bookmarks.filter(
        bookmark => bookmark.conversationId === conversationId
      );
    },
    [bookmarks]
  );

  // Get starred bookmarks
  const getStarredBookmarks = useCallback(() => {
    return bookmarks.filter(bookmark => bookmark.isStarred);
  }, [bookmarks]);

  // Search bookmarks
  const searchBookmarks = useCallback(
    (query: string) => {
      if (!query.trim()) return bookmarks;

      const lowerQuery = query.toLowerCase();
      return bookmarks.filter(
        bookmark =>
          bookmark.title.toLowerCase().includes(lowerQuery) ||
          bookmark.description?.toLowerCase().includes(lowerQuery) ||
          bookmark.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    },
    [bookmarks]
  );

  // Get bookmark context
  const getBookmarkContext = useCallback(
    (
      bookmark: ConversationBookmark,
      conversation: Conversation,
      contextSize?: number
    ) => {
      return bookmarkService.getBookmarkContext(
        bookmark,
        conversation,
        contextSize
      );
    },
    []
  );

  // Navigate to bookmark (returns message index)
  const navigateToBookmark = useCallback(
    (bookmark: ConversationBookmark, conversation: Conversation): number => {
      return conversation.messages.findIndex(m => m.id === bookmark.messageId);
    },
    []
  );

  // Get bookmark statistics
  const getBookmarkStats = useCallback(() => {
    return bookmarkService.getBookmarkStats();
  }, []);

  // Export bookmarks
  const exportBookmarks = useCallback(() => {
    return bookmarkService.exportBookmarks();
  }, []);

  // Import bookmarks
  const importBookmarks = useCallback(
    async (data: any): Promise<boolean> => {
      try {
        const success = bookmarkService.importBookmarks(data);
        if (success) {
          await loadBookmarks(); // Reload to show imported bookmarks
        }
        return success;
      } catch (error) {
        console.error('Failed to import bookmarks:', error);
        return false;
      }
    },
    [loadBookmarks]
  );

  // Clear all bookmarks
  const clearAllBookmarks = useCallback(async () => {
    try {
      bookmarkService.clearAllBookmarks();
      setBookmarks([]);
    } catch (error) {
      console.error('Failed to clear bookmarks:', error);
    }
  }, []);

  // Get recent bookmarks (last 7 days)
  const getRecentBookmarks = useCallback(() => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return bookmarks.filter(bookmark => bookmark.createdAt >= weekAgo);
  }, [bookmarks]);

  // Get bookmarks by tags
  const getBookmarksByTag = useCallback(
    (tag: string) => {
      return bookmarks.filter(bookmark =>
        bookmark.tags.some(t => t.toLowerCase() === tag.toLowerCase())
      );
    },
    [bookmarks]
  );

  // Get all unique tags
  const getAllTags = useCallback(() => {
    const allTags = bookmarks.flatMap(bookmark => bookmark.tags);
    return [...new Set(allTags)].sort();
  }, [bookmarks]);

  return {
    bookmarks,
    isLoading,
    createBookmark,
    createSmartBookmark,
    updateBookmark,
    deleteBookmark,
    toggleStar,
    getBookmarksForConversation,
    getStarredBookmarks,
    searchBookmarks,
    getBookmarkContext,
    navigateToBookmark,
    getBookmarkStats,
    getRecentBookmarks,
    getBookmarksByTag,
    getAllTags,
    exportBookmarks,
    importBookmarks,
    clearAllBookmarks,
    loadBookmarks,
  };
}
