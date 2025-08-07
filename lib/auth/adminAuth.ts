import { databases, account, DATABASE_ID, COLLECTIONS } from './appwrite';
import { AdminUser, AdminPermission, SystemLog } from '../../types/admin';
import { ID, Query } from 'appwrite';

// Admin authentication service
export class AdminAuthService {
  private static instance: AdminAuthService;
  
  static getInstance(): AdminAuthService {
    if (!AdminAuthService.instance) {
      AdminAuthService.instance = new AdminAuthService();
    }
    return AdminAuthService.instance;
  }

  // Admin login with email and password
  async adminLogin(email: string, password: string): Promise<{
    user: AdminUser;
    sessionToken: string;
  }> {
    try {
      // First authenticate with Appwrite
      const session = await account.createEmailPasswordSession(email, password);
      const appwriteUser = await account.get();
      
      // Check if user has admin privileges
      const adminUser = await this.getAdminUser(appwriteUser.$id);
      if (!adminUser) {
        // Clean up the session if not an admin
        try {
          await account.deleteSession('current');
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        throw new Error('Access denied. Admin privileges required.');
      }

      // Update last login
      await this.updateLastLogin(adminUser.id);
      
      // Log admin login
      await this.logAdminAction(adminUser.id, 'admin_login', {
        email: adminUser.email,
        role: adminUser.role,
        timestamp: new Date().toISOString()
      });

      return {
        user: adminUser,
        sessionToken: session.$id
      };
    } catch (error: any) {
      // Log failed login attempt
      await this.logAdminAction(null, 'admin_login_failed', {
        email,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      // Re-throw the original error if it's already our custom error
      if (error.message === 'Access denied. Admin privileges required.') {
        throw error;
      }
      
      throw this.handleAuthError(error);
    }
  }

  // Get admin user by ID
  async getAdminUser(userId: string): Promise<AdminUser | null> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ADMIN_CONFIGS,
        [
          Query.equal('key', 'admin_user'),
          Query.equal('value.id', userId)
        ]
      );

      if (response.documents.length === 0) {
        return null;
      }

      const adminDoc = response.documents[0];
      return adminDoc.value as AdminUser;
    } catch (error) {
      console.error('Failed to get admin user:', error);
      return null;
    }
  }

  // Create admin user
  async createAdminUser(
    email: string,
    password: string,
    name: string,
    role: 'super_admin' | 'admin' | 'moderator',
    permissions: AdminPermission[],
    createdBy: string
  ): Promise<AdminUser> {
    try {
      // Create Appwrite account
      const appwriteUser = await account.create(ID.unique(), email, password, name);
      
      // Create admin user record
      const adminUser: AdminUser = {
        id: appwriteUser.$id,
        email: appwriteUser.email,
        role,
        permissions,
        lastLogin: new Date()
      };

      // Store admin user in database
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.ADMIN_CONFIGS,
        ID.unique(),
        {
          key: 'admin_user',
          value: adminUser,
          category: 'system',
          updatedBy: createdBy,
          updatedAt: new Date().toISOString()
        }
      );

      // Log admin creation
      await this.logAdminAction(createdBy, 'admin_user_created', {
        newAdminId: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        permissions: adminUser.permissions
      });

      return adminUser;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Update admin user
  async updateAdminUser(
    adminId: string,
    updates: Partial<Pick<AdminUser, 'role' | 'permissions'>>,
    updatedBy: string
  ): Promise<AdminUser> {
    try {
      const currentAdmin = await this.getAdminUser(adminId);
      if (!currentAdmin) {
        throw new Error('Admin user not found');
      }

      const updatedAdmin: AdminUser = {
        ...currentAdmin,
        ...updates
      };

      // Find and update the admin document
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ADMIN_CONFIGS,
        [
          Query.equal('key', 'admin_user'),
          Query.equal('value.id', adminId)
        ]
      );

      if (response.documents.length === 0) {
        throw new Error('Admin user document not found');
      }

      const docId = response.documents[0].$id;
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.ADMIN_CONFIGS,
        docId,
        {
          value: updatedAdmin,
          updatedBy,
          updatedAt: new Date().toISOString()
        }
      );

      // Log admin update
      await this.logAdminAction(updatedBy, 'admin_user_updated', {
        adminId,
        updates,
        previousRole: currentAdmin.role,
        newRole: updatedAdmin.role
      });

      return updatedAdmin;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Delete admin user
  async deleteAdminUser(adminId: string, deletedBy: string): Promise<void> {
    try {
      const adminUser = await this.getAdminUser(adminId);
      if (!adminUser) {
        throw new Error('Admin user not found');
      }

      // Prevent self-deletion
      if (adminId === deletedBy) {
        throw new Error('Cannot delete your own admin account');
      }

      // Find and delete the admin document
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ADMIN_CONFIGS,
        [
          Query.equal('key', 'admin_user'),
          Query.equal('value.id', adminId)
        ]
      );

      if (response.documents.length > 0) {
        await databases.deleteDocument(
          DATABASE_ID,
          COLLECTIONS.ADMIN_CONFIGS,
          response.documents[0].$id
        );
      }

      // Log admin deletion
      await this.logAdminAction(deletedBy, 'admin_user_deleted', {
        deletedAdminId: adminId,
        email: adminUser.email,
        role: adminUser.role
      });
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // List all admin users
  async listAdminUsers(): Promise<AdminUser[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ADMIN_CONFIGS,
        [Query.equal('key', 'admin_user')]
      );

      return response.documents.map(doc => doc.value as AdminUser);
    } catch (error) {
      console.error('Failed to list admin users:', error);
      return [];
    }
  }

