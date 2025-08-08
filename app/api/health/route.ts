import { NextRequest, NextResponse } from 'next/server';
import { healthCheckService, PerformanceMonitor } from '@/lib/monitoring/healthCheck';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Perform comprehensive health check
    const healthResult = await healthCheckService.performHealthCheck();
    const systemMetrics = healthCheckService.getSystemMetrics();
    const performanceStats = PerformanceMonitor.getStats();

    // Record response time
    const responseTime = Date.now() - startTime;
    PerformanceMonitor.recordResponseTime(responseTime);

    // Determine HTTP status based on health
    let status = 200;
    if (healthResult.status === 'degraded') status = 200; // Still OK but with warnings
    if (healthResult.status === 'unhealthy') status = 503; // Service unavailable

    const response = {
      status: healthResult.status,
      timestamp: healthResult.timestamp,
      uptime: systemMetrics.uptime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: healthResult.checks,
      metrics: {
        memory: systemMetrics.memoryUsage,
        responseTime: systemMetrics.responseTime,
        performance: performanceStats,
        errorRate: systemMetrics.errorRate,
        activeUsers: systemMetrics.activeUsers
      },
      errors: healthResult.errors
    };

    return NextResponse.json(response, { status });

  } catch (error) {
    console.error('Health check endpoint error:', error);
    PerformanceMonitor.recordError();
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date(),
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}

// Simple ping endpoint for basic uptime monitoring
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}