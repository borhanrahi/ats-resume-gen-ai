import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the admin middleware
vi.mock('lib/auth/adminMiddleware', () => ({
  withUserManagementAuth: (handler: any) => handler,
  withSystemAnalyticsAuth: (handler: any) => handler,
  withAIModelConfigAuth: (handler: any) => handler,
  withFeatureManagementAuth: (handler: any) => handler,
}));

// Mock Appwrite
vi.mock('lib/auth/appwrite', () => ({
  databases: {
    listDocuments: vi.fn(),
    getDocument: vi.fn(),
    createDocument: vi.fn(),
    updateDocument: vi.fn(),
    deleteDocument: vi.fn(),
  },
  DATABASE_ID: 'test-db',
  COLLECTIONS: {
    USERS: 'users',
    ADMIN_CONFIGS: 'admin_configs',
    SYSTEM_LOGS: 'system_logs',
  },
}));

// Mock AI Model Manager
vi.mock('lib/ai/aiModelManager', () => ({
  getAIModelManager: vi.fn(() => ({
    getAllModels: vi.fn(() => []),
    getStats: vi.fn(() => ({})),
    getHealthStatus: vi.fn(() => ({})),
    getPerformanceMetrics: vi.fn(() => ({})),
    addModel: vi.fn(),
    updateModel: vi.fn(),
    removeModel: vi.fn(),
    getModel: vi.fn(),
  })),
  initializeAIModelManager: vi.fn(),
}));

