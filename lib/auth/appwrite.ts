import { Client, Account, Databases, ID, Models } from 'appwrite';

// Appwrite configuration
const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;

// Database and collection IDs
export const DATABASE_ID = 'main';
export const COLLECTIONS = {
  USERS: 'users',
  ANALYSES: 'analyses',
  TEMPLATES: 'templates',
  PAYMENTS: 'payments',
  ADMIN_CONFIGS: 'admin_configs',
  SYSTEM_LOGS: 'system_logs'
} as const;

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

// Initialize services
export const account = new Account(client);
export const databases = new Databases(client);

// Types for authentication
export interface UserSession {
  $id: string;
  userId: string;
  expire: string;
  provider: string;
  providerUid: string;
  providerAccessToken: string;
  providerAccessTokenExpiry: string;
  providerRefreshToken: string;
  ip: string;
  osCode: string;
  osName: string;
  osVersion: string;
  clientType: string;
  clientCode: string;
  clientName: string;
  clientVersion: string;
  clientEngine: string;
  clientEngineVersion: string;
  deviceName: string;
  deviceBrand: string;
  deviceModel: string;
  countryCode: string;
  countryName: string;
  current: boolean;
}

export interface UserPrefs {
  theme?: 'light' | 'dark';
  language?: string;
  notifications?: boolean;
}

export interface AppwriteUser extends Models.User<UserPrefs> {
  subscription?: {
    plan: 'free' | 'premium';
    status: 'active' | 'cancelled' | 'expired';
    expiresAt: string;
  };
}

