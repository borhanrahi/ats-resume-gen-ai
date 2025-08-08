/**
 * Admin notification system for real-time alerts and email notifications
 * Handles system events, errors, and critical issues with escalation rules
 * Requirements: 13.3, 13.4 - System monitoring and error tracking with admin alerts
 */

export type NotificationType = 
  | 'system_error'
  | 'critical_error'
  | 'high_error_rate'
  | 'auth_failure'
  | 'ai_api_failure'
  | 'payment_issue'
  | 'security_event'
  | 'performance_issue'
  | 'user_action'
  | 'admin_action'
  | 'system_health';

export type NotificationSeverity = 'low' | 'medium' | 'high' | 'critical';

export type NotificationChannel = 'email' | 'webhook' | 'push' | 'sms' | 'console';

export interface NotificationPreference {
  adminId: string;
  email: string;
  channels: {
    [key in NotificationChannel]?: {
      enabled: boolean;
      types: NotificationType[];
      severities: NotificationSeverity[];
      quietHours?: {
        start: string; // HH:MM format
        end: string;   // HH:MM format
        timezone: string;
      };
    };
  };
  escalationRules: EscalationRule[];
}

export interface EscalationRule {
  id: string;
  name: string;
  condition: {
    types: NotificationType[];
    severities: NotificationSeverity[];
    frequency: {
      count: number;
      timeWindow: number; // milliseconds
    };
  };
  escalationSteps: EscalationStep[];
  enabled: boolean;
}

export interface EscalationStep {
  delay: number; // milliseconds
  channels: NotificationChannel[];
  recipients: string[]; // admin IDs or email addresses
  template: string;
  requiresAcknowledgment: boolean;
}

export interface Notification {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  data: Record<string, unknown>;
  timestamp: number;
  source: {
    component: string;
    userId?: string;
    adminId?: string;
    ip?: string;
  };
  channels: NotificationChannel[];
  recipients: string[];
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'acknowledged';
  attempts: number;
  lastAttempt?: number;
  acknowledgedBy?: string;
  acknowledgedAt?: number;
  escalationLevel: number;
  parentNotificationId?: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  channel: NotificationChannel;
  subject: string;
  body: string;
  variables: string[];
  isDefault: boolean;
}

export interface NotificationStats {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalAcknowledged: number;
  byType: Record<NotificationType, number>;
  bySeverity: Record<NotificationSeverity, number>;
  byChannel: Record<NotificationChannel, number>;
  averageDeliveryTime: number;
  averageAcknowledgmentTime: number;
}

class NotificationSystem {
  private static instance: NotificationSystem;
  private notifications: Map<string, Notification> = new Map();
  private preferences: Map<string, NotificationPreference> = new Map();
  private templates: Map<string, NotificationTemplate> = new Map();
  private escalationTimers: Map<string, NodeJS.Timeout> = new Map();
  private isInitialized = false;

  private constructor() {}

  static getInstance(): NotificationSystem {
    if (!NotificationSystem.instance) {
      NotificationSystem.instance = new NotificationSystem();
    }
    return NotificationSystem.instance;
  }

  /**
   * Initialize the notification system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await this.loadPreferences();
    await this.loadTemplates();
    this.initializeDefaultTemplates();

    this.isInitialized = true;
    console.log('Notification system initialized');
  }

  /**
   * Send a notification
   */
  async sendNotification(
    type: NotificationType,
    severity: NotificationSeverity,
    title: string,
    message: string,
    data: Record<string, unknown> = {},
    source: {
      component: string;
      userId?: string;
      adminId?: string;
      ip?: string;
    }
  ): Promise<Notification> {
    const notification: Notification = {
      id: this.generateNotificationId(),
      type,
      severity,
      title,
      message,
      data,
      timestamp: Date.now(),
      source,
      channels: [],
      recipients: [],
      status: 'pending',
      attempts: 0,
      escalationLevel: 0,
    };

    // Determine recipients and channels based on preferences
    await this.determineRecipientsAndChannels(notification);

    // Store notification
    this.notifications.set(notification.id, notification);

    // Send through all channels
    await this.deliverNotification(notification);

    // Set up escalation if needed
    this.setupEscalation(notification);

    return notification;
  }

