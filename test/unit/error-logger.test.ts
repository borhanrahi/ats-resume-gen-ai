/**
 * Unit tests for the centralized logging system
 * Tests structured logging, error categorization, and alert functionality
 * Requirements: 13.3 - System monitoring and error tracking
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { errorLogger, LogLevel, LogCategory, AlertRule } from '@/lib/utils/errorLogger';

// Mock fetch for remote logging
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock console methods
const consoleMock = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  log: vi.fn(),
};
Object.defineProperty(console, 'debug', { value: consoleMock.debug });
Object.defineProperty(console, 'info', { value: consoleMock.info });
Object.defineProperty(console, 'warn', { value: consoleMock.warn });
Object.defineProperty(console, 'error', { value: consoleMock.error });
Object.defineProperty(console, 'log', { value: consoleMock.log });

describe('ErrorLogger', () => {
  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Reset logger state
    errorLogger.clearLogs();
    
    // Initialize logger
    await errorLogger.initialize({
      maxLogSize: 1000,
      enableConsoleOutput: true,
      enableRemoteLogging: false,
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Basic Logging', () => {
    it('should create log entries with correct structure', () => {
      const entry = errorLogger.info('system', 'Test message', { key: 'value' });

      expect(entry).toMatchObject({
        level: 'info',
        category: 'system',
        message: 'Test message',
        context: { key: 'value' },
      });
      expect(entry.id).toBeDefined();
      expect(entry.timestamp).toBeDefined();
      expect(entry.sessionId).toBeDefined();
    });

    it('should log different levels correctly', () => {
      const debugEntry = errorLogger.debug('system', 'Debug message');
      const infoEntry = errorLogger.info('system', 'Info message');
      const warningEntry = errorLogger.warning('system', 'Warning message');
      const errorEntry = errorLogger.error('system', 'Error message');
      const criticalEntry = errorLogger.critical('system', 'Critical message');

      expect(debugEntry.level).toBe('debug');
      expect(infoEntry.level).toBe('info');
      expect(warningEntry.level).toBe('warning');
      expect(errorEntry.level).toBe('error');
      expect(criticalEntry.level).toBe('critical');
    });

    it('should log different categories correctly', () => {
      const categories: LogCategory[] = [
        'auth', 'ai_analysis', 'document_parsing', 'export', 'payment',
        'admin', 'system', 'user_action', 'api', 'performance', 'security'
      ];

      categories.forEach(category => {
        const entry = errorLogger.info(category, `Test ${category} message`);
        expect(entry.category).toBe(category);
      });
    });

    it('should handle error objects correctly', () => {
      const testError = new Error('Test error');
      testError.stack = 'Error stack trace';

      const entry = errorLogger.error('system', 'Error occurred', testError, { additional: 'context' });

      expect(entry.context?.error).toMatchObject({
        name: 'Error',
        message: 'Test error',
        stack: 'Error stack trace',
      });
      expect(entry.stack).toBe('Error stack trace');
    });
  });

  describe('Log Filtering and Retrieval', () => {
    beforeEach(() => {
      // Create test logs
      errorLogger.debug('system', 'Debug message');
      errorLogger.info('auth', 'Info message', {}, { userId: 'user1' });
      errorLogger.warning('api', 'Warning message');
      errorLogger.error('ai_analysis', 'Error message', undefined, {}, { userId: 'user2' });
      errorLogger.critical('security', 'Critical message', undefined, {}, { adminId: 'admin1' });
    });

    it('should filter logs by level', () => {
      const errorLogs = errorLogger.getLogs({ level: ['error', 'critical'] });
      expect(errorLogs).toHaveLength(2);
      expect(errorLogs.every(log => log.level === 'error' || log.level === 'critical')).toBe(true);
    });

    it('should filter logs by category', () => {
      const authLogs = errorLogger.getLogs({ category: ['auth'] });
      expect(authLogs).toHaveLength(1);
      expect(authLogs[0].category).toBe('auth');
    });

    it('should filter logs by userId', () => {
      const user1Logs = errorLogger.getLogs({ userId: 'user1' });
      expect(user1Logs).toHaveLength(1);
      expect(user1Logs[0].userId).toBe('user1');
    });

    it('should filter logs by adminId', () => {
      const adminLogs = errorLogger.getLogs({ adminId: 'admin1' });
      expect(adminLogs).toHaveLength(1);
      expect(adminLogs[0].adminId).toBe('admin1');
    });

    it('should filter logs by time range', () => {
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);

      const recentLogs = errorLogger.getLogs({ startTime: oneHourAgo });
      expect(recentLogs.length).toBeGreaterThan(0);

      const futureLogs = errorLogger.getLogs({ startTime: now + 1000 });
      expect(futureLogs).toHaveLength(0);
    });

    it('should search logs by message content', () => {
      const searchResults = errorLogger.getLogs({ searchTerm: 'Debug' });
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].message).toContain('Debug');
    });

    it('should apply pagination', () => {
      const firstPage = errorLogger.getLogs({ limit: 2, offset: 0 });
      const secondPage = errorLogger.getLogs({ limit: 2, offset: 2 });

      expect(firstPage).toHaveLength(2);
      expect(secondPage).toHaveLength(2);
      expect(firstPage[0].id).not.toBe(secondPage[0].id);
    });
  });

  describe('Log Aggregation', () => {
    beforeEach(() => {
      // Clear logs first to ensure clean state
      errorLogger.clearLogs();
      
      // Create test logs with known distribution
      errorLogger.debug('system', 'Debug 1');
      errorLogger.debug('system', 'Debug 2');
      errorLogger.info('auth', 'Info 1');
      errorLogger.info('api', 'Info 2');
      errorLogger.info('api', 'Info 3');
      errorLogger.warning('system', 'Warning 1');
      errorLogger.error('ai_analysis', 'Error 1');
      errorLogger.error('ai_analysis', 'Error 1'); // Duplicate for top errors
      errorLogger.critical('security', 'Critical 1');
    });

    it('should calculate level counts correctly', () => {
      const aggregation = errorLogger.getLogAggregation();

      expect(aggregation.levelCounts).toMatchObject({
        debug: 2,
        info: 3,
        warning: 1,
        error: 2,
        critical: 1,
      });
    });

    it('should calculate category counts correctly', () => {
      const aggregation = errorLogger.getLogAggregation();

      expect(aggregation.categoryCounts.system).toBe(3);
      expect(aggregation.categoryCounts.auth).toBe(1);
      expect(aggregation.categoryCounts.api).toBe(2);
      expect(aggregation.categoryCounts.ai_analysis).toBe(2);
      expect(aggregation.categoryCounts.security).toBe(1);
    });

    it('should calculate error rate correctly', () => {
      const aggregation = errorLogger.getLogAggregation();

      // 3 errors (2 error + 1 critical) out of 9 total = 33.33%
      expect(aggregation.errorRate).toBeCloseTo(33.33, 1);
    });

    it('should identify top errors', () => {
      const aggregation = errorLogger.getLogAggregation();

      expect(aggregation.topErrors).toHaveLength(2);
      expect(aggregation.topErrors[0]).toMatchObject({
        message: 'Error 1',
        count: 2,
      });
    });

    it('should return recent errors', () => {
      const aggregation = errorLogger.getLogAggregation();

      expect(aggregation.recentErrors).toHaveLength(3);
      expect(aggregation.recentErrors.every(log => 
        log.level === 'error' || log.level === 'critical'
      )).toBe(true);
    });
  });

  describe('Performance Logging', () => {
    it('should log performance with duration', () => {
      const entry = errorLogger.logPerformance('api', 'test_operation', 1500, { endpoint: '/test' });

      expect(entry.level).toBe('info');
      expect(entry.category).toBe('api');
      expect(entry.message).toBe('Performance: test_operation');
      expect(entry.duration).toBe(1500);
      expect(entry.context).toMatchObject({
        endpoint: '/test',
        operation: 'test_operation',
        duration: 1500,
      });
    });

    it('should use warning level for slow operations', () => {
      const entry = errorLogger.logPerformance('api', 'slow_operation', 7000);
      expect(entry.level).toBe('warning');
    });

    it('should use error level for very slow operations', () => {
      const entry = errorLogger.logPerformance('api', 'very_slow_operation', 15000);
      expect(entry.level).toBe('error');
    });
  });

  describe('User and Admin Action Logging', () => {
    it('should log user actions correctly', () => {
      const entry = errorLogger.logUserAction('login', 'user123', { method: 'email' });

      expect(entry.level).toBe('info');
      expect(entry.category).toBe('user_action');
      expect(entry.message).toBe('User action: login');
      expect(entry.userId).toBe('user123');
      expect(entry.context).toMatchObject({
        method: 'email',
        action: 'login',
      });
    });

    it('should log admin actions correctly', () => {
      const entry = errorLogger.logAdminAction('user_suspend', 'admin456', { targetUser: 'user789' });

      expect(entry.level).toBe('info');
      expect(entry.category).toBe('admin');
      expect(entry.message).toBe('Admin action: user_suspend');
      expect(entry.adminId).toBe('admin456');
      expect(entry.context).toMatchObject({
        targetUser: 'user789',
        action: 'user_suspend',
      });
    });
  });

  describe('Security Event Logging', () => {
    it('should log security events with correct severity mapping', () => {
      const lowEntry = errorLogger.logSecurityEvent('failed_login', 'low', { attempts: 1 });
      const mediumEntry = errorLogger.logSecurityEvent('suspicious_activity', 'medium', { ip: '1.2.3.4' });
      const highEntry = errorLogger.logSecurityEvent('brute_force', 'high', { attempts: 10 });
      const criticalEntry = errorLogger.logSecurityEvent('data_breach', 'critical', { affected: 1000 });

      expect(lowEntry.level).toBe('warning');
      expect(mediumEntry.level).toBe('warning');
      expect(highEntry.level).toBe('error');
      expect(criticalEntry.level).toBe('critical');

      expect(lowEntry.category).toBe('security');
      expect(lowEntry.context?.severity).toBe('low');
    });
  });

  describe('Alert Rules', () => {
    it('should trigger alerts for critical logs', async () => {
      const consoleSpy = vi.spyOn(console, 'error');

      errorLogger.critical('system', 'Critical system failure');

      // Wait for alert processing
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ALERT: Critical Errors'),
        expect.any(Object)
      );
    });

    it('should add and manage custom alert rules', () => {
      const customRule: AlertRule = {
        id: 'test_rule',
        name: 'Test Rule',
        condition: {
          level: ['error'],
          category: ['auth'],
        },
        actions: [
          {
            type: 'console',
            config: { severity: 'medium' },
          },
        ],
        enabled: true,
        cooldown: 60000,
      };

      errorLogger.addAlertRule(customRule);

      const rules = errorLogger.getAlertRules();
      const addedRule = rules.find(rule => rule.id === 'test_rule');

      expect(addedRule).toBeDefined();
      expect(addedRule?.name).toBe('Test Rule');
    });

    it('should remove alert rules', () => {
      const customRule: AlertRule = {
        id: 'test_rule_to_remove',
        name: 'Test Rule to Remove',
        condition: { level: ['error'] },
        actions: [{ type: 'console', config: {} }],
        enabled: true,
        cooldown: 60000,
      };

      errorLogger.addAlertRule(customRule);
      expect(errorLogger.getAlertRules().find(r => r.id === 'test_rule_to_remove')).toBeDefined();

      errorLogger.removeAlertRule('test_rule_to_remove');
      expect(errorLogger.getAlertRules().find(r => r.id === 'test_rule_to_remove')).toBeUndefined();
    });
  });

  describe('Log Management', () => {
    it('should clear all logs', () => {
      errorLogger.clearLogs(); // Clear first
      errorLogger.info('system', 'Test message');
      expect(errorLogger.getLogs()).toHaveLength(1);

      errorLogger.clearLogs();
      expect(errorLogger.getLogs()).toHaveLength(0);
    });

    it('should export logs as JSON', () => {
      errorLogger.clearLogs(); // Clear first
      errorLogger.info('system', 'Test message 1');
      errorLogger.error('api', 'Test message 2');

      const exported = errorLogger.exportLogs();
      const parsed = JSON.parse(exported);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].message).toBe('Test message 2'); // Newest first
      expect(parsed[1].message).toBe('Test message 1');
    });

    it('should export filtered logs', () => {
      errorLogger.info('system', 'Info message');
      errorLogger.error('api', 'Error message');

      const exported = errorLogger.exportLogs({ level: ['error'] });
      const parsed = JSON.parse(exported);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].level).toBe('error');
    });
  });

  describe('Console Output', () => {
    it('should output to console in development mode', () => {
      // Set development mode
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      errorLogger.info('system', 'Test console output');

      expect(consoleMock.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] [system]'),
        'Test console output',
        undefined
      );

      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should include stack trace for errors', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const testError = new Error('Test error');
      testError.stack = 'Test stack trace';

      errorLogger.error('system', 'Error with stack', testError);

      expect(consoleMock.error).toHaveBeenCalledWith(
        expect.stringContaining('Stack trace:'),
        'Test stack trace'
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Remote Logging', () => {
    it('should send logs to remote service in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const fetchMock = fetch as Mock;
      fetchMock.mockResolvedValueOnce(new Response('OK'));

      errorLogger.info('system', 'Test remote logging');

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(fetchMock).toHaveBeenCalledWith('/api/admin/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"message":"Test remote logging"'),
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle remote logging failures gracefully', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const fetchMock = fetch as Mock;
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      // Should not throw
      expect(() => {
        errorLogger.info('system', 'Test failed remote logging');
      }).not.toThrow();

      process.env.NODE_ENV = originalEnv;
    });
  });
});

describe('Utility Functions', () => {
  describe('withLogging', () => {
    it('should wrap synchronous functions with logging', async () => {
      const { withLogging } = await import('../../lib/utils/errorLogger');
      
      errorLogger.clearLogs();
      const testFunction = (x: number, y: number) => x + y;
      const wrappedFunction = withLogging(testFunction, 'api', 'addition');

      const result = wrappedFunction(2, 3);

      expect(result).toBe(5);
      
      const logs = errorLogger.getLogs({ category: ['api'] });
      expect(logs.some(log => log.message.includes('addition'))).toBe(true);
    });

    it('should wrap asynchronous functions with logging', async () => {
      const { withLogging } = await import('../../lib/utils/errorLogger');
      
      errorLogger.clearLogs();
      const asyncFunction = async (x: number) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return x * 2;
      };
      const wrappedFunction = withLogging(asyncFunction, 'api', 'async_operation');

      const result = await wrappedFunction(5);

      expect(result).toBe(10);
      
      const logs = errorLogger.getLogs({ category: ['api'] });
      expect(logs.some(log => log.message.includes('async_operation'))).toBe(true);
    });

    it('should log errors from wrapped functions', async () => {
      const { withLogging } = await import('../../lib/utils/errorLogger');
      
      errorLogger.clearLogs();
      const failingFunction = () => {
        throw new Error('Test error');
      };
      const wrappedFunction = withLogging(failingFunction, 'api', 'failing_operation');

      expect(() => wrappedFunction()).toThrow('Test error');
      
      const logs = errorLogger.getLogs({ level: ['error'] });
      expect(logs.some(log => log.message.includes('failing_operation failed'))).toBe(true);
    });
  });

  describe('logAsync', () => {
    it('should log successful async operations', async () => {
      const { logAsync } = await import('../../lib/utils/errorLogger');
      
      errorLogger.clearLogs();
      const asyncOperation = Promise.resolve('success');
      const result = await logAsync(asyncOperation, 'api', 'test_async');

      expect(result).toBe('success');
      
      const logs = errorLogger.getLogs({ category: ['api'] });
      expect(logs.some(log => log.message.includes('test_async'))).toBe(true);
    });

    it('should log failed async operations', async () => {
      const { logAsync } = await import('../../lib/utils/errorLogger');
      
      errorLogger.clearLogs();
      const failingOperation = Promise.reject(new Error('Async error'));
      
      await expect(logAsync(failingOperation, 'api', 'failing_async')).rejects.toThrow('Async error');
      
      const logs = errorLogger.getLogs({ level: ['error'] });
      expect(logs.some(log => log.message.includes('failing_async failed'))).toBe(true);
    });
  });
});