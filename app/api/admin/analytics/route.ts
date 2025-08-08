import { NextRequest, NextResponse } from 'next/server';
import { withSystemAnalyticsAuth } from '../../../lib/auth/adminMiddleware';
import { databases, DATABASE_ID, COLLECTIONS } from '../../../lib/auth/appwrite';
import { Query } from 'appwrite';

// System analytics interfaces
interface SystemOverview {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  totalAnalyses: number;
  systemUptime: number;
  errorRate: number;
  averageResponseTime: number;
}

interface APIMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  requestsPerHour: number;
  topEndpoints: Array<{
    endpoint: string;
    requests: number;
    averageResponseTime: number;
    errorRate: number;
  }>;
}

interface AIModelMetrics {
  totalAIRequests: number;
  successfulAIRequests: number;
  failedAIRequests: number;
  averageAIResponseTime: number;
  modelUsage: Array<{
    modelId: string;
    modelName: string;
    requests: number;
    successRate: number;
    averageResponseTime: number;
    fallbacksTriggered: number;
  }>;
  fallbackStats: {
    totalFallbacks: number;
    fallbackSuccessRate: number;
    mostCommonFallbackReason: string;
  };
}

interface RevenueMetrics {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  averageRevenuePerUser: number;
  conversionRate: number;
  churnRate: number;
  revenueGrowth: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  paymentMethods: Array<{
    method: string;
    count: number;
    percentage: number;
  }>;
}

interface PerformanceMetrics {
  serverMetrics: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkIO: number;
  };
  databaseMetrics: {
    connectionCount: number;
    queryTime: number;
    slowQueries: number;
  };
  cacheMetrics: {
    hitRate: number;
    missRate: number;
    evictionRate: number;
  };
}

interface SystemAnalyticsResponse {
  overview: SystemOverview;
  api: APIMetrics;
  aiModels: AIModelMetrics;
  revenue: RevenueMetrics;
  performance: PerformanceMetrics;
  timestamp: string;
}

// Calculate system overview metrics
async function calculateSystemOverview(): Promise<SystemOverview> {
  try {
    // In production, these would be actual database queries and system metrics
    // Mock data for development
    return {
      totalUsers: 1247,
      activeUsers: 1089,
      premiumUsers: 312,
      totalAnalyses: 10847,
      systemUptime: 99.8, // percentage
      errorRate: 0.2, // percentage
      averageResponseTime: 245 // milliseconds
    };
  } catch (error) {
    console.error('System overview calculation failed:', error);
    throw error;
  }
}

// Calculate API metrics
async function calculateAPIMetrics(): Promise<APIMetrics> {
  try {
    // In production, these would be calculated from request logs
    // Mock data for development
    return {
      totalRequests: 45678,
      successfulRequests: 45587,
      failedRequests: 91,
      averageResponseTime: 245,
      requestsPerHour: 1902,
      topEndpoints: [
        {
          endpoint: '/api/analyze',
          requests: 18934,
          averageResponseTime: 1250,
          errorRate: 0.1
        },
        {
          endpoint: '/api/admin/users',
          requests: 8765,
          averageResponseTime: 180,
          errorRate: 0.05
        },
        {
          endpoint: '/api/export',
          requests: 5432,
          averageResponseTime: 890,
          errorRate: 0.3
        },
        {
          endpoint: '/api/auth/login',
          requests: 4321,
          averageResponseTime: 120,
          errorRate: 2.1
        },
        {
          endpoint: '/api/admin/analytics',
          requests: 2876,
          averageResponseTime: 340,
          errorRate: 0.0
        }
      ]
    };
  } catch (error) {
    console.error('API metrics calculation failed:', error);
    throw error;
  }
}

// Calculate AI model metrics
async function calculateAIModelMetrics(): Promise<AIModelMetrics> {
  try {
    // In production, these would be calculated from AI request logs
    // Mock data for development
    return {
      totalAIRequests: 12456,
      successfulAIRequests: 12234,
      failedAIRequests: 222,
      averageAIResponseTime: 2340,
      modelUsage: [
        {
          modelId: 'openrouter-free',
          modelName: 'OpenRouter Free',
          requests: 7834,
          successRate: 98.2,
          averageResponseTime: 2100,
          fallbacksTriggered: 45
        },
        {
          modelId: 'gemini-free',
          modelName: 'Gemini Free',
          requests: 2876,
          successRate: 97.8,
          averageResponseTime: 1890,
          fallbacksTriggered: 23
        },
        {
          modelId: 'openrouter-premium',
          modelName: 'OpenRouter Premium',
          requests: 1456,
          successRate: 99.1,
          averageResponseTime: 1650,
          fallbacksTriggered: 8
        },
        {
          modelId: 'gemini-premium',
          modelName: 'Gemini Premium',
          requests: 290,
          successRate: 98.9,
          averageResponseTime: 1420,
          fallbacksTriggered: 2
        }
      ],
      fallbackStats: {
        totalFallbacks: 78,
        fallbackSuccessRate: 89.7,
        mostCommonFallbackReason: 'Rate limit exceeded'
      }
    };
  } catch (error) {
    console.error('AI model metrics calculation failed:', error);
    throw error;
  }
}

// Calculate revenue metrics
async function calculateRevenueMetrics(): Promise<RevenueMetrics> {
  try {
    // In production, these would be calculated from payment records
    // Mock data for development
    const totalUsers = 1247;
    const premiumUsers = 312;
    const monthlyPrice = 9.99;
    
    return {
      totalRevenue: 28456.78,
      monthlyRecurringRevenue: premiumUsers * monthlyPrice,
      averageRevenuePerUser: 28456.78 / totalUsers,
      conversionRate: (premiumUsers / totalUsers) * 100,
      churnRate: 2.3,
      revenueGrowth: {
        daily: 1.2,
        weekly: 8.7,
        monthly: 15.4
      },
      paymentMethods: [
        { method: 'Credit Card', count: 245, percentage: 78.5 },
        { method: 'PayPal', count: 52, percentage: 16.7 },
        { method: 'Bank Transfer', count: 15, percentage: 4.8 }
      ]
    };
  } catch (error) {
    console.error('Revenue metrics calculation failed:', error);
    throw error;
  }
}

// Calculate performance metrics
async function calculatePerformanceMetrics(): Promise<PerformanceMetrics> {
  try {
    // In production, these would be actual system metrics
    // Mock data for development
    return {
      serverMetrics: {
        cpuUsage: 45.2,
        memoryUsage: 67.8,
        diskUsage: 23.4,
        networkIO: 156.7
      },
      databaseMetrics: {
        connectionCount: 23,
        queryTime: 45.6,
        slowQueries: 3
      },
      cacheMetrics: {
        hitRate: 89.4,
        missRate: 10.6,
        evictionRate: 2.1
      }
    };
  } catch (error) {
    console.error('Performance metrics calculation failed:', error);
    throw error;
  }
}

