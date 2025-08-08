/**
 * API endpoint for log aggregation data
 * Provides analytics and metrics for the logging system
 * Requirements: 13.3 - System monitoring and error tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { LogAggregation } from '@/lib/utils/errorLogger';

// Import the server logs from the main logs route
// In production, this should use a shared database
let serverLogs: any[] = [];

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // const isAdmin = await verifyAdminAuth(request);
    // if (!isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const timeWindow = searchParams.get('timeWindow') ? parseInt(searchParams.get('timeWindow')!) : undefined;
    
    const now = Date.now();
    const windowStart = timeWindow ? now - timeWindow : 0;
    const logs = serverLogs.filter(log => log.timestamp >= windowStart);

    const levelCounts = {
      debug: 0,
      info: 0,
      warning: 0,
      error: 0,
      critical: 0,
    };

    const categoryCounts = {
      auth: 0,
      ai_analysis: 0,
      document_parsing: 0,
      export: 0,
      payment: 0,
      admin: 0,
      system: 0,
      user_action: 0,
      api: 0,
      performance: 0,
      security: 0,
    };

    const errorMessages = new Map<string, { count: number; lastOccurrence: number }>();

    logs.forEach(log => {
      if (levelCounts[log.level] !== undefined) {
        levelCounts[log.level]++;
      }
      
      if (categoryCounts[log.category] !== undefined) {
        categoryCounts[log.category]++;
      }

      if (log.level === 'error' || log.level === 'critical') {
        const existing = errorMessages.get(log.message) || { count: 0, lastOccurrence: 0 };
        errorMessages.set(log.message, {
          count: existing.count + 1,
          lastOccurrence: Math.max(existing.lastOccurrence, log.timestamp),
        });
      }
    });

    const totalCount = logs.length;
    const errorCount = levelCounts.error + levelCounts.critical;
    const errorRate = totalCount > 0 ? (errorCount / totalCount) * 100 : 0;

    const topErrors = Array.from(errorMessages.entries())
      .map(([message, data]) => ({ message, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const recentErrors = logs
      .filter(log => log.level === 'error' || log.level === 'critical')
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20);

    const aggregation: LogAggregation = {
      totalCount,
      levelCounts,
      categoryCounts,
      errorRate,
      criticalCount: levelCounts.critical,
      recentErrors,
      topErrors,
    };

    return NextResponse.json(aggregation);
  } catch (error) {
    console.error('Failed to get log aggregation:', error);
    return NextResponse.json(
      { error: 'Failed to get log aggregation' },
      { status: 500 }
    );
  }
}