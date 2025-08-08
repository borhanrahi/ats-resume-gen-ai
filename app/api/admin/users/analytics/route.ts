import { NextRequest, NextResponse } from 'next/server';
import { withSystemAnalyticsAuth } from '../../../../lib/auth/adminMiddleware';
import { databases, DATABASE_ID, COLLECTIONS } from '../../../../lib/auth/appwrite';
import { Query } from 'appwrite';

// User analytics interfaces
interface UserGrowthMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  newUsersThisYear: number;
  growthRate: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

interface SubscriptionMetrics {
  freeUsers: number;
  premiumUsers: number;
  conversionRate: number;
  churnRate: number;
  averageLifetimeValue: number;
  monthlyRecurringRevenue: number;
}

interface UsageMetrics {
  totalAnalyses: number;
  averageAnalysesPerUser: number;
  activeUsersLast30Days: number;
  topFeatures: Array<{
    feature: string;
    usage: number;
    percentage: number;
  }>;
}

interface DemographicMetrics {
  topDomains: Array<{
    domain: string;
    count: number;
    percentage: number;
  }>;
  usersByCountry: Array<{
    country: string;
    count: number;
    percentage: number;
  }>;
  deviceTypes: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
}

interface UserAnalyticsResponse {
  growth: UserGrowthMetrics;
  subscriptions: SubscriptionMetrics;
  usage: UsageMetrics;
  demographics: DemographicMetrics;
  timestamp: string;
}

// Calculate user growth metrics
async function calculateGrowthMetrics(): Promise<UserGrowthMetrics> {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);

    // In production, these would be actual database queries
    // const totalUsersResponse = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USERS, [Query.limit(1)]);
    // const totalUsers = totalUsersResponse.total;

    // Mock data for development
    const totalUsers = 1247;
    const activeUsers = 1089;
    const newUsersToday = 23;
    const newUsersThisWeek = 156;
    const newUsersThisMonth = 687;
    const newUsersThisYear = 1247;

    // Calculate growth rates
    const previousDayUsers = totalUsers - newUsersToday;
    const previousWeekUsers = totalUsers - newUsersThisWeek;
    const previousMonthUsers = totalUsers - newUsersThisMonth;

    const dailyGrowthRate = previousDayUsers > 0 ? ((newUsersToday / previousDayUsers) * 100) : 0;
    const weeklyGrowthRate = previousWeekUsers > 0 ? ((newUsersThisWeek / previousWeekUsers) * 100) : 0;
    const monthlyGrowthRate = previousMonthUsers > 0 ? ((newUsersThisMonth / previousMonthUsers) * 100) : 0;

    return {
      totalUsers,
      activeUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      newUsersThisYear,
      growthRate: {
        daily: Math.round(dailyGrowthRate * 100) / 100,
        weekly: Math.round(weeklyGrowthRate * 100) / 100,
        monthly: Math.round(monthlyGrowthRate * 100) / 100,
      }
    };
  } catch (error) {
    console.error('Growth metrics calculation failed:', error);
    throw error;
  }
}

// Calculate subscription metrics
async function calculateSubscriptionMetrics(): Promise<SubscriptionMetrics> {
  try {
    // In production, these would be actual database queries
    // const freeUsersResponse = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USERS, [
    //   Query.equal('subscription.plan', 'free'),
    //   Query.limit(1)
    // ]);
    // const premiumUsersResponse = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USERS, [
    //   Query.equal('subscription.plan', 'premium'),
    //   Query.limit(1)
    // ]);

    // Mock data for development
    const freeUsers = 935;
    const premiumUsers = 312;
    const totalUsers = freeUsers + premiumUsers;
    
    const conversionRate = (premiumUsers / totalUsers) * 100;
    const churnRate = 2.3; // Mock churn rate
    const averageLifetimeValue = 89.50; // Mock LTV
    const monthlyRecurringRevenue = premiumUsers * 9.99; // Assuming $9.99/month

    return {
      freeUsers,
      premiumUsers,
      conversionRate: Math.round(conversionRate * 100) / 100,
      churnRate,
      averageLifetimeValue,
      monthlyRecurringRevenue: Math.round(monthlyRecurringRevenue * 100) / 100
    };
  } catch (error) {
    console.error('Subscription metrics calculation failed:', error);
    throw error;
  }
}

// Calculate usage metrics
async function calculateUsageMetrics(): Promise<UsageMetrics> {
  try {
    // In production, these would be actual database queries from analytics collection
    // Mock data for development
    const totalAnalyses = 10847;
    const totalUsers = 1247;
    const averageAnalysesPerUser = totalAnalyses / totalUsers;
    const activeUsersLast30Days = 892;

    const topFeatures = [
      { feature: 'ATS Score Analysis', usage: 8934, percentage: 82.4 },
      { feature: 'Keyword Matching', usage: 7621, percentage: 70.3 },
      { feature: 'Grammar Check', usage: 6543, percentage: 60.3 },
      { feature: 'Resume Builder', usage: 3421, percentage: 31.5 },
      { feature: 'Template Application', usage: 2876, percentage: 26.5 }
    ];

    return {
      totalAnalyses,
      averageAnalysesPerUser: Math.round(averageAnalysesPerUser * 100) / 100,
      activeUsersLast30Days,
      topFeatures
    };
  } catch (error) {
    console.error('Usage metrics calculation failed:', error);
    throw error;
  }
}

// Calculate demographic metrics
async function calculateDemographicMetrics(): Promise<DemographicMetrics> {
  try {
    // In production, these would be actual database queries
    // Mock data for development
    const totalUsers = 1247;

    const topDomains = [
      { domain: 'gmail.com', count: 456, percentage: 36.6 },
      { domain: 'yahoo.com', count: 234, percentage: 18.8 },
      { domain: 'outlook.com', count: 189, percentage: 15.2 },
      { domain: 'company.com', count: 123, percentage: 9.9 },
      { domain: 'example.org', count: 89, percentage: 7.1 }
    ].map(item => ({
      ...item,
      percentage: Math.round((item.count / totalUsers) * 10000) / 100
    }));

    const usersByCountry = [
      { country: 'United States', count: 487, percentage: 39.1 },
      { country: 'Canada', count: 156, percentage: 12.5 },
      { country: 'United Kingdom', count: 134, percentage: 10.7 },
      { country: 'Australia', count: 98, percentage: 7.9 },
      { country: 'Germany', count: 87, percentage: 7.0 }
    ].map(item => ({
      ...item,
      percentage: Math.round((item.count / totalUsers) * 10000) / 100
    }));

    const deviceTypes = [
      { type: 'Desktop', count: 743, percentage: 59.6 },
      { type: 'Mobile', count: 398, percentage: 31.9 },
      { type: 'Tablet', count: 106, percentage: 8.5 }
    ].map(item => ({
      ...item,
      percentage: Math.round((item.count / totalUsers) * 10000) / 100
    }));

    return {
      topDomains,
      usersByCountry,
      deviceTypes
    };
  } catch (error) {
    console.error('Demographic metrics calculation failed:', error);
    throw error;
  }
}

// GET /api/admin/users/analytics - Get comprehensive user analytics
const getUserAnalyticsHandler = async (request: NextRequest, { user }: { user: any }) => {
  try {
    const { searchParams } = new URL(request.url);
    const includeGrowth = searchParams.get('growth') !== 'false';
    const includeSubscriptions = searchParams.get('subscriptions') !== 'false';
    const includeUsage = searchParams.get('usage') !== 'false';
    const includeDemographics = searchParams.get('demographics') !== 'false';

    const analytics: Partial<UserAnalyticsResponse> = {
      timestamp: new Date().toISOString()
    };

    // Calculate metrics based on query parameters
    if (includeGrowth) {
      analytics.growth = await calculateGrowthMetrics();
    }

    if (includeSubscriptions) {
      analytics.subscriptions = await calculateSubscriptionMetrics();
    }

    if (includeUsage) {
      analytics.usage = await calculateUsageMetrics();
    }

    if (includeDemographics) {
      analytics.demographics = await calculateDemographicMetrics();
    }

    return NextResponse.json({
      success: true,
      analytics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('User analytics error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch user analytics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

export const GET = withSystemAnalyticsAuth(getUserAnalyticsHandler);