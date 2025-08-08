/**
 * Integration tests for the comprehensive logging and error tracking system
 * Tests the complete logging workflow including error logger and notification system
 * Requirements: 13.3, 13.4 - System monitoring and error tracking integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { errorLogger } from '@/lib/utils/errorLogger';
import { notificationSystem, sendCriticalAlert } from '@/lib/admin/notificationSystem';

// Mock fetch for API calls
global.fetch = vi.fn();

describe('Logging System Integration', () => {
  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Initialize systems
    await errorLogger.initialize();
    await notificationSystem.initialize();
    
    // Clear logs for clean state
    errorLogger.clearLogs();
  });

  describe('Error Logger Core Functionality', () => {
    it('should create and retrieve log entries', () => {
      const entry = errorLogger.info('system', 'Test log message', { key: 'value' });

      expect(entry).toMatchObject({
        level: 'info',
        category: 'system',
        message: 'Test log message',
        context: { key: 'value' },
      });
      expect(entry.id).toBeDefined();
      expect(entry.timestamp).toBeDefined();

      const logs = errorLogger.getLogs();
      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs.some(log => log.id === entry.id)).toBe(true);
    });

    it('should handle different log levels', () => {
      const initialCount = errorLogger.getLogs().length;
      
      errorLogger.debug('system', 'Debug message');
      errorLogger.info('system', 'Info message');
      errorLogger.warning('system', 'Warning message');
      errorLogger.error('system', 'Error message');
      errorLogger.critical('system', 'Critical message');

      const logs = errorLogger.getLogs();
      expect(logs.length).toBeGreaterThanOrEqual(initialCount + 5);

      const levels = logs.map(log => log.level);
      expect(levels).toContain('debug');
      expect(levels).toContain('info');
      expect(levels).toContain('warning');
      expect(levels).toContain('error');
      expect(levels).toContain('critical');
    });

    it('should filter logs correctly', () => {
      errorLogger.info('auth', 'Auth info');
      errorLogger.error('api', 'API error');
      errorLogger.critical('security', 'Security critical');

      const errorLogs = errorLogger.getLogs({ level: ['error', 'critical'] });
      expect(errorLogs).toHaveLength(2);

      const authLogs = errorLogger.getLogs({ category: ['auth'] });
      expect(authLogs).toHaveLength(1);
      expect(authLogs[0].category).toBe('auth');
    });

    it('should calculate aggregation statistics', () => {
      const initialCount = errorLogger.getLogs().length;
      
      errorLogger.info('system', 'Info 1');
      errorLogger.info('system', 'Info 2');
      errorLogger.error('api', 'Error 1');
      errorLogger.critical('security', 'Critical 1');

      const aggregation = errorLogger.getLogAggregation();

      expect(aggregation.totalCount).toBeGreaterThanOrEqual(4);
      expect(aggregation.levelCounts.info).toBeGreaterThanOrEqual(2);
      expect(aggregation.levelCounts.error).toBeGreaterThanOrEqual(1);
      expect(aggregation.levelCounts.critical).toBeGreaterThanOrEqual(1);
      expect(aggregation.errorRate).toBeGreaterThan(0); // Should have some error rate
    });
  });

  describe('Notification System Core Functionality', () => {
    it('should send notifications successfully', async () => {
      const notification = await notificationSystem.sendNotification(
        'system_error',
        'high',
        'Test System Error',
        'This is a test system error',
        { errorCode: 500 },
        { component: 'test' }
      );

      expect(notification).toMatchObject({
        type: 'system_error',
        severity: 'high',
        title: 'Test System Error',
        message: 'This is a test system error',
        data: { errorCode: 500 },
        source: { component: 'test' },
      });
      expect(notification.id).toBeDefined();
      expect(notification.timestamp).toBeDefined();
    });

    it('should handle critical alerts', async () => {
      const notification = await sendCriticalAlert(
        'Critical System Failure',
        'The system has encountered a critical error',
        { severity: 'critical', component: 'core' },
        { component: 'system' }
      );

      expect(notification.type).toBe('critical_error');
      expect(notification.severity).toBe('critical');
      expect(notification.title).toBe('Critical System Failure');
    });

    it('should acknowledge notifications', async () => {
      const notification = await notificationSystem.sendNotification(
        'system_error',
        'medium',
        'Test Error',
        'Test error message',
        {},
        { component: 'test' }
      );

      const acknowledged = await notificationSystem.acknowledgeNotification(notification.id, 'admin1');
      expect(acknowledged).toBe(true);

      const notifications = notificationSystem.getNotifications({ status: ['acknowledged'] });
      expect(notifications.some(n => n.id === notification.id)).toBe(true);
    });
  });

  describe('System Integration', () => {
    it('should work together for comprehensive error tracking', async () => {
      // Log an error
      const logEntry = errorLogger.error('api', 'API request failed', new Error('Connection timeout'), {
        endpoint: '/api/users',
        statusCode: 500,
      });

      // Send a notification about the error
      const notification = await notificationSystem.sendNotification(
        'system_error',
        'high',
        'API Error Detected',
        `Error in ${logEntry.category}: ${logEntry.message}`,
        {
          logId: logEntry.id,
          endpoint: '/api/users',
        },
        { component: 'api_monitor' }
      );

      // Verify both systems recorded the information
      const logs = errorLogger.getLogs({ level: ['error'] });
      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs.some(log => log.id === logEntry.id)).toBe(true);

      const notifications = notificationSystem.getNotifications({ types: ['system_error'] });
      expect(notifications.length).toBeGreaterThanOrEqual(1);
      expect(notifications.some(n => n.data?.logId === logEntry.id)).toBe(true);
    });

    it('should handle performance logging', () => {
      const performanceEntry = errorLogger.logPerformance('api', 'database_query', 2500, {
        query: 'SELECT * FROM users',
        rows: 1000,
      });

      expect(performanceEntry.level).toBe('info'); // 2500ms is under warning threshold
      expect(performanceEntry.category).toBe('api');
      expect(performanceEntry.duration).toBe(2500);
      expect(performanceEntry.context?.operation).toBe('database_query');
    });

    it('should handle user action logging', () => {
      const userActionEntry = errorLogger.logUserAction('login', 'user123', {
        method: 'email',
        ip: '192.168.1.1',
      });

      expect(userActionEntry.level).toBe('info');
      expect(userActionEntry.category).toBe('user_action');
      expect(userActionEntry.userId).toBe('user123');
      expect(userActionEntry.context?.action).toBe('login');
    });

    it('should handle security event logging', () => {
      const securityEntry = errorLogger.logSecurityEvent('failed_login_attempt', 'medium', {
        ip: '192.168.1.100',
        attempts: 3,
      });

      expect(securityEntry.level).toBe('warning'); // medium severity maps to warning
      expect(securityEntry.category).toBe('security');
      expect(securityEntry.context?.event).toBe('failed_login_attempt');
      expect(securityEntry.context?.severity).toBe('medium');
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle logging failures gracefully', () => {
      // Should not throw even with invalid data
      expect(() => {
        errorLogger.info('system', '', undefined);
      }).not.toThrow();

      expect(() => {
        errorLogger.error('system', 'Error', null as any);
      }).not.toThrow();
    });

    it('should handle notification failures gracefully', async () => {
      // Mock fetch to fail
      (global.fetch as unknown).mockRejectedValueOnce(new Error('Network error'));

      // Should not throw
      await expect(notificationSystem.sendNotification(
        'system_error',
        'high',
        'Test Error',
        'Test message',
        {},
        { component: 'test' }
      )).resolves.toBeDefined();
    });
  });

  describe('Configuration and Management', () => {
    it('should manage notification preferences', async () => {
      const preferences = {
        adminId: 'admin1',
        email: 'admin1@example.com',
        channels: {
          email: {
            enabled: true,
            types: ['critical_error' as const],
            severities: ['critical' as const],
          },
        },
        escalationRules: [],
      };

      await notificationSystem.updatePreferences('admin1', preferences);
      const retrieved = notificationSystem.getPreferences('admin1');

      expect(retrieved).toMatchObject(preferences);
    });

    it('should export logs for analysis', () => {
      const initialCount = errorLogger.getLogs().length;
      
      errorLogger.info('system', 'Log 1');
      errorLogger.error('api', 'Log 2');

      const exported = errorLogger.exportLogs();
      const parsed = JSON.parse(exported);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThanOrEqual(2);
      expect(parsed.some(log => log.message === 'Log 1')).toBe(true);
      expect(parsed.some(log => log.message === 'Log 2')).toBe(true);
    });

    it('should clear logs when requested', () => {
      const initialCount = errorLogger.getLogs().length;
      errorLogger.info('system', 'Test log');
      expect(errorLogger.getLogs().length).toBeGreaterThan(initialCount);

      errorLogger.clearLogs();
      // clearLogs() itself creates a log entry, so we expect 1 log (the "Logs cleared" message)
      expect(errorLogger.getLogs()).toHaveLength(1);
      expect(errorLogger.getLogs()[0].message).toBe('Logs cleared');
    });
  });
});