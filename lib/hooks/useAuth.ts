import { useState, useEffect, createContext, useContext } from 'react';
import { authService, AppwriteUser, UserSession } from '@/lib/auth/appwrite';

interface AuthContextType {
  user: AppwriteUser | null;
  session: UserSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<AppwriteUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useAuthState() {
  const [user, setUser] = useState<AppwriteUser | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      setIsLoading(true);
      const [currentUser, currentSession] = await Promise.all([
        authService.getCurrentUser(),
        authService.getCurrentSession(),
      ]);
      
      setUser(currentUser);
      setSession(currentSession);
    } catch (error) {
      console.error('Auth state check failed:', error);
      setUser(null);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const session = await authService.login(email, password);
      const user = await authService.getCurrentUser();
      
      setSession(session);
      setUser(user);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      await authService.loginWithGoogle();
      // The redirect will handle the rest
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const user = await authService.createAccount(email, password, name);
      const session = await authService.login(email, password);
      
      setUser(user);
      setSession(session);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const updateProfile = async (data: Partial<AppwriteUser>) => {
    try {
      if (data.name) {
        await authService.updateName(data.name);
      }
      
      if (data.preferences) {
        await authService.updatePreferences(data.preferences);
      }
      
      // Refresh user data
      const updatedUser = await authService.getCurrentUser();
      setUser(updatedUser);
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  };

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!user && !!session,
    login,
    loginWithGoogle,
    register,
    logout,
    updateProfile,
  };
}