  /**
   * Acknowledge a notification
   */
  async acknowledgeNotification(notificationId: string, adminId: string): Promise<boolean> {
    const notification = this.notifications.get(notificationId);
    if (!notification) return false;

    notification.status = 'acknowledged';
    notification.acknowledgedBy = adminId;
    notification.acknowledgedAt = Date.now();

    // Cancel escalation
    const escalationTimer = this.escalationTimers.get(notificationId);
    if (escalationTimer) {
      clearTimeout(escalationTimer);
      this.escalationTimers.delete(notificationId);
    }

    // Update storage
    await this.persistNotification(notification);

    return true;
  }

  /**
   * Get notifications with filtering
   */
  getNotifications(filter?: {
    types?: NotificationType[];
    severities?: NotificationSeverity[];
    status?: Notification['status'][];
    adminId?: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
    offset?: number;
  }): Notification[] {
    let notifications = Array.from(this.notifications.values());

    if (filter?.types) {
      notifications = notifications.filter(n => filter.types!.includes(n.type));
    }

    if (filter?.severities) {
      notifications = notifications.filter(n => filter.severities!.includes(n.severity));
    }

    if (filter?.status) {
      notifications = notifications.filter(n => filter.status!.includes(n.status));
    }

    if (filter?.adminId) {
      notifications = notifications.filter(n => 
        n.recipients.includes(filter.adminId!) || 
        n.source.adminId === filter.adminId
      );
    }

    if (filter?.startTime) {
      notifications = notifications.filter(n => n.timestamp >= filter.startTime!);
    }

    if (filter?.endTime) {
      notifications = notifications.filter(n => n.timestamp <= filter.endTime!);
    }

    // Sort by timestamp (newest first)
    notifications.sort((a, b) => b.timestamp - a.timestamp);

    // Apply pagination
    if (filter?.offset || filter?.limit) {
      const offset = filter.offset || 0;
      const limit = filter.limit || 100;
      notifications = notifications.slice(offset, offset + limit);
    }

    return notifications;
  }

  /**
   * Get notification statistics
   */
  getNotificationStats(timeWindow?: number): NotificationStats {
    const now = Date.now();
    const windowStart = timeWindow ? now - timeWindow : 0;
    const notifications = Array.from(this.notifications.values())
      .filter(n => n.timestamp >= windowStart);

    const stats: NotificationStats = {
      totalSent: 0,
      totalDelivered: 0,
      totalFailed: 0,
      totalAcknowledged: 0,
      byType: {} as Record<NotificationType, number>,
      bySeverity: {} as Record<NotificationSeverity, number>,
      byChannel: {} as Record<NotificationChannel, number>,
      averageDeliveryTime: 0,
      averageAcknowledgmentTime: 0,
    };

    let totalDeliveryTime = 0;
    let totalAcknowledgmentTime = 0;
    let deliveredCount = 0;
    let acknowledgedCount = 0;

    notifications.forEach(notification => {
      // Count by status
      if (notification.status === 'sent' || notification.status === 'delivered') {
        stats.totalSent++;
      }
      if (notification.status === 'delivered') {
        stats.totalDelivered++;
        deliveredCount++;
        if (notification.lastAttempt) {
          totalDeliveryTime += notification.lastAttempt - notification.timestamp;
        }
      }
      if (notification.status === 'failed') {
        stats.totalFailed++;
      }
      if (notification.status === 'acknowledged') {
        stats.totalAcknowledged++;
        acknowledgedCount++;
        if (notification.acknowledgedAt) {
          totalAcknowledgmentTime += notification.acknowledgedAt - notification.timestamp;
        }
      }

      // Count by type
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;

      // Count by severity
      stats.bySeverity[notification.severity] = (stats.bySeverity[notification.severity] || 0) + 1;

      // Count by channel
      notification.channels.forEach(channel => {
        stats.byChannel[channel] = (stats.byChannel[channel] || 0) + 1;
      });
    });

    // Calculate averages
    stats.averageDeliveryTime = deliveredCount > 0 ? totalDeliveryTime / deliveredCount : 0;
    stats.averageAcknowledgmentTime = acknowledgedCount > 0 ? totalAcknowledgmentTime / acknowledgedCount : 0;

    return stats;
  }

  /**
   * Manage admin notification preferences
   */
  async updatePreferences(adminId: string, preferences: Partial<NotificationPreference>): Promise<void> {
    const existing = this.preferences.get(adminId) || {
      adminId,
      email: '',
      channels: {},
      escalationRules: [],
    };

    const updated = { ...existing, ...preferences };
    this.preferences.set(adminId, updated);

    await this.persistPreferences();
  }

  getPreferences(adminId: string): NotificationPreference | undefined {
    return this.preferences.get(adminId);
  }

  /**
   * Manage notification templates
   */
  async updateTemplate(template: NotificationTemplate): Promise<void> {
    this.templates.set(template.id, template);
    await this.persistTemplates();
  }

  getTemplate(id: string): NotificationTemplate | undefined {
    return this.templates.get(id);
  }

  getTemplates(type?: NotificationType, channel?: NotificationChannel): NotificationTemplate[] {
    let templates = Array.from(this.templates.values());

    if (type) {
      templates = templates.filter(t => t.type === type);
    }

    if (channel) {
      templates = templates.filter(t => t.channel === channel);
    }

    return templates;
  }

  /**
   * Private methods
   */
  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async determineRecipientsAndChannels(notification: Notification): Promise<void> {
    const recipients = new Set<string>();
    const channels = new Set<NotificationChannel>();

    // Get all admin preferences
    for (const [adminId, prefs] of this.preferences) {
      // Check if admin should receive this notification
      for (const [channel, config] of Object.entries(prefs.channels)) {
        if (!config?.enabled) continue;

        const shouldReceive = 
          config.types.includes(notification.type) &&
          config.severities.includes(notification.severity);

        if (shouldReceive && !this.isInQuietHours(prefs, channel as NotificationChannel)) {
          recipients.add(adminId);
          channels.add(channel as NotificationChannel);
        }
      }
    }

    // For critical notifications, ensure at least one admin is notified
    if (notification.severity === 'critical' && recipients.size === 0) {
      // Add all admins with email enabled
      for (const [adminId, prefs] of this.preferences) {
        if (prefs.channels.email?.enabled) {
          recipients.add(adminId);
          channels.add('email');
        }
      }
    }

    notification.recipients = Array.from(recipients);
    notification.channels = Array.from(channels);
  }

  private isInQuietHours(prefs: NotificationPreference, channel: NotificationChannel): boolean {
    const config = prefs.channels[channel];
    if (!config?.quietHours) return false;

    const now = new Date();
    const timezone = config.quietHours.timezone || 'UTC';
    
    // Simple quiet hours check (would need proper timezone handling in production)
    const currentHour = now.getHours();
    const startHour = parseInt(config.quietHours.start.split(':')[0]);
    const endHour = parseInt(config.quietHours.end.split(':')[0]);

    if (startHour <= endHour) {
      return currentHour >= startHour && currentHour < endHour;
    } else {
      return currentHour >= startHour || currentHour < endHour;
    }
  }

  private async deliverNotification(notification: Notification): Promise<void> {
    notification.attempts++;
    notification.lastAttempt = Date.now();

    const deliveryPromises = notification.channels.map(channel => 
      this.deliverToChannel(notification, channel)
    );

    try {
      await Promise.allSettled(deliveryPromises);
      notification.status = 'delivered';
    } catch (error) {
      notification.status = 'failed';
      console.error('Failed to deliver notification:', error);
    }

    await this.persistNotification(notification);
  }

  private async deliverToChannel(notification: Notification, channel: NotificationChannel): Promise<void> {
    switch (channel) {
      case 'email':
        await this.sendEmail(notification);
        break;
      case 'webhook':
        await this.sendWebhook(notification);
        break;
      case 'push':
        await this.sendPushNotification(notification);
        break;
      case 'sms':
        await this.sendSMS(notification);
        break;
      case 'console':
        this.sendConsoleNotification(notification);
        break;
    }
  }

