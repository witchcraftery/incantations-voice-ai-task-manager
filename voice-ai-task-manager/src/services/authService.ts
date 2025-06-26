import { UserPreferences } from '../types';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

interface LoginResponse {
  success: boolean;
  user: AuthUser;
  token: string;
}

class AuthService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api.incantations.witchcraftery.io'
      : 'http://localhost:3001';
    
    this.token = localStorage.getItem('auth_token');
  }

  // Google OAuth login
  async loginWithGoogle(credential: string): Promise<AuthUser | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          credential,
          clientId: process.env.VITE_GOOGLE_CLIENT_ID
        })
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data: LoginResponse = await response.json();
      
      if (data.success) {
        this.token = data.token;
        localStorage.setItem('auth_token', data.token);
        return data.user;
      }

      return null;
    } catch (error) {
      console.error('Google login failed:', error);
      return null;
    }
  }

  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    if (!this.token) return null;

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.logout();
        }
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Get current user failed:', error);
      return null;
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      this.token = null;
      localStorage.removeItem('auth_token');
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Get token for API requests
  getToken(): string | null {
    return this.token;
  }

  // Sync data to cloud
  async syncToCloud(data: { tasks: any[], conversations: any[], preferences: UserPreferences }): Promise<boolean> {
    if (!this.token) return false;

    try {
      const response = await fetch(`${this.baseUrl}/api/sync/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      return response.ok;
    } catch (error) {
      console.error('Sync to cloud failed:', error);
      return false;
    }
  }

  // Download data from cloud
  async downloadFromCloud(): Promise<{ tasks: any[], conversations: any[], preferences: UserPreferences } | null> {
    if (!this.token) return null;

    try {
      const response = await fetch(`${this.baseUrl}/api/sync/download`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
        credentials: 'include'
      });

      if (!response.ok) return null;

      return await response.json();
    } catch (error) {
      console.error('Download from cloud failed:', error);
      return null;
    }
  }

  // Sync preferences only
  async syncPreferences(preferences: UserPreferences): Promise<boolean> {
    if (!this.token) return false;

    try {
      const response = await fetch(`${this.baseUrl}/api/sync/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        credentials: 'include',
        body: JSON.stringify(preferences)
      });

      return response.ok;
    } catch (error) {
      console.error('Preferences sync failed:', error);
      return false;
    }
  }
}

export const authService = new AuthService();
export type { AuthUser };
