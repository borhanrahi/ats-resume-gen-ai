import { NextRequest, NextResponse } from 'next/server';

interface ErrorReport {
  type: string;
  message: string;
  technicalMessage: string;
  context?: Record<string, unknown>;
  timestamp: number;
  userAgent: string;
  url: string;
  userId?: string;
  errorId?: string;
  stack?: string;
  componentStack?: string;
}

export async function POST(request: NextRequest) {
  try {
    const errorReport: ErrorReport = await request.json();

    // Validate required fields
    if (!errorReport.type || !errorReport.message || !errorReport.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Log error for debugging (in production, you'd send to monitoring service)
    console.error('Error Report:', {
      type: errorReport.type,
      message: errorReport.message,
      technicalMessage: errorReport.technicalMessage,
      timestamp: new Date(errorReport.timestamp).toISOString(),
      url: errorReport.url,
      userAgent: errorReport.userAgent,
      userId: errorReport.userId,
      context: errorReport.context,
    });

    // In production, you would:
    // 1. Send to error monitoring service (Sentry, LogRocket, etc.)
    // 2. Store in database for analysis
    // 3. Alert team for critical errors
    // 4. Update error statistics

    // Example: Send to external monitoring service
    if (process.env.NODE_ENV === 'production') {
      await sendToMonitoringService(errorReport);
    }

    // Store error statistics locally
    await updateErrorStatistics(errorReport);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Error report received',
        reportId: generateReportId(errorReport)
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Failed to process error report:', error);
    
    return NextResponse.json(
      { error: 'Failed to process error report' },
      { status: 500 }
    );
  }
}

/**
 * Send error report to external monitoring service
 */
async function sendToMonitoringService(errorReport: ErrorReport): Promise<void> {
  try {
    // Example: Send to Sentry, LogRocket, or custom monitoring service
    // This is where you'd integrate with your preferred error monitoring solution
    
    // For now, we'll just log it
    console.log('Would send to monitoring service:', errorReport.type);
    
    // Example integration with a hypothetical monitoring service:
    /*
    await fetch(process.env.MONITORING_SERVICE_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MONITORING_SERVICE_TOKEN}`,
      },
      body: JSON.stringify({
        level: getErrorLevel(errorReport.type),
        message: errorReport.message,
        extra: {
          technicalMessage: errorReport.technicalMessage,
          context: errorReport.context,
          userAgent: errorReport.userAgent,
          url: errorReport.url,
          userId: errorReport.userId,
        },
        tags: {
          errorType: errorReport.type,
          environment: process.env.NODE_ENV,
        },
        timestamp: errorReport.timestamp,
      }),
    });
    */
  } catch (error) {
    console.error('Failed to send to monitoring service:', error);
  }
}

/**
 * Update local error statistics
 */
async function updateErrorStatistics(errorReport: ErrorReport): Promise<void> {
  try {
    // In a real application, you'd store this in a database
    // For now, we'll use a simple in-memory approach or file system
    
    const statsKey = `error_stats_${new Date().toISOString().split('T')[0]}`;
    
    // This would typically be stored in Redis, database, or file system
    console.log(`Updating error statistics for ${statsKey}:`, {
      type: errorReport.type,
      count: 1,
      timestamp: errorReport.timestamp,
    });
    
  } catch (error) {
    console.error('Failed to update error statistics:', error);
  }
}

/**
 * Generate unique report ID
 */
function generateReportId(errorReport: ErrorReport): string {
  const timestamp = errorReport.timestamp;
  const hash = Buffer.from(
    `${errorReport.type}_${errorReport.message}_${timestamp}`
  ).toString('base64').slice(0, 8);
  
  return `report_${timestamp}_${hash}`;
}

/**
 * Get error level for monitoring service
 */
function getErrorLevel(errorType: string): 'error' | 'warning' | 'info' {
  const criticalErrors = [
    'AUTH_ERROR',
    'PERMISSION_ERROR',
    'UNKNOWN_ERROR',
  ];
  
  const warningErrors = [
    'NETWORK_ERROR',
    'AI_API_ERROR',
    'RATE_LIMIT_ERROR',
    'OFFLINE_ERROR',
  ];
  
  if (criticalErrors.includes(errorType)) {
    return 'error';
  } else if (warningErrors.includes(errorType)) {
    return 'warning';
  } else {
    return 'info';
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json(
    { 
      status: 'ok',
      service: 'error-reporting',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}