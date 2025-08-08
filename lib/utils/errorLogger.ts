/**
 * Centralized logging system for the ATS Resume Checker application
 * Provides structured logging, error categorization, and automated alerting
 * Requirements: 13.3 - System monitoring and error tracking
 */

export type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical';

export type LogCategory = 
  | 'auth'
  | 'ai_analysis'
  | 'document_parsing'
  | 'export'
  | 'payment'
  | 'admin'
  | 'system'
  | 'user_action'
  | 'api'
  | 'performance'
  | 'security';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  category: LogCategory;
  message: string;
  context?: Record<string, unknown>;
  userId?: string;
  adminId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  ip?: string;
  stack?: string;
  duration?: number;
  metadata?: {
    version?: string;
    environment?: string;
    buildId?: string;
    feature?: string;
    component?: string;
  };
}

export interface LogFilter {
  level?: LogLevel[];
  category?: LogCategory[];
  userId?: string;
  adminId?: string;
  startTime?: number;
  endTime?: number;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

export interface LogAggregation {
  totalCount: number;
  levelCounts: Record<LogLevel, number>;
  categoryCounts: Record<LogCategory, number>;
  errorRate: number;
  criticalCount: number;
  recentErrors: LogEntry[];
  topErrors: Array<{
    message: string;
    count: number;
    lastOccurrence: number;
  }>;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: {
    level?: LogLevel[];
    category?: LogCategory[];
    messagePattern?: string;
    threshold?: {
      count: number;
      timeWindow: number; // in milliseconds
    };
    errorRate?: {
      percentage: number;
      timeWindow: number;
    };
  };
  actions: AlertAction[];
  enabled: boolean;
  cooldown: number; // minimum time between alerts in milliseconds
  lastTriggered?: number;
}

export interface AlertAction {
  type: 'email' | 'webhook' | 'console' | 'notification';
  config: {
    recipients?: string[];
    webhookUrl?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    template?: string;
  };
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private logs: LogEntry[] = [];
  private alertRules: AlertRule[] = [];
  private maxLogSize = 10000; // Maximum number of logs to keep in memory
  private sessionId: string;
  private isInitialized = false;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeDefaultAlertRules();
  }

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  /**
   * Initialize the logger with configuration
   */
  async initialize(config?: {
    maxLogSize?: number;
    enableConsoleOutput?: boolean;
    enableRemoteLogging?: boolean;
    alertRules?: AlertRule[];
  }): Promise<void> {
    if (this.isInitialized) return;

    if (config?.maxLogSize) {
      this.maxLogSize = config.maxLogSize;
    }

    if (config?.alertRules) {
      this.alertRules = [...this.alertRules, ...config.alertRules];
    }

    // Load persisted logs from localStorage
    await this.loadPersistedLogs();

    // Set up periodic cleanup
    setInterval(() => this.cleanup(), 60000); // Clean up every minute

    // Set up periodic log persistence
    setInterval(() => this.persistLogs(), 30000); // Persist every 30 seconds

    this.isInitialized = true;

    this.log('info', 'system', 'Error logger initialized', {
      maxLogSize: this.maxLogSize,
      sessionId: this.sessionId,
    });
  }

