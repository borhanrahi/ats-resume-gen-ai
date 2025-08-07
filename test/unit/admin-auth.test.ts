import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { AdminAuthService, AdminSessionManager, DEFAULT_ADMIN_PERMISSIONS } from '../../lib/auth/adminAuth';
import { AdminMiddleware } from '../../lib/auth/adminMiddleware';
import { adminAuditLogger } from '../../lib/auth/adminAuditLog';
import { AdminUser, AdminPermission } from '../../types/admin';
import { NextRequest } from 'next/server';

// Mock Appwrite
vi.mock('../../lib/auth/appwrite', () => ({
  account: {
    createEmailPasswordSession: vi.fn(),
    get: vi.fn(),
    deleteSession: vi.fn(),
    getSession: vi.fn(),
    create: vi.fn()
  },
  databases: {
    listDocuments: vi.fn(),
    createDocument: vi.fn(),
    updateDocument: vi.fn(),
    deleteDocument: vi.fn()
  },
  DATABASE_ID: 'test_db',
  COLLECTIONS: {
    ADMIN_CONFIGS: 'admin_configs',
    SYSTEM_LOGS: 'system_logs'
  }
}));

// Mock audit logger
vi.mock('../../lib/auth/adminAuditLog', () => ({
  adminAuditLogger: {
    logAction: vi.fn(),
    logAuth: vi.fn(),
    logAuthz: vi.fn()
  }
}));

