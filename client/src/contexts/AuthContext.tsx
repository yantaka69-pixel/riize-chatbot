import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { User, MoodType } from '../types';
import { authApi, generateDeviceId } from '../utils/api';

interface AuthContextType {
  user: User | null;
  deviceId: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (nickname: string) => Promise<void>;
  updateMood: (mood: MoodType) => Promise<void>;
  updateNickname: (nickname: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'riize_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [deviceId] = useState<string>(generateDeviceId());
  const [isLoading, setIsLoading] = useState(true);

  // Try to restore user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Verify the stored user still has the same device
        if (parsed.deviceId === deviceId) {
          setUser(parsed);
        } else {
          // Different device -> clear stored user
          localStorage.removeItem(USER_STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, [deviceId]);

  const login = useCallback(async (nickname: string) => {
    try {
      const response = await authApi.login(nickname, deviceId);
      const userData: User = {
        id: response.user.id,
        nickname: response.user.nickname,
        deviceId: response.user.deviceId,
        currentMood: response.user.currentMood || 'normal',
        createdAt: response.user.createdAt,
      };

      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, [deviceId]);

  const updateMood = useCallback(async (mood: MoodType) => {
    if (!user) return;

    try {
      await authApi.updateMood(user.id, mood);
      const updatedUser = { ...user, currentMood: mood };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Update mood failed:', error);
      throw error;
    }
  }, [user]);

  const updateNickname = useCallback(async (nickname: string) => {
    if (!user) return;

    try {
      await authApi.updateNickname(user.id, nickname);
      const updatedUser = { ...user, nickname };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Update nickname failed:', error);
      throw error;
    }
  }, [user]);

  const logout = useCallback(() => {
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  }, []);

  const value: AuthContextType = {
    user,
    deviceId,
    isAuthenticated: !!user,
    isLoading,
    login,
    updateMood,
    updateNickname,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
