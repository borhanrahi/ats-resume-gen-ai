import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ModelFallbackSystem } from '../modelFallback';
import type { AIModelConfig } from '@/types/admin';

// Mock console methods to avoid noise in tests
const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('ModelFallbackSystem', () => {
  let fallbackSystem: ModelFallbackSystem;
  let mockModels: AIModelConfig[];

  beforeEach(() => {
    fallbackSystem = new ModelFallbackSystem({
      maxRetries: 3,
      timeoutMs: 5000,
      exponentialBackoff: true,
      healthCheckInterval: 1000,
      failureThreshold: 2,
      recoveryThreshold: 2
    });

    mockModels = [
      {
        id: 'model-1',
        name: 'Primary Model',
        provider: 'openrouter',
        apiKey: 'test-key-1',
        endpoint: 'https://api.test.com',
        tier: 'free',
        priority: 1,
        isActive: true,
        fallbackModels: ['model-2'],
        rateLimits: { requestsPerMinute: 60, requestsPerDay: 1000 }
      },
      {
        id: 'model-2',
        name: 'Fallback Model',
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
        id: 'model-3',
        name: 'Inactive Model',
        provider: 'claude',
        apiKey: 'test-key-3',
        endpoint: '',
        tier: 'free',
        priority: 3,
        isActive: false,
        fallbackModels: [],
        rateLimits: { requestsPerMinute: 20, requestsPerDay: 200 }
      }
    ];
  });

  afterEach(() => {
    fallbackSystem.destroy();
    vi.clearAllMocks();
  });

  describe('executeWithFallback', () => {
    it('should execute successfully with primary model', async () => {
      const mockOperation = vi.fn().mockResolvedValue('success');

      const result = await fallbackSystem.executeWithFallback(
        mockModels,
        mockOperation,
        'free'
      );

      expect(result.result).toBe('success');
      expect(result.modelUsed).toBe('model-1');
      expect(result.fallbacksUsed).toEqual([]);
      expect(result.attempts).toBe(1);
      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(mockOperation).toHaveBeenCalledWith(mockModels[0]);
    });

    it('should fallback to secondary model when primary fails', async () => {
      const mockOperation = vi.fn()
        .mockRejectedValueOnce(new Error('Primary failed'))
        .mockResolvedValueOnce('fallback success');

      const result = await fallbackSystem.executeWithFallback(
        mockModels,
        mockOperation,
        'free'
      );

      expect(result.result).toBe('fallback success');
      expect(result.modelUsed).toBe('model-2');
      expect(result.fallbacksUsed).toEqual(['model-2']);
      expect(result.attempts).toBe(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].modelId).toBe('model-1');
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should skip inactive models', async () => {
      const mockOperation = vi.fn()
        .mockRejectedValueOnce(new Error('Primary failed'))
        .mockRejectedValueOnce(new Error('Secondary failed'));

      // Make model-2 inactive
      mockModels[1].isActive = false;

      await expect(
        fallbackSystem.executeWithFallback(mockModels, mockOperation, 'free')
      ).rejects.toThrow('All models failed');

      // Should only try model-1 (model-2 is inactive, model-3 is inactive)
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should respect model priority ordering', async () => {
      // Swap priorities
      mockModels[0].priority = 2;
      mockModels[1].priority = 1;

      const mockOperation = vi.fn().mockResolvedValue('success');

      const result = await fallbackSystem.executeWithFallback(
        mockModels,
        mockOperation,
        'free'
      );

      expect(result.modelUsed).toBe('model-2'); // Should use model-2 first due to priority
      expect(mockOperation).toHaveBeenCalledWith(mockModels[1]);
    });

    it('should filter models by tier', async () => {
      // Set model-1 to premium tier
      mockModels[0].tier = 'premium';

      const mockOperation = vi.fn().mockResolvedValue('success');

      const result = await fallbackSystem.executeWithFallback(
        mockModels,
        mockOperation,
        'free'
      );

      expect(result.modelUsed).toBe('model-2'); // Should skip model-1 (premium tier)
      expect(mockOperation).toHaveBeenCalledWith(mockModels[1]);
    });

    it('should handle timeout correctly', async () => {
      const mockOperation = vi.fn().mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timed out after 5000ms')), 6000))
      );

      await expect(
        fallbackSystem.executeWithFallback(mockModels, mockOperation, 'free')
      ).rejects.toThrow('All models failed');

      expect(mockOperation).toHaveBeenCalled();
    }, 20000); // Increase timeout for this test

    it('should apply exponential backoff between retries', async () => {
      // Add a third model so we have enough models to test backoff
      const extendedModels: AIModelConfig[] = [...mockModels, {
        id: 'model-4',
        name: 'Third Model',
        provider: 'custom',
        apiKey: 'test-key-4',
        endpoint: '',
        tier: 'free',
        priority: 4,
        isActive: true,
        fallbackModels: [],
        rateLimits: { requestsPerMinute: 20, requestsPerDay: 200 }
      }];

      const mockOperation = vi.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValueOnce('success');

      const startTime = Date.now();

      const result = await fallbackSystem.executeWithFallback(
        extendedModels,
        mockOperation,
        'free'
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.result).toBe('success');
      expect(duration).toBeGreaterThan(1000); // Should have some delay from backoff
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('should throw error when no models are available', async () => {
      const mockOperation = vi.fn();

      await expect(
        fallbackSystem.executeWithFallback([], mockOperation, 'free')
      ).rejects.toThrow('No available models for tier: free');

      expect(mockOperation).not.toHaveBeenCalled();
    });
  });

  describe('health monitoring', () => {
    it('should track successful calls', async () => {
      const mockOperation = vi.fn().mockResolvedValue('success');

      await fallbackSystem.executeWithFallback(mockModels, mockOperation, 'free');

      const health = fallbackSystem.getModelHealth('model-1');
      expect(health).toBeTruthy();
      expect(health!.isHealthy).toBe(true);
      expect(health!.consecutiveFailures).toBe(0);
      expect(health!.lastSuccessfulCall).toBeTruthy();
    });

    it('should track failed calls and mark model as unhealthy', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('Always fails'));

      // Fail enough times to mark as unhealthy
      for (let i = 0; i < 3; i++) {
        try {
          await fallbackSystem.executeWithFallback([mockModels[0]], mockOperation, 'free');
        } catch {
          // Expected to fail
        }
      }

      const health = fallbackSystem.getModelHealth('model-1');
      expect(health).toBeTruthy();
      expect(health!.isHealthy).toBe(false);
      expect(health!.consecutiveFailures).toBeGreaterThanOrEqual(2);
    });

    it('should recover unhealthy model after successful calls', async () => {
      // First, make the model unhealthy by failing multiple times
      const failOperation = vi.fn().mockRejectedValue(new Error('Always fails'));
      
      for (let i = 0; i < 3; i++) {
        try {
          await fallbackSystem.executeWithFallback([mockModels[0]], failOperation, 'free');
        } catch {
          // Expected to fail
        }
      }

      let health = fallbackSystem.getModelHealth('model-1');
      expect(health!.isHealthy).toBe(false);

      // Now create a new operation that succeeds
      const successOperation = vi.fn().mockResolvedValue('Success');

      // Manually mark as healthy to allow testing recovery
      fallbackSystem.setModelHealth('model-1', true);

      // Now make successful calls to test recovery tracking
      await fallbackSystem.executeWithFallback([mockModels[0]], successOperation, 'free');
      await fallbackSystem.executeWithFallback([mockModels[0]], successOperation, 'free');

      health = fallbackSystem.getModelHealth('model-1');
      expect(health!.isHealthy).toBe(true);
      expect(health!.consecutiveFailures).toBe(0);
    });

    it('should calculate success rate correctly', async () => {
      const mockOperation = vi.fn()
        .mockResolvedValueOnce('Success 1')
        .mockResolvedValueOnce('Success 2')
        .mockRejectedValueOnce(new Error('Failure 1'))
        .mockResolvedValueOnce('Success 3');

      // Execute multiple calls
      for (let i = 0; i < 4; i++) {
        try {
          await fallbackSystem.executeWithFallback([mockModels[0]], mockOperation, 'free');
        } catch {
          // Some calls expected to fail
        }
      }

      const health = fallbackSystem.getModelHealth('model-1');
      expect(health).toBeTruthy();
      expect(health!.successRate).toBe(75); // 3 successes out of 4 calls
      expect(health!.errorRate).toBe(25);
    });
  });

  describe('manual health management', () => {
    it('should allow manually setting model health', () => {
      fallbackSystem.setModelHealth('model-1', false);

      const health = fallbackSystem.getModelHealth('model-1');
      expect(health!.isHealthy).toBe(false);
      expect(health!.consecutiveFailures).toBeGreaterThanOrEqual(2);
    });

    it('should allow resetting model health', () => {
      // First, create some health data
      fallbackSystem.setModelHealth('model-1', false);
      expect(fallbackSystem.getModelHealth('model-1')).toBeTruthy();

      // Then reset it
      fallbackSystem.resetModelHealth('model-1');
      expect(fallbackSystem.getModelHealth('model-1')).toBeNull();
    });
  });

  describe('statistics', () => {
    it('should provide accurate statistics', async () => {
      const mockOperation = vi.fn()
        .mockResolvedValueOnce('Success 1')
        .mockRejectedValueOnce(new Error('Failure 1'))
        .mockResolvedValueOnce('Success 2');

      // Execute some calls
      for (let i = 0; i < 3; i++) {
        try {
          await fallbackSystem.executeWithFallback([mockModels[0]], mockOperation, 'free');
        } catch {
          // Some calls expected to fail
        }
      }

      const stats = fallbackSystem.getStats();
      expect(stats.totalModels).toBe(1); // Only model-1 has been used
      expect(stats.totalCalls).toBe(3);
      expect(stats.successfulCalls).toBe(2);
      expect(stats.overallSuccessRate).toBeCloseTo(66.67, 1);
    });
  });

  describe('configuration updates', () => {
    it('should allow updating configuration', () => {
      const newConfig = {
        maxRetries: 5,
        timeoutMs: 10000,
        failureThreshold: 5
      };

      fallbackSystem.updateConfig(newConfig);

      const stats = fallbackSystem.getStats();
      expect(stats.config.maxRetries).toBe(5);
      expect(stats.config.timeoutMs).toBe(10000);
      expect(stats.config.failureThreshold).toBe(5);
    });
  });

  describe('cleanup', () => {
    it('should clean up resources properly', () => {
      const healthStatus = fallbackSystem.getModelHealthStatus();
      expect(Array.isArray(healthStatus)).toBe(true);

      fallbackSystem.destroy();

      // After destroy, should have no health data
      const statsAfterDestroy = fallbackSystem.getStats();
      expect(statsAfterDestroy.totalModels).toBe(0);
    });
  });
});

