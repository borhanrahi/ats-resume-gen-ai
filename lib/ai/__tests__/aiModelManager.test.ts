import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AIModelManager } from '../aiModelManager';
import type { AIModelConfig } from '@/types/admin';

// Mock the client classes
vi.mock('../openRouterClient', () => ({
  OpenRouterClient: vi.fn().mockImplementation(() => ({
    analyzeResume: vi.fn().mockResolvedValue({
      score: 85,
      breakdown: { formatting: 90, keywords: 80, structure: 85, length: 85 },
      recommendations: [],
      keywordMatch: { found: [], missing: [], matchPercentage: 80, density: 2.5, suggestions: [] },
      grammarIssues: [],
      modelUsed: 'test-model',
      fallbacksUsed: []
    }),
    makeRequest: vi.fn().mockResolvedValue({
      choices: [{ message: { content: 'Test successful' } }]
    }),
    updateConfig: vi.fn(),
    getStats: vi.fn().mockReturnValue({ requestCount: 0 })
  }))
}));

vi.mock('../geminiClient', () => ({
  GeminiClient: vi.fn().mockImplementation(() => ({
    analyzeGrammar: vi.fn().mockResolvedValue({
      grammarIssues: [],
      overallScore: 90,
      suggestions: { summary: [], titles: [], improvements: [] },
      readabilityScore: 85,
      toneAnalysis: { score: 88, feedback: 'Professional tone', suggestions: [] }
    }),
    analyzeContent: vi.fn().mockResolvedValue({
      contentQuality: 85,
      strengthsWeaknesses: { strengths: [], weaknesses: [] },
      suggestions: { summaryOptions: [], titleOptions: [], contentImprovements: [] },
      professionalTone: { score: 88, feedback: 'Good professional tone' }
    }),
    testConnection: vi.fn().mockResolvedValue({ success: true, response: 'Connection successful' }),
    updateConfig: vi.fn(),
    getStats: vi.fn().mockReturnValue({ requestCount: 0 })
  }))
}));