// Authentication service class
export class AuthService {
  private static instance: AuthService;
  
  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Create account
  async createAccount(email: string, password: string, name: string): Promise<AppwriteUser> {
    try {
      const user = await account.create(ID.unique(), email, password, name);
      
      // Create user document in database
      await this.createUserDocument(user.$id, {
        email: user.email,
        name: user.name,
        subscription: {
          plan: 'free',
          status: 'active',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
        },
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: true
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      return user as AppwriteUser;
    } catch (error) {
      console.error('Account creation failed:', error);
      throw this.handleAuthError(error);
    }
  }

  // Login with email and password
  async login(email: string, password: string): Promise<UserSession> {
    try {
      const session = await account.createEmailPasswordSession(email, password);
      return session as UserSession;
    } catch (error) {
      console.error('Login failed:', error);
      throw this.handleAuthError(error);
    }
  }

  // Login with OAuth (Google)
  async loginWithGoogle(): Promise<void> {
    try {
      await account.createOAuth2Session(
        'google',
        `${window.location.origin}/dashboard`,
        `${window.location.origin}/auth/login?error=oauth_failed`
      );
    } catch (error) {
      console.error('Google OAuth failed:', error);
      throw this.handleAuthError(error);
    }
  }

  // Get current session
  async getCurrentSession(): Promise<UserSession | null> {
    try {
      const session = await account.getSession('current');
      return session as UserSession;
    } catch (error) {
      return null;
    }
  }

  // Get current user
  async getCurrentUser(): Promise<AppwriteUser | null> {
    try {
      const user = await account.get();
      
      // Get additional user data from database
      const userDoc = await this.getUserDocument(user.$id);
      
      return {
        ...user,
        subscription: userDoc?.subscription,
        preferences: userDoc?.preferences
      } as AppwriteUser;
    } catch (error) {
      return null;
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await account.deleteSession('current');
    } catch (error) {
      console.error('Logout failed:', error);
      throw this.handleAuthError(error);
    }
  }

  // Logout from all sessions
  async logoutAll(): Promise<void> {
    try {
      await account.deleteSessions();
    } catch (error) {
      console.error('Logout all failed:', error);
      throw this.handleAuthError(error);
    }
  }

  // Send password recovery email
  async sendPasswordRecovery(email: string): Promise<void> {
    try {
      await account.createRecovery(
        email,
        `${window.location.origin}/auth/reset-password`
      );
    } catch (error) {
      console.error('Password recovery failed:', error);
      throw this.handleAuthError(error);
    }
  }

  // Complete password recovery
  async completePasswordRecovery(
    userId: string,
    secret: string,
    password: string
  ): Promise<void> {
    try {
      await account.updateRecovery(userId, secret, password);
    } catch (error) {
      console.error('Password recovery completion failed:', error);
      throw this.handleAuthError(error);
    }
  }

  // Send email verification
  async sendEmailVerification(): Promise<void> {
    try {
      await account.createVerification(
        `${window.location.origin}/auth/verify-email`
      );
    } catch (error) {
      console.error('Email verification failed:', error);
      throw this.handleAuthError(error);
    }
  }

  // Complete email verification
  async completeEmailVerification(userId: string, secret: string): Promise<void> {
    try {
      await account.updateVerification(userId, secret);
    } catch (error) {
      console.error('Email verification completion failed:', error);
      throw this.handleAuthError(error);
    }
  }

  // Update user preferences
  async updatePreferences(prefs: UserPrefs): Promise<AppwriteUser> {
    try {
      const user = await account.updatePrefs(prefs);
      return user as AppwriteUser;
    } catch (error) {
      console.error('Preferences update failed:', error);
      throw this.handleAuthError(error);
    }
  }

  // Update user name
  async updateName(name: string): Promise<AppwriteUser> {
    try {
      const user = await account.updateName(name);
      return user as AppwriteUser;
    } catch (error) {
      console.error('Name update failed:', error);
      throw this.handleAuthError(error);
    }
  }

  // Update user email
  async updateEmail(email: string, password: string): Promise<AppwriteUser> {
    try {
      const user = await account.updateEmail(email, password);
      return user as AppwriteUser;
    } catch (error) {
      console.error('Email update failed:', error);
      throw this.handleAuthError(error);
    }
  }

  // Update user password
  async updatePassword(newPassword: string, oldPassword: string): Promise<AppwriteUser> {
    try {
      const user = await account.updatePassword(newPassword, oldPassword);
      return user as AppwriteUser;
    } catch (error) {
      console.error('Password update failed:', error);
      throw this.handleAuthError(error);
    }
  }

  // Create user document in database
  private async createUserDocument(userId: string, userData: any): Promise<void> {
    try {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.USERS,
        userId,
        userData
      );
    } catch (error) {
      console.error('User document creation failed:', error);
      // Don't throw here as the account was already created
    }
  }

  // Get user document from database
  private async getUserDocument(userId: string): Promise<any> {
    try {
      return await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.USERS,
        userId
      );
    } catch (error) {
      console.error('User document retrieval failed:', error);
      return null;
    }
  }

  // Handle authentication errors
  private handleAuthError(error: any): Error {
    if (error?.code) {
      switch (error.code) {
        case 401:
          return new Error('Invalid credentials. Please check your email and password.');
        case 409:
          return new Error('An account with this email already exists.');
        case 429:
          return new Error('Too many requests. Please try again later.');
        case 400:
          if (error.message?.includes('password')) {
            return new Error('Password must be at least 8 characters long.');
          }
          if (error.message?.includes('email')) {
            return new Error('Please enter a valid email address.');
          }
          return new Error('Invalid request. Please check your input.');
        default:
          return new Error(error.message || 'Authentication failed. Please try again.');
      }
    }
    return new Error('Authentication failed. Please try again.');
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();

// JWT Token management utilities
export class TokenManager {
  private static readonly TOKEN_KEY = 'appwrite_session';
  
  static setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TokenManager.TOKEN_KEY, token);
    }
  }
  
  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TokenManager.TOKEN_KEY);
    }
    return null;
  }
  
  static removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TokenManager.TOKEN_KEY);
    }
  }
  
  static isTokenExpired(token: string): boolean {
    try {
      // Basic JWT expiration check
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}

export default client;