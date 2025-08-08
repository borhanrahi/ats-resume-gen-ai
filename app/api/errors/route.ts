import { NextRequest, NextResponse } from 'next/server';
import { ErrorReport } from '@/lib/monitoring/errorTracking';

// In-memory storage for error reports (in production, use a database)
const errorReports: ErrorReport[] = [];

export async function POST(request: NextRequest) {
  try {
    const errorReport: ErrorReport = await request.json();
    
    // Validate error report structure
    if (!errorReport.id || !errorReport.message || !errorReport.timestamp) {
      return NextResponse.json(
        { error: 'Invalid error report structure' },
        { status: 400 }
      );
    }

    // Store error report (in production, save to database)
    errorReports.push(errorReport);
    
    // Keep only last 5000 error reports in memory
    if (errorReports.length > 5000) {
      errorReports.shift();
    }

    // Log critical errors immediately
    if (errorReport.severity === 'critical') {
      console.error('CRITICAL ERROR RECEIVED:', {
        id: errorReport.id,
        message: errorReport.message,
        page: errorReport.context.page,
        occurrences: errorReport.occurrences
      });
    }

    return NextResponse.json({ success: true, id: errorReport.id }, { status: 200 });

  } catch (error) {
    console.error('Error reporting endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to process error report' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '24h';
    const severity = searchParams.get('severity');
    const page = searchParams.get('page');
    const resolved = searchParams.get('resolved');

    // Calculate time range
    const now = new Date();
    let startTime: Date;
    
    switch (timeframe) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Filter error reports
    let filteredErrors = errorReports.filter(error => 
      new Date(error.timestamp) >= startTime
    );

    if (severity) {
      filteredErrors = filteredErrors.filter(error => error.severity === severity);
    }

    if (page) {
      filteredErrors = filteredErrors.filter(error => error.context.page === page);
    }

    if (resolved !== null) {
      const isResolved = resolved === 'true';
      filteredErrors = filteredErrors.filter(error => error.resolved === isResolved);
    }

    // Calculate metrics
    const totalErrors = filteredErrors.reduce((sum, error) => sum + error.occurrences, 0);
    const uniqueErrors = filteredErrors.length;
    
    const severityBreakdown = {
      critical: filteredErrors.filter(e => e.severity === 'critical').length,
      high: filteredErrors.filter(e => e.severity === 'high').length,
      medium: filteredErrors.filter(e => e.severity === 'medium').length,
      low: filteredErrors.filter(e => e.severity === 'low').length
    };

    const topErrors = filteredErrors
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 10)
      .map(error => ({
        id: error.id,
        message: error.message.substring(0, 100),
        occurrences: error.occurrences,
        severity: error.severity,
        page: error.context.page,
        lastSeen: error.timestamp,
        resolved: error.resolved
      }));

    const errorsByPage: Record<string, number> = {};
    filteredErrors.forEach(error => {
      const page = error.context.page;
      errorsByPage[page] = (errorsByPage[page] || 0) + error.occurrences;
    });

    return NextResponse.json({
      timeframe,
      startTime,
      endTime: now,
      metrics: {
        totalErrors,
        uniqueErrors,
        severityBreakdown,
        errorsByPage: Object.entries(errorsByPage)
          .map(([page, count]) => ({ page, count }))
          .sort((a, b) => b.count - a.count)
      },
      topErrors,
      errors: filteredErrors.slice(0, 100) // Limit response size
    });

  } catch (error) {
    console.error('Error GET endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve error data' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { errorId, action } = await request.json();
    
    if (!errorId || !action) {
      return NextResponse.json(
        { error: 'Missing errorId or action' },
        { status: 400 }
      );
    }

    const errorIndex = errorReports.findIndex(error => error.id === errorId);
    
    if (errorIndex === -1) {
      return NextResponse.json(
        { error: 'Error not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'resolve':
        errorReports[errorIndex].resolved = true;
        break;
      case 'unresolve':
        errorReports[errorIndex].resolved = false;
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ 
      success: true, 
      error: errorReports[errorIndex] 
    });

  } catch (error) {
    console.error('Error PATCH endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to update error' },
      { status: 500 }
    );
  }
}