describe('AIModelManager', () => {
  let modelManager: AIModelManager;
  let mockModels: AIModelConfig[];

  beforeEach(() => {
    mockModels = [
      {
        id: 'openrouter-free',
        name: 'OpenRouter Free',
        provider: 'openrouter',
        apiKey: 'test-key-1',
        endpoint: 'https://openrouter.ai/api/v1',
        tier: 'free',
        priority: 1,
        isActive: true,
        fallbackModels: ['gemini-free'],
        rateLimits: { requestsPerMinute: 60, requestsPerDay: 1000 }
      },
      {
        id: 'gemini-free',
        name: 'Gemini Free',
        provider: 'gemini',
        apiKey: 'test-key-2',
        endpoint: '',
        tier: 'free',
        priority: 2,
        isActive: true,
        fallbackModels: [],
        rateLimits: { requestsPerMinute: 30, requestsPerDay: 500 }
      },
      {
        id: 'openrouter-premium',
        name: 'OpenRouter Premium',
        provider: 'openrouter',
        apiKey: 'test-key-3',
        endpoint: 'https://openrouter.ai/api/v1',
        tier: 'premium',
        priority: 1,
        isActive: true,
        fallbackModels: [],
        rateLimits: { requestsPerMinute: 120, requestsPerDay: 5000 }
      }
    ];

    modelManager = new AIModelManager({
      models: mockModels,
      fallbackConfig: {
        maxRetries: 3,
        timeoutMs: 5000,
        exponentialBackoff: true
      }
    });
  });

  afterEach(() => {
    modelManager.destroy();
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with provided models', () => {
      const allModels = modelManager.getAllModels();
      expect(allModels).toHaveLength(3);
      expect(allModels.map(m => m.id)).toEqual(['openrouter-free', 'gemini-free', 'openrouter-premium']);
    });

    it('should create performance metrics for all models', () => {
      const metrics = modelManager.getPerformanceMetrics();
      expect(metrics).toHaveLength(3);
      
      metrics.forEach(metric => {
        expect(metric.totalCalls).toBe(0);
        expect(metric.successfulCalls).toBe(0);
        expect(metric.failedCalls).toBe(0);
        expect(metric.isHealthy).toBe(true);
      });
    });
  });

  describe('model management', () => {
    it('should add new model successfully', async () => {
      const newModel: AIModelConfig = {
        id: 'claude-premium',
        name: 'Claude Premium',
        provider: 'anthropic',
        apiKey: 'test-key-4',
        endpoint: '',
        tier: 'premium',
        priority: 2,
        isActive: true,
        fallbackModels: [],
        rateLimits: { requestsPerMinute: 100, requestsPerDay: 3000 }
      };

      await modelManager.addModel(newModel);

      const allModels = modelManager.getAllModels();
      expect(allModels).toHaveLength(4);
      expect(modelManager.getModel('claude-premium')).toEqual(newModel);
    });

    it('should update existing model', async () => {
      const updates = {
        name: 'Updated OpenRouter Free',
        priority: 3,
        isActive: false
      };

      await modelManager.updateModel('openrouter-free', updates);

      const updatedModel = modelManager.getModel('openrouter-free');
      expect(updatedModel?.name).toBe('Updated OpenRouter Free');
      expect(updatedModel?.priority).toBe(3);
      expect(updatedModel?.isActive).toBe(false);
    });

    it('should remove model successfully', () => {
      modelManager.removeModel('gemini-free');

      const allModels = modelManager.getAllModels();
      expect(allModels).toHaveLength(2);
      expect(modelManager.getModel('gemini-free')).toBeUndefined();
    });

    it('should get models by tier', () => {
      const freeModels = modelManager.getModelsByTier('free');
      const premiumModels = modelManager.getModelsByTier('premium');

      expect(freeModels).toHaveLength(2);
      expect(premiumModels).toHaveLength(1);
      expect(freeModels.every(m => m.tier === 'free')).toBe(true);
      expect(premiumModels.every(m => m.tier === 'premium')).toBe(true);
    });
  });

  describe('analysis operations', () => {
    it('should perform ATS analysis with fallback', async () => {
      const request = {
        resumeContent: 'Test resume content',
        jobDescription: 'Test job description',
        tier: 'free' as const,
        analysisType: 'ats' as const
      };

      const result = await modelManager.analyzeATS(request);

      expect(result.result.score).toBe(85);
      expect(result.modelUsed).toBe('openrouter-free');
      expect(result.attempts).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should perform grammar analysis with fallback', async () => {
      const request = {
        resumeContent: 'Test resume content',
        tier: 'free' as const,
        analysisType: 'grammar' as const
      };

      const result = await modelManager.analyzeGrammar(request);

      expect(result.result.overallScore).toBe(90);
      expect(result.modelUsed).toBe('gemini-free');
      expect(result.attempts).toBe(1);
    });

    it('should perform content analysis with fallback', async () => {
      const request = {
        resumeContent: 'Test resume content',
        jobDescription: 'Test job description',
        tier: 'free' as const,
        analysisType: 'content' as const
      };

      const result = await modelManager.analyzeContent(request);

      expect(result.result.contentQuality).toBe(85);
      expect(result.modelUsed).toBe('gemini-free');
      expect(result.attempts).toBe(1);
    });

    it('should use premium models for premium tier', async () => {
      const request = {
        resumeContent: 'Test resume content',
        tier: 'premium' as const,
        analysisType: 'ats' as const
      };

      const result = await modelManager.analyzeATS(request);

      expect(result.modelUsed).toBe('openrouter-premium');
    });
  });

  describe('model testing', () => {
    it('should test OpenRouter model successfully', async () => {
      const result = await modelManager.testModel('openrouter-free');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Model test successful');
      expect(result.responseTime).toBeGreaterThan(0);
    });

    it('should test Gemini model successfully', async () => {
      const result = await modelManager.testModel('gemini-free');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Model test successful');
      expect(result.responseTime).toBeGreaterThan(0);
    });

    it('should handle test failure gracefully', async () => {
      // Mock a failing client
      const { GeminiClient } = await import('../geminiClient');
      const mockClient = new GeminiClient({ apiKey: 'test' });
      vi.mocked(mockClient.testConnection).mockResolvedValueOnce({
        success: false,
        error: 'API key invalid'
      });

      // Update the model manager to use the failing client
      modelManager['clients'].set('gemini-free', mockClient);

      const result = await modelManager.testModel('gemini-free');

      expect(result.success).toBe(false);
      expect(result.message).toContain('API key invalid');
    });

    it('should return error for non-existent model', async () => {
      const result = await modelManager.testModel('non-existent-model');

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  describe('performance tracking', () => {
    it('should update performance metrics after successful analysis', async () => {
      const request = {
        resumeContent: 'Test resume content',
        tier: 'free' as const,
        analysisType: 'ats' as const
      };

      await modelManager.analyzeATS(request);

      const metrics = modelManager.getModelPerformanceMetrics('openrouter-free');
      expect(metrics?.totalCalls).toBe(1);
      expect(metrics?.successfulCalls).toBe(1);
      expect(metrics?.failedCalls).toBe(0);
      expect(metrics?.successRate).toBe(100);
      expect(metrics?.lastUsed).toBeTruthy();
    });

    it('should track failed calls correctly', async () => {
      // Mock a failing operation
      const { OpenRouterClient } = await import('../openRouterClient');
      const mockClient = new OpenRouterClient({ apiKey: 'test' });
      vi.mocked(mockClient.analyzeResume).mockRejectedValueOnce(new Error('API error'));

      modelManager['clients'].set('openrouter-free', mockClient);

      const request = {
        resumeContent: 'Test resume content',
        tier: 'free' as const,
        analysisType: 'ats' as const
      };

      try {
        await modelManager.analyzeATS(request);
      } catch {
        // Expected to fail
      }

      const metrics = modelManager.getModelPerformanceMetrics('openrouter-free');
      expect(metrics?.failedCalls).toBeGreaterThan(0);
      expect(metrics?.successRate).toBeLessThan(100);
    });
  });

  describe('health status integration', () => {
    it('should provide health status from fallback system', () => {
      const healthStatus = modelManager.getHealthStatus();
      expect(Array.isArray(healthStatus)).toBe(true);
    });

    it('should sync health status with performance metrics', async () => {
      // Perform some operations to generate health data
      const request = {
        resumeContent: 'Test resume content',
        tier: 'free' as const,
        analysisType: 'ats' as const
      };

      await modelManager.analyzeATS(request);

      const metrics = modelManager.getModelPerformanceMetrics('openrouter-free');
      const healthStatus = modelManager.getHealthStatus();
      
      const modelHealth = healthStatus.find(h => h.modelId === 'openrouter-free');
      
      expect(metrics?.isHealthy).toBe(modelHealth?.isHealthy);
    });
  });

  describe('statistics and reporting', () => {
    it('should provide comprehensive statistics', () => {
      const stats = modelManager.getStats();

      expect(stats.totalModels).toBe(3);
      expect(stats.activeModels).toBe(3);
      expect(stats.fallbackSystem).toBeDefined();
      expect(stats.models).toHaveLength(3);

      stats.models.forEach(model => {
        expect(model.id).toBeDefined();
        expect(model.name).toBeDefined();
        expect(model.provider).toBeDefined();
        expect(model.performance).toBeDefined();
      });
    });

    it('should track active vs inactive models', async () => {
      // Deactivate one model
      await modelManager.updateModel('gemini-free', { isActive: false });

      const stats = modelManager.getStats();
      expect(stats.totalModels).toBe(3);
      expect(stats.activeModels).toBe(2);
    });
  });

  describe('error handling', () => {
    it('should handle invalid model configuration gracefully', async () => {
      const invalidModel = {
        id: '',
        name: '',
        provider: 'invalid',
        apiKey: '',
        endpoint: '',
        tier: 'free',
        priority: 1,
        isActive: true,
        fallbackModels: [],
        rateLimits: { requestsPerMinute: 60, requestsPerDay: 1000 }
      } as AIModelConfig;

      await expect(modelManager.addModel(invalidModel)).rejects.toThrow();
    });

    it('should handle update of non-existent model', async () => {
      await expect(
        modelManager.updateModel('non-existent', { name: 'Updated' })
      ).rejects.toThrow('not found');
    });

    it('should handle analysis with no available models', async () => {
      // Remove all free tier models
      modelManager.removeModel('openrouter-free');
      modelManager.removeModel('gemini-free');

      const request = {
        resumeContent: 'Test resume content',
        tier: 'free' as const,
        analysisType: 'ats' as const
      };

      await expect(modelManager.analyzeATS(request)).rejects.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should clean up resources properly', () => {
      const initialStats = modelManager.getStats();
      expect(initialStats.totalModels).toBe(3);

      modelManager.destroy();

      // After destroy, the fallback system should be cleaned up
      // Note: We can't easily test this without exposing internal state
      // but the destroy method should call fallbackSystem.destroy()
    });
  });
});

// Integration tests
describe('AIModelManager Integration Tests', () => {
  it('should handle real-world analysis workflow', async () => {
    const models: AIModelConfig[] = [
      {
        id: 'primary-ats',
        name: 'Primary ATS Model',
        provider: 'openrouter',
        apiKey: 'test-key',
        endpoint: 'https://openrouter.ai/api/v1',
        tier: 'free',
        priority: 1,
        isActive: true,
        fallbackModels: ['fallback-ats'],
        rateLimits: { requestsPerMinute: 60, requestsPerDay: 1000 }
      },
      {
        id: 'fallback-ats',
        name: 'Fallback ATS Model',
        provider: 'openrouter',
        apiKey: 'test-key-2',
        endpoint: 'https://openrouter.ai/api/v1',
        tier: 'free',
        priority: 2,
        isActive: true,
        fallbackModels: [],
        rateLimits: { requestsPerMinute: 30, requestsPerDay: 500 }
      },
      {
        id: 'grammar-model',
        name: 'Grammar Analysis Model',
        provider: 'gemini',
        apiKey: 'test-key-3',
        endpoint: '',
        tier: 'free',
        priority: 1,
        isActive: true,
        fallbackModels: [],
        rateLimits: { requestsPerMinute: 15, requestsPerDay: 200 }
      }
    ];

    const manager = new AIModelManager({ models });

    try {
      // Test complete analysis workflow
      const resumeContent = `
        John Doe
        Software Engineer
        john.doe@email.com | (555) 123-4567
        
        SUMMARY
        Experienced software engineer with 5 years of experience in web development.
        
        EXPERIENCE
        Senior Software Engineer at Tech Corp (2020-2023)
        - Developed scalable web applications using React and Node.js
        - Led a team of 3 developers
        - Improved application performance by 40%
        
        SKILLS
        JavaScript, React, Node.js, Python, AWS, Docker
      `;

      const jobDescription = `
        We are looking for a Senior Software Engineer with experience in:
        - React and modern JavaScript frameworks
        - Node.js backend development
        - Cloud platforms (AWS preferred)
        - Team leadership experience
        - 5+ years of software development experience
      `;

      // Perform ATS analysis
      const atsResult = await manager.analyzeATS({
        resumeContent,
        jobDescription,
        tier: 'free',
        analysisType: 'ats'
      });

      expect(atsResult.result.score).toBeGreaterThan(0);
      expect(atsResult.modelUsed).toBe('primary-ats');

      // Perform grammar analysis
      const grammarResult = await manager.analyzeGrammar({
        resumeContent,
        tier: 'free',
        analysisType: 'grammar'
      });

      expect(grammarResult.result.overallScore).toBeGreaterThan(0);
      expect(grammarResult.modelUsed).toBe('grammar-model');

      // Check that performance metrics were updated
      const atsMetrics = manager.getModelPerformanceMetrics('primary-ats');
      const grammarMetrics = manager.getModelPerformanceMetrics('grammar-model');

      expect(atsMetrics?.totalCalls).toBe(1);
      expect(atsMetrics?.successfulCalls).toBe(1);
      expect(grammarMetrics?.totalCalls).toBe(1);
      expect(grammarMetrics?.successfulCalls).toBe(1);

      // Test model health status
      const healthStatus = manager.getHealthStatus();
      expect(healthStatus.length).toBeGreaterThan(0);

      // Get comprehensive stats
      const stats = manager.getStats();
      expect(stats.totalModels).toBe(3);
      expect(stats.activeModels).toBe(3);
      expect(stats.fallbackSystem.totalCalls).toBeGreaterThan(0);

    } finally {
      manager.destroy();
    }
  });
});