import { OpenRouterClient } from './openRouterClient';
import { GeminiClient } from './geminiClient';
import { ModelFallbackSystem, type FallbackResult } from './modelFallback';
import type { AIModelConfig } from '@/types/admin';
import type { ATSAnalysis, GrammarAnalysisResult, ContentAnalysisResult } from '@/types/analysis';

export interface ModelManagerConfig {
  models: AIModelConfig[];
  fallbackConfig?: {
    maxRetries?: number;
    timeoutMs?: number;
    exponentialBackoff?: boolean;
    healthCheckInterval?: number;
    failureThreshold?: number;
    recoveryThreshold?: number;
  };
}

export interface AnalysisRequest {
  resumeContent: string;
  jobDescription?: string;
  tier: 'free' | 'premium';
  analysisType: 'ats' | 'grammar' | 'content';
}

export interface ModelPerformanceMetrics {
  modelId: string;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageResponseTime: number;
  successRate: number;
  lastUsed: Date | null;
  isHealthy: boolean;
}

export class AIModelManager {
  private models: Map<string, AIModelConfig> = new Map();
  private clients: Map<string, OpenRouterClient | GeminiClient> = new Map();
  private fallbackSystem: ModelFallbackSystem;
  private performanceMetrics: Map<string, ModelPerformanceMetrics> = new Map();

  constructor(config: ModelManagerConfig) {
    this.fallbackSystem = new ModelFallbackSystem(config.fallbackConfig);
    this.updateModels(config.models);
  }

  /**
   * Update the model configuration
   */
  updateModels(models: AIModelConfig[]): void {
    // Clear existing models and clients
    this.models.clear();
    this.clients.clear();

    // Add new models
    models.forEach(model => {
      this.models.set(model.id, model);
      
      // Initialize performance metrics
      if (!this.performanceMetrics.has(model.id)) {
        this.performanceMetrics.set(model.id, {
          modelId: model.id,
          totalCalls: 0,
          successfulCalls: 0,
          failedCalls: 0,
          averageResponseTime: 0,
          successRate: 0,
          lastUsed: null,
          isHealthy: true
        });
      }

      // Create appropriate client based on provider
      try {
        const client = this.createClient(model);
        if (client) {
          this.clients.set(model.id, client);
        }
      } catch (error) {
        console.error(`Failed to create client for model ${model.id}:`, error);
      }
    });

    console.log(`✅ Updated AI model manager with ${models.length} models`);
  }

  /**
   * Perform ATS analysis with fallback
   */
  async analyzeATS(request: AnalysisRequest): Promise<FallbackResult<ATSAnalysis>> {
    const models = Array.from(this.models.values());
    
    return this.fallbackSystem.executeWithFallback(
      models,
      async (model) => {
        const client = this.clients.get(model.id);
        
        if (!client || !(client instanceof OpenRouterClient)) {
          throw new Error(`No OpenRouter client available for model ${model.id}`);
        }

        // Update client configuration
        client.updateConfig({
          apiKey: model.apiKey,
          baseUrl: model.endpoint || undefined,
          model: this.getModelName(model),
          timeoutMs: 30000
        });

        const result = await client.analyzeResume(request.resumeContent, request.jobDescription);
        
        // Update performance metrics
        this.updatePerformanceMetrics(model.id, true, Date.now());
        
        return result;
      },
      request.tier
    );
  }

  /**
   * Perform grammar analysis with fallback
   */
  async analyzeGrammar(request: AnalysisRequest): Promise<FallbackResult<GrammarAnalysisResult>> {
    const models = Array.from(this.models.values());
    
    return this.fallbackSystem.executeWithFallback(
      models,
      async (model) => {
        const client = this.clients.get(model.id);
        
        if (!client || !(client instanceof GeminiClient)) {
          throw new Error(`No Gemini client available for model ${model.id}`);
        }

        // Update client configuration
        client.updateConfig({
          apiKey: model.apiKey,
          model: this.getModelName(model),
          timeoutMs: 30000
        });

        const result = await client.analyzeGrammar(request.resumeContent);
        
        // Update performance metrics
        this.updatePerformanceMetrics(model.id, true, Date.now());
        
        return result;
      },
      request.tier
    );
  }

  /**
   * Perform content analysis with fallback
   */
  async analyzeContent(request: AnalysisRequest): Promise<FallbackResult<ContentAnalysisResult>> {
    const models = Array.from(this.models.values());
    
    return this.fallbackSystem.executeWithFallback(
      models,
      async (model) => {
        const client = this.clients.get(model.id);
        
        if (!client || !(client instanceof GeminiClient)) {
          throw new Error(`No Gemini client available for model ${model.id}`);
        }

        // Update client configuration
        client.updateConfig({
          apiKey: model.apiKey,
          model: this.getModelName(model),
          timeoutMs: 30000
        });

        const result = await client.analyzeContent(request.resumeContent, request.jobDescription);
        
        // Update performance metrics
        this.updatePerformanceMetrics(model.id, true, Date.now());
        
        return result;
      },
      request.tier
    );
  }

