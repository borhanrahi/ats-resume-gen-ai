import { NextRequest, NextResponse } from 'next/server';
import { getAIModelManager } from '@/lib/ai/aiModelManager';

// Mock admin authentication - replace with real auth
function isAdminAuthenticated(request: NextRequest): boolean {
  // TODO: Implement real admin authentication
  const authHeader = request.headers.get('authorization');
  return authHeader === 'Bearer admin-token';
}

/**
 * GET /api/admin/ai-config/analytics
 * Get AI model usage analytics and cost tracking
 */
export async function GET(request: NextRequest) {
  try {
    if (!isAdminAuthenticated(request)) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin authentication required' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h'; // 24h, 7d, 30d
    const modelId = searchParams.get('modelId'); // Optional: filter by specific model

    const manager = getAIModelManager();
    const stats = manager.getStats();
    const performanceMetrics = manager.getPerformanceMetrics();
    const healthStatus = manager.getHealthStatus();

    // Filter by model if specified
    const filteredMetrics = modelId 
      ? performanceMetrics.filter(m => m.modelId === modelId)
      : performanceMetrics;

    // Calculate cost estimates (mock implementation)
    const costEstimates = calculateCostEstimates(filteredMetrics, timeRange);

    // Generate usage trends (mock implementation)
    const usageTrends = generateUsageTrends(filteredMetrics, timeRange);

    // Calculate efficiency metrics
    const efficiencyMetrics = calculateEfficiencyMetrics(filteredMetrics);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalModels: stats.totalModels,
          activeModels: stats.activeModels,
          healthyModels: stats.fallbackSystem.healthyModels,
          totalCalls: stats.fallbackSystem.totalCalls,
          overallSuccessRate: stats.fallbackSystem.overallSuccessRate
        },
        performanceMetrics: filteredMetrics,
        healthStatus,
        costEstimates,
        usageTrends,
        efficiencyMetrics,
        timeRange
      }
    });

  } catch (error) {
    console.error('Error fetching AI analytics:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch AI analytics',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate cost estimates for models
 */
function calculateCostEstimates(metrics: any[], timeRange: string) {
  // Mock cost calculation - replace with real pricing data
  const costPerRequest = {
    'openrouter': 0.001, // $0.001 per request
    'gemini': 0.0005,    // $0.0005 per request
    'claude': 0.002,     // $0.002 per request
    'openai': 0.0015     // $0.0015 per request
  };

  const multiplier = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;

  return metrics.map(metric => {
    const provider = metric.modelId.split('-')[0] as keyof typeof costPerRequest;
    const costPer = costPerRequest[provider] || 0.001;
    const estimatedCost = metric.totalCalls * costPer * multiplier;

    return {
      modelId: metric.modelId,
      totalCalls: metric.totalCalls * multiplier,
      costPerRequest: costPer,
      estimatedCost: estimatedCost,
      currency: 'USD'
    };
  });
}

/**
 * Generate usage trends over time
 */
function generateUsageTrends(metrics: any[], timeRange: string) {
  // Mock trend data - replace with real time-series data
  const points = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30;
  const unit = timeRange === '24h' ? 'hour' : 'day';

  return metrics.map(metric => {
    const trend = [];
    const baseUsage = metric.totalCalls / points;

    for (let i = 0; i < points; i++) {
      // Generate mock trend with some variation
      const variation = (Math.random() - 0.5) * 0.4; // ±20% variation
      const usage = Math.max(0, Math.round(baseUsage * (1 + variation)));
      
      const timestamp = new Date();
      if (unit === 'hour') {
        timestamp.setHours(timestamp.getHours() - (points - i - 1));
      } else {
        timestamp.setDate(timestamp.getDate() - (points - i - 1));
      }

      trend.push({
        timestamp: timestamp.toISOString(),
        usage,
        successRate: Math.max(70, metric.successRate + (Math.random() - 0.5) * 10)
      });
    }

    return {
      modelId: metric.modelId,
      timeRange,
      unit,
      data: trend
    };
  });
}

/**
 * Calculate efficiency metrics
 */
function calculateEfficiencyMetrics(metrics: any[]) {
  const totalCalls = metrics.reduce((sum, m) => sum + m.totalCalls, 0);
  const totalSuccessful = metrics.reduce((sum, m) => sum + m.successfulCalls, 0);
  const avgResponseTime = metrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / metrics.length;

  // Find best and worst performing models
  const bestModel = metrics.reduce((best, current) => 
    current.successRate > best.successRate ? current : best, 
    metrics[0] || { successRate: 0 }
  );

  const worstModel = metrics.reduce((worst, current) => 
    current.successRate < worst.successRate ? current : worst, 
    metrics[0] || { successRate: 100 }
  );

  const fastestModel = metrics.reduce((fastest, current) => 
    current.averageResponseTime < fastest.averageResponseTime ? current : fastest, 
    metrics[0] || { averageResponseTime: Infinity }
  );

  return {
    overall: {
      totalCalls,
      totalSuccessful,
      overallSuccessRate: totalCalls > 0 ? (totalSuccessful / totalCalls) * 100 : 0,
      averageResponseTime: avgResponseTime || 0
    },
    bestPerforming: {
      modelId: bestModel?.modelId || null,
      successRate: bestModel?.successRate || 0,
      totalCalls: bestModel?.totalCalls || 0
    },
    worstPerforming: {
      modelId: worstModel?.modelId || null,
      successRate: worstModel?.successRate || 0,
      totalCalls: worstModel?.totalCalls || 0
    },
    fastest: {
      modelId: fastestModel?.modelId || null,
      averageResponseTime: fastestModel?.averageResponseTime || 0,
      totalCalls: fastestModel?.totalCalls || 0
    },
    recommendations: generateRecommendations(metrics)
  };
}

/**
 * Generate optimization recommendations
 */
function generateRecommendations(metrics: any[]) {
  const recommendations = [];

  // Check for underperforming models
  const underperforming = metrics.filter(m => m.successRate < 80);
  if (underperforming.length > 0) {
    recommendations.push({
      type: 'performance',
      priority: 'high',
      title: 'Low Success Rate Models',
      description: `${underperforming.length} model(s) have success rates below 80%`,
      action: 'Consider disabling or investigating these models',
      models: underperforming.map(m => m.modelId)
    });
  }

  // Check for slow models
  const slowModels = metrics.filter(m => m.averageResponseTime > 10000); // 10 seconds
  if (slowModels.length > 0) {
    recommendations.push({
      type: 'performance',
      priority: 'medium',
      title: 'Slow Response Times',
      description: `${slowModels.length} model(s) have average response times over 10 seconds`,
      action: 'Consider optimizing timeout settings or model configuration',
      models: slowModels.map(m => m.modelId)
    });
  }

  // Check for unused models
  const unusedModels = metrics.filter(m => m.totalCalls === 0);
  if (unusedModels.length > 0) {
    recommendations.push({
      type: 'optimization',
      priority: 'low',
      title: 'Unused Models',
      description: `${unusedModels.length} model(s) have not been used`,
      action: 'Consider removing unused models to reduce complexity',
      models: unusedModels.map(m => m.modelId)
    });
  }

  // Check for cost optimization
  const highUsageModels = metrics.filter(m => m.totalCalls > 1000);
  if (highUsageModels.length > 0) {
    recommendations.push({
      type: 'cost',
      priority: 'medium',
      title: 'High Usage Models',
      description: `${highUsageModels.length} model(s) have high usage that may impact costs`,
      action: 'Monitor costs and consider rate limiting if necessary',
      models: highUsageModels.map(m => m.modelId)
    });
  }

  return recommendations;
}