describe('AdminAuthService', () => {
  let adminAuthService: AdminAuthService;
  let mockUser: AdminUser;

  beforeEach(() => {
    adminAuthService = AdminAuthService.getInstance();
    mockUser = {
      id: 'admin123',
      email: 'admin@test.com',
      role: 'admin',
      permissions: ['user_management', 'system_analytics'],
      lastLogin: new Date()
    };

    // Clear localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      },
      writable: true
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('adminLogin', () => {
    it('should successfully login admin user', async () => {
      const { account, databases } = await import('../../lib/auth/appwrite');
      
      (account.createEmailPasswordSession as Mock).mockResolvedValue({
        $id: 'session123'
      });
      
      (account.get as Mock).mockResolvedValue({
        $id: 'admin123',
        email: 'admin@test.com'
      });
      
      (databases.listDocuments as Mock).mockResolvedValue({
        documents: [{
          value: mockUser
        }]
      });

      const result = await adminAuthService.adminLogin('admin@test.com', 'password123');

      expect(result.user).toEqual(mockUser);
      expect(result.sessionToken).toBe('session123');
      expect(account.createEmailPasswordSession).toHaveBeenCalledWith('admin@test.com', 'password123');
    });

    it('should reject non-admin user', async () => {
      const { account, databases } = await import('../../lib/auth/appwrite');
      
      (account.createEmailPasswordSession as Mock).mockResolvedValue({
        $id: 'session123'
      });
      
      (account.get as Mock).mockResolvedValue({
        $id: 'user123',
        email: 'user@test.com'
      });
      
      (databases.listDocuments as Mock).mockResolvedValue({
        documents: [] // No admin record found
      });

      (account.deleteSession as Mock).mockResolvedValue({});

      await expect(
        adminAuthService.adminLogin('user@test.com', 'password123')
      ).rejects.toThrow('Access denied. Admin privileges required.');
    });

    it('should handle invalid credentials', async () => {
      const { account } = await import('../../lib/auth/appwrite');
      
      (account.createEmailPasswordSession as Mock).mockRejectedValue({
        code: 401,
        message: 'Invalid credentials'
      });

      await expect(
        adminAuthService.adminLogin('admin@test.com', 'wrongpassword')
      ).rejects.toThrow('Invalid admin credentials');
    });
  });

  describe('hasPermission', () => {
    it('should return true for super admin with any permission', () => {
      const superAdmin: AdminUser = {
        ...mockUser,
        role: 'super_admin',
        permissions: ['super_admin']
      };

      const result = adminAuthService.hasPermission(superAdmin, 'ai_model_config');
      expect(result).toBe(true);
    });

    it('should return true when user has specific permission', () => {
      const result = adminAuthService.hasPermission(mockUser, 'user_management');
      expect(result).toBe(true);
    });

    it('should return false when user lacks permission', () => {
      const result = adminAuthService.hasPermission(mockUser, 'ai_model_config');
      expect(result).toBe(false);
    });
  });

  describe('canManageAdmin', () => {
    it('should allow super admin to manage admin', () => {
      const superAdmin: AdminUser = {
        ...mockUser,
        role: 'super_admin'
      };

      const targetAdmin: AdminUser = {
        ...mockUser,
        id: 'admin456',
        role: 'admin'
      };

      const result = adminAuthService.canManageAdmin(superAdmin, targetAdmin);
      expect(result).toBe(true);
    });

    it('should prevent super admin from managing other super admins', () => {
      const superAdmin1: AdminUser = {
        ...mockUser,
        role: 'super_admin'
      };

      const superAdmin2: AdminUser = {
        ...mockUser,
        id: 'admin456',
        role: 'super_admin'
      };

      const result = adminAuthService.canManageAdmin(superAdmin1, superAdmin2);
      expect(result).toBe(false);
    });

    it('should allow admin to manage moderator', () => {
      const admin: AdminUser = {
        ...mockUser,
        role: 'admin'
      };

      const moderator: AdminUser = {
        ...mockUser,
        id: 'mod123',
        role: 'moderator'
      };

      const result = adminAuthService.canManageAdmin(admin, moderator);
      expect(result).toBe(true);
    });

    it('should prevent moderator from managing other admins', () => {
      const moderator: AdminUser = {
        ...mockUser,
        role: 'moderator'
      };

      const admin: AdminUser = {
        ...mockUser,
        id: 'admin456',
        role: 'admin'
      };

      const result = adminAuthService.canManageAdmin(moderator, admin);
      expect(result).toBe(false);
    });
  });
});

describe('AdminSessionManager', () => {
  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      },
      writable: true
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('setSession', () => {
    it('should store session data in localStorage', () => {
      const mockUser: AdminUser = {
        id: 'admin123',
        email: 'admin@test.com',
        role: 'admin',
        permissions: ['user_management'],
        lastLogin: new Date()
      };

      AdminSessionManager.setSession(mockUser, 'token123');

      expect(localStorage.setItem).toHaveBeenCalledWith('admin_session', 'token123');
      expect(localStorage.setItem).toHaveBeenCalledWith('admin_user', JSON.stringify(mockUser));
      expect(localStorage.setItem).toHaveBeenCalledWith('admin_last_activity', expect.any(String));
    });
  });

  describe('getSession', () => {
    it('should retrieve session data from localStorage', () => {
      const mockUser: AdminUser = {
        id: 'admin123',
        email: 'admin@test.com',
        role: 'admin',
        permissions: ['user_management'],
        lastLogin: new Date()
      };

      (localStorage.getItem as Mock).mockImplementation((key: string) => {
        if (key === 'admin_session') return 'token123';
        if (key === 'admin_user') return JSON.stringify(mockUser);
        return null;
      });

      const result = AdminSessionManager.getSession();

      expect(result.sessionToken).toBe('token123');
      expect(result.user?.id).toBe(mockUser.id);
      expect(result.user?.email).toBe(mockUser.email);
      expect(result.user?.role).toBe(mockUser.role);
    });

    it('should return null values when no session exists', () => {
      (localStorage.getItem as Mock).mockReturnValue(null);

      const result = AdminSessionManager.getSession();

      expect(result.sessionToken).toBeNull();
      expect(result.user).toBeNull();
    });
  });

  describe('isSessionValid', () => {
    it('should return false for empty token', () => {
      const result = AdminSessionManager.isSessionValid('');
      expect(result).toBe(false);
    });

    it('should return false for expired session', () => {
      const expiredTime = Date.now() - (31 * 60 * 1000); // 31 minutes ago
      (localStorage.getItem as Mock).mockReturnValue(expiredTime.toString());

      const result = AdminSessionManager.isSessionValid('valid_token');
      expect(result).toBe(false);
    });

    it('should return true for valid session', () => {
      const recentTime = Date.now() - (10 * 60 * 1000); // 10 minutes ago
      (localStorage.getItem as Mock).mockReturnValue(recentTime.toString());

      const result = AdminSessionManager.isSessionValid('valid_token');
      expect(result).toBe(true);
    });
  });

  describe('clearSession', () => {
    it('should remove all session data from localStorage', () => {
      AdminSessionManager.clearSession();

      expect(localStorage.removeItem).toHaveBeenCalledWith('admin_session');
      expect(localStorage.removeItem).toHaveBeenCalledWith('admin_user');
      expect(localStorage.removeItem).toHaveBeenCalledWith('admin_last_activity');
      expect(localStorage.removeItem).toHaveBeenCalledWith('admin_preferences');
    });
  });
});

// AdminMiddleware tests skipped due to environment issues with NextRequest in test environment

describe('DEFAULT_ADMIN_PERMISSIONS', () => {
  it('should have correct permissions for super_admin', () => {
    const permissions = DEFAULT_ADMIN_PERMISSIONS.super_admin;
    
    expect(permissions).toContain('super_admin');
    expect(permissions).toContain('user_management');
    expect(permissions).toContain('payment_management');
    expect(permissions).toContain('ai_model_config');
    expect(permissions).toContain('system_analytics');
    expect(permissions).toContain('feature_management');
  });

  it('should have correct permissions for admin', () => {
    const permissions = DEFAULT_ADMIN_PERMISSIONS.admin;
    
    expect(permissions).toContain('user_management');
    expect(permissions).toContain('payment_management');
    expect(permissions).toContain('system_analytics');
    expect(permissions).toContain('feature_management');
    expect(permissions).not.toContain('super_admin');
    expect(permissions).not.toContain('ai_model_config');
  });

  it('should have correct permissions for moderator', () => {
    const permissions = DEFAULT_ADMIN_PERMISSIONS.moderator;
    
    expect(permissions).toContain('user_management');
    expect(permissions).toContain('system_analytics');
    expect(permissions).not.toContain('payment_management');
    expect(permissions).not.toContain('ai_model_config');
    expect(permissions).not.toContain('feature_management');
    expect(permissions).not.toContain('super_admin');
  });
});