  /**
   * Test a specific model
   */
  async testModel(modelId: string): Promise<{ success: boolean; message: string; responseTime?: number }> {
    const model = this.models.get(modelId);
    if (!model) {
      return { success: false, message: `Model ${modelId} not found` };
    }

    const client = this.clients.get(modelId);
    if (!client) {
      return { success: false, message: `No client available for model ${modelId}` };
    }

    const startTime = Date.now();

    try {
      if (client instanceof OpenRouterClient) {
        // Test OpenRouter client
        const testResponse = await client.makeRequest({
          model: this.getModelName(model),
          messages: [
            {
              role: 'system',
              content: 'You are a test assistant. Respond with "Test successful" to confirm the connection.'
            },
            {
              role: 'user',
              content: 'Please confirm the connection is working.'
            }
          ],
          max_tokens: 50,
          temperature: 0.1
        });

        const responseTime = Date.now() - startTime;
        
        if (testResponse.choices && testResponse.choices.length > 0) {
          this.updatePerformanceMetrics(modelId, true, responseTime);
          return {
            success: true,
            message: 'Model test successful',
            responseTime
          };
        } else {
          throw new Error('Invalid response format');
        }
      } else if (client instanceof GeminiClient) {
        // Test Gemini client
        const testResult = await client.testConnection();
        const responseTime = Date.now() - startTime;
        
        if (testResult.success) {
          this.updatePerformanceMetrics(modelId, true, responseTime);
          return {
            success: true,
            message: 'Model test successful',
            responseTime
          };
        } else {
          throw new Error(testResult.error || 'Test failed');
        }
      } else {
        throw new Error('Unknown client type');
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.updatePerformanceMetrics(modelId, false, responseTime);
      
      return {
        success: false,
        message: `Model test failed: ${errorMessage}`,
        responseTime
      };
    }
  }

  /**
   * Add a new model
   */
  async addModel(model: AIModelConfig): Promise<void> {
    // Validate model configuration
    if (!model.id || !model.name || !model.provider || !model.apiKey) {
      throw new Error('Invalid model configuration: missing required fields');
    }

    // Test the model before adding
    const client = this.createClient(model);
    if (!client) {
      throw new Error(`Unable to create client for provider: ${model.provider}`);
    }

    // Add to maps
    this.models.set(model.id, model);
    this.clients.set(model.id, client);
    
    // Initialize performance metrics
    this.performanceMetrics.set(model.id, {
      modelId: model.id,
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      averageResponseTime: 0,
      successRate: 0,
      lastUsed: null,
      isHealthy: true
    });

    console.log(`✅ Added new model: ${model.name} (${model.id})`);
  }

  /**
   * Remove a model
   */
  removeModel(modelId: string): void {
    this.models.delete(modelId);
    this.clients.delete(modelId);
    this.performanceMetrics.delete(modelId);
    this.fallbackSystem.resetModelHealth(modelId);
    
    console.log(`🗑️ Removed model: ${modelId}`);
  }

  /**
   * Update a model configuration
   */
  async updateModel(modelId: string, updates: Partial<AIModelConfig>): Promise<void> {
    const existingModel = this.models.get(modelId);
    if (!existingModel) {
      throw new Error(`Model ${modelId} not found`);
    }

    const updatedModel = { ...existingModel, ...updates };
    
    // If API key or provider changed, recreate the client
    if (updates.apiKey || updates.provider || updates.endpoint) {
      const newClient = this.createClient(updatedModel);
      if (newClient) {
        this.clients.set(modelId, newClient);
      }
    }

    this.models.set(modelId, updatedModel);
    
    console.log(`🔄 Updated model: ${updatedModel.name} (${modelId})`);
  }

  /**
   * Get model by ID
   */
  getModel(modelId: string): AIModelConfig | undefined {
    return this.models.get(modelId);
  }

  /**
   * Get all models
   */
  getAllModels(): AIModelConfig[] {
    return Array.from(this.models.values());
  }

  /**
   * Get models by tier
   */
  getModelsByTier(tier: 'free' | 'premium'): AIModelConfig[] {
    return Array.from(this.models.values()).filter(model => model.tier === tier);
  }

  /**
   * Get performance metrics for all models
   */
  getPerformanceMetrics(): ModelPerformanceMetrics[] {
    return Array.from(this.performanceMetrics.values());
  }

  /**
   * Get performance metrics for a specific model
   */
  getModelPerformanceMetrics(modelId: string): ModelPerformanceMetrics | undefined {
    return this.performanceMetrics.get(modelId);
  }

  /**
   * Get fallback system health status
   */
  getHealthStatus() {
    return this.fallbackSystem.getModelHealthStatus();
  }

  /**
   * Get comprehensive statistics
   */
  getStats() {
    const fallbackStats = this.fallbackSystem.getStats();
    const modelStats = Array.from(this.models.values()).map(model => ({
      id: model.id,
      name: model.name,
      provider: model.provider,
      tier: model.tier,
      isActive: model.isActive,
      priority: model.priority,
      performance: this.performanceMetrics.get(model.id),
      health: this.fallbackSystem.getModelHealth(model.id)
    }));

    return {
      totalModels: this.models.size,
      activeModels: Array.from(this.models.values()).filter(m => m.isActive).length,
      fallbackSystem: fallbackStats,
      models: modelStats
    };
  }

  /**
   * Create appropriate client for model
   */
  private createClient(model: AIModelConfig): OpenRouterClient | GeminiClient | null {
    try {
      switch (model.provider.toLowerCase()) {
        case 'openrouter':
        case 'openai':
        case 'anthropic':
        case 'custom':
          return new OpenRouterClient({
            apiKey: model.apiKey,
            baseUrl: model.endpoint || 'https://openrouter.ai/api/v1',
            model: this.getModelName(model),
            maxRetries: 3,
            timeoutMs: 30000
          });

        case 'gemini':
        case 'google':
          return new GeminiClient({
            apiKey: model.apiKey,
            model: this.getModelName(model),
            maxRetries: 3,
            timeoutMs: 30000,
            rateLimitPerMinute: model.rateLimits.requestsPerMinute
          });

        default:
          console.warn(`Unknown provider: ${model.provider}`);
          return null;
      }
    } catch (error) {
      console.error(`Failed to create client for model ${model.id}:`, error);
      return null;
    }
  }

  /**
   * Get model name for API calls
   */
  private getModelName(model: AIModelConfig): string {
    // If model has a specific model name in the config, use it
    // Otherwise, use a default based on provider
    switch (model.provider.toLowerCase()) {
      case 'openrouter':
        return model.name.includes('/') ? model.name : 'meta-llama/llama-3.1-8b-instruct:free';
      case 'gemini':
      case 'google':
        return model.name.includes('gemini') ? model.name : 'gemini-1.5-flash';
      case 'openai':
        return model.name.includes('gpt') ? model.name : 'gpt-3.5-turbo';
      case 'anthropic':
        return model.name.includes('claude') ? model.name : 'claude-3-haiku-20240307';
      default:
        return model.name;
    }
  }

  /**
   * Update performance metrics for a model
   */
  private updatePerformanceMetrics(modelId: string, success: boolean, responseTime: number): void {
    const metrics = this.performanceMetrics.get(modelId);
    if (!metrics) return;

    metrics.totalCalls++;
    metrics.lastUsed = new Date();

    if (success) {
      metrics.successfulCalls++;
      
      // Update average response time (only for successful calls)
      const totalSuccessTime = metrics.averageResponseTime * (metrics.successfulCalls - 1);
      metrics.averageResponseTime = (totalSuccessTime + responseTime) / metrics.successfulCalls;
    } else {
      metrics.failedCalls++;
    }

    metrics.successRate = (metrics.successfulCalls / metrics.totalCalls) * 100;
    
    // Update health status based on recent performance
    const health = this.fallbackSystem.getModelHealth(modelId);
    if (health) {
      metrics.isHealthy = health.isHealthy;
    }

    this.performanceMetrics.set(modelId, metrics);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.fallbackSystem.destroy();
    this.models.clear();
    this.clients.clear();
    this.performanceMetrics.clear();
  }
}

// Default AI model manager instance - will be initialized when models are loaded
export let aiModelManager: AIModelManager | null = null;

/**
 * Initialize the AI model manager with configuration
 */
export function initializeAIModelManager(config: ModelManagerConfig): void {
  if (aiModelManager) {
    aiModelManager.destroy();
  }
  
  aiModelManager = new AIModelManager(config);
  console.log('🚀 AI Model Manager initialized');
}

/**
 * Get the current AI model manager instance
 */
export function getAIModelManager(): AIModelManager {
  if (!aiModelManager) {
    throw new Error('AI Model Manager not initialized. Call initializeAIModelManager() first.');
  }
  
  return aiModelManager;
}