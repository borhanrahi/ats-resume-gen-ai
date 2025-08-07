"use client";

import { useState, useEffect, useCallback } from 'react';
import type { AIModelConfig, ModelConfigUpdate } from '@/types/admin';

export interface ModelTestResult {
  success: boolean;
  message: string;
  responseTime?: number;
}

export interface ModelAnalytics {
  overview: {
    totalModels: number;
    activeModels: number;
    healthyModels: number;
    totalCalls: number;
    overallSuccessRate: number;
  };
  performanceMetrics: Array<{
    modelId: string;
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    averageResponseTime: number;
    successRate: number;
    lastUsed: Date | null;
    isHealthy: boolean;
  }>;
  healthStatus: Array<{
    modelId: string;
    isHealthy: boolean;
    lastSuccessfulCall: Date | null;
    lastFailure: Date | null;
    consecutiveFailures: number;
    averageResponseTime: number;
    successRate: number;
    errorRate: number;
  }>;
  costEstimates: Array<{
    modelId: string;
    totalCalls: number;
    costPerRequest: number;
    estimatedCost: number;
    currency: string;
  }>;
  usageTrends: Array<{
    modelId: string;
    timeRange: string;
    unit: string;
    data: Array<{
      timestamp: string;
      usage: number;
      successRate: number;
    }>;
  }>;
  efficiencyMetrics: {
    overall: {
      totalCalls: number;
      totalSuccessful: number;
      overallSuccessRate: number;
      averageResponseTime: number;
    };
    bestPerforming: {
      modelId: string | null;
      successRate: number;
      totalCalls: number;
    };
    worstPerforming: {
      modelId: string | null;
      successRate: number;
      totalCalls: number;
    };
    fastest: {
      modelId: string | null;
      averageResponseTime: number;
      totalCalls: number;
    };
    recommendations: Array<{
      type: string;
      priority: string;
      title: string;
      description: string;
      action: string;
      models: string[];
    }>;
  };
}

export interface UseModelManagementReturn {
  // State
  models: AIModelConfig[];
  analytics: ModelAnalytics | null;
  loading: boolean;
  error: string | null;
  testResults: Record<string, ModelTestResult>;
  
  // Actions
  refreshModels: () => Promise<void>;
  addModel: (model: Omit<AIModelConfig, 'id'>) => Promise<void>;
  updateModel: (modelId: string, updates: Partial<AIModelConfig>) => Promise<void>;
  deleteModel: (modelId: string) => Promise<void>;
  testModel: (modelId: string) => Promise<ModelTestResult>;
  setPrimaryModel: (modelId: string, tier: 'free' | 'premium') => Promise<void>;
  refreshAnalytics: (timeRange?: string, modelId?: string) => Promise<void>;
  
  // Real-time features
  startRealTimeUpdates: () => void;
  stopRealTimeUpdates: () => void;
  isRealTimeActive: boolean;
}