// GET /api/admin/analytics - Get comprehensive system analytics
const getSystemAnalyticsHandler = async (request: NextRequest, { user }: { user: any }) => {
  try {
    const { searchParams } = new URL(request.url);
    const includeOverview = searchParams.get('overview') !== 'false';
    const includeAPI = searchParams.get('api') !== 'false';
    const includeAI = searchParams.get('ai') !== 'false';
    const includeRevenue = searchParams.get('revenue') !== 'false';
    const includePerformance = searchParams.get('performance') !== 'false';
    const timeRange = searchParams.get('timeRange') || '24h'; // 1h, 24h, 7d, 30d

    const analytics: Partial<SystemAnalyticsResponse> = {
      timestamp: new Date().toISOString()
    };

    // Calculate metrics based on query parameters
    const promises: Promise<void>[] = [];

    if (includeOverview) {
      promises.push(
        calculateSystemOverview().then(data => {
          analytics.overview = data;
        })
      );
    }

    if (includeAPI) {
      promises.push(
        calculateAPIMetrics().then(data => {
          analytics.api = data;
        })
      );
    }

    if (includeAI) {
      promises.push(
        calculateAIModelMetrics().then(data => {
          analytics.aiModels = data;
        })
      );
    }

    if (includeRevenue) {
      promises.push(
        calculateRevenueMetrics().then(data => {
          analytics.revenue = data;
        })
      );
    }

    if (includePerformance) {
      promises.push(
        calculatePerformanceMetrics().then(data => {
          analytics.performance = data;
        })
      );
    }

    // Wait for all calculations to complete
    await Promise.all(promises);

    return NextResponse.json({
      success: true,
      analytics,
      timeRange,
      generatedAt: new Date().toISOString(),
      cacheExpiry: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
    });

  } catch (error) {
    console.error('System analytics error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch system analytics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

export const GET = withSystemAnalyticsAuth(getSystemAnalyticsHandler);

// POST /api/admin/analytics - Trigger analytics recalculation
const recalculateAnalyticsHandler = async (request: NextRequest, { user }: { user: any }) => {
  try {
    const body = await request.json();
    const { metrics = ['all'], force = false } = body;

    // Validate metrics parameter
    const validMetrics = ['all', 'overview', 'api', 'ai', 'revenue', 'performance'];
    const requestedMetrics = Array.isArray(metrics) ? metrics : [metrics];
    
    const invalidMetrics = requestedMetrics.filter(m => !validMetrics.includes(m));
    if (invalidMetrics.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid metrics specified',
          message: `Invalid metrics: ${invalidMetrics.join(', ')}`,
          validMetrics
        },
        { status: 400 }
      );
    }

    // Check if recalculation is needed (unless forced)
    if (!force) {
      // In production, check last calculation time from cache/database
      const lastCalculation = new Date(Date.now() - 4 * 60 * 1000); // Mock: 4 minutes ago
      const minInterval = 5 * 60 * 1000; // 5 minutes minimum interval
      
      if (Date.now() - lastCalculation.getTime() < minInterval) {
        return NextResponse.json(
          {
            success: false,
            error: 'Recalculation too frequent',
            message: 'Analytics were recently calculated. Use force=true to override.',
            lastCalculation: lastCalculation.toISOString(),
            nextAllowedCalculation: new Date(lastCalculation.getTime() + minInterval).toISOString()
          },
          { status: 429 }
        );
      }
    }

    // Simulate recalculation process
    const recalculationResults: Record<string, any> = {};
    
    if (requestedMetrics.includes('all') || requestedMetrics.includes('overview')) {
      recalculationResults.overview = await calculateSystemOverview();
    }
    
    if (requestedMetrics.includes('all') || requestedMetrics.includes('api')) {
      recalculationResults.api = await calculateAPIMetrics();
    }
    
    if (requestedMetrics.includes('all') || requestedMetrics.includes('ai')) {
      recalculationResults.aiModels = await calculateAIModelMetrics();
    }
    
    if (requestedMetrics.includes('all') || requestedMetrics.includes('revenue')) {
      recalculationResults.revenue = await calculateRevenueMetrics();
    }
    
    if (requestedMetrics.includes('all') || requestedMetrics.includes('performance')) {
      recalculationResults.performance = await calculatePerformanceMetrics();
    }

    // In production, save recalculated metrics to cache/database
    console.log('Analytics recalculated:', recalculationResults);

    return NextResponse.json({
      success: true,
      message: 'Analytics recalculated successfully',
      recalculatedMetrics: Object.keys(recalculationResults),
      results: recalculationResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analytics recalculation error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to recalculate analytics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

export const POST = withSystemAnalyticsAuth(recalculateAnalyticsHandler);