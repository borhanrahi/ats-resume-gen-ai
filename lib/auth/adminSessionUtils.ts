import { AdminUser } from '../../types/admin';

// Admin session storage keys
export const ADMIN_SESSION_KEYS = {
  USER: 'admin_user',
  SESSION_TOKEN: 'admin_session_token',
  LAST_ACTIVITY: 'admin_last_activity',
  PREFERENCES: 'admin_preferences'
} as const;

// Session timeout (30 minutes)
export const SESSION_TIMEOUT = 30 * 60 * 1000;

// Admin session utilities
export class AdminSessionUtils {
  // Check if session is expired
  static isSessionExpired(): boolean {
    if (typeof window === 'undefined') return true;
    
    const lastActivity = localStorage.getItem(ADMIN_SESSION_KEYS.LAST_ACTIVITY);
    if (!lastActivity) return true;
    
    const lastActivityTime = parseInt(lastActivity, 10);
    const now = Date.now();
    
    return (now - lastActivityTime) > SESSION_TIMEOUT;
  }

  // Update last activity timestamp
  static updateLastActivity(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(ADMIN_SESSION_KEYS.LAST_ACTIVITY, Date.now().toString());
  }

  // Get session data
  static getSessionData(): {
    user: AdminUser | null;
    sessionToken: string | null;
    isExpired: boolean;
  } {
    if (typeof window === 'undefined') {
      return { user: null, sessionToken: null, isExpired: true };
    }

    try {
      const userStr = localStorage.getItem(ADMIN_SESSION_KEYS.USER);
      const sessionToken = localStorage.getItem(ADMIN_SESSION_KEYS.SESSION_TOKEN);
      const isExpired = AdminSessionUtils.isSessionExpired();

      const user = userStr ? JSON.parse(userStr) : null;

      return { user, sessionToken, isExpired };
    } catch (error) {
      console.error('Failed to get session data:', error);
      return { user: null, sessionToken: null, isExpired: true };
    }
  }

  // Set session data
  static setSessionData(user: AdminUser, sessionToken: string): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(ADMIN_SESSION_KEYS.USER, JSON.stringify(user));
      localStorage.setItem(ADMIN_SESSION_KEYS.SESSION_TOKEN, sessionToken);
      AdminSessionUtils.updateLastActivity();
    } catch (error) {
      console.error('Failed to set session data:', error);
    }
  }

  // Clear session data
  static clearSessionData(): void {
    if (typeof window === 'undefined') return;

    Object.values(ADMIN_SESSION_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  // Get admin preferences
  static getAdminPreferences(): Record<string, any> {
    if (typeof window === 'undefined') return {};

    try {
      const prefsStr = localStorage.getItem(ADMIN_SESSION_KEYS.PREFERENCES);
      return prefsStr ? JSON.parse(prefsStr) : {};
    } catch (error) {
      console.error('Failed to get admin preferences:', error);
      return {};
    }
  }

  // Set admin preferences
  static setAdminPreferences(preferences: Record<string, any>): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(ADMIN_SESSION_KEYS.PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to set admin preferences:', error);
    }
  }

  // Initialize session monitoring
  static initializeSessionMonitoring(onSessionExpired: () => void): () => void {
    if (typeof window === 'undefined') return () => {};

    // Check session every minute
    const interval = setInterval(() => {
      if (AdminSessionUtils.isSessionExpired()) {
        onSessionExpired();
      }
    }, 60000);

    // Update activity on user interaction
    const updateActivity = () => AdminSessionUtils.updateLastActivity();
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Cleanup function
    return () => {
      clearInterval(interval);
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }
}

// Admin activity tracker
export class AdminActivityTracker {
  private static activities: Array<{
    action: string;
    timestamp: Date;
    details?: Record<string, any>;
  }> = [];

  // Track admin activity
  static trackActivity(action: string, details?: Record<string, any>): void {
    AdminActivityTracker.activities.push({
      action,
      timestamp: new Date(),
      details
    });

    // Keep only last 100 activities
    if (AdminActivityTracker.activities.length > 100) {
      AdminActivityTracker.activities = AdminActivityTracker.activities.slice(-100);
    }

    // Update last activity timestamp
    AdminSessionUtils.updateLastActivity();
  }

  // Get recent activities
  static getRecentActivities(limit: number = 10): Array<{
    action: string;
    timestamp: Date;
    details?: Record<string, any>;
  }> {
    return AdminActivityTracker.activities
      .slice(-limit)
      .reverse();
  }

  // Clear activities
  static clearActivities(): void {
    AdminActivityTracker.activities = [];
  }
}

// Security utilities for admin sessions
export class AdminSecurityUtils {
  // Generate secure session token
  static generateSessionToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Validate session token format
  static isValidSessionToken(token: string): boolean {
    return /^[a-f0-9]{64}$/.test(token);
  }

  // Check for suspicious activity
  static checkSuspiciousActivity(): {
    isSuspicious: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let isSuspicious = false;

    // Check for rapid successive logins
    const recentActivities = AdminActivityTracker.getRecentActivities(20);
    const loginAttempts = recentActivities.filter(
      activity => activity.action === 'admin_login'
    );

    if (loginAttempts.length > 5) {
      reasons.push('Multiple login attempts detected');
      isSuspicious = true;
    }

    // Check for unusual activity patterns
    const failedActions = recentActivities.filter(
      activity => activity.action.includes('failed')
    );

    if (failedActions.length > 10) {
      reasons.push('High number of failed actions');
      isSuspicious = true;
    }

    return { isSuspicious, reasons };
  }

  // Get security recommendations
  static getSecurityRecommendations(user: AdminUser): string[] {
    const recommendations: string[] = [];

    // Check last login time
    const daysSinceLastLogin = Math.floor(
      (Date.now() - user.lastLogin.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastLogin > 30) {
      recommendations.push('Consider updating your password - last login was over 30 days ago');
    }

    // Check role-specific recommendations
    if (user.role === 'super_admin') {
      recommendations.push('Enable two-factor authentication for enhanced security');
      recommendations.push('Regularly review admin user permissions');
    }

    if (user.permissions.includes('super_admin')) {
      recommendations.push('Monitor system logs regularly for suspicious activity');
    }

    return recommendations;
  }
}

// Admin session hooks for React components
export const useAdminSession = () => {
  const { user, sessionToken, isExpired } = AdminSessionUtils.getSessionData();
  
  const trackActivity = (action: string, details?: Record<string, any>) => {
    AdminActivityTracker.trackActivity(action, details);
  };

  const getRecentActivities = (limit?: number) => {
    return AdminActivityTracker.getRecentActivities(limit);
  };

  const getSecurityStatus = () => {
    if (!user) return null;
    
    return {
      ...AdminSecurityUtils.checkSuspiciousActivity(),
      recommendations: AdminSecurityUtils.getSecurityRecommendations(user)
    };
  };

  return {
    user,
    sessionToken,
    isExpired,
    trackActivity,
    getRecentActivities,
    getSecurityStatus
  };
};