  // Check admin permissions
  hasPermission(admin: AdminUser, permission: AdminPermission): boolean {
    // Super admin has all permissions
    if (admin.role === 'super_admin') {
      return true;
    }

    // Check if admin has the specific permission
    return admin.permissions.includes(permission);
  }

  // Check if admin can perform action on another admin
  canManageAdmin(currentAdmin: AdminUser, targetAdmin: AdminUser): boolean {
    // Super admin can manage anyone except other super admins
    if (currentAdmin.role === 'super_admin') {
      return targetAdmin.role !== 'super_admin' || currentAdmin.id === targetAdmin.id;
    }

    // Admin can manage moderators only
    if (currentAdmin.role === 'admin') {
      return targetAdmin.role === 'moderator';
    }

    // Moderators cannot manage other admins
    return false;
  }

  // Validate admin session
  async validateAdminSession(): Promise<AdminUser | null> {
    try {
      const session = await account.getSession('current');
      if (!session) {
        return null;
      }

      // Check if session is expired
      if (new Date(session.expire) < new Date()) {
        await account.deleteSession('current');
        return null;
      }

      const appwriteUser = await account.get();
      const adminUser = await this.getAdminUser(appwriteUser.$id);
      
      return adminUser;
    } catch (error) {
      return null;
    }
  }

  // Admin logout
  async adminLogout(adminId: string): Promise<void> {
    try {
      await account.deleteSession('current');
      
      // Log admin logout
      await this.logAdminAction(adminId, 'admin_logout', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Admin logout failed:', error);
      throw this.handleAuthError(error);
    }
  }

  // Update last login timestamp
  private async updateLastLogin(adminId: string): Promise<void> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ADMIN_CONFIGS,
        [
          Query.equal('key', 'admin_user'),
          Query.equal('value.id', adminId)
        ]
      );

