/**
 * React hook for using the centralized logging system
 * Provides easy access to logging functionality in React components
 * Requirements: 13.3 - System monitoring and error tracking
 */

import { useCallback, useEffect, useState } from 'react';
import { errorLogger, LogEntry, LogFilter, LogAggregation, LogLevel, LogCategory } from '@/lib/utils/errorLogger';

export interface UseErrorLoggerReturn {
  // Logging methods
  log: (level: LogLevel, category: LogCategory, message: string, context?: Record<string, unknown>) => LogEntry;
  debug: (category: LogCategory, message: string, context?: Record<string, unknown>) => LogEntry;
  info: (category: LogCategory, message: string, context?: Record<string, unknown>) => LogEntry;
  warning: (category: LogCategory, message: string, context?: Record<string, unknown>) => LogEntry;
  error: (category: LogCategory, message: string, error?: Error, context?: Record<string, unknown>) => LogEntry;
  critical: (category: LogCategory, message: string, error?: Error, context?: Record<string, unknown>) => LogEntry;
  
  // Performance logging
  logPerformance: (category: LogCategory, operation: string, duration: number, context?: Record<string, unknown>) => LogEntry;
  
  // User action logging
  logUserAction: (action: string, context?: Record<string, unknown>) => LogEntry;
  
  // Security event logging
  logSecurityEvent: (event: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: Record<string, unknown>) => LogEntry;
  
  // Log retrieval
  getLogs: (filter?: LogFilter) => LogEntry[];
  getLogAggregation: (timeWindow?: number) => LogAggregation;
  
  // Utility methods
  clearLogs: () => void;
  exportLogs: (filter?: LogFilter) => string;
  
  // State
  isInitialized: boolean;
}

export function useErrorLogger(userId?: string, adminId?: string): UseErrorLoggerReturn {
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize the logger
  useEffect(() => {
    const initializeLogger = async () => {
      if (!isInitialized) {
        await errorLogger.initialize({
          maxLogSize: 10000,
          enableConsoleOutput: process.env.NODE_ENV === 'development',
          enableRemoteLogging: process.env.NODE_ENV === 'production',
        });
        setIsInitialized(true);
      }
    };

    initializeLogger();
  }, [isInitialized]);

  // Logging methods with user context
  const log = useCallback((
    level: LogLevel,
    category: LogCategory,
    message: string,
    context?: Record<string, unknown>
  ): LogEntry => {
    return errorLogger.log(level, category, message, context, { userId, adminId });
  }, [userId, adminId]);

  const debug = useCallback((
    category: LogCategory,
    message: string,
    context?: Record<string, unknown>
  ): LogEntry => {
    return errorLogger.debug(category, message, context, { userId, adminId });
  }, [userId, adminId]);

  const info = useCallback((
    category: LogCategory,
    message: string,
    context?: Record<string, unknown>
  ): LogEntry => {
    return errorLogger.info(category, message, context, { userId, adminId });
  }, [userId, adminId]);

  const warning = useCallback((
    category: LogCategory,
    message: string,
    context?: Record<string, unknown>
  ): LogEntry => {
    return errorLogger.warning(category, message, context, { userId, adminId });
  }, [userId, adminId]);

  const error = useCallback((
    category: LogCategory,
    message: string,
    errorObj?: Error,
    context?: Record<string, unknown>
  ): LogEntry => {
    return errorLogger.error(category, message, errorObj, context, { userId, adminId });
  }, [userId, adminId]);

  const critical = useCallback((
    category: LogCategory,
    message: string,
    errorObj?: Error,
    context?: Record<string, unknown>
  ): LogEntry => {
    return errorLogger.critical(category, message, errorObj, context, { userId, adminId });
  }, [userId, adminId]);

  const logPerformance = useCallback((
    category: LogCategory,
    operation: string,
    duration: number,
    context?: Record<string, unknown>
  ): LogEntry => {
    return errorLogger.logPerformance(category, operation, duration, context, { userId, adminId });
  }, [userId, adminId]);

  const logUserAction = useCallback((
    action: string,
    context?: Record<string, unknown>
  ): LogEntry => {
    return errorLogger.logUserAction(action, userId, context);
  }, [userId]);

  const logSecurityEvent = useCallback((
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    context?: Record<string, unknown>
  ): LogEntry => {
    return errorLogger.logSecurityEvent(event, severity, context, { userId, adminId });
  }, [userId, adminId]);

  // Log retrieval methods
  const getLogs = useCallback((filter?: LogFilter): LogEntry[] => {
    return errorLogger.getLogs(filter);
  }, []);

  const getLogAggregation = useCallback((timeWindow?: number): LogAggregation => {
    return errorLogger.getLogAggregation(timeWindow);
  }, []);

  // Utility methods
  const clearLogs = useCallback((): void => {
    errorLogger.clearLogs();
  }, []);

  const exportLogs = useCallback((filter?: LogFilter): string => {
    return errorLogger.exportLogs(filter);
  }, []);

  return {
    log,
    debug,
    info,
    warning,
    error,
    critical,
    logPerformance,
    logUserAction,
    logSecurityEvent,
    getLogs,
    getLogAggregation,
    clearLogs,
    exportLogs,
    isInitialized,
  };
}

