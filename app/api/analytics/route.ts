import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsEvent } from '@/lib/monitoring/analytics';

// In-memory storage for analytics events (in production, use a database)
const analyticsEvents: AnalyticsEvent[] = [];

export async function POST(request: NextRequest) {
  try {
    const event: AnalyticsEvent = await request.json();
    
    // Validate event structure
    if (!event.event || !event.timestamp || !event.sessionId) {
      return NextResponse.json(
        { error: 'Invalid event structure' },
        { status: 400 }
      );
    }

    // Store event (in production, save to database)
    analyticsEvents.push(event);
    
    // Keep only last 10000 events in memory
    if (analyticsEvents.length > 10000) {
      analyticsEvents.shift();
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Analytics endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to process analytics event' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '24h';
    const event = searchParams.get('event');

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

    // Filter events
    let filteredEvents = analyticsEvents.filter(e => 
      new Date(e.timestamp) >= startTime
    );

    if (event) {
      filteredEvents = filteredEvents.filter(e => e.event === event);
    }

    // Calculate metrics
    const metrics = {
      totalEvents: filteredEvents.length,
      uniqueSessions: new Set(filteredEvents.map(e => e.sessionId)).size,
      eventBreakdown: {} as Record<string, number>,
      pageViews: filteredEvents.filter(e => e.event === 'page_view').length,
      conversions: filteredEvents.filter(e => e.event === 'conversion').length,
      errors: filteredEvents.filter(e => e.event === 'error').length,
      topPages: [] as Array<{ page: string; views: number }>
    };

    // Event breakdown
    filteredEvents.forEach(event => {
      metrics.eventBreakdown[event.event] = (metrics.eventBreakdown[event.event] || 0) + 1;
    });

    // Top pages
    const pageViews = filteredEvents.filter(e => e.event === 'page_view');
    const pageCounts: Record<string, number> = {};
    pageViews.forEach(event => {
      const page = event.properties?.page || event.page || 'unknown';
      pageCounts[page] = (pageCounts[page] || 0) + 1;
    });
    
    metrics.topPages = Object.entries(pageCounts)
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    return NextResponse.json({
      timeframe,
      startTime,
      endTime: now,
      metrics,
      events: event ? filteredEvents : undefined // Only return events if specific event requested
    });

  } catch (error) {
    console.error('Analytics GET endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analytics data' },
      { status: 500 }
    );
  }
}