  private async sendEmail(notification: Notification): Promise<void> {
    const template = this.getTemplate(`${notification.type}_email`) || 
                    this.getTemplate('default_email');

    if (!template) {
      throw new Error('No email template found');
    }

    const recipients = notification.recipients
      .map(adminId => this.preferences.get(adminId)?.email)
      .filter(Boolean) as string[];

    if (recipients.length === 0) return;

    const emailData = {
      recipients,
      subject: this.renderTemplate(template.subject, notification),
      body: this.renderTemplate(template.body, notification),
      notification,
    };

    // Send via API endpoint
    await fetch('/api/admin/notifications/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailData),
    });
  }

  private async sendWebhook(notification: Notification): Promise<void> {
    // Implementation would depend on configured webhook URLs
    const webhookUrl = process.env.ADMIN_WEBHOOK_URL;
    if (!webhookUrl) return;

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'notification',
        notification,
        timestamp: Date.now(),
      }),
    });
  }

  private async sendPushNotification(notification: Notification): Promise<void> {
    // Implementation would use a push notification service
    console.log('Push notification would be sent:', notification.title);
  }

  private async sendSMS(notification: Notification): Promise<void> {
    // Implementation would use an SMS service
    console.log('SMS would be sent:', notification.title);
  }

  private sendConsoleNotification(notification: Notification): void {
    const prefix = `[${notification.severity.toUpperCase()}] [${notification.type}]`;
    console.warn(`${prefix} ${notification.title}: ${notification.message}`);
  }

  private renderTemplate(template: string, notification: Notification): string {
    let rendered = template;

    // Replace variables
    rendered = rendered.replace(/\{\{title\}\}/g, notification.title);
    rendered = rendered.replace(/\{\{message\}\}/g, notification.message);
    rendered = rendered.replace(/\{\{severity\}\}/g, notification.severity);
    rendered = rendered.replace(/\{\{type\}\}/g, notification.type);
    rendered = rendered.replace(/\{\{timestamp\}\}/g, new Date(notification.timestamp).toISOString());

    // Replace data variables
    Object.entries(notification.data).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{data\\.${key}\\}\\}`, 'g');
      rendered = rendered.replace(regex, String(value));
    });

    return rendered;
  }

  private setupEscalation(notification: Notification): void {
    // Find applicable escalation rules
    const applicableRules = Array.from(this.preferences.values())
      .flatMap(prefs => prefs.escalationRules)
      .filter(rule => 
        rule.enabled &&
        rule.condition.types.includes(notification.type) &&
        rule.condition.severities.includes(notification.severity)
      );

    if (applicableRules.length === 0) return;

    // Set up escalation timer for the first applicable rule
    const rule = applicableRules[0];
    const firstStep = rule.escalationSteps[0];

    if (firstStep) {
      const timer = setTimeout(() => {
        this.escalateNotification(notification, rule, 0);
      }, firstStep.delay);

      this.escalationTimers.set(notification.id, timer);
    }
  }

  private async escalateNotification(
    notification: Notification,
    rule: EscalationRule,
    stepIndex: number
  ): Promise<void> {
    const step = rule.escalationSteps[stepIndex];
    if (!step) return;

    // Create escalated notification
    const escalatedNotification: Notification = {
      ...notification,
      id: this.generateNotificationId(),
      title: `[ESCALATED] ${notification.title}`,
      channels: step.channels,
      recipients: step.recipients,
      escalationLevel: stepIndex + 1,
      parentNotificationId: notification.id,
      timestamp: Date.now(),
    };

    // Deliver escalated notification
    await this.deliverNotification(escalatedNotification);

    // Set up next escalation step
    const nextStepIndex = stepIndex + 1;
    const nextStep = rule.escalationSteps[nextStepIndex];

    if (nextStep && !step.requiresAcknowledgment) {
      const timer = setTimeout(() => {
        this.escalateNotification(notification, rule, nextStepIndex);
      }, nextStep.delay);

      this.escalationTimers.set(notification.id, timer);
    }
  }

  private async loadPreferences(): Promise<void> {
    try {
      // In production, load from database
      // For now, use default preferences
      this.initializeDefaultPreferences();
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  }

  private async loadTemplates(): Promise<void> {
    try {
      // In production, load from database
      // For now, use default templates
    } catch (error) {
      console.error('Failed to load notification templates:', error);
    }
  }

  private initializeDefaultPreferences(): void {
    // Create default preferences for system admin
    const defaultPrefs: NotificationPreference = {
      adminId: 'system_admin',
      email: 'admin@example.com',
      channels: {
        email: {
          enabled: true,
          types: ['critical_error', 'system_error', 'security_event'],
          severities: ['high', 'critical'],
        },
        console: {
          enabled: true,
          types: ['critical_error', 'system_error', 'high_error_rate'],
          severities: ['medium', 'high', 'critical'],
        },
      },
      escalationRules: [
        {
          id: 'critical_escalation',
          name: 'Critical Error Escalation',
          condition: {
            types: ['critical_error'],
            severities: ['critical'],
            frequency: { count: 1, timeWindow: 60000 },
          },
          escalationSteps: [
            {
              delay: 300000, // 5 minutes
              channels: ['email'],
              recipients: ['system_admin'],
              template: 'critical_escalation',
              requiresAcknowledgment: true,
            },
          ],
          enabled: true,
        },
      ],
    };

    this.preferences.set('system_admin', defaultPrefs);
  }

  private initializeDefaultTemplates(): void {
    const templates: NotificationTemplate[] = [
      {
        id: 'default_email',
        name: 'Default Email Template',
        type: 'system_error',
        channel: 'email',
        subject: '[{{severity}}] {{title}}',
        body: `
          <h2>{{title}}</h2>
          <p><strong>Severity:</strong> {{severity}}</p>
          <p><strong>Type:</strong> {{type}}</p>
          <p><strong>Time:</strong> {{timestamp}}</p>
          <p><strong>Message:</strong></p>
          <p>{{message}}</p>
        `,
        variables: ['title', 'severity', 'type', 'timestamp', 'message'],
        isDefault: true,
      },
      {
        id: 'critical_error_email',
        name: 'Critical Error Email Template',
        type: 'critical_error',
        channel: 'email',
        subject: '🚨 CRITICAL: {{title}}',
        body: `
          <div style="color: red; border: 2px solid red; padding: 20px;">
            <h1>🚨 CRITICAL ERROR ALERT</h1>
            <h2>{{title}}</h2>
            <p><strong>Time:</strong> {{timestamp}}</p>
            <p><strong>Message:</strong></p>
            <p>{{message}}</p>
            <p><strong>Immediate action required!</strong></p>
          </div>
        `,
        variables: ['title', 'timestamp', 'message'],
        isDefault: true,
      },
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  private async persistNotification(notification: Notification): Promise<void> {
    // In production, save to database
    // For now, just keep in memory
  }

  private async persistPreferences(): Promise<void> {
    // In production, save to database
    // For now, just keep in memory
  }

  private async persistTemplates(): Promise<void> {
    // In production, save to database
    // For now, just keep in memory
  }
}

// Export singleton instance
export const notificationSystem = NotificationSystem.getInstance();

// Utility functions
export async function sendCriticalAlert(
  title: string,
  message: string,
  data?: Record<string, unknown>,
  source?: {
    component: string;
    userId?: string;
    adminId?: string;
    ip?: string;
  }
): Promise<Notification> {
  return notificationSystem.sendNotification(
    'critical_error',
    'critical',
    title,
    message,
    data,
    source || { component: 'system' }
  );
}

export async function sendSystemAlert(
  title: string,
  message: string,
  severity: NotificationSeverity = 'medium',
  data?: Record<string, unknown>,
  source?: {
    component: string;
    userId?: string;
    adminId?: string;
    ip?: string;
  }
): Promise<Notification> {
  return notificationSystem.sendNotification(
    'system_error',
    severity,
    title,
    message,
    data,
    source || { component: 'system' }
  );
}

export async function sendSecurityAlert(
  title: string,
  message: string,
  severity: NotificationSeverity = 'high',
  data?: Record<string, unknown>,
  source?: {
    component: string;
    userId?: string;
    adminId?: string;
    ip?: string;
  }
): Promise<Notification> {
  return notificationSystem.sendNotification(
    'security_event',
    severity,
    title,
    message,
    data,
    source || { component: 'security' }
  );
}