import { databases, DATABASE_ID, COLLECTIONS } from './appwrite';
import { SystemLog } from '../../types/admin';
import { ID, Query } from 'appwrite';

// Audit log levels
export type AuditLogLevel = 'info' | 'warning' | 'error' | 'critical';

// Audit log categories
export type AuditLogCategory = 
  | 'authentication'
  | 'authorization'
  | 'user_management'
  | 'payment_management'
  | 'ai_model_config'
  | 'system_analytics'
  | 'feature_management'
  | 'security'
  | 'system';

// Audit log entry
export interface AuditLogEntry {
  level: AuditLogLevel;
  category: AuditLogCategory;
  action: string;
  message: string;
  adminId?: string;
  userId?: string;
  resourceId?: string;
  resourceType?: string;
  context: Record<string, any>;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
}

// Admin audit logging service
export class AdminAuditLogger {
  private static instance: AdminAuditLogger;
  
  static getInstance(): AdminAuditLogger {
    if (!AdminAuditLogger.instance) {
      AdminAuditLogger.instance = new AdminAuditLogger();
    }
    return AdminAuditLogger.instance;
  }

  // Log admin action
  async logAction(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
    try {
      const logEntry: Omit<SystemLog, '$id'> = {
        level: entry.level,
        message: `[${entry.category.toUpperCase()}] ${entry.action}: ${entry.message}`,
        context: {
          category: entry.category,
          action: entry.action,
          resourceId: entry.resourceId,
          resourceType: entry.resourceType,
          ip: entry.ip,
          userAgent: entry.userAgent,
          ...entry.context
        },
        adminId: entry.adminId,
        userId: entry.userId,
        createdAt: new Date()
      };

      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.SYSTEM_LOGS,
        ID.unique(),
        logEntry
      );

      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[AUDIT] ${entry.level.toUpperCase()}: ${entry.message}`, entry.context);
      }
    } catch (error) {
      console.error('Failed to log audit entry:', error);
    }
  }

  // Log authentication events
  async logAuth(
    action: 'login' | 'logout' | 'login_failed' | 'session_expired',
    adminId: string | null,
    context: Record<string, any> = {}
  ): Promise<void> {
    const messages = {
      login: 'Admin user logged in successfully',
      logout: 'Admin user logged out',
      login_failed: 'Admin login attempt failed',
      session_expired: 'Admin session expired'
    };

    await this.logAction({
      level: action === 'login_failed' ? 'warning' : 'info',
      category: 'authentication',
      action,
      message: messages[action],
      adminId: adminId || undefined,
      context
    });
  }

  // Log authorization events
  async logAuthz(
    action: 'access_granted' | 'access_denied' | 'permission_check',
    adminId: string,
    context: Record<string, any> = {}
  ): Promise<void> {
    const messages = {
      access_granted: 'Admin access granted',
      access_denied: 'Admin access denied',
      permission_check: 'Admin permission checked'
    };

    await this.logAction({
      level: action === 'access_denied' ? 'warning' : 'info',
      category: 'authorization',
      action,
      message: messages[action],
      adminId,
      context
    });
  }

  // Log user management events
  async logUserManagement(
    action: 'user_created' | 'user_updated' | 'user_deleted' | 'user_suspended' | 'subscription_changed',
    adminId: string,
    userId: string,
    context: Record<string, any> = {}
  ): Promise<void> {
    const messages = {
      user_created: 'User account created',
      user_updated: 'User account updated',
      user_deleted: 'User account deleted',
      user_suspended: 'User account suspended',
      subscription_changed: 'User subscription changed'
    };

    await this.logAction({
      level: 'info',
      category: 'user_management',
      action,
      message: messages[action],
      adminId,
      userId,
      resourceId: userId,
      resourceType: 'user',
      context
    });
  }

  // Log payment management events
  async logPaymentManagement(
    action: 'payment_processed' | 'refund_issued' | 'subscription_updated' | 'payment_failed',
    adminId: string,
    userId: string,
    context: Record<string, any> = {}
  ): Promise<void> {
    const messages = {
      payment_processed: 'Payment processed',
      refund_issued: 'Refund issued',
      subscription_updated: 'Subscription updated',
      payment_failed: 'Payment processing failed'
    };

    await this.logAction({
      level: action === 'payment_failed' ? 'error' : 'info',
      category: 'payment_management',
      action,
      message: messages[action],
      adminId,
      userId,
      resourceId: context.paymentId || context.subscriptionId,
      resourceType: 'payment',
      context
    });
  }

  // Log AI model configuration events
  async logAIModelConfig(
    action: 'model_added' | 'model_updated' | 'model_deleted' | 'fallback_configured' | 'model_tested',
    adminId: string,
    context: Record<string, any> = {}
  ): Promise<void> {
    const messages = {
      model_added: 'AI model added',
      model_updated: 'AI model updated',
      model_deleted: 'AI model deleted',
      fallback_configured: 'AI model fallback configured',
      model_tested: 'AI model tested'
    };

    await this.logAction({
      level: 'info',
      category: 'ai_model_config',
      action,
      message: messages[action],
      adminId,
      resourceId: context.modelId,
      resourceType: 'ai_model',
      context
    });
  }

  // Log system analytics events
  async logSystemAnalytics(
    action: 'report_generated' | 'metrics_viewed' | 'export_created',
    adminId: string,
    context: Record<string, any> = {}
  ): Promise<void> {
    const messages = {
      report_generated: 'System report generated',
      metrics_viewed: 'System metrics viewed',
      export_created: 'Data export created'
    };

    await this.logAction({
      level: 'info',
      category: 'system_analytics',
      action,
      message: messages[action],
      adminId,
      context
    });
  }

  // Log feature management events
  async logFeatureManagement(
    action: 'feature_created' | 'feature_updated' | 'feature_deleted' | 'roadmap_updated',
    adminId: string,
    context: Record<string, any> = {}
  ): Promise<void> {
    const messages = {
      feature_created: 'Feature request created',
      feature_updated: 'Feature request updated',
      feature_deleted: 'Feature request deleted',
      roadmap_updated: 'Feature roadmap updated'
    };

    await this.logAction({
      level: 'info',
      category: 'feature_management',
      action,
      message: messages[action],
      adminId,
      resourceId: context.featureId,
      resourceType: 'feature',
      context
    });
  }

  // Log security events
  async logSecurity(
    action: 'suspicious_activity' | 'rate_limit_exceeded' | 'unauthorized_access' | 'security_scan',
    adminId: string | null,
    context: Record<string, any> = {}
  ): Promise<void> {
    const messages = {
      suspicious_activity: 'Suspicious activity detected',
      rate_limit_exceeded: 'Rate limit exceeded',
      unauthorized_access: 'Unauthorized access attempt',
      security_scan: 'Security scan performed'
    };

    await this.logAction({
      level: 'warning',
      category: 'security',
      action,
      message: messages[action],
      adminId: adminId || undefined,
      context
    });
  }

  // Log system events
  async logSystem(
    action: 'system_startup' | 'system_shutdown' | 'backup_created' | 'maintenance_mode',
    adminId: string | null,
    context: Record<string, any> = {}
  ): Promise<void> {
    const messages = {
      system_startup: 'System started',
      system_shutdown: 'System shutdown',
      backup_created: 'System backup created',
      maintenance_mode: 'Maintenance mode toggled'
    };

    await this.logAction({
      level: 'info',
      category: 'system',
      action,
      message: messages[action],
      adminId: adminId || undefined,
      context
    });
  }

  // Get audit logs with filtering
  async getLogs(options: {
    adminId?: string;
    userId?: string;
    category?: AuditLogCategory;
    level?: AuditLogLevel;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}): Promise<SystemLog[]> {
    try {
      const queries = [
        Query.orderDesc('createdAt'),
        Query.limit(options.limit || 100),
        Query.offset(options.offset || 0)
      ];

      if (options.adminId) {
        queries.push(Query.equal('adminId', options.adminId));
      }

      if (options.userId) {
        queries.push(Query.equal('userId', options.userId));
      }

      if (options.level) {
        queries.push(Query.equal('level', options.level));
      }

      if (options.startDate) {
        queries.push(Query.greaterThanEqual('createdAt', options.startDate.toISOString()));
      }

      if (options.endDate) {
        queries.push(Query.lessThanEqual('createdAt', options.endDate.toISOString()));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SYSTEM_LOGS,
        queries
      );

      let logs = response.documents as SystemLog[];

      // Client-side filtering for complex queries
      if (options.category) {
        logs = logs.filter(log => log.context?.category === options.category);
      }

      if (options.action) {
        logs = logs.filter(log => log.context?.action === options.action);
      }

      return logs;
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      return [];
    }
  }

  // Get audit log statistics
  async getLogStats(options: {
    startDate?: Date;
    endDate?: Date;
    adminId?: string;
  } = {}): Promise<{
    totalLogs: number;
    logsByLevel: Record<AuditLogLevel, number>;
    logsByCategory: Record<AuditLogCategory, number>;
    topAdmins: Array<{ adminId: string; count: number }>;
    recentActivity: SystemLog[];
  }> {
    try {
      const logs = await this.getLogs({
        ...options,
        limit: 1000 // Get more logs for statistics
      });

      const stats = {
        totalLogs: logs.length,
        logsByLevel: {
          info: 0,
          warning: 0,
          error: 0,
          critical: 0
        } as Record<AuditLogLevel, number>,
        logsByCategory: {
          authentication: 0,
          authorization: 0,
          user_management: 0,
          payment_management: 0,
          ai_model_config: 0,
          system_analytics: 0,
          feature_management: 0,
          security: 0,
          system: 0
        } as Record<AuditLogCategory, number>,
        topAdmins: [] as Array<{ adminId: string; count: number }>,
        recentActivity: logs.slice(0, 10)
      };

      // Count by level
      logs.forEach(log => {
        if (log.level in stats.logsByLevel) {
          stats.logsByLevel[log.level as AuditLogLevel]++;
        }
      });

      // Count by category
      logs.forEach(log => {
        const category = log.context?.category as AuditLogCategory;
        if (category && category in stats.logsByCategory) {
          stats.logsByCategory[category]++;
        }
      });

      // Count by admin
      const adminCounts: Record<string, number> = {};
      logs.forEach(log => {
        if (log.adminId) {
          adminCounts[log.adminId] = (adminCounts[log.adminId] || 0) + 1;
        }
      });

      stats.topAdmins = Object.entries(adminCounts)
        .map(([adminId, count]) => ({ adminId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return stats;
    } catch (error) {
      console.error('Failed to get audit log stats:', error);
      return {
        totalLogs: 0,
        logsByLevel: { info: 0, warning: 0, error: 0, critical: 0 },
        logsByCategory: {
          authentication: 0,
          authorization: 0,
          user_management: 0,
          payment_management: 0,
          ai_model_config: 0,
          system_analytics: 0,
          feature_management: 0,
          security: 0,
          system: 0
        },
        topAdmins: [],
        recentActivity: []
      };
    }
  }

  // Clean up old logs (retention policy)
  async cleanupOldLogs(retentionDays: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SYSTEM_LOGS,
        [
          Query.lessThan('createdAt', cutoffDate.toISOString()),
          Query.limit(100) // Process in batches
        ]
      );

      let deletedCount = 0;
      for (const log of response.documents) {
        try {
          await databases.deleteDocument(
            DATABASE_ID,
            COLLECTIONS.SYSTEM_LOGS,
            log.$id
          );
          deletedCount++;
        } catch (error) {
          console.error(`Failed to delete log ${log.$id}:`, error);
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const adminAuditLogger = AdminAuditLogger.getInstance();

// Convenience functions for common audit log operations
export const auditLog = {
  auth: (action: Parameters<AdminAuditLogger['logAuth']>[0], adminId: string | null, context?: Record<string, any>) =>
    adminAuditLogger.logAuth(action, adminId, context),
  
  authz: (action: Parameters<AdminAuditLogger['logAuthz']>[0], adminId: string, context?: Record<string, any>) =>
    adminAuditLogger.logAuthz(action, adminId, context),
  
  userMgmt: (action: Parameters<AdminAuditLogger['logUserManagement']>[0], adminId: string, userId: string, context?: Record<string, any>) =>
    adminAuditLogger.logUserManagement(action, adminId, userId, context),
  
  payment: (action: Parameters<AdminAuditLogger['logPaymentManagement']>[0], adminId: string, userId: string, context?: Record<string, any>) =>
    adminAuditLogger.logPaymentManagement(action, adminId, userId, context),
  
  aiModel: (action: Parameters<AdminAuditLogger['logAIModelConfig']>[0], adminId: string, context?: Record<string, any>) =>
    adminAuditLogger.logAIModelConfig(action, adminId, context),
  
  analytics: (action: Parameters<AdminAuditLogger['logSystemAnalytics']>[0], adminId: string, context?: Record<string, any>) =>
    adminAuditLogger.logSystemAnalytics(action, adminId, context),
  
  feature: (action: Parameters<AdminAuditLogger['logFeatureManagement']>[0], adminId: string, context?: Record<string, any>) =>
    adminAuditLogger.logFeatureManagement(action, adminId, context),
  
  security: (action: Parameters<AdminAuditLogger['logSecurity']>[0], adminId: string | null, context?: Record<string, any>) =>
    adminAuditLogger.logSecurity(action, adminId, context),
  
  system: (action: Parameters<AdminAuditLogger['logSystem']>[0], adminId: string | null, context?: Record<string, any>) =>
    adminAuditLogger.logSystem(action, adminId, context)
};