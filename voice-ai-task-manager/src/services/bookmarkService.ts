/**
 * Bookmark service for managing user bookmarks
 */

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  description?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class BookmarkService {
  private static baseUrl = import.meta.env.VITE_API_URL || '/api';

  static async getBookmarks(): Promise<Bookmark[]> {
    try {
      const response = await fetch(`${this.baseUrl}/bookmarks`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookmarks');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      return [];
    }
  }

  static async createBookmark(bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bookmark | null> {
    try {
      const response = await fetch(`${this.baseUrl}/bookmarks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(bookmark),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create bookmark');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating bookmark:', error);
      return null;
    }
  }

  static async updateBookmark(id: string, updates: Partial<Bookmark>): Promise<Bookmark | null> {
    try {
      const response = await fetch(`${this.baseUrl}/bookmarks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update bookmark');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating bookmark:', error);
      return null;
    }
  }

  static async deleteBookmark(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/bookmarks/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      return false;
    }
  }
}