describe('Admin API Endpoints', () => {
  const mockAdminUser = {
    id: 'admin_123',
    email: 'admin@example.com',
    role: 'admin',
    permissions: ['user_management', 'system_analytics', 'ai_model_config', 'feature_management'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('User Management APIs', () => {
    describe('GET /api/admin/users', () => {
      it('should return paginated users list', async () => {
        const { GET } = await import('../app/api/admin/users/route');
        
        const request = new NextRequest('http://localhost/api/admin/users?page=1&limit=10');
        const response = await GET(request, { user: mockAdminUser });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.users).toBeDefined();
        expect(data.pagination).toBeDefined();
        expect(data.pagination.currentPage).toBe(1);
        expect(data.pagination.usersPerPage).toBe(10);
      });

      it('should filter users by plan', async () => {
        const { GET } = await import('../app/api/admin/users/route');
        
        const request = new NextRequest('http://localhost/api/admin/users?plan=premium');
        const response = await GET(request, { user: mockAdminUser });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.filters.plan).toBe('premium');
      });

      it('should include analytics when requested', async () => {
        const { GET } = await import('../app/api/admin/users/route');
        
        const request = new NextRequest('http://localhost/api/admin/users?analytics=true');
        const response = await GET(request, { user: mockAdminUser });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.analytics).toBeDefined();
      });
    });

    describe('POST /api/admin/users', () => {
      it('should create a new user', async () => {
        const { POST } = await import('../app/api/admin/users/route');
        
        const userData = {
          email: 'newuser@example.com',
          name: 'New User',
          plan: 'free'
        };

        const request = new NextRequest('http://localhost/api/admin/users', {
          method: 'POST',
          body: JSON.stringify(userData),
          headers: { 'Content-Type': 'application/json' }
        });

        const response = await POST(request, { user: mockAdminUser });
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.user).toBeDefined();
        expect(data.user.email).toBe(userData.email);
        expect(data.user.name).toBe(userData.name);
      });

      it('should validate required fields', async () => {
        const { POST } = await import('../app/api/admin/users/route');
        
        const request = new NextRequest('http://localhost/api/admin/users', {
          method: 'POST',
          body: JSON.stringify({}),
          headers: { 'Content-Type': 'application/json' }
        });

        const response = await POST(request, { user: mockAdminUser });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Missing required fields');
      });

      it('should validate email format', async () => {
        const { POST } = await import('../app/api/admin/users/route');
        
        const userData = {
          email: 'invalid-email',
          name: 'Test User'
        };

        const request = new NextRequest('http://localhost/api/admin/users', {
          method: 'POST',
          body: JSON.stringify(userData),
          headers: { 'Content-Type': 'application/json' }
        });

        const response = await POST(request, { user: mockAdminUser });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Invalid email format');
      });
    });

    describe('GET /api/admin/users/analytics', () => {
      it('should return comprehensive user analytics', async () => {
        const { GET } = await import('../app/api/admin/users/analytics/route');
        
        const request = new NextRequest('http://localhost/api/admin/users/analytics');
        const response = await GET(request, { user: mockAdminUser });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.analytics).toBeDefined();
        expect(data.analytics.growth).toBeDefined();
        expect(data.analytics.subscriptions).toBeDefined();
        expect(data.analytics.usage).toBeDefined();
        expect(data.analytics.demographics).toBeDefined();
      });

      it('should allow selective analytics inclusion', async () => {
        const { GET } = await import('../app/api/admin/users/analytics/route');
        
        const request = new NextRequest('http://localhost/api/admin/users/analytics?growth=true&subscriptions=false');
        const response = await GET(request, { user: mockAdminUser });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.analytics.growth).toBeDefined();
        expect(data.analytics.subscriptions).toBeUndefined();
      });
    });

    describe('POST /api/admin/users/export', () => {
      it('should export users in CSV format', async () => {
        const { POST } = await import('../app/api/admin/users/export/route');
        
        const exportOptions = {
          format: 'csv',
          fields: ['id', 'email', 'name', 'plan']
        };

        const request = new NextRequest('http://localhost/api/admin/users/export', {
          method: 'POST',
          body: JSON.stringify(exportOptions),
          headers: { 'Content-Type': 'application/json' }
        });

        const response = await POST(request, { user: mockAdminUser });

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('text/csv');
        expect(response.headers.get('Content-Disposition')).toContain('attachment');
      });

      it('should export users in JSON format', async () => {
        const { POST } = await import('../app/api/admin/users/export/route');
        
        const exportOptions = {
          format: 'json',
          includeAnalytics: true
        };

        const request = new NextRequest('http://localhost/api/admin/users/export', {
          method: 'POST',
          body: JSON.stringify(exportOptions),
          headers: { 'Content-Type': 'application/json' }
        });

        const response = await POST(request, { user: mockAdminUser });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.format).toBe('json');
        expect(data.data).toBeDefined();
      });

      it('should validate export format', async () => {
        const { POST } = await import('../app/api/admin/users/export/route');
        
        const exportOptions = {
          format: 'invalid'
        };

        const request = new NextRequest('http://localhost/api/admin/users/export', {
          method: 'POST',
          body: JSON.stringify(exportOptions),
          headers: { 'Content-Type': 'application/json' }
        });

        const response = await POST(request, { user: mockAdminUser });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Invalid export format');
      });
    });

    describe('POST /api/admin/users/bulk-actions', () => {
      it('should perform bulk user suspension', async () => {
        const { POST } = await import('../app/api/admin/users/bulk-actions/route');
        
        const bulkAction = {
          userIds: ['user_001', 'user_002', 'user_003'],
          action: 'suspend',
          options: {
            reason: 'Policy violation'
          }
        };

        const request = new NextRequest('http://localhost/api/admin/users/bulk-actions', {
          method: 'POST',
          body: JSON.stringify(bulkAction),
          headers: { 'Content-Type': 'application/json' }
        });

        const response = await POST(request, { user: mockAdminUser });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.action).toBe('suspend');
        expect(data.totalRequested).toBe(3);
        expect(data.results).toHaveLength(3);
      });

      it('should validate bulk action parameters', async () => {
        const { POST } = await import('../app/api/admin/users/bulk-actions/route');
        
        const request = new NextRequest('http://localhost/api/admin/users/bulk-actions', {
          method: 'POST',
          body: JSON.stringify({}),
          headers: { 'Content-Type': 'application/json' }
        });

        const response = await POST(request, { user: mockAdminUser });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Missing or invalid userIds array');
      });

      it('should enforce user limit for bulk operations', async () => {
        const { POST } = await import('../app/api/admin/users/bulk-actions/route');
        
        const bulkAction = {
          userIds: Array.from({ length: 101 }, (_, i) => `user_${i}`),
          action: 'suspend'
        };

        const request = new NextRequest('http://localhost/api/admin/users/bulk-actions', {
          method: 'POST',
          body: JSON.stringify(bulkAction),
          headers: { 'Content-Type': 'application/json' }
        });

        const response = await POST(request, { user: mockAdminUser });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Too many users');
      });
    });
  });

  describe('AI Configuration APIs', () => {
    describe('GET /api/admin/ai-config', () => {
      it('should return AI model configurations', async () => {
        const { GET } = await import('../app/api/admin/ai-config/route');
        
        const request = new NextRequest('http://localhost/api/admin/ai-config');
        const response = await GET(request, { user: mockAdminUser });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.models).toBeDefined();
        expect(Array.isArray(data.models)).toBe(true);
      });

      it('should include optional metrics when requested', async () => {
        const { GET } = await import('../app/api/admin/ai-config/route');
        
        const request = new NextRequest('http://localhost/api/admin/ai-config?stats=true&health=true&metrics=true');
        const response = await GET(request, { user: mockAdminUser });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.stats).toBeDefined();
        expect(data.healthStatus).toBeDefined();
        expect(data.performanceMetrics).toBeDefined();
      });
    });

    describe('POST /api/admin/ai-config', () => {
      it('should create a new AI model', async () => {
        const { POST } = await import('../app/api/admin/ai-config/route');
        
        const modelData = {
          model: {
            name: 'Test Model',
            provider: 'openrouter',
            apiKey: 'test-key',
            tier: 'free',
            priority: 1
          }
        };

        const request = new NextRequest('http://localhost/api/admin/ai-config', {
          method: 'POST',
          body: JSON.stringify(modelData),
          headers: { 'Content-Type': 'application/json' }
        });

        const response = await POST(request, { user: mockAdminUser });
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.model).toBeDefined();
        expect(data.model.name).toBe(modelData.model.name);
      });

      it('should validate required model fields', async () => {
        const { POST } = await import('../app/api/admin/ai-config/route');
        
        const request = new NextRequest('http://localhost/api/admin/ai-config', {
          method: 'POST',
          body: JSON.stringify({ model: {} }),
          headers: { 'Content-Type': 'application/json' }
        });

        const response = await POST(request, { user: mockAdminUser });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Missing required fields');
      });

      it('should validate provider', async () => {
        const { POST } = await import('../app/api/admin/ai-config/route');
        
        const modelData = {
          model: {
            name: 'Test Model',
            provider: 'invalid-provider'
          }
        };

        const request = new NextRequest('http://localhost/api/admin/ai-config', {
          method: 'POST',
          body: JSON.stringify(modelData),
          headers: { 'Content-Type': 'application/json' }
        });

        const response = await POST(request, { user: mockAdminUser });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Invalid provider');
      });
    });

    describe('PUT /api/admin/ai-config', () => {
      it('should update AI model configuration', async () => {
        const { PUT } = await import('../app/api/admin/ai-config/route');
        
        const updateData = {
          modelId: 'openrouter-free',
          updates: {
            priority: 2,
            isActive: false
          }
        };

        const request = new NextRequest('http://localhost/api/admin/ai-config', {
          method: 'PUT',
          body: JSON.stringify(updateData),
          headers: { 'Content-Type': 'application/json' }
        });

        const response = await PUT(request, { user: mockAdminUser });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.model).toBeDefined();
        expect(data.updatedFields).toContain('priority');
        expect(data.updatedFields).toContain('isActive');
      });

      it('should validate update parameters', async () => {
        const { PUT } = await import('../app/api/admin/ai-config/route');
        
        const request = new NextRequest('http://localhost/api/admin/ai-config', {
          method: 'PUT',
          body: JSON.stringify({}),
          headers: { 'Content-Type': 'application/json' }
        });

        const response = await PUT(request, { user: mockAdminUser });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Missing required fields');
      });
    });

    describe('DELETE /api/admin/ai-config', () => {
      it('should delete AI model', async () => {
        const { DELETE } = await import('../app/api/admin/ai-config/route');
        
        const request = new NextRequest('http://localhost/api/admin/ai-config?modelId=test-model');
        const response = await DELETE(request, { user: mockAdminUser });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toContain('deleted successfully');
      });

      it('should require model ID', async () => {
        const { DELETE } = await import('../app/api/admin/ai-config/route');
        
        const request = new NextRequest('http://localhost/api/admin/ai-config');
        const response = await DELETE(request, { user: mockAdminUser });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Missing model ID');
      });
    });
  });

  describe('System Analytics APIs', () => {
    describe('GET /api/admin/analytics', () => {
      it('should return comprehensive system analytics', async () => {
        const { GET } = await import('../app/api/admin/analytics/route');
        
        const request = new NextRequest('http://localhost/api/admin/analytics');
        const response = await GET(request, { user: mockAdminUser });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.analytics).toBeDefined();
        expect(data.analytics.overview).toBeDefined();
        expect(data.analytics.api).toBeDefined();
        expect(data.analytics.aiModels).toBeDefined();
        expect(data.analytics.revenue).toBeDefined();
        expect(data.analytics.performance).toBeDefined();
      });

      it('should allow selective analytics inclusion', async () => {
        const { GET } = await import('../app/api/admin/analytics/route');
        
        const request = new NextRequest('http://localhost/api/admin/analytics?overview=true&api=false&ai=false&revenue=false&performance=false');
        const response = await GET(request, { user: mockAdminUser });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.analytics.overview).toBeDefined();
        expect(data.analytics.api).toBeUndefined();
        expect(data.analytics.aiModels).toBeUndefined();
        expect(data.analytics.revenue).toBeUndefined();
        expect(data.analytics.performance).toBeUndefined();
      });
    });

    describe('POST /api/admin/analytics', () => {
      it('should trigger analytics recalculation', async () => {
        const { POST } = await import('../app/api/admin/analytics/route');
        
        const recalcRequest = {
          metrics: ['overview', 'api'],
          force: true
        };

        const request = new NextRequest('http://localhost/api/admin/analytics', {
          method: 'POST',
          body: JSON.stringify(recalcRequest),
          headers: { 'Content-Type': 'application/json' }
        });

        const response = await POST(request, { user: mockAdminUser });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.recalculatedMetrics).toContain('overview');
        expect(data.recalculatedMetrics).toContain('api');
        expect(data.results).toBeDefined();
      });

      it('should validate metrics parameter', async () => {
        const { POST } = await import('../app/api/admin/analytics/route');
        
        const recalcRequest = {
          metrics: ['invalid-metric']
        };

        const request = new NextRequest('http://localhost/api/admin/analytics', {
          method: 'POST',
          body: JSON.stringify(recalcRequest),
          headers: { 'Content-Type': 'application/json' }
        });

        const response = await POST(request, { user: mockAdminUser });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Invalid metrics specified');
      });
    });
  });

  describe('Feature Management APIs', () => {
    describe('GET /api/admin/features', () => {
      it('should return paginated features list', async () => {
        const { GET } = await import('../app/api/admin/features/route');
        
        const request = new NextRequest('http://localhost/api/admin/features?page=1&limit=10');
        const response = await GET(request, { user: mockAdminUser });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.features).toBeDefined();
        expect(Array.isArray(data.features)).toBe(true);
        expect(data.pagination).toBeDefined();
        expect(data.stats).toBeDefined();
      });

      it('should filter features by status', async () => {
        const { GET } = await import('../app/api/admin/features/route');
        
        const request = new NextRequest('http://localhost/api/admin/features?status=planned');
        const response = await GET(request, { user: mockAdminUser });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.filters.status).toBe('planned');
      });
    });

    describe('POST /api/admin/features', () => {
      it('should create a new feature request', async () => {
        const { POST } = await import('../app/api/admin/features/route');
        
        const featureData = {
          title: 'New Feature',
          description: 'A new feature for testing',
          priority: 'medium',
          complexity: 'simple',
          businessValue: 75,
          estimatedHours: 20,
          requestedBy: 'Test User'
        };

        const request = new NextRequest('http://localhost/api/admin/features', {
          method: 'POST',
          body: JSON.stringify(featureData),
          headers: { 'Content-Type': 'application/json' }
        });

        const response = await POST(request, { user: mockAdminUser });
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.feature).toBeDefined();
        expect(data.feature.title).toBe(featureData.title);
      });

      it('should validate required fields', async () => {
        const { POST } = await import('../app/api/admin/features/route');
        
        const request = new NextRequest('http://localhost/api/admin/features', {
          method: 'POST',
          body: JSON.stringify({}),
          headers: { 'Content-Type': 'application/json' }
        });

        const response = await POST(request, { user: mockAdminUser });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Missing required fields');
      });

      it('should validate business value range', async () => {
        const { POST } = await import('../app/api/admin/features/route');
        
        const featureData = {
          title: 'Test Feature',
          description: 'Test description',
          priority: 'medium',
          complexity: 'simple',
          businessValue: 150, // Invalid: > 100
          estimatedHours: 20,
          requestedBy: 'Test User'
        };

        const request = new NextRequest('http://localhost/api/admin/features', {
          method: 'POST',
          body: JSON.stringify(featureData),
          headers: { 'Content-Type': 'application/json' }
        });

        const response = await POST(request, { user: mockAdminUser });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Invalid business value');
      });
    });

    describe('PUT /api/admin/features', () => {
      it('should perform bulk feature updates', async () => {
        const { PUT } = await import('../app/api/admin/features/route');
        
        const bulkUpdate = {
          featureIds: ['1', '2', '3'],
          updates: {
            status: 'planned',
            priority: 'high'
          }
        };

        const request = new NextRequest('http://localhost/api/admin/features', {
          method: 'PUT',
          body: JSON.stringify(bulkUpdate),
          headers: { 'Content-Type': 'application/json' }
        });

        const response = await PUT(request, { user: mockAdminUser });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.results).toHaveLength(3);
        expect(data.summary.totalRequested).toBe(3);
      });

      it('should validate bulk update parameters', async () => {
        const { PUT } = await import('../app/api/admin/features/route');
        
        const request = new NextRequest('http://localhost/api/admin/features', {
          method: 'PUT',
          body: JSON.stringify({}),
          headers: { 'Content-Type': 'application/json' }
        });

        const response = await PUT(request, { user: mockAdminUser });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Missing feature IDs');
      });
    });
  });
});