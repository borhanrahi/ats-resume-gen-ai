import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AdminAuthProvider, useAdminAuth } from '../../lib/auth/AdminAuthContext';
import { AdminAuthService } from '../../lib/auth/adminAuth';
import { adminAuditLogger } from '../../lib/auth/adminAuditLog';
import { AdminUser } from '../../types/admin';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';

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

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('Admin Authentication Integration', () => {
  let mockAdminUser: AdminUser;

  beforeEach(() => {
    mockAdminUser = {
      id: 'admin123',
      email: 'admin@test.com',
      role: 'admin',
      permissions: ['user_management', 'system_analytics'],
      lastLogin: new Date()
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('AdminAuthContext Integration', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AdminAuthProvider>{children}</AdminAuthProvider>
    );

    it('should initialize with loading state', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAdminAuth(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should restore session from localStorage', async () => {
      const sessionToken = 'valid_session_token';
      const recentActivity = Date.now().toString();

      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'admin_session') return sessionToken;
        if (key === 'admin_user') return JSON.stringify(mockAdminUser);
        if (key === 'admin_last_activity') return recentActivity;
        return null;
      });

      const adminAuthService = await import('../../lib/auth/adminAuth');
      vi.spyOn(adminAuthService.adminAuthService, 'validateAdminSession')
        .mockResolvedValue(mockAdminUser);

      const { result } = renderHook(() => useAdminAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toEqual(mockAdminUser);
      });
    });

    it('should handle login flow', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAdminAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const adminAuthService = await import('../../lib/auth/adminAuth');
      vi.spyOn(adminAuthService.adminAuthService, 'adminLogin')
        .mockResolvedValue({
          user: mockAdminUser,
          sessionToken: 'new_session_token'
        });

      await act(async () => {
        await result.current.login('admin@test.com', 'password123');
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockAdminUser);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'admin_session',
        'new_session_token'
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'admin_user',
        JSON.stringify(mockAdminUser)
      );
    });

    it('should handle login failure', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAdminAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const adminAuthService = await import('../../lib/auth/adminAuth');
      vi.spyOn(adminAuthService.adminAuthService, 'adminLogin')
        .mockRejectedValue(new Error('Invalid credentials'));

      await act(async () => {
        await expect(
          result.current.login('admin@test.com', 'wrongpassword')
        ).rejects.toThrow('Invalid credentials');
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('should handle logout flow', async () => {
      // Setup authenticated state
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'admin_session') return 'session_token';
        if (key === 'admin_user') return JSON.stringify(mockAdminUser);
        if (key === 'admin_last_activity') return Date.now().toString();
        return null;
      });

      const adminAuthService = await import('../../lib/auth/adminAuth');
      vi.spyOn(adminAuthService.adminAuthService, 'validateAdminSession')
        .mockResolvedValue(mockAdminUser);
      vi.spyOn(adminAuthService.adminAuthService, 'adminLogout')
        .mockResolvedValue();

      const { result } = renderHook(() => useAdminAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('admin_session');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('admin_user');
    });

    it('should check permissions correctly', async () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'admin_session') return 'session_token';
        if (key === 'admin_user') return JSON.stringify(mockAdminUser);
        if (key === 'admin_last_activity') return Date.now().toString();
        return null;
      });

      const adminAuthService = await import('../../lib/auth/adminAuth');
      vi.spyOn(adminAuthService.adminAuthService, 'validateAdminSession')
        .mockResolvedValue(mockAdminUser);

      const { result } = renderHook(() => useAdminAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      expect(result.current.hasPermission('user_management')).toBe(true);
      expect(result.current.hasPermission('ai_model_config')).toBe(false);
    });
  });

  describe('Admin Authentication Service Integration', () => {
    it('should create admin user and log action', async () => {
      const { account, databases } = await import('../../lib/auth/appwrite');
      
      (account.create as any).mockResolvedValue({
        $id: 'new_admin_id',
        email: 'newadmin@test.com'
      });

      (databases.createDocument as any).mockResolvedValue({
        $id: 'doc_id'
      });

      vi.spyOn(adminAuditLogger, 'logAction').mockResolvedValue();

      const adminAuthService = AdminAuthService.getInstance();
      
      const newAdmin = await adminAuthService.createAdminUser(
        'newadmin@test.com',
        'password123',
        'New Admin',
        'admin',
        ['user_management'],
        'creator_admin_id'
      );

      expect(newAdmin.email).toBe('newadmin@test.com');
      expect(newAdmin.role).toBe('admin');
      expect(newAdmin.permissions).toEqual(['user_management']);
      
      expect(databases.createDocument).toHaveBeenCalledWith(
        'test_db',
        'admin_configs',
        expect.any(String),
        expect.objectContaining({
          key: 'admin_user',
          value: expect.objectContaining({
            email: 'newadmin@test.com',
            role: 'admin'
          }),
          updatedBy: 'creator_admin_id'
        })
      );
    });

    it('should update admin user and log changes', async () => {
      const { databases } = await import('../../lib/auth/appwrite');
      
      (databases.listDocuments as any).mockResolvedValue({
        documents: [{
          $id: 'doc_id',
          value: mockAdminUser
        }]
      });

      (databases.updateDocument as any).mockResolvedValue({
        $id: 'doc_id'
      });

      vi.spyOn(adminAuditLogger, 'logAction').mockResolvedValue();

      const adminAuthService = AdminAuthService.getInstance();
      
      const updatedAdmin = await adminAuthService.updateAdminUser(
        'admin123',
        { role: 'super_admin', permissions: ['super_admin'] },
        'updater_admin_id'
      );

      expect(updatedAdmin.role).toBe('super_admin');
      expect(updatedAdmin.permissions).toEqual(['super_admin']);
      
      expect(databases.updateDocument).toHaveBeenCalledWith(
        'test_db',
        'admin_configs',
        'doc_id',
        expect.objectContaining({
          value: expect.objectContaining({
            role: 'super_admin',
            permissions: ['super_admin']
          }),
          updatedBy: 'updater_admin_id'
        })
      );
    });

    it('should delete admin user and log deletion', async () => {
      const { databases } = await import('../../lib/auth/appwrite');
      
      (databases.listDocuments as any)
        .mockResolvedValueOnce({
          documents: [{
            $id: 'doc_id',
            value: mockAdminUser
          }]
        })
        .mockResolvedValueOnce({
          documents: [{
            $id: 'doc_id'
          }]
        });

      (databases.deleteDocument as any).mockResolvedValue({});

      vi.spyOn(adminAuditLogger, 'logAction').mockResolvedValue();

      const adminAuthService = AdminAuthService.getInstance();
      
      await adminAuthService.deleteAdminUser('admin123', 'deleter_admin_id');

      expect(databases.deleteDocument).toHaveBeenCalledWith(
        'test_db',
        'admin_configs',
        'doc_id'
      );
    });

    it('should prevent self-deletion', async () => {
      const { databases } = await import('../../lib/auth/appwrite');
      
      (databases.listDocuments as any).mockResolvedValue({
        documents: [{
          value: mockAdminUser
        }]
      });

      const adminAuthService = AdminAuthService.getInstance();
      
      await expect(
        adminAuthService.deleteAdminUser('admin123', 'admin123')
      ).rejects.toThrow('Cannot delete your own admin account');
    });
  });

  describe('Audit Logging Integration', () => {
    it('should log admin login attempts', async () => {
      const { databases } = await import('../../lib/auth/appwrite');
      
      (databases.createDocument as any).mockResolvedValue({
        $id: 'log_id'
      });

      await adminAuditLogger.logAuth('login', 'admin123', {
        email: 'admin@test.com',
        ip: '192.168.1.1'
      });

      expect(databases.createDocument).toHaveBeenCalledWith(
        'test_db',
        'system_logs',
        expect.any(String),
        expect.objectContaining({
          level: 'info',
          message: expect.stringContaining('Admin user logged in successfully'),
          adminId: 'admin123',
          context: expect.objectContaining({
            category: 'authentication',
            action: 'login',
            email: 'admin@test.com',
            ip: '192.168.1.1'
          })
        })
      );
    });

    it('should log failed login attempts', async () => {
      const { databases } = await import('../../lib/auth/appwrite');
      
      (databases.createDocument as any).mockResolvedValue({
        $id: 'log_id'
      });

      await adminAuditLogger.logAuth('login_failed', null, {
        email: 'admin@test.com',
        error: 'Invalid credentials',
        ip: '192.168.1.1'
      });

      expect(databases.createDocument).toHaveBeenCalledWith(
        'test_db',
        'system_logs',
        expect.any(String),
        expect.objectContaining({
          level: 'warning',
          message: expect.stringContaining('Admin login attempt failed'),
          adminId: undefined,
          context: expect.objectContaining({
            category: 'authentication',
            action: 'login_failed',
            email: 'admin@test.com',
            error: 'Invalid credentials'
          })
        })
      );
    });

    it('should log authorization events', async () => {
      const { databases } = await import('../../lib/auth/appwrite');
      
      (databases.createDocument as any).mockResolvedValue({
        $id: 'log_id'
      });

      await adminAuditLogger.logAuthz('access_denied', 'admin123', {
        requiredPermission: 'ai_model_config',
        userPermissions: ['user_management'],
        path: '/admin/ai-models'
      });

      expect(databases.createDocument).toHaveBeenCalledWith(
        'test_db',
        'system_logs',
        expect.any(String),
        expect.objectContaining({
          level: 'warning',
          message: expect.stringContaining('Admin access denied'),
          adminId: 'admin123',
          context: expect.objectContaining({
            category: 'authorization',
            action: 'access_denied',
            requiredPermission: 'ai_model_config',
            userPermissions: ['user_management'],
            path: '/admin/ai-models'
          })
        })
      );
    });
  });

  describe('Session Management Integration', () => {
    it('should handle session timeout', async () => {
      const expiredTime = Date.now() - (31 * 60 * 1000); // 31 minutes ago
      
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'admin_session') return 'expired_token';
        if (key === 'admin_user') return JSON.stringify(mockAdminUser);
        if (key === 'admin_last_activity') return expiredTime.toString();
        return null;
      });

      const { AdminSessionManager } = await import('../../lib/auth/adminAuth');
      
      const isValid = AdminSessionManager.isSessionValid('expired_token');
      expect(isValid).toBe(false);
    });

    it('should update activity timestamp', async () => {
      const { AdminSessionManager } = await import('../../lib/auth/adminAuth');
      
      AdminSessionManager.updateActivity();
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'admin_last_activity',
        expect.any(String)
      );
    });
  });
});