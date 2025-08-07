import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionStats } from '@/lib/admin/subscriptionManager';
import { User } from '@/types/user';
import { PaymentFailure } from '@/lib/admin/subscriptionManager';

// Mock data for development - replace with actual database queries
const mockUsers: User[] = [
  {
    $id: 'user1',
    email: 'john.doe@example.com',
    name: 'John Doe',
    subscription: {
      plan: 'premium',
      status: 'active',
      expiresAt: new Date('2024-02-15'),
      paymentHistory: []
    },
    preferences: { theme: 'light', language: 'en', notifications: true, emailUpdates: true },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15')
  },
  {
    $id: 'user2',
    email: 'jane.smith@example.com',
    name: 'Jane Smith',
    subscription: {
      plan: 'premium',
      status: 'cancelled',
      expiresAt: new Date('2024-01-20'),
      paymentHistory: []
    },
    preferences: { theme: 'dark', language: 'en', notifications: false, emailUpdates: false },
    createdAt: new Date('2023-12-15'),
    updatedAt: new Date('2024-01-10')
  },
  {
    $id: 'user3',
    email: 'bob.wilson@example.com',
    name: 'Bob Wilson',
    subscription: {
      plan: 'free',
      status: 'active',
      expiresAt: new Date('2099-12-31'),
      paymentHistory: []
    },
    preferences: { theme: 'light', language: 'en', notifications: true, emailUpdates: true },
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05')
  },
  {
    $id: 'user4',
    email: 'alice.brown@example.com',
    name: 'Alice Brown',
    subscription: {
      plan: 'premium',
      status: 'expired',
      expiresAt: new Date('2024-01-01'),
      paymentHistory: []
    },
    preferences: { theme: 'light', language: 'en', notifications: true, emailUpdates: true },
    createdAt: new Date('2023-11-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    $id: 'user5',
    email: 'charlie.davis@example.com',
    name: 'Charlie Davis',
    subscription: {
      plan: 'premium',
      status: 'active',
      expiresAt: new Date('2024-02-20'),
      paymentHistory: []
    },
    preferences: { theme: 'light', language: 'en', notifications: true, emailUpdates: true },
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-20')
  }
];

const mockPaymentFailures: PaymentFailure[] = [
  {
    id: 'failure_1',
    userId: 'user1',
    userEmail: 'john.doe@example.com',
    subscriptionId: 'sub_1',
    amount: 29.99,
    currency: 'USD',
    failureReason: 'Insufficient funds',
    retryCount: 1,
    maxRetries: 3,
    nextRetryDate: new Date('2024-01-17'),
    lastAttemptDate: new Date('2024-01-16'),
    status: 'retrying',
    paymentMethod: 'stripe',
    subscriptionPlan: 'premium'
  },
  {
    id: 'failure_2',
    userId: 'user2',
    userEmail: 'jane.smith@example.com',
    subscriptionId: 'sub_2',
    amount: 29.99,
    currency: 'USD',
    failureReason: 'Card expired',
    retryCount: 3,
    maxRetries: 3,
    lastAttemptDate: new Date('2024-01-15'),
    status: 'failed',
    paymentMethod: 'stripe',
    subscriptionPlan: 'premium'
  }
];

export async function GET(request: NextRequest) {
  try {
    // In production, add admin authentication check here
    // const adminUser = await verifyAdminAuth(request);
    // if (!adminUser) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // In production, fetch actual data from database
    const users = mockUsers;
    const paymentFailures = mockPaymentFailures;

    // Calculate subscription statistics
    const stats = await calculateSubscriptionStats(users, paymentFailures);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching subscription stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription statistics' },
      { status: 500 }
    );
  }
}

async function calculateSubscriptionStats(
  users: User[],
  paymentFailures: PaymentFailure[]
): Promise<SubscriptionStats> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Basic subscription counts
  const totalSubscriptions = users.length;
  const activeSubscriptions = users.filter(u => u.subscription.status === 'active').length;
  const cancelledSubscriptions = users.filter(u => u.subscription.status === 'cancelled').length;
  const expiredSubscriptions = users.filter(u => u.subscription.status === 'expired').length;

  // Pending renewals (subscriptions expiring in next 7 days)
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const pendingRenewals = users.filter(u => 
    u.subscription.status === 'active' && 
    new Date(u.subscription.expiresAt) <= sevenDaysFromNow
  ).length;

  // Failed payments
  const failedPayments = paymentFailures.filter(f => f.status === 'retrying' || f.status === 'failed').length;

  // Monthly Recurring Revenue (MRR)
  const premiumPrice = 29.99; // In production, this would come from your pricing config
  const activePremiumUsers = users.filter(u => 
    u.subscription.status === 'active' && u.subscription.plan === 'premium'
  ).length;
  const monthlyRecurringRevenue = activePremiumUsers * premiumPrice;

  // Churn rate (cancelled subscriptions in last 30 days / total active subscriptions at start of period)
  const recentCancellations = users.filter(u => 
    u.subscription.status === 'cancelled' && 
    new Date(u.updatedAt) >= thirtyDaysAgo
  ).length;
  const churnRate = activeSubscriptions > 0 ? (recentCancellations / activeSubscriptions) * 100 : 0;

  // Average Lifetime Value (simplified calculation)
  const averageLifetimeValue = calculateAverageLifetimeValue(users);

  // Conversion rate (premium users / total users)
  const premiumUsers = users.filter(u => u.subscription.plan === 'premium').length;
  const conversionRate = totalSubscriptions > 0 ? (premiumUsers / totalSubscriptions) * 100 : 0;

  return {
    totalSubscriptions,
    activeSubscriptions,
    cancelledSubscriptions,
    expiredSubscriptions,
    pendingRenewals,
    failedPayments,
    monthlyRecurringRevenue,
    churnRate,
    averageLifetimeValue,
    conversionRate
  };
}

function calculateAverageLifetimeValue(users: User[]): number {
  // Simplified calculation: average months subscribed * monthly price
  const premiumPrice = 29.99;
  const premiumUsers = users.filter(u => u.subscription.plan === 'premium');
  
  if (premiumUsers.length === 0) return 0;

  const totalLifetimeMonths = premiumUsers.reduce((sum, user) => {
    const createdAt = new Date(user.createdAt);
    const now = new Date();
    const monthsSubscribed = Math.max(1, Math.floor((now.getTime() - createdAt.getTime()) / (30 * 24 * 60 * 60 * 1000)));
    return sum + monthsSubscribed;
  }, 0);

  const averageMonths = totalLifetimeMonths / premiumUsers.length;
  return averageMonths * premiumPrice;
}

// Helper function to get users from database (to be implemented)
async function getUsersFromDatabase(): Promise<User[]> {
  // This would integrate with your actual database
  // For example, with Appwrite:
  // const database = new Databases(client);
  // const response = await database.listDocuments(
  //   'your-database-id',
  //   'users-collection-id',
  //   [Query.limit(1000)] // Adjust limit as needed
  // );
  // return response.documents as User[];
  
  return mockUsers;
}

// Helper function to get payment failures from database (to be implemented)
async function getPaymentFailuresFromDatabase(): Promise<PaymentFailure[]> {
  // This would integrate with your actual database
  // For example, with Appwrite:
  // const database = new Databases(client);
  // const response = await database.listDocuments(
  //   'your-database-id',
  //   'payment-failures-collection-id',
  //   [Query.limit(1000)] // Adjust limit as needed
  // );
  // return response.documents as PaymentFailure[];
  
  return mockPaymentFailures;
}