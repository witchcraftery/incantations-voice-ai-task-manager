import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credential: string, clientId: string) => Promise<void>;
  logout: () => Promise<void>;
  syncPreferences: (localPreferences: any) => Promise<any>;
  updatePreferences: (preferences: any) => Promise<void>;
  getPreferences: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const API_BASE = process.env.NODE_ENV === 'production' 
    ? 'https://api.incantations.witchcraftery.io'
    : 'http://localhost:3001';

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.log('Not authenticated:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credential: string, clientId: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ credential, clientId }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      setUser(data.user);
      
      // Auto-sync localStorage preferences on first login
      const localPrefs = localStorage.getItem('incantations-preferences');
      if (localPrefs) {
        try {
          const parsed = JSON.parse(localPrefs);
          await syncPreferences(parsed);
        } catch (error) {
          console.warn('Failed to sync local preferences:', error);
        }
      }
      
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const getPreferences = async (): Promise<any> => {
    if (!user) return {};
    
    try {
      const response = await fetch(`${API_BASE}/api/user/preferences`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to get preferences:', error);
    }
    
    return {};
  };

  const updatePreferences = async (preferences: any) => {
    if (!user) return;
    
    try {
      await fetch(`${API_BASE}/api/user/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(preferences),
      });
    } catch (error) {
      console.error('Failed to update preferences:', error);
      throw error;
    }
  };

  const syncPreferences = async (localPreferences: any) => {
    if (!user) return localPreferences;
    
    try {
      const response = await fetch(`${API_BASE}/api/user/preferences/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ localPreferences }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.preferences;
      }
    } catch (error) {
      console.error('Failed to sync preferences:', error);
    }
    
    return localPreferences;
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    syncPreferences,
    updatePreferences,
    getPreferences,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