  /**
   * Main logging method
   */
  log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    context?: Record<string, unknown>,
    options?: {
      userId?: string;
      adminId?: string;
      duration?: number;
      stack?: string;
    }
  ): LogEntry {
    const entry: LogEntry = {
      id: this.generateLogId(),
      timestamp: Date.now(),
      level,
      category,
      message,
      context,
      userId: options?.userId,
      adminId: options?.adminId,
      sessionId: this.sessionId,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      stack: options?.stack,
      duration: options?.duration,
      metadata: {
        version: process.env.NEXT_PUBLIC_APP_VERSION,
        environment: process.env.NODE_ENV,
        buildId: process.env.NEXT_PUBLIC_BUILD_ID,
      },
    };

    // Add to logs array
    this.logs.push(entry);

    // Maintain log size limit
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(-this.maxLogSize);
    }

    // Console output for development
    if (process.env.NODE_ENV === 'development') {
      this.outputToConsole(entry);
    }

    // Check alert rules
    this.checkAlertRules(entry);

    // Send to remote logging service if enabled
    if (process.env.NODE_ENV === 'production') {
      this.sendToRemoteLogging(entry).catch(error => {
        console.error('Failed to send log to remote service:', error);
      });
    }

    return entry;
  }

  /**
   * Convenience methods for different log levels
   */
  debug(category: LogCategory, message: string, context?: Record<string, unknown>, options?: { userId?: string; adminId?: string }): LogEntry {
    return this.log('debug', category, message, context, options);
  }

  info(category: LogCategory, message: string, context?: Record<string, unknown>, options?: { userId?: string; adminId?: string }): LogEntry {
    return this.log('info', category, message, context, options);
  }

  warning(category: LogCategory, message: string, context?: Record<string, unknown>, options?: { userId?: string; adminId?: string }): LogEntry {
    return this.log('warning', category, message, context, options);
  }

  error(category: LogCategory, message: string, error?: Error, context?: Record<string, unknown>, options?: { userId?: string; adminId?: string }): LogEntry {
    return this.log('error', category, message, {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    }, {
      ...options,
      stack: error?.stack,
    });
  }

  critical(category: LogCategory, message: string, error?: Error, context?: Record<string, unknown>, options?: { userId?: string; adminId?: string }): LogEntry {
    return this.log('critical', category, message, {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    }, {
      ...options,
      stack: error?.stack,
    });
  }

  /**
   * Performance logging
   */
  logPerformance(
    category: LogCategory,
    operation: string,
    duration: number,
    context?: Record<string, unknown>,
    options?: { userId?: string; adminId?: string }
  ): LogEntry {
    const level: LogLevel = duration > 10000 ? 'error' : duration > 5000 ? 'warning' : 'info';
    return this.log(level, category, `Performance: ${operation}`, {
      ...context,
      operation,
      duration,
    }, {
      ...options,
      duration,
    });
  }

  /**
   * User action logging
   */
  logUserAction(
    action: string,
    userId?: string,
    context?: Record<string, unknown>
  ): LogEntry {
    return this.log('info', 'user_action', `User action: ${action}`, {
      ...context,
      action,
    }, { userId });
  }

  /**
   * Admin action logging
   */
  logAdminAction(
    action: string,
    adminId: string,
    context?: Record<string, unknown>
  ): LogEntry {
    return this.log('info', 'admin', `Admin action: ${action}`, {
      ...context,
      action,
    }, { adminId });
  }

  /**
   * Security event logging
   */
  logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    context?: Record<string, unknown>,
    options?: { userId?: string; adminId?: string }
  ): LogEntry {
    const level: LogLevel = severity === 'critical' ? 'critical' : severity === 'high' ? 'error' : 'warning';
    return this.log(level, 'security', `Security event: ${event}`, {
      ...context,
      event,
      severity,
    }, options);
  }

  /**
   * Get logs with filtering
   */
  getLogs(filter?: LogFilter): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (filter?.level) {
      filteredLogs = filteredLogs.filter(log => filter.level!.includes(log.level));
    }

    if (filter?.category) {
      filteredLogs = filteredLogs.filter(log => filter.category!.includes(log.category));
    }

    if (filter?.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === filter.userId);
    }

    if (filter?.adminId) {
      filteredLogs = filteredLogs.filter(log => log.adminId === filter.adminId);
    }

    if (filter?.startTime) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.startTime!);
    }

    if (filter?.endTime) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= filter.endTime!);
    }

    if (filter?.searchTerm) {
      const searchTerm = filter.searchTerm.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(searchTerm) ||
        JSON.stringify(log.context || {}).toLowerCase().includes(searchTerm)
      );
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => b.timestamp - a.timestamp);

    // Apply pagination
    if (filter?.offset || filter?.limit) {
      const offset = filter.offset || 0;
      const limit = filter.limit || 100;
      filteredLogs = filteredLogs.slice(offset, offset + limit);
    }

    return filteredLogs;
  }

  /**
   * Get log aggregation data
   */
  getLogAggregation(timeWindow?: number): LogAggregation {
    const now = Date.now();
    const windowStart = timeWindow ? now - timeWindow : 0;
    const logs = this.logs.filter(log => log.timestamp >= windowStart);

    const levelCounts: Record<LogLevel, number> = {
      debug: 0,
      info: 0,
      warning: 0,
      error: 0,
      critical: 0,
    };

    const categoryCounts: Record<LogCategory, number> = {
      auth: 0,
      ai_analysis: 0,
      document_parsing: 0,
      export: 0,
      payment: 0,
      admin: 0,
      system: 0,
      user_action: 0,
      api: 0,
      performance: 0,
      security: 0,
    };

    const errorMessages = new Map<string, { count: number; lastOccurrence: number }>();

    logs.forEach(log => {
      levelCounts[log.level]++;
      categoryCounts[log.category]++;

      if (log.level === 'error' || log.level === 'critical') {
        const existing = errorMessages.get(log.message) || { count: 0, lastOccurrence: 0 };
        errorMessages.set(log.message, {
          count: existing.count + 1,
          lastOccurrence: Math.max(existing.lastOccurrence, log.timestamp),
        });
      }
    });

    const totalCount = logs.length;
    const errorCount = levelCounts.error + levelCounts.critical;
    const errorRate = totalCount > 0 ? (errorCount / totalCount) * 100 : 0;

    const topErrors = Array.from(errorMessages.entries())
      .map(([message, data]) => ({ message, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const recentErrors = logs
      .filter(log => log.level === 'error' || log.level === 'critical')
      .slice(0, 20);

    return {
      totalCount,
      levelCounts,
      categoryCounts,
      errorRate,
      criticalCount: levelCounts.critical,
      recentErrors,
      topErrors,
    };
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
    this.persistLogs();
    this.log('info', 'system', 'Logs cleared');
  }

  /**
   * Export logs
   */
  exportLogs(filter?: LogFilter): string {
    const logs = this.getLogs(filter);
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Add or update alert rule
   */
  addAlertRule(rule: AlertRule): void {
    const existingIndex = this.alertRules.findIndex(r => r.id === rule.id);
    if (existingIndex >= 0) {
      this.alertRules[existingIndex] = rule;
    } else {
      this.alertRules.push(rule);
    }
    this.log('info', 'system', `Alert rule ${existingIndex >= 0 ? 'updated' : 'added'}: ${rule.name}`);
  }

  /**
   * Remove alert rule
   */
  removeAlertRule(ruleId: string): void {
    this.alertRules = this.alertRules.filter(rule => rule.id !== ruleId);
    this.log('info', 'system', `Alert rule removed: ${ruleId}`);
  }

  /**
   * Get alert rules
   */
  getAlertRules(): AlertRule[] {
    return [...this.alertRules];
  }

  /**
   * Private methods
   */
  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private outputToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.category}]`;
    
    switch (entry.level) {
      case 'debug':
        console.debug(prefix, entry.message, entry.context);
        break;
      case 'info':
        console.info(prefix, entry.message, entry.context);
        break;
      case 'warning':
        console.warn(prefix, entry.message, entry.context);
        break;
      case 'error':
      case 'critical':
        console.error(prefix, entry.message, entry.context);
        if (entry.stack) {
          console.error('Stack trace:', entry.stack);
        }
        break;
    }
  }

  private async sendToRemoteLogging(entry: LogEntry): Promise<void> {
    try {
      await fetch('/api/admin/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      // Fail silently to avoid infinite logging loops
    }
  }

  private checkAlertRules(entry: LogEntry): void {
    const now = Date.now();

    this.alertRules.forEach(rule => {
      if (!rule.enabled) return;

      // Check cooldown
      if (rule.lastTriggered && (now - rule.lastTriggered) < rule.cooldown) {
        return;
      }

      // Check conditions
      if (this.shouldTriggerAlert(rule, entry)) {
        this.triggerAlert(rule, entry);
        rule.lastTriggered = now;
      }
    });
  }

  private shouldTriggerAlert(rule: AlertRule, entry: LogEntry): boolean {
    const { condition } = rule;

    // Check level condition
    if (condition.level && !condition.level.includes(entry.level)) {
      return false;
    }

    // Check category condition
    if (condition.category && !condition.category.includes(entry.category)) {
      return false;
    }

    // Check message pattern
    if (condition.messagePattern) {
      const regex = new RegExp(condition.messagePattern, 'i');
      if (!regex.test(entry.message)) {
        return false;
      }
    }

    // Check threshold condition
    if (condition.threshold) {
      const windowStart = Date.now() - condition.threshold.timeWindow;
      const recentLogs = this.logs.filter(log => 
        log.timestamp >= windowStart &&
        (!condition.level || condition.level.includes(log.level)) &&
        (!condition.category || condition.category.includes(log.category))
      );
      
      if (recentLogs.length < condition.threshold.count) {
        return false;
      }
    }

    // Check error rate condition
    if (condition.errorRate) {
      const windowStart = Date.now() - condition.errorRate.timeWindow;
      const recentLogs = this.logs.filter(log => log.timestamp >= windowStart);
      const errorLogs = recentLogs.filter(log => log.level === 'error' || log.level === 'critical');
      
      const errorRate = recentLogs.length > 0 ? (errorLogs.length / recentLogs.length) * 100 : 0;
      
      if (errorRate < condition.errorRate.percentage) {
        return false;
      }
    }

    return true;
  }

  private async triggerAlert(rule: AlertRule, entry: LogEntry): Promise<void> {
    this.log('warning', 'system', `Alert triggered: ${rule.name}`, {
      ruleId: rule.id,
      triggerEntry: entry.id,
    });

    for (const action of rule.actions) {
      try {
        await this.executeAlertAction(action, rule, entry);
      } catch (error) {
        this.log('error', 'system', `Failed to execute alert action: ${action.type}`, {
          ruleId: rule.id,
          actionType: action.type,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  private async executeAlertAction(action: AlertAction, rule: AlertRule, entry: LogEntry): Promise<void> {
    switch (action.type) {
      case 'console':
        console.error(`ALERT: ${rule.name}`, { rule, entry });
        break;

      case 'notification':
        if (typeof window !== 'undefined' && 'Notification' in window) {
          new Notification(`Alert: ${rule.name}`, {
            body: entry.message,
            icon: '/favicon.ico',
          });
        }
        break;

      case 'webhook':
        if (action.config.webhookUrl) {
          await fetch(action.config.webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              alert: rule.name,
              severity: action.config.severity || 'medium',
              entry,
              timestamp: Date.now(),
            }),
          });
        }
        break;

      case 'email':
        // Email alerts will be handled by the notification system
        await fetch('/api/admin/notifications/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipients: action.config.recipients,
            subject: `Alert: ${rule.name}`,
            template: action.config.template || 'alert',
            data: {
              alertName: rule.name,
              severity: action.config.severity || 'medium',
              message: entry.message,
              timestamp: new Date(entry.timestamp).toISOString(),
              context: entry.context,
            },
          }),
        });
        break;
    }
  }

  private initializeDefaultAlertRules(): void {
    this.alertRules = [
      {
        id: 'critical_errors',
        name: 'Critical Errors',
        condition: {
          level: ['critical'],
        },
        actions: [
          {
            type: 'console',
            config: { severity: 'critical' },
          },
          {
            type: 'notification',
            config: { severity: 'critical' },
          },
        ],
        enabled: true,
        cooldown: 60000, // 1 minute
      },
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        condition: {
          errorRate: {
            percentage: 10,
            timeWindow: 300000, // 5 minutes
          },
        },
        actions: [
          {
            type: 'console',
            config: { severity: 'high' },
          },
        ],
        enabled: true,
        cooldown: 300000, // 5 minutes
      },
      {
        id: 'auth_failures',
        name: 'Authentication Failures',
        condition: {
          category: ['auth'],
          level: ['error'],
          threshold: {
            count: 5,
            timeWindow: 300000, // 5 minutes
          },
        },
        actions: [
          {
            type: 'console',
            config: { severity: 'medium' },
          },
        ],
        enabled: true,
        cooldown: 600000, // 10 minutes
      },
      {
        id: 'ai_api_failures',
        name: 'AI API Failures',
        condition: {
          category: ['ai_analysis'],
          level: ['error', 'critical'],
          threshold: {
            count: 3,
            timeWindow: 180000, // 3 minutes
          },
        },
        actions: [
          {
            type: 'console',
            config: { severity: 'high' },
          },
        ],
        enabled: true,
        cooldown: 300000, // 5 minutes
      },
    ];
  }

  private async loadPersistedLogs(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('error_logs');
        if (stored) {
          const parsedLogs = JSON.parse(stored);
          if (Array.isArray(parsedLogs)) {
            this.logs = parsedLogs.slice(-this.maxLogSize);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load persisted logs:', error);
    }
  }

  private async persistLogs(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        const logsToStore = this.logs.slice(-1000); // Store last 1000 logs
        localStorage.setItem('error_logs', JSON.stringify(logsToStore));
      }
    } catch (error) {
      console.error('Failed to persist logs:', error);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    // Remove old logs
    this.logs = this.logs.filter(log => (now - log.timestamp) < maxAge);

    // Reset alert rule cooldowns if needed
    this.alertRules.forEach(rule => {
      if (rule.lastTriggered && (now - rule.lastTriggered) > rule.cooldown * 10) {
        delete rule.lastTriggered;
      }
    });
  }
}

// Export singleton instance
export const errorLogger = ErrorLogger.getInstance();

// Utility functions
export function withLogging<T extends (...args: any[]) => any>(
  fn: T,
  category: LogCategory,
  operation: string
): T {
  return ((...args: Parameters<T>) => {
    const startTime = Date.now();
    
    try {
      const result = fn(...args);
      
      if (result instanceof Promise) {
        return result
          .then((value) => {
            const duration = Date.now() - startTime;
            errorLogger.logPerformance(category, operation, duration, { success: true });
            return value;
          })
          .catch((error) => {
            const duration = Date.now() - startTime;
            errorLogger.error(category, `${operation} failed`, error, { duration });
            throw error;
          });
      } else {
        const duration = Date.now() - startTime;
        errorLogger.logPerformance(category, operation, duration, { success: true });
        return result;
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      errorLogger.error(category, `${operation} failed`, error as Error, { duration });
      throw error;
    }
  }) as T;
}

export function logAsync<T>(
  promise: Promise<T>,
  category: LogCategory,
  operation: string,
  context?: Record<string, unknown>
): Promise<T> {
  const startTime = Date.now();
  
  return promise
    .then((result) => {
      const duration = Date.now() - startTime;
      errorLogger.logPerformance(category, operation, duration, { ...context, success: true });
      return result;
    })
    .catch((error) => {
      const duration = Date.now() - startTime;
      errorLogger.error(category, `${operation} failed`, error, { ...context, duration });
      throw error;
    });
}