'use client';

import { useState, useEffect, useCallback } from 'react';
import { usageTracker } from '@/lib/storage/usageTracker';
import { UserUsage } from '@/types/user';
import { ResumeData } from '@/types/resume';
import { ATSAnalysis, JobDescription } from '@/types/analysis';

interface UseUsageLimitReturn {
  usage: UserUsage | null;
  canAnalyze: boolean;
  remaining: number;
  isLoading: boolean;
  error: string | null;
  recordAnalysis: (
    resumeData: ResumeData,
    analysis: ATSAnalysis,
    jobDescription?: JobDescription
  ) => Promise<string>;
  refreshUsage: () => void;
  checkLimit: () => boolean;
  getUsageStats: () => any;
}

/**
 * Hook for managing usage limits and enforcement
 * Provides real-time usage tracking and limit enforcement
 */
export function useUsageLimit(): UseUsageLimitReturn {
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load usage data
  const loadUsage = useCallback(() => {
    try {
      setIsLoading(true);
      setError(null);
      const currentUsage = usageTracker.getCurrentUsage();
      setUsage(currentUsage);
    } catch (err) {
      console.error('Error loading usage:', err);
      setError('Failed to load usage data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize usage data only on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadUsage();
    }
  }, [loadUsage]);

  // Check if user can analyze
  const canAnalyze = usage ? usage.dailyCount < 5 : false;
  
  // Get remaining analyses
  const remaining = usage ? Math.max(0, 5 - usage.dailyCount) : 0;

  // Record a new analysis
  const recordAnalysis = useCallback(async (
    resumeData: ResumeData,
    analysis: ATSAnalysis,
    jobDescription?: JobDescription
  ): Promise<string> => {
    try {
      // Check limit before recording
      if (!usageTracker.canAnalyze()) {
        throw new Error('Daily analysis limit exceeded');
      }

      const analysisId = usageTracker.recordAnalysis(
        resumeData,
        analysis,
        jobDescription
      );

      // Refresh usage data
      loadUsage();

      return analysisId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record analysis';
      setError(errorMessage);
      throw err;
    }
  }, [loadUsage]);

  // Refresh usage data
  const refreshUsage = useCallback(() => {
    loadUsage();
  }, [loadUsage]);

  // Check limit without recording
  const checkLimit = useCallback(() => {
    return usageTracker.canAnalyze();
  }, []);

  // Get usage statistics
  const getUsageStats = useCallback(() => {
    return usageTracker.getUsageStats();
  }, []);

  return {
    usage,
    canAnalyze,
    remaining,
    isLoading,
    error,
    recordAnalysis,
    refreshUsage,
    checkLimit,
    getUsageStats
  };
}

export default useUsageLimit;