/**
 * Hook for performance monitoring
 */
export function usePerformanceLogger(category: LogCategory, userId?: string, adminId?: string) {
  const { logPerformance } = useErrorLogger(userId, adminId);

  const measurePerformance = useCallback(<T>(
    operation: string,
    fn: () => T | Promise<T>,
    context?: Record<string, unknown>
  ): T | Promise<T> => {
    const startTime = performance.now();

    const handleResult = (result: T) => {
      const duration = performance.now() - startTime;
      logPerformance(category, operation, duration, { ...context, success: true });
      return result;
    };

    const handleError = (error: any) => {
      const duration = performance.now() - startTime;
      logPerformance(category, operation, duration, { ...context, success: false, error: error.message });
      throw error;
    };

    try {
      const result = fn();
      
      if (result instanceof Promise) {
        return result.then(handleResult).catch(handleError);
      } else {
        return handleResult(result);
      }
    } catch (error) {
      return handleError(error);
    }
  }, [category, logPerformance]);

  return { measurePerformance };
}

/**
 * Hook for automatic error boundary logging
 */
export function useErrorBoundaryLogger(componentName: string, userId?: string) {
  const { error: logError } = useErrorLogger(userId);

  const logComponentError = useCallback((error: Error, errorInfo: { componentStack: string }) => {
    logError('system', `Error in component: ${componentName}`, error, {
      componentName,
      componentStack: errorInfo.componentStack,
    });
  }, [componentName, logError]);

  return { logComponentError };
}

/**
 * Hook for user action tracking
 */
export function useUserActionLogger(userId?: string) {
  const { logUserAction } = useErrorLogger(userId);

  const trackAction = useCallback((
    action: string,
    context?: Record<string, unknown>
  ) => {
    logUserAction(action, {
      ...context,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    });
  }, [logUserAction]);

  const trackClick = useCallback((
    element: string,
    context?: Record<string, unknown>
  ) => {
    trackAction(`click_${element}`, context);
  }, [trackAction]);

  const trackNavigation = useCallback((
    from: string,
    to: string,
    context?: Record<string, unknown>
  ) => {
    trackAction('navigation', { from, to, ...context });
  }, [trackAction]);

  const trackFeatureUsage = useCallback((
    feature: string,
    context?: Record<string, unknown>
  ) => {
    trackAction(`feature_${feature}`, context);
  }, [trackAction]);

  return {
    trackAction,
    trackClick,
    trackNavigation,
    trackFeatureUsage,
  };
}

/**
 * Hook for admin action logging
 */
export function useAdminActionLogger(adminId: string) {
  const { log } = useErrorLogger(undefined, adminId);

  const logAdminAction = useCallback((
    action: string,
    context?: Record<string, unknown>
  ) => {
    log('info', 'admin', `Admin action: ${action}`, {
      ...context,
      action,
      adminId,
      timestamp: Date.now(),
    });
  }, [log, adminId]);

  const logUserManagement = useCallback((
    action: string,
    targetUserId: string,
    context?: Record<string, unknown>
  ) => {
    logAdminAction(`user_management_${action}`, {
      ...context,
      targetUserId,
    });
  }, [logAdminAction]);

  const logSystemConfig = useCallback((
    action: string,
    configKey: string,
    context?: Record<string, unknown>
  ) => {
    logAdminAction(`system_config_${action}`, {
      ...context,
      configKey,
    });
  }, [logAdminAction]);

  const logPaymentAction = useCallback((
    action: string,
    paymentId: string,
    context?: Record<string, unknown>
  ) => {
    logAdminAction(`payment_${action}`, {
      ...context,
      paymentId,
    });
  }, [logAdminAction]);

  return {
    logAdminAction,
    logUserManagement,
    logSystemConfig,
    logPaymentAction,
  };
}