export function useModelManagement(): UseModelManagementReturn {
  const [models, setModels] = useState<AIModelConfig[]>([]);
  const [analytics, setAnalytics] = useState<ModelAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, ModelTestResult>>({});
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);
  const [realTimeInterval, setRealTimeInterval] = useState<NodeJS.Timeout | null>(null);

  // API call helper
  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer admin-token', // TODO: Replace with real auth
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'API call failed');
    }

    return data.data;
  }, []);

  // Refresh models from API
  const refreshModels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiCall('/api/admin/ai-config');
      setModels(data.models || []);
      
      // Update analytics if we have the data
      if (data.stats && data.healthStatus && data.performanceMetrics) {
        setAnalytics(prev => ({
          ...prev,
          overview: {
            totalModels: data.stats.totalModels,
            activeModels: data.stats.activeModels,
            healthyModels: data.stats.fallbackSystem.healthyModels,
            totalCalls: data.stats.fallbackSystem.totalCalls,
            overallSuccessRate: data.stats.fallbackSystem.overallSuccessRate
          },
          performanceMetrics: data.performanceMetrics,
          healthStatus: data.healthStatus
        } as ModelAnalytics));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh models');
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Add new model
  const addModel = useCallback(async (model: Omit<AIModelConfig, 'id'>) => {
    try {
      setLoading(true);
      setError(null);

      await apiCall('/api/admin/ai-config', {
        method: 'POST',
        body: JSON.stringify({ model }),
      });

      // Refresh models to get the updated list
      await refreshModels();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add model');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall, refreshModels]);

  // Update existing model
  const updateModel = useCallback(async (modelId: string, updates: Partial<AIModelConfig>) => {
    try {
      setLoading(true);
      setError(null);

      await apiCall('/api/admin/ai-config', {
        method: 'PUT',
        body: JSON.stringify({ modelId, updates }),
      });

      // Update local state immediately for better UX
      setModels(prev => prev.map(model => 
        model.id === modelId ? { ...model, ...updates } : model
      ));

      // Refresh to ensure consistency
      await refreshModels();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update model');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall, refreshModels]);

  // Delete model
  const deleteModel = useCallback(async (modelId: string) => {
    try {
      setLoading(true);
      setError(null);

      await apiCall(`/api/admin/ai-config/${modelId}`, {
        method: 'DELETE',
      });

      // Remove from local state immediately
      setModels(prev => prev.filter(model => model.id !== modelId));
      
      // Clear test results for deleted model
      setTestResults(prev => {
        const { [modelId]: _, ...rest } = prev;
        return rest;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete model');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Test model
  const testModel = useCallback(async (modelId: string): Promise<ModelTestResult> => {
    try {
      setError(null);

      // Set loading state for this specific model
      setTestResults(prev => ({
        ...prev,
        [modelId]: { success: false, message: 'Testing...', responseTime: 0 }
      }));

      const result = await apiCall('/api/admin/ai-config/test', {
        method: 'POST',
        body: JSON.stringify({ modelId }),
      });

      // Update test results
      setTestResults(prev => ({
        ...prev,
        [modelId]: result
      }));

      return result;
    } catch (err) {
      const errorResult = {
        success: false,
        message: err instanceof Error ? err.message : 'Test failed'
      };

      setTestResults(prev => ({
        ...prev,
        [modelId]: errorResult
      }));

      return errorResult;
    }
  }, [apiCall]);

  // Set primary model for a tier
  const setPrimaryModel = useCallback(async (modelId: string, tier: 'free' | 'premium') => {
    try {
      setLoading(true);
      setError(null);

      // First, update all models of the same tier to not be primary (priority > 1)
      const updates = models
        .filter(model => model.tier === tier && model.id !== modelId)
        .map(model => updateModel(model.id, { priority: model.priority === 1 ? 2 : model.priority }));

      await Promise.all(updates);

      // Then set the selected model as primary (priority = 1)
      await updateModel(modelId, { priority: 1 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set primary model');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [models, updateModel]);

  // Refresh analytics
  const refreshAnalytics = useCallback(async (timeRange = '24h', modelId?: string) => {
    try {
      setError(null);

      const params = new URLSearchParams({ timeRange });
      if (modelId) params.append('modelId', modelId);

      const data = await apiCall(`/api/admin/ai-config/analytics?${params}`);
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh analytics');
    }
  }, [apiCall]);

  // Start real-time updates
  const startRealTimeUpdates = useCallback(() => {
    if (realTimeInterval) return; // Already active

    setIsRealTimeActive(true);
    
    const interval = setInterval(async () => {
      try {
        await Promise.all([
          refreshModels(),
          refreshAnalytics()
        ]);
      } catch (err) {
        console.error('Real-time update failed:', err);
      }
    }, 30000); // Update every 30 seconds

    setRealTimeInterval(interval);
  }, [realTimeInterval, refreshModels, refreshAnalytics]);

  // Stop real-time updates
  const stopRealTimeUpdates = useCallback(() => {
    if (realTimeInterval) {
      clearInterval(realTimeInterval);
      setRealTimeInterval(null);
    }
    setIsRealTimeActive(false);
  }, [realTimeInterval]);

  // Initial load
  useEffect(() => {
    refreshModels();
    refreshAnalytics();
  }, [refreshModels, refreshAnalytics]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (realTimeInterval) {
        clearInterval(realTimeInterval);
      }
    };
  }, [realTimeInterval]);

  return {
    // State
    models,
    analytics,
    loading,
    error,
    testResults,
    
    // Actions
    refreshModels,
    addModel,
    updateModel,
    deleteModel,
    testModel,
    setPrimaryModel,
    refreshAnalytics,
    
    // Real-time features
    startRealTimeUpdates,
    stopRealTimeUpdates,
    isRealTimeActive,
  };
}