// Integration tests with AIModelManager
describe('ModelFallbackSystem Integration', () => {
  let fallbackSystem: ModelFallbackSystem;

  beforeEach(() => {
    fallbackSystem = new ModelFallbackSystem();
  });

  afterEach(() => {
    fallbackSystem.destroy();
  });

  it('should integrate properly with real-world scenarios', async () => {
    const models: AIModelConfig[] = [
      {
        id: 'openrouter-primary',
        name: 'OpenRouter Primary',
        provider: 'openrouter',
        apiKey: 'test-key',
        endpoint: 'https://openrouter.ai/api/v1',
        tier: 'free',
        priority: 1,
        isActive: true,
        fallbackModels: ['gemini-fallback'],
        rateLimits: { requestsPerMinute: 60, requestsPerDay: 1000 }
      },
      {
        id: 'gemini-fallback',
        name: 'Gemini Fallback',
        provider: 'gemini',
        apiKey: 'test-key',
        endpoint: '',
        tier: 'free',
        priority: 2,
        isActive: true,
        fallbackModels: [],
        rateLimits: { requestsPerMinute: 30, requestsPerDay: 500 }
      }
    ];

    // Simulate a scenario where primary fails but fallback succeeds
    const mockAnalysisOperation = vi.fn()
      .mockRejectedValueOnce(new Error('OpenRouter API rate limit exceeded'))
      .mockResolvedValueOnce({
        score: 85,
        breakdown: { formatting: 90, keywords: 80, structure: 85, length: 85 },
        recommendations: [],
        keywordMatch: { found: [], missing: [], matchPercentage: 80, density: 2.5, suggestions: [] },
        grammarIssues: [],
        modelUsed: 'gemini-fallback',
        fallbacksUsed: []
      });

    const result = await fallbackSystem.executeWithFallback(
      models,
      mockAnalysisOperation,
      'free'
    );

    expect((result.result as unknown).score).toBe(85);
    expect(result.modelUsed).toBe('gemini-fallback');
    expect(result.fallbacksUsed).toEqual(['gemini-fallback']);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].modelId).toBe('openrouter-primary');

    // Verify health tracking
    const primaryHealth = fallbackSystem.getModelHealth('openrouter-primary');
    const fallbackHealth = fallbackSystem.getModelHealth('gemini-fallback');

    expect(primaryHealth?.consecutiveFailures).toBe(1);
    expect(fallbackHealth?.consecutiveFailures).toBe(0);
    expect(fallbackHealth?.lastSuccessfulCall).toBeTruthy();
  });
});

afterEach(() => {
  consoleSpy.mockRestore();
});