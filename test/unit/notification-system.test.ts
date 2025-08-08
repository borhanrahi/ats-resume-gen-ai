/**
 * Unit tests for the admin notification system
 * Tests real-time notifications, email alerts, and escalation rules
 * Requirements: 13.3, 13.4 - System monitoring with admin notification testing
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { 
  notificationSystem, 
  sendCriticalAlert, 
  sendSystemAlert, 
  sendSecurityAlert,
  NotificationType,
  NotificationSeverity 
} from '@/lib/admin/notificationSystem';

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock console methods
const consoleMock = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};
Object.defineProperty(console, 'log', { value: consoleMock.log });
Object.defineProperty(console, 'warn', { value: consoleMock.warn });
Object.defineProperty(console, 'error', { value: consoleMock.error });

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  value: vi.fn().mockImplementation((title, options) => ({
    title,
    ...options,
  })),
});

describe('NotificationSystem', () => {
  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Initialize notification system
    await notificationSystem.initialize();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Basic Notification Sending', () => {
    it('should send a notification successfully', async () => {
      const notification = await notificationSystem.sendNotification(
        'system_error',
        'high',
        'Test System Error',
        'This is a test system error message',
        { errorCode: 500 },
        { component: 'test' }
      );

      expect(notification).toMatchObject({
        type: 'system_error',
        severity: 'high',
        title: 'Test System Error',
        message: 'This is a test system error message',
        data: { errorCode: 500 },
        source: { component: 'test' },
        status: 'delivered',
      });
      expect(notification.id).toBeDefined();
      expect(notification.timestamp).toBeDefined();
    });

    it('should handle different notification types', async () => {
      const types: NotificationType[] = [
        'system_error',
        'critical_error',
        'high_error_rate',
        'auth_failure',
        'ai_api_failure',
        'payment_issue',
        'security_event',
        'performance_issue',
      ];

      for (const type of types) {
        const notification = await notificationSystem.sendNotification(
          type,
          'medium',
          `Test ${type}`,
          `Test message for ${type}`,
          {},
          { component: 'test' }
        );

        expect(notification.type).toBe(type);
      }
    });

    it('should handle different severity levels', async () => {
      const severities: NotificationSeverity[] = ['low', 'medium', 'high', 'critical'];

      for (const severity of severities) {
        const notification = await notificationSystem.sendNotification(
          'system_error',
          severity,
          `Test ${severity} error`,
          `Test message with ${severity} severity`,
          {},
          { component: 'test' }
        );

        expect(notification.severity).toBe(severity);
      }
    });
  });

  describe('Notification Retrieval and Filtering', () => {
    beforeEach(async () => {
      // Create test notifications
      await notificationSystem.sendNotification('system_error', 'high', 'High Error', 'High error message', {}, { component: 'test' });
      await notificationSystem.sendNotification('critical_error', 'critical', 'Critical Error', 'Critical error message', {}, { component: 'test' });
      await notificationSystem.sendNotification('auth_failure', 'medium', 'Auth Failure', 'Auth failure message', {}, { component: 'auth', userId: 'user1' });
      await notificationSystem.sendNotification('security_event', 'high', 'Security Event', 'Security event message', {}, { component: 'security', adminId: 'admin1' });
    });

    it('should retrieve all notifications', () => {
      const notifications = notificationSystem.getNotifications();
      expect(notifications).toHaveLength(4);
    });

    it('should filter notifications by type', () => {
      const systemErrors = notificationSystem.getNotifications({ types: ['system_error'] });
      expect(systemErrors).toHaveLength(1);
      expect(systemErrors[0].type).toBe('system_error');

      const criticalErrors = notificationSystem.getNotifications({ types: ['critical_error'] });
      expect(criticalErrors).toHaveLength(1);
      expect(criticalErrors[0].type).toBe('critical_error');
    });

    it('should filter notifications by severity', () => {
      const highSeverity = notificationSystem.getNotifications({ severities: ['high'] });
      expect(highSeverity).toHaveLength(2);
      expect(highSeverity.every(n => n.severity === 'high')).toBe(true);

      const criticalSeverity = notificationSystem.getNotifications({ severities: ['critical'] });
      expect(criticalSeverity).toHaveLength(1);
      expect(criticalSeverity[0].severity).toBe('critical');
    });

    it('should filter notifications by status', () => {
      const deliveredNotifications = notificationSystem.getNotifications({ status: ['delivered'] });
      expect(deliveredNotifications).toHaveLength(4);
      expect(deliveredNotifications.every(n => n.status === 'delivered')).toBe(true);
    });

    it('should filter notifications by adminId', () => {
      const adminNotifications = notificationSystem.getNotifications({ adminId: 'admin1' });
      expect(adminNotifications).toHaveLength(1);
      expect(adminNotifications[0].source.adminId).toBe('admin1');
    });

    it('should apply pagination', () => {
      const firstPage = notificationSystem.getNotifications({ limit: 2, offset: 0 });
      const secondPage = notificationSystem.getNotifications({ limit: 2, offset: 2 });

      expect(firstPage).toHaveLength(2);
      expect(secondPage).toHaveLength(2);
      expect(firstPage[0].id).not.toBe(secondPage[0].id);
    });

    it('should filter by time range', () => {
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);

      const recentNotifications = notificationSystem.getNotifications({ startTime: oneHourAgo });
      expect(recentNotifications.length).toBeGreaterThan(0);

      const futureNotifications = notificationSystem.getNotifications({ startTime: now + 1000 });
      expect(futureNotifications).toHaveLength(0);
    });
  });

  describe('Notification Acknowledgment', () => {
    it('should acknowledge a notification', async () => {
      const notification = await notificationSystem.sendNotification(
        'system_error',
        'high',
        'Test Error',
        'Test message',
        {},
        { component: 'test' }
      );

      const acknowledged = await notificationSystem.acknowledgeNotification(notification.id, 'admin1');
      expect(acknowledged).toBe(true);

      const updatedNotifications = notificationSystem.getNotifications({ status: ['acknowledged'] });
      expect(updatedNotifications).toHaveLength(1);
      expect(updatedNotifications[0].acknowledgedBy).toBe('admin1');
      expect(updatedNotifications[0].acknowledgedAt).toBeDefined();
    });

    it('should return false for non-existent notification', async () => {
      const acknowledged = await notificationSystem.acknowledgeNotification('non-existent', 'admin1');
      expect(acknowledged).toBe(false);
    });
  });

  describe('Notification Statistics', () => {
    beforeEach(async () => {
      // Create test notifications with known distribution
      await notificationSystem.sendNotification('system_error', 'high', 'Error 1', 'Message 1', {}, { component: 'test' });
      await notificationSystem.sendNotification('critical_error', 'critical', 'Error 2', 'Message 2', {}, { component: 'test' });
      await notificationSystem.sendNotification('auth_failure', 'medium', 'Error 3', 'Message 3', {}, { component: 'auth' });
      
      // Acknowledge one notification
      const notifications = notificationSystem.getNotifications();
      await notificationSystem.acknowledgeNotification(notifications[0].id, 'admin1');
    });

    it('should calculate notification statistics correctly', () => {
      const stats = notificationSystem.getNotificationStats();

      expect(stats.totalSent).toBe(3);
      expect(stats.totalDelivered).toBe(3);
      expect(stats.totalAcknowledged).toBe(1);
      expect(stats.totalFailed).toBe(0);

      expect(stats.byType.system_error).toBe(1);
      expect(stats.byType.critical_error).toBe(1);
      expect(stats.byType.auth_failure).toBe(1);

      expect(stats.bySeverity.high).toBe(1);
      expect(stats.bySeverity.critical).toBe(1);
      expect(stats.bySeverity.medium).toBe(1);
    });

    it('should calculate statistics for time window', () => {
      const oneHour = 60 * 60 * 1000;
      const stats = notificationSystem.getNotificationStats(oneHour);

      expect(stats.totalSent).toBe(3);
    });
  });

  describe('Notification Preferences', () => {
    it('should update admin preferences', async () => {
      const preferences = {
        adminId: 'admin1',
        email: 'admin1@example.com',
        channels: {
          email: {
            enabled: true,
            types: ['critical_error' as NotificationType],
            severities: ['critical' as NotificationSeverity],
          },
        },
        escalationRules: [],
      };

      await notificationSystem.updatePreferences('admin1', preferences);

      const retrieved = notificationSystem.getPreferences('admin1');
      expect(retrieved).toMatchObject(preferences);
    });

    it('should get undefined for non-existent admin', () => {
      const preferences = notificationSystem.getPreferences('non-existent');
      expect(preferences).toBeUndefined();
    });
  });

  describe('Notification Templates', () => {
    it('should update and retrieve templates', async () => {
      const template = {
        id: 'test_template',
        name: 'Test Template',
        type: 'system_error' as NotificationType,
        channel: 'email' as const,
        subject: 'Test Subject: {{title}}',
        body: 'Test Body: {{message}}',
        variables: ['title', 'message'],
        isDefault: false,
      };

      await notificationSystem.updateTemplate(template);

      const retrieved = notificationSystem.getTemplate('test_template');
      expect(retrieved).toMatchObject(template);
    });

    it('should filter templates by type and channel', async () => {
      const template1 = {
        id: 'template1',
        name: 'Template 1',
        type: 'system_error' as NotificationType,
        channel: 'email' as const,
        subject: 'Subject 1',
        body: 'Body 1',
        variables: [],
        isDefault: false,
      };

      const template2 = {
        id: 'template2',
        name: 'Template 2',
        type: 'critical_error' as NotificationType,
        channel: 'webhook' as const,
        subject: 'Subject 2',
        body: 'Body 2',
        variables: [],
        isDefault: false,
      };

      await notificationSystem.updateTemplate(template1);
      await notificationSystem.updateTemplate(template2);

      const emailTemplates = notificationSystem.getTemplates(undefined, 'email');
      expect(emailTemplates.some(t => t.id === 'template1')).toBe(true);

      const systemErrorTemplates = notificationSystem.getTemplates('system_error');
      expect(systemErrorTemplates.some(t => t.id === 'template1')).toBe(true);
    });
  });

  describe('Console Notifications', () => {
    it('should output console notifications', async () => {
      await notificationSystem.sendNotification(
        'system_error',
        'high',
        'Console Test',
        'Console test message',
        {},
        { component: 'test' }
      );

      expect(consoleMock.warn).toHaveBeenCalledWith(
        expect.stringContaining('[HIGH] [system_error] Console Test: Console test message')
      );
    });
  });

  describe('Email Notifications', () => {
    it('should attempt to send email notifications', async () => {
      const fetchMock = fetch as Mock;
      fetchMock.mockResolvedValueOnce(new Response('OK'));

      // Update preferences to enable email
      await notificationSystem.updatePreferences('system_admin', {
        adminId: 'system_admin',
        email: 'admin@example.com',
        channels: {
          email: {
            enabled: true,
            types: ['system_error'],
            severities: ['high'],
          },
        },
        escalationRules: [],
      });

      await notificationSystem.sendNotification(
        'system_error',
        'high',
        'Email Test',
        'Email test message',
        {},
        { component: 'test' }
      );

      // Wait for async email sending
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(fetchMock).toHaveBeenCalledWith('/api/admin/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"subject"'),
      });
    });
  });

  describe('Utility Functions', () => {
    it('should send critical alerts', async () => {
      const notification = await sendCriticalAlert(
        'Critical Test',
        'Critical test message',
        { errorCode: 500 },
        { component: 'test' }
      );

      expect(notification.type).toBe('critical_error');
      expect(notification.severity).toBe('critical');
      expect(notification.title).toBe('Critical Test');
    });

    it('should send system alerts', async () => {
      const notification = await sendSystemAlert(
        'System Test',
        'System test message',
        'high',
        { errorCode: 500 },
        { component: 'test' }
      );

      expect(notification.type).toBe('system_error');
      expect(notification.severity).toBe('high');
      expect(notification.title).toBe('System Test');
    });

    it('should send security alerts', async () => {
      const notification = await sendSecurityAlert(
        'Security Test',
        'Security test message',
        'high',
        { ip: '192.168.1.1' },
        { component: 'security' }
      );

      expect(notification.type).toBe('security_event');
      expect(notification.severity).toBe('high');
      expect(notification.title).toBe('Security Test');
    });

    it('should use default severity for system alerts', async () => {
      const notification = await sendSystemAlert(
        'Default Severity Test',
        'Default severity test message'
      );

      expect(notification.severity).toBe('medium');
    });

    it('should use default severity for security alerts', async () => {
      const notification = await sendSecurityAlert(
        'Default Security Test',
        'Default security test message'
      );

      expect(notification.severity).toBe('high');
    });
  });

  describe('Error Handling', () => {
    it('should handle email sending failures gracefully', async () => {
      const fetchMock = fetch as Mock;
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      // Should not throw
      await expect(notificationSystem.sendNotification(
        'system_error',
        'high',
        'Email Failure Test',
        'Email failure test message',
        {},
        { component: 'test' }
      )).resolves.toBeDefined();
    });

    it('should handle webhook failures gracefully', async () => {
      const originalEnv = process.env.ADMIN_WEBHOOK_URL;
      process.env.ADMIN_WEBHOOK_URL = 'https://invalid-webhook-url.com';

      const fetchMock = fetch as Mock;
      fetchMock.mockRejectedValueOnce(new Error('Webhook error'));

      // Should not throw
      await expect(notificationSystem.sendNotification(
        'system_error',
        'high',
        'Webhook Failure Test',
        'Webhook failure test message',
        {},
        { component: 'test' }
      )).resolves.toBeDefined();

      process.env.ADMIN_WEBHOOK_URL = originalEnv;
    });
  });
});