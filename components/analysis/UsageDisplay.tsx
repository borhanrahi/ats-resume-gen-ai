'use client';

import React, { useState, useEffect } from 'react';
import { usageTracker } from '@/lib/storage/usageTracker';
import { UserUsage } from '@/types/user';
import { 
  BarChart3, 
  Clock, 
  TrendingUp, 
  Zap,
  Crown,
  RefreshCw
} from 'lucide-react';

interface UsageDisplayProps {
  className?: string;
  showUpgradePrompt?: boolean;
  onUpgradeClick?: () => void;
}

/**
 * Mobile-first usage display component showing remaining analyses
 * Follows mobile-first design principles with progressive enhancement
 */
export function UsageDisplay({ 
  className = '', 
  showUpgradePrompt = true,
  onUpgradeClick 
}: UsageDisplayProps) {
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [stats, setStats] = useState<{
    totalAnalyses: number;
    todayAnalyses: number;
    remainingToday: number;
    averageScore: number;
    lastAnalysisDate: Date | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadUsageData();
    }
  }, []);

  const loadUsageData = () => {
    try {
      setIsLoading(true);
      const currentUsage = usageTracker.getCurrentUsage();
      const usageStats = usageTracker.getUsageStats();
      
      setUsage(currentUsage);
      setStats(usageStats);
    } catch (error) {
      console.error('Error loading usage data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadUsageData();
  };

  if (isLoading) {
    return (
      <div className={`w-full bg-card border border-border rounded-lg ${className}`}>
        <div className="p-4 md:p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!usage || !stats) {
    return (
      <div className={`w-full bg-card border border-border rounded-lg ${className}`}>
        <div className="p-4 md:p-6">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Unable to load usage data</p>
            <button 
              onClick={handleRefresh}
              className="mt-2 min-h-[44px] px-4 py-2 bg-background border border-border rounded-md hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <RefreshCw className="w-4 h-4 mr-2 inline" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progressPercentage = (usage.dailyCount / 5) * 100;
  const isLimitReached = usage.dailyCount >= 5;
  const remaining = Math.max(0, 5 - usage.dailyCount);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Usage Card - Mobile-first design */}
      <div className="w-full bg-card border border-border rounded-lg">
        <div className="p-4 md:p-6 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Daily Usage
            </h2>
            <div className="flex items-center gap-2">
              <span 
                className={`px-2 py-1 text-xs rounded-full ${
                  isLimitReached 
                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" 
                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                }`}
              >
                {usage.dailyCount}/5 Used
              </span>
              <button
                onClick={handleRefresh}
                className="min-h-[44px] min-w-[44px] p-2 hover:bg-muted rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="px-4 md:px-6 pb-4 md:pb-6 space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Analyses Today</span>
              <span className="font-medium">
                {remaining} remaining
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  isLimitReached ? "bg-red-500" : "bg-blue-500"
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Status Message */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            {isLimitReached ? (
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    Daily limit reached
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your usage will reset tomorrow. Upgrade for unlimited analyses.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {remaining} analyses remaining
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Free tier includes 5 analyses per day
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Stats Grid - Mobile-first responsive */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg md:text-xl font-bold text-blue-600">
                {stats.totalAnalyses}
              </div>
              <div className="text-xs text-gray-600">
                Total Analyses
              </div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg md:text-xl font-bold text-green-600">
                {stats.averageScore}
              </div>
              <div className="text-xs text-gray-600">
                Avg Score
              </div>
            </div>
          </div>

          {/* Upgrade Prompt - Mobile-first */}
          {showUpgradePrompt && (
            <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-start gap-3">
                <Crown className="w-6 h-6 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold mb-1">
                    Upgrade to Premium
                  </h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Get unlimited analyses, advanced features, and priority support
                  </p>
                  <button
                    onClick={onUpgradeClick}
                    className="w-full sm:w-auto min-h-[44px] px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 flex items-center justify-center gap-2"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Upgrade Now
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Last Analysis Info - Mobile-first */}
      {stats.lastAnalysisDate && (
        <div className="w-full bg-card border border-border rounded-lg">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground">
                  Last analysis: {stats.lastAnalysisDate.toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsageDisplay;