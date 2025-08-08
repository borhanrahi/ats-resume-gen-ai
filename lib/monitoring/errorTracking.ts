/**
 * Error Tracking and Monitoring System
 */

export interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: {
    userId?: string;
    sessionId: string;
    page: string;
    userAgent: string;
    url: string;
    component?: string;
    action?: string;
  };
  metadata?: Record<string, any>;
  resolved: boolean;
  occurrences: number;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorRate: number;
  topErrors: Array<{ message: string; count: number; severity: string }>;
  errorsByPage: Array<{ page: string; count: number }>;
  errorTrends: Array<{ timestamp: Date; count: number }>;
}

class ErrorTrackingService {
  private static instance: ErrorTrackingService;
  private errors: Map<string, ErrorReport> = new Map();
  private errorQueue: ErrorReport[] = [];

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializeClientErrorTracking();
    }
  }

  static getInstance(): ErrorTrackingService {
    if (!ErrorTrackingService.instance) {
      ErrorTrackingService.instance = new ErrorTrackingService();
    }
    return ErrorTrackingService.instance;
  }

  private initializeClientErrorTracking(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message), {
        component: 'global',
        action: 'runtime_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(new Error(`Unhandled Promise Rejection: ${event.reason}`), {
        component: 'global',
        action: 'promise_rejection'
      });
    });

    // React error boundary integration
    if (typeof window !== 'undefined' && (window as any).__REACT_ERROR_OVERLAY_GLOBAL_HOOK__) {
      const originalCaptureException = (window as any).__REACT_ERROR_OVERLAY_GLOBAL_HOOK__.onError;
      (window as any).__REACT_ERROR_OVERLAY_GLOBAL_HOOK__.onError = (error: Error) => {
        this.captureError(error, {
          component: 'react',
          action: 'component_error'
        });
        if (originalCaptureException) {
          originalCaptureException(error);
        }
      };
    }
  }

  captureError(
    error: Error | string,
    context?: {
      component?: string;
      action?: string;
      userId?: string;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      metadata?: Record<string, any>;
    }
  ): string {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? undefined : error.stack;
    
    // Generate error ID based on message and stack
    const errorId = this.generateErrorId(errorMessage, errorStack);
    
    // Check if this error already exists
    const existingError = this.errors.get(errorId);
    
    if (existingError) {
      // Update existing error
      existingError.occurrences++;
      existingError.timestamp = new Date();
      if (context?.metadata) {
        existingError.metadata = { ...existingError.metadata, ...context.metadata };
      }
    } else {
      // Create new error report
      const errorReport: ErrorReport = {
        id: errorId,
        message: errorMessage,
        stack: errorStack,
        timestamp: new Date(),
        severity: context?.severity || this.determineSeverity(errorMessage),
        context: {
          userId: context?.userId,
          sessionId: this.getSessionId(),
          page: typeof window !== 'undefined' ? window.location.pathname : 'server',
          userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
          url: typeof window !== 'undefined' ? window.location.href : 'server',
          component: context?.component,
          action: context?.action
        },
        metadata: context?.metadata,
        resolved: false,
        occurrences: 1
      };

      this.errors.set(errorId, errorReport);
      this.errorQueue.push(errorReport);
    }

    // Send to monitoring service
    this.sendErrorReport(this.errors.get(errorId)!);

    // Alert for critical errors
    const error_report = this.errors.get(errorId)!;
    if (error_report.severity === 'critical') {
      this.sendCriticalAlert(error_report);
    }

    return errorId;
  }

  private generateErrorId(message: string, stack?: string): string {
    // Create a hash-like ID based on error message and stack trace
    const content = message + (stack || '');
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `error_${Math.abs(hash).toString(36)}`;
  }

  private determineSeverity(message: string): 'low' | 'medium' | 'high' | 'critical' {
    const criticalKeywords = ['crash', 'fatal', 'security', 'payment', 'data loss'];
    const highKeywords = ['api', 'network', 'timeout', 'authentication', 'authorization'];
    const mediumKeywords = ['validation', 'parsing', 'format', 'upload'];

    const lowerMessage = message.toLowerCase();

    if (criticalKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'critical';
    }
    if (highKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'high';
    }
    if (mediumKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'medium';
    }
    return 'low';
  }

  private getSessionId(): string {
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('error_tracking_session');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('error_tracking_session', sessionId);
      }
      return sessionId;
    }
    return 'server_session';
  }

  private async sendErrorReport(error: ErrorReport): Promise<void> {
    try {
      // Only send in production
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error captured:', error);
        return;
      }

      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(error),
      });
    } catch (sendError) {
      console.error('Failed to send error report:', sendError);
    }
  }

  private async sendCriticalAlert(error: ErrorReport): Promise<void> {
    try {
      // In production, this could integrate with:
      // - Slack webhooks
      // - Email alerts
      // - PagerDuty
      // - Discord webhooks
      
      console.error('CRITICAL ERROR ALERT:', {
        message: error.message,
        page: error.context.page,
        occurrences: error.occurrences,
        timestamp: error.timestamp
      });

      // Example: Send to webhook
      if (process.env.CRITICAL_ERROR_WEBHOOK) {
        await fetch(process.env.CRITICAL_ERROR_WEBHOOK, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: `🚨 Critical Error Alert`,
            attachments: [{
              color: 'danger',
              fields: [
                { title: 'Error', value: error.message, short: false },
                { title: 'Page', value: error.context.page, short: true },
                { title: 'Occurrences', value: error.occurrences.toString(), short: true },
                { title: 'Time', value: error.timestamp.toISOString(), short: true }
              ]
            }]
          }),
        });
      }
    } catch (alertError) {
      console.error('Failed to send critical alert:', alertError);
    }
  }

  getErrorMetrics(timeframe: '1h' | '24h' | '7d' | '30d' = '24h'): ErrorMetrics {
    const now = new Date();
    let startTime: Date;
    
    switch (timeframe) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const recentErrors = Array.from(this.errors.values()).filter(
      error => error.timestamp >= startTime
    );

    const totalErrors = recentErrors.reduce((sum, error) => sum + error.occurrences, 0);
    
    // Calculate error rate (errors per hour)
    const timeRangeHours = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    const errorRate = totalErrors / timeRangeHours;

    // Top errors
    const topErrors = recentErrors
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 10)
      .map(error => ({
        message: error.message.substring(0, 100),
        count: error.occurrences,
        severity: error.severity
      }));

    // Errors by page
    const pageErrorCounts: Record<string, number> = {};
    recentErrors.forEach(error => {
      const page = error.context.page;
      pageErrorCounts[page] = (pageErrorCounts[page] || 0) + error.occurrences;
    });
    
    const errorsByPage = Object.entries(pageErrorCounts)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Error trends (hourly buckets)
    const errorTrends: Array<{ timestamp: Date; count: number }> = [];
    const bucketSize = 60 * 60 * 1000; // 1 hour
    const buckets = Math.ceil(timeRangeHours);
    
    for (let i = 0; i < buckets; i++) {
      const bucketStart = new Date(startTime.getTime() + i * bucketSize);
      const bucketEnd = new Date(bucketStart.getTime() + bucketSize);
      
      const bucketErrors = recentErrors.filter(error => 
        error.timestamp >= bucketStart && error.timestamp < bucketEnd
      );
      
      const bucketCount = bucketErrors.reduce((sum, error) => sum + error.occurrences, 0);
      
      errorTrends.push({
        timestamp: bucketStart,
        count: bucketCount
      });
    }

    return {
      totalErrors,
      errorRate,
      topErrors,
      errorsByPage,
      errorTrends
    };
  }

  getErrorById(errorId: string): ErrorReport | undefined {
    return this.errors.get(errorId);
  }

  markErrorAsResolved(errorId: string): boolean {
    const error = this.errors.get(errorId);
    if (error) {
      error.resolved = true;
      return true;
    }
    return false;
  }

  getAllErrors(): ErrorReport[] {
    return Array.from(this.errors.values());
  }

  clearResolvedErrors(): number {
    const resolvedCount = Array.from(this.errors.values()).filter(e => e.resolved).length;
    
    for (const [id, error] of this.errors.entries()) {
      if (error.resolved) {
        this.errors.delete(id);
      }
    }
    
    return resolvedCount;
  }
}

export const errorTrackingService = ErrorTrackingService.getInstance();

// React hook for error tracking
export function useErrorTracking() {
  const captureError = (error: Error | string, context?: any) => {
    return errorTrackingService.captureError(error, context);
  };

  const captureException = (error: Error, context?: any) => {
    return errorTrackingService.captureError(error, {
      ...context,
      severity: 'high'
    });
  };

  return {
    captureError,
    captureException
  };
}