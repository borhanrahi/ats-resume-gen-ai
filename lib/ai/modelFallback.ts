import type { AIModelConfig } from '@/types/admin';

export interface FallbackResult<T> {
  result: T;
  modelUsed: string;
  fallbacksUsed: string[];
  attempts: number;
  totalTime: number;
  errors: Array<{
    modelId: string;
    error: string;
    timestamp: Date;
  }>;
}

export interface ModelHealthStatus {
  modelId: string;
  isHealthy: boolean;
  lastSuccessfulCall: Date | null;
  lastFailure: Date | null;
  consecutiveFailures: number;
  averageResponseTime: number;
  successRate: number; // percentage over last 100 calls
  errorRate: number;
}

export interface FallbackConfig {
  maxRetries: number;
  timeoutMs: number;
  exponentialBackoff: boolean;
  healthCheckInterval: number; // ms
  failureThreshold: number; // consecutive failures before marking unhealthy
  recoveryThreshold: number; // consecutive successes before marking healthy
}

export class ModelFallbackSystem {
  private modelHealth: Map<string, ModelHealthStatus> = new Map();
  private callHistory: Map<string, Array<{ success: boolean; responseTime: number; timestamp: Date }>> = new Map();
  private config: FallbackConfig;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<FallbackConfig> = {}) {
    this.config = {
      maxRetries: config.maxRetries || 3,
      timeoutMs: config.timeoutMs || 30000,
      exponentialBackoff: config.exponentialBackoff ?? true,
      healthCheckInterval: config.healthCheckInterval || 60000, // 1 minute
      failureThreshold: config.failureThreshold || 3,
      recoveryThreshold: config.recoveryThreshold || 2,
    };

    // Start health monitoring
    this.startHealthMonitoring();
  }

  /**
   * Execute a function with fallback logic
   */
  async executeWithFallback<T>(
    models: AIModelConfig[],
    operation: (model: AIModelConfig) => Promise<T>,
    tier: 'free' | 'premium'
  ): Promise<FallbackResult<T>> {
    const startTime = Date.now();
    const errors: Array<{ modelId: string; error: string; timestamp: Date }> = [];
    const fallbacksUsed: string[] = [];

    // Filter and sort models by tier and health
    const availableModels = this.getAvailableModels(models, tier);
    
    if (availableModels.length === 0) {
      throw new Error(`No available models for tier: ${tier}`);
    }

    let lastError: Error | null = null;
    let attempts = 0;
    let primaryModelId: string | null = null;

    for (const model of availableModels) {
      attempts++;
      const modelStartTime = Date.now();

      // Track the primary model (first one we try)
      if (attempts === 1) {
        primaryModelId = model.id;
      }

      try {
        // Check if model is healthy before attempting
        if (!this.isModelHealthy(model.id)) {
          const error = `Model ${model.id} is marked as unhealthy`;
          errors.push({
            modelId: model.id,
            error,
            timestamp: new Date()
          });
          
          // If this is not the primary model, it's a fallback
          if (attempts > 1) {
            fallbacksUsed.push(model.id);
          }
          
          continue;
        }

        // Execute the operation with timeout
        const result = await this.executeWithTimeout(
          () => operation(model),
          this.config.timeoutMs
        );

        const responseTime = Date.now() - modelStartTime;
        
        // Record successful call
        this.recordCall(model.id, true, responseTime);
        
        // If this is not the primary model, it's a fallback
        if (attempts > 1) {
          fallbacksUsed.push(model.id);
        }
        
        return {
          result,
          modelUsed: model.id,
          fallbacksUsed,
          attempts,
          totalTime: Date.now() - startTime,
          errors
        };

      } catch (error) {
        const responseTime = Date.now() - modelStartTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Record failed call
        this.recordCall(model.id, false, responseTime);
        
        errors.push({
          modelId: model.id,
          error: errorMessage,
          timestamp: new Date()
        });

        lastError = error instanceof Error ? error : new Error(errorMessage);

        // Apply exponential backoff if enabled and not the last model
        if (this.config.exponentialBackoff && attempts < availableModels.length) {
          const delay = Math.min(1000 * Math.pow(2, attempts - 1), 10000);
          await this.delay(delay);
        }
      }
    }

    // All models failed
    throw new Error(
      `All models failed after ${attempts} attempts. Last error: ${lastError?.message || 'Unknown error'}`
    );
  }

  /**
   * Get available models sorted by priority and health
   */
  private getAvailableModels(models: AIModelConfig[], tier: 'free' | 'premium'): AIModelConfig[] {
    return models
      .filter(model => 
        model.tier === tier && 
        model.isActive
      )
      .sort((a, b) => {
        // Primary sort by priority (lower number = higher priority)
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        
        // Secondary sort by health status
        const aHealthy = this.isModelHealthy(a.id);
        const bHealthy = this.isModelHealthy(b.id);
        
        if (aHealthy && !bHealthy) return -1;
        if (!aHealthy && bHealthy) return 1;
        
        // Tertiary sort by success rate
        const aHealth = this.modelHealth.get(a.id);
        const bHealth = this.modelHealth.get(b.id);
        
        if (aHealth && bHealth) {
          return bHealth.successRate - aHealth.successRate;
        }
        
        return 0;
      });
  }

  /**
   * Check if a model is healthy
   */
  private isModelHealthy(modelId: string): boolean {
    const health = this.modelHealth.get(modelId);
    
    if (!health) {
      // New model, assume healthy
      return true;
    }
    
    return health.isHealthy;
  }

  /**
   * Record a call result for health monitoring
   */
  private recordCall(modelId: string, success: boolean, responseTime: number): void {
    const timestamp = new Date();
    
    // Initialize health status if not exists
    if (!this.modelHealth.has(modelId)) {
      this.modelHealth.set(modelId, {
        modelId,
        isHealthy: true,
        lastSuccessfulCall: null,
        lastFailure: null,
        consecutiveFailures: 0,
        averageResponseTime: 0,
        successRate: 100,
        errorRate: 0
      });
    }

    // Initialize call history if not exists
    if (!this.callHistory.has(modelId)) {
      this.callHistory.set(modelId, []);
    }

    const health = this.modelHealth.get(modelId)!;
    const history = this.callHistory.get(modelId)!;

    // Add to call history (keep last 100 calls)
    history.push({ success, responseTime, timestamp });
    if (history.length > 100) {
      history.shift();
    }

    // Update health status
    if (success) {
      health.lastSuccessfulCall = timestamp;
      health.consecutiveFailures = 0;
      
      // Mark as healthy if it was unhealthy and we've had enough successes
      if (!health.isHealthy) {
        const recentSuccesses = history.slice(-this.config.recoveryThreshold)
          .filter(call => call.success).length;
        
        if (recentSuccesses >= this.config.recoveryThreshold) {
          health.isHealthy = true;
          console.log(`✅ Model ${modelId} marked as healthy after recovery`);
        }
      }
    } else {
      health.lastFailure = timestamp;
      health.consecutiveFailures++;
      
      // Mark as unhealthy if we've exceeded the failure threshold
      if (health.isHealthy && health.consecutiveFailures >= this.config.failureThreshold) {
        health.isHealthy = false;
        console.log(`❌ Model ${modelId} marked as unhealthy after ${health.consecutiveFailures} consecutive failures`);
      }
    }

    // Update statistics
    const successfulCalls = history.filter(call => call.success).length;
    health.successRate = (successfulCalls / history.length) * 100;
    health.errorRate = 100 - health.successRate;
    
    // Update average response time (only for successful calls)
    const successfulResponseTimes = history
      .filter(call => call.success)
      .map(call => call.responseTime);
    
    if (successfulResponseTimes.length > 0) {
      health.averageResponseTime = successfulResponseTimes.reduce((sum, time) => sum + time, 0) / successfulResponseTimes.length;
    }

    this.modelHealth.set(modelId, health);
  }

  /**
   * Execute operation with timeout
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      operation()
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform periodic health check
   */
  private performHealthCheck(): void {
    const now = new Date();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [modelId, health] of this.modelHealth.entries()) {
      // Check if model has been inactive for too long
      const lastActivity = health.lastSuccessfulCall || health.lastFailure;
      
      if (lastActivity && (now.getTime() - lastActivity.getTime()) > staleThreshold) {
        // Model hasn't been used recently, reset consecutive failures
        if (health.consecutiveFailures > 0) {
          health.consecutiveFailures = Math.max(0, health.consecutiveFailures - 1);
          
          // Potentially mark as healthy if failures have decreased
          if (!health.isHealthy && health.consecutiveFailures < this.config.failureThreshold) {
            health.isHealthy = true;
            console.log(`🔄 Model ${modelId} marked as healthy due to inactivity recovery`);
          }
        }
      }
    }
  }

  /**
   * Get health status for all models
   */
  getModelHealthStatus(): ModelHealthStatus[] {
    return Array.from(this.modelHealth.values());
  }

  /**
   * Get health status for a specific model
   */
  getModelHealth(modelId: string): ModelHealthStatus | null {
    return this.modelHealth.get(modelId) || null;
  }

  /**
   * Manually mark a model as healthy or unhealthy
   */
  setModelHealth(modelId: string, isHealthy: boolean): void {
    let health = this.modelHealth.get(modelId);
    
    if (!health) {
      // Create health status if it doesn't exist
      health = {
        modelId,
        isHealthy: true,
        lastSuccessfulCall: null,
        lastFailure: null,
        consecutiveFailures: 0,
        averageResponseTime: 0,
        successRate: 100,
        errorRate: 0
      };
    }
    
    health.isHealthy = isHealthy;
    health.consecutiveFailures = isHealthy ? 0 : this.config.failureThreshold;
    this.modelHealth.set(modelId, health);
    
    console.log(`🔧 Model ${modelId} manually marked as ${isHealthy ? 'healthy' : 'unhealthy'}`);
  }

  /**
   * Reset health status for a model
   */
  resetModelHealth(modelId: string): void {
    this.modelHealth.delete(modelId);
    this.callHistory.delete(modelId);
    
    console.log(`🔄 Health status reset for model ${modelId}`);
  }

  /**
   * Get fallback system statistics
   */
  getStats() {
    const totalModels = this.modelHealth.size;
    const healthyModels = Array.from(this.modelHealth.values()).filter(h => h.isHealthy).length;
    const unhealthyModels = totalModels - healthyModels;
    
    const totalCalls = Array.from(this.callHistory.values())
      .reduce((sum, history) => sum + history.length, 0);
    
    const successfulCalls = Array.from(this.callHistory.values())
      .reduce((sum, history) => sum + history.filter(call => call.success).length, 0);
    
    const overallSuccessRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;
    
    return {
      totalModels,
      healthyModels,
      unhealthyModels,
      totalCalls,
      successfulCalls,
      overallSuccessRate,
      config: this.config
    };
  }

  /**
   * Update fallback configuration
   */
  updateConfig(newConfig: Partial<FallbackConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart health monitoring if interval changed
    if (newConfig.healthCheckInterval) {
      this.startHealthMonitoring();
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    this.modelHealth.clear();
    this.callHistory.clear();
  }
}

// Default fallback system instance
export const modelFallbackSystem = new ModelFallbackSystem({
  maxRetries: 3,
  timeoutMs: 30000,
  exponentialBackoff: true,
  healthCheckInterval: 60000,
  failureThreshold: 3,
  recoveryThreshold: 2
});