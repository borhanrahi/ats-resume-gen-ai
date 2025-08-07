import { NextRequest, NextResponse } from 'next/server';

// Mock data for development - in production this would come from your database
const generateMockDashboardData = () => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return {
    totalUsers: Math.floor(Math.random() * 2000) + 1000,
    activeUsers: Math.floor(Math.random() * 500) + 200,
    premiumUsers: Math.floor(Math.random() * 150) + 50,
    analysesToday: Math.floor(Math.random() * 300) + 100,
    analysesThisMonth: Math.floor(Math.random() * 8000) + 3000,
    apiCalls: Math.floor(Math.random() * 5000) + 2000,
    successRate: 95 + Math.random() * 4, // 95-99%
    revenue: {
      today: Math.random() * 200 + 50,
      thisMonth: Math.random() * 5000 + 2000,
      total: Math.random() * 50000 + 10000
    },
    systemHealth: {
      status: Math.random() > 0.1 ? 'healthy' : (Math.random() > 0.5 ? 'warning' : 'critical'),
      uptime: 99 + Math.random(),
      responseTime: Math.floor(Math.random() * 300) + 150
    },
    recentActivity: [
      {
        id: '1',
        type: 'user_signup',
        message: 'New premium user registered: user@example.com',
        timestamp: new Date(Date.now() - Math.random() * 60 * 60 * 1000)
      },
      {
        id: '2',
        type: 'analysis',
        message: `Resume analysis completed for user ID: ${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000)
      },
      {
        id: '3',
        type: 'payment',
        message: `Payment received: $${(Math.random() * 50 + 10).toFixed(2)} from user ID: ${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date(Date.now() - Math.random() * 3 * 60 * 60 * 1000)
      },
      {
        id: '4',
        type: 'error',
        message: 'API rate limit exceeded for OpenRouter',
        timestamp: new Date(Date.now() - Math.random() * 4 * 60 * 60 * 1000)
      },
      {
        id: '5',
        type: 'analysis',
        message: `Bulk analysis completed for ${Math.floor(Math.random() * 10) + 1} resumes`,
        timestamp: new Date(Date.now() - Math.random() * 5 * 60 * 60 * 1000)
      }
    ]
  };
};

export async function GET(request: NextRequest) {
  try {
    // In production, you would:
    // 1. Verify admin authentication
    // 2. Query your database for real metrics
    // 3. Calculate statistics from actual data
    
    // For now, return mock data
    const dashboardData = generateMockDashboardData();
    
    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

// In production, you might also want a POST endpoint to trigger data refresh
export async function POST(request: NextRequest) {
  try {
    // Trigger manual data refresh
    const dashboardData = generateMockDashboardData();
    
    return NextResponse.json({
      success: true,
      data: dashboardData,
      refreshedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Dashboard refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh dashboard data' },
      { status: 500 }
    );
  }
}