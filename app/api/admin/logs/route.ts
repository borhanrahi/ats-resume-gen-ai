/**
 * API endpoint for centralized logging system
 * Handles log ingestion, retrieval, and management
 * Requirements: 13.3 - System monitoring and error tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { LogEntry, LogFilter, LogAggregation } from '@/lib/utils/errorLogger';

// In-memory log storage for development
// In production, this should be replaced with a proper database
let serverLogs: LogEntry[] = [];
const MAX_SERVER_LOGS = 50000;

/**
 * POST /api/admin/logs - Store a new log entry
 */
export async function POST(request: NextRequest) {
  try {
    const logEntry: LogEntry = await request.json();

    // Validate log entry
    if (!logEntry.id || !logEntry.timestamp || !logEntry.level || !logEntry.category || !logEntry.message) {
      return NextResponse.json(
        { error: 'Invalid log entry format' },
        { status: 400 }
      );
    }

    // Add server-side metadata
    const enhancedEntry: LogEntry = {
      ...logEntry,
      ip: getClientIP(request),
      metadata: {
        ...logEntry.metadata,
        serverTimestamp: Date.now(),
      },
    };

    // Store log entry
    serverLogs.push(enhancedEntry);

    // Maintain log size limit
    if (serverLogs.length > MAX_SERVER_LOGS) {
      serverLogs = serverLogs.slice(-MAX_SERVER_LOGS);
    }

    // Handle critical logs immediately
    if (logEntry.level === 'critical') {
      await handleCriticalLog(enhancedEntry);
    }

    // Handle high error rates
    await checkErrorRates();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to store log entry:', error);
    return NextResponse.json(
      { error: 'Failed to store log entry' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/logs - Retrieve logs with filtering
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // const isAdmin = await verifyAdminAuth(request);
    // if (!isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    
    // Parse filter parameters
    const filter: LogFilter = {
      level: searchParams.get('level')?.split(',') as any,
      category: searchParams.get('category')?.split(',') as any,
      userId: searchParams.get('userId') || undefined,
      adminId: searchParams.get('adminId') || undefined,
      startTime: searchParams.get('startTime') ? parseInt(searchParams.get('startTime')!) : undefined,
      endTime: searchParams.get('endTime') ? parseInt(searchParams.get('endTime')!) : undefined,
      searchTerm: searchParams.get('searchTerm') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    // Apply filters
    let filteredLogs = [...serverLogs];

    if (filter.level?.length) {
      filteredLogs = filteredLogs.filter(log => filter.level!.includes(log.level));
    }

    if (filter.category?.length) {
      filteredLogs = filteredLogs.filter(log => filter.category!.includes(log.category));
    }

    if (filter.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === filter.userId);
    }

    if (filter.adminId) {
      filteredLogs = filteredLogs.filter(log => log.adminId === filter.adminId);
    }

    if (filter.startTime) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.startTime!);
    }

    if (filter.endTime) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= filter.endTime!);
    }

    if (filter.searchTerm) {
      const searchTerm = filter.searchTerm.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(searchTerm) ||
        JSON.stringify(log.context || {}).toLowerCase().includes(searchTerm)
      );
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => b.timestamp - a.timestamp);

    // Apply pagination
    const totalCount = filteredLogs.length;
    const paginatedLogs = filteredLogs.slice(filter.offset || 0, (filter.offset || 0) + (filter.limit || 100));

    return NextResponse.json({
      logs: paginatedLogs,
      totalCount,
      hasMore: (filter.offset || 0) + (filter.limit || 100) < totalCount,
    });
  } catch (error) {
    console.error('Failed to retrieve logs:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve logs' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/logs - Clear logs
 */
export async function DELETE(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // const isAdmin = await verifyAdminAuth(request);
    // if (!isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const olderThan = searchParams.get('olderThan');

    if (olderThan) {
      const cutoffTime = parseInt(olderThan);
      const initialCount = serverLogs.length;
      serverLogs = serverLogs.filter(log => log.timestamp > cutoffTime);
      const deletedCount = initialCount - serverLogs.length;

      return NextResponse.json({
        success: true,
        deletedCount,
        remainingCount: serverLogs.length,
      });
    } else {
      const deletedCount = serverLogs.length;
      serverLogs = [];

      return NextResponse.json({
        success: true,
        deletedCount,
        remainingCount: 0,
      });
    }
  } catch (error) {
    console.error('Failed to clear logs:', error);
    return NextResponse.json(
      { error: 'Failed to clear logs' },
      { status: 500 }
    );
  }
}

/**
 * Helper functions
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

async function handleCriticalLog(logEntry: LogEntry): Promise<void> {
  try {
    // Log to console immediately
    console.error('CRITICAL LOG RECEIVED:', {
      id: logEntry.id,
      message: logEntry.message,
      category: logEntry.category,
      timestamp: new Date(logEntry.timestamp).toISOString(),
      context: logEntry.context,
    });

    // TODO: Send immediate notifications
    // - Email alerts to admin team
    // - Slack/Discord webhooks
    // - SMS alerts for critical system failures
    
    // For now, just log the intent
    console.log('Would send critical alert notifications for:', logEntry.id);
  } catch (error) {
    console.error('Failed to handle critical log:', error);
  }
}

async function checkErrorRates(): Promise<void> {
  try {
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    
    // Get logs from last 5 minutes
    const recentLogs = serverLogs.filter(log => log.timestamp >= fiveMinutesAgo);
    const errorLogs = recentLogs.filter(log => log.level === 'error' || log.level === 'critical');
    
    if (recentLogs.length === 0) return;
    
    const errorRate = (errorLogs.length / recentLogs.length) * 100;
    
    // Alert if error rate is above 10%
    if (errorRate > 10) {
      console.warn('HIGH ERROR RATE DETECTED:', {
        errorRate: `${errorRate.toFixed(2)}%`,
        totalLogs: recentLogs.length,
        errorLogs: errorLogs.length,
        timeWindow: '5 minutes',
      });
      
      // TODO: Send error rate alert
    }
  } catch (error) {
    console.error('Failed to check error rates:', error);
  }
}

/**
 * GET /api/admin/logs/aggregation - Get log aggregation data
 */
export async function aggregationHandler(request: NextRequest) {
  try {
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
      levelCounts[log.level]++;
      categoryCounts[log.category]++;

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