      if (response.documents.length > 0) {
        const doc = response.documents[0];
        const adminUser = doc.value as AdminUser;
        
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.ADMIN_CONFIGS,
          doc.$id,
          {
            value: {
              ...adminUser,
              lastLogin: new Date()
            },
            updatedAt: new Date().toISOString()
          }
        );
      }
    } catch (error) {
      console.error('Failed to update last login:', error);
    }
  }

  // Log admin actions for audit trail
  async logAdminAction(
    adminId: string | null,
    action: string,
    context: Record<string, any>
  ): Promise<void> {
    try {
      const logEntry: Omit<SystemLog, '$id'> = {
        level: 'info',
        message: `Admin action: ${action}`,
        context: {
          action,
          ...context
        },
        adminId,
        createdAt: new Date()
      };

      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.SYSTEM_LOGS,
        ID.unique(),
        logEntry
      );
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  }

  // Get admin audit logs
  async getAdminLogs(
    adminId?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<SystemLog[]> {
    try {
      const queries = [
        Query.orderDesc('createdAt'),
        Query.limit(limit),
        Query.offset(offset)
      ];

      if (adminId) {
        queries.push(Query.equal('adminId', adminId));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SYSTEM_LOGS,
        queries
      );

      return response.documents as SystemLog[];
    } catch (error) {
      console.error('Failed to get admin logs:', error);
      return [];
    }
  }

  // Handle authentication errors
  private handleAuthError(error: any): Error {
    if (error?.code) {
      switch (error.code) {
        case 401:
          return new Error('Invalid admin credentials');
        case 403:
          return new Error('Access denied. Admin privileges required.');
        case 429:
          return new Error('Too many login attempts. Please try again later.');
        default:
          return new Error(error.message || 'Admin authentication failed');
      }
    }
    return new Error('Admin authentication failed');
  }
}

// Export singleton instance
export const adminAuthService = AdminAuthService.getInstance();

// Admin session management
export class AdminSessionManager {
  private static readonly SESSION_KEY = 'admin_session';
  private static readonly USER_KEY = 'admin_user';
  
  static setSession(user: AdminUser, sessionToken: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AdminSessionManager.SESSION_KEY, sessionToken);
      localStorage.setItem(AdminSessionManager.USER_KEY, JSON.stringify(user));
      
      // Update last activity
      localStorage.setItem('admin_last_activity', Date.now().toString());
    }
  }
  
  static getSession(): { user: AdminUser | null; sessionToken: string | null } {
    if (typeof window !== 'undefined') {
      const sessionToken = localStorage.getItem(AdminSessionManager.SESSION_KEY);
      const userStr = localStorage.getItem(AdminSessionManager.USER_KEY);
      
      const user = userStr ? JSON.parse(userStr) : null;
      
      return { user, sessionToken };
    }
    return { user: null, sessionToken: null };
  }
  
  static clearSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AdminSessionManager.SESSION_KEY);
      localStorage.removeItem(AdminSessionManager.USER_KEY);
      localStorage.removeItem('admin_last_activity');
      localStorage.removeItem('admin_preferences');
    }
  }
  
  static isSessionValid(sessionToken: string): boolean {
    if (!sessionToken || sessionToken.length === 0) return false;
    
    // Check session timeout (30 minutes)
    if (typeof window !== 'undefined') {
      const lastActivity = localStorage.getItem('admin_last_activity');
      if (lastActivity) {
        const lastActivityTime = parseInt(lastActivity, 10);
        const now = Date.now();
        const sessionTimeout = 30 * 60 * 1000; // 30 minutes
        
        if ((now - lastActivityTime) > sessionTimeout) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  static updateActivity(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_last_activity', Date.now().toString());
    }
  }
}

// Admin role hierarchy
export const ADMIN_ROLE_HIERARCHY = {
  super_admin: 3,
  admin: 2,
  moderator: 1
} as const;

// Default permissions for each role
export const DEFAULT_ADMIN_PERMISSIONS: Record<AdminUser['role'], AdminPermission[]> = {
  super_admin: [
    'user_management',
    'payment_management',
    'ai_model_config',
    'system_analytics',
    'feature_management',
    'super_admin'
  ],
  admin: [
    'user_management',
    'payment_management',
    'system_analytics',
    'feature_management'
  ],
  moderator: [
    'user_management',
    'system_analytics'
  ]
};

// Permission descriptions
export const PERMISSION_DESCRIPTIONS: Record<AdminPermission, string> = {
  user_management: 'Manage user accounts, subscriptions, and access',
  payment_management: 'View and manage payment records and subscriptions',
  ai_model_config: 'Configure AI models and fallback systems',
  system_analytics: 'View system metrics and analytics',
  feature_management: 'Manage feature requests and roadmap',
  super_admin: 'Full system access and admin management'
};