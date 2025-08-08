/**
 * Privacy-Compliant Analytics System
 */

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: Date;
  sessionId: string;
  userId?: string;
  page?: string;
}

export interface UserBehaviorMetrics {
  pageViews: number;
  uniqueVisitors: number;
  sessionDuration: number;
  bounceRate: number;
  conversionRate: number;
  topPages: Array<{ page: string; views: number }>;
  userFlow: Array<{ from: string; to: string; count: number }>;
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private startTime: Date;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = new Date();
    
    // Initialize session tracking
    if (typeof window !== 'undefined') {
      this.initializeClientTracking();
    }
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeClientTracking(): void {
    // Track page views
    this.trackPageView(window.location.pathname);

    // Track session duration on page unload
    window.addEventListener('beforeunload', () => {
      const sessionDuration = Date.now() - this.startTime.getTime();
      this.track('session_end', { duration: sessionDuration });
    });

    // Track user interactions (privacy-compliant)
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.tagName === 'A') {
        this.track('click', {
          element: target.tagName.toLowerCase(),
          text: target.textContent?.substring(0, 50) || '',
          page: window.location.pathname
        });
      }
    });
  }

  track(event: string, properties?: Record<string, any>, userId?: string): void {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: this.sanitizeProperties(properties),
      timestamp: new Date(),
      sessionId: this.sessionId,
      userId,
      page: typeof window !== 'undefined' ? window.location.pathname : undefined
    };

    this.events.push(analyticsEvent);
    
    // Keep only last 1000 events in memory
    if (this.events.length > 1000) {
      this.events.shift();
    }

    // Send to analytics endpoint (non-blocking)
    this.sendToEndpoint(analyticsEvent);
  }

  trackPageView(page: string, userId?: string): void {
    this.track('page_view', { page }, userId);
  }

  trackConversion(type: 'signup' | 'upgrade' | 'analysis_complete', value?: number, userId?: string): void {
    this.track('conversion', { type, value }, userId);
  }

  trackError(error: string, context?: Record<string, any>): void {
    this.track('error', { 
      error: error.substring(0, 200), // Limit error message length
      context: this.sanitizeProperties(context)
    });
  }

  trackPerformance(metric: string, value: number, context?: Record<string, any>): void {
    this.track('performance', { 
      metric, 
      value, 
      context: this.sanitizeProperties(context) 
    });
  }

  private sanitizeProperties(properties?: Record<string, any>): Record<string, any> | undefined {
    if (!properties) return undefined;

    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(properties)) {
      // Remove PII and sensitive data
      if (this.isSensitiveKey(key)) continue;
      
      // Sanitize values
      if (typeof value === 'string') {
        sanitized[key] = value.substring(0, 200); // Limit string length
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (value && typeof value === 'object') {
        sanitized[key] = '[object]'; // Don't store complex objects
      }
    }

    return sanitized;
  }

  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      'email', 'password', 'token', 'key', 'secret', 'auth',
      'phone', 'address', 'ssn', 'credit', 'payment', 'personal'
    ];
    
    return sensitiveKeys.some(sensitive => 
      key.toLowerCase().includes(sensitive)
    );
  }

  private async sendToEndpoint(event: AnalyticsEvent): Promise<void> {
    try {
      // Only send in production and if user hasn't opted out
      if (process.env.NODE_ENV !== 'production') return;
      if (typeof window !== 'undefined' && localStorage.getItem('analytics_opt_out') === 'true') return;

      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      // Silently fail - analytics shouldn't break the app
      console.debug('Analytics send failed:', error);
    }
  }

  getUserBehaviorMetrics(): UserBehaviorMetrics {
    const pageViews = this.events.filter(e => e.event === 'page_view').length;
    const uniqueVisitors = new Set(this.events.map(e => e.sessionId)).size;
    
    // Calculate session duration
    const sessionEvents = this.events.filter(e => e.sessionId === this.sessionId);
    const sessionStart = sessionEvents[0]?.timestamp || this.startTime;
    const sessionEnd = sessionEvents[sessionEvents.length - 1]?.timestamp || new Date();
    const sessionDuration = sessionEnd.getTime() - sessionStart.getTime();

    // Calculate bounce rate (sessions with only one page view)
    const sessions = this.groupEventsBySession();
    const bouncedSessions = Object.values(sessions).filter(events => 
      events.filter(e => e.event === 'page_view').length === 1
    ).length;
    const bounceRate = sessions.length > 0 ? (bouncedSessions / Object.keys(sessions).length) * 100 : 0;

    // Calculate conversion rate
    const conversions = this.events.filter(e => e.event === 'conversion').length;
    const conversionRate = uniqueVisitors > 0 ? (conversions / uniqueVisitors) * 100 : 0;

    // Top pages
    const pageViewEvents = this.events.filter(e => e.event === 'page_view');
    const pageViewCounts: Record<string, number> = {};
    pageViewEvents.forEach(event => {
      const page = event.properties?.page || event.page || 'unknown';
      pageViewCounts[page] = (pageViewCounts[page] || 0) + 1;
    });
    const topPages = Object.entries(pageViewCounts)
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // User flow (simplified)
    const userFlow: Array<{ from: string; to: string; count: number }> = [];
    // This would require more complex analysis of sequential page views

    return {
      pageViews,
      uniqueVisitors,
      sessionDuration,
      bounceRate,
      conversionRate,
      topPages,
      userFlow
    };
  }

  private groupEventsBySession(): Record<string, AnalyticsEvent[]> {
    const sessions: Record<string, AnalyticsEvent[]> = {};
    
    this.events.forEach(event => {
      if (!sessions[event.sessionId]) {
        sessions[event.sessionId] = [];
      }
      sessions[event.sessionId].push(event);
    });

    return sessions;
  }

  // GDPR Compliance methods
  optOut(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('analytics_opt_out', 'true');
      this.events = []; // Clear existing events
    }
  }

  optIn(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('analytics_opt_out');
    }
  }

  isOptedOut(): boolean {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('analytics_opt_out') === 'true';
    }
    return false;
  }

  exportUserData(): AnalyticsEvent[] {
    // Return user's analytics data for GDPR data export requests
    return this.events.filter(event => event.userId);
  }

  deleteUserData(userId: string): void {
    // Remove user's analytics data for GDPR deletion requests
    this.events = this.events.filter(event => event.userId !== userId);
  }
}

export const analyticsService = AnalyticsService.getInstance();

// React hook for analytics
export function useAnalytics() {
  const track = (event: string, properties?: Record<string, any>) => {
    analyticsService.track(event, properties);
  };

  const trackPageView = (page: string) => {
    analyticsService.trackPageView(page);
  };

  const trackConversion = (type: 'signup' | 'upgrade' | 'analysis_complete', value?: number) => {
    analyticsService.trackConversion(type, value);
  };

  return {
    track,
    trackPageView,
    trackConversion,
    optOut: () => analyticsService.optOut(),
    optIn: () => analyticsService.optIn(),
    isOptedOut: () => analyticsService.isOptedOut()
  };
}