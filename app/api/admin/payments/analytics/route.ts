import { NextRequest, NextResponse } from 'next/server';
import { PaymentTracker } from '@/lib/admin/paymentTracking';
import { PaymentRecord } from '@/types/user';

// Mock payment data for development - replace with actual database queries
const mockPayments: PaymentRecord[] = [
  {
    $id: '1',
    userId: 'user1',
    amount: 29.99,
    currency: 'USD',
    status: 'completed',
    paymentMethod: 'stripe',
    transactionId: 'txn_1234567890',
    createdAt: new Date('2024-01-15')
  },
  {
    $id: '2',
    userId: 'user2',
    amount: 29.99,
    currency: 'USD',
    status: 'completed',
    paymentMethod: 'paypal',
    transactionId: 'txn_0987654321',
    createdAt: new Date('2024-01-14')
  },
  {
    $id: '3',
    userId: 'user3',
    amount: 29.99,
    currency: 'USD',
    status: 'failed',
    paymentMethod: 'stripe',
    transactionId: 'txn_1111111111',
    createdAt: new Date('2024-01-13')
  },
  {
    $id: '4',
    userId: 'user4',
    amount: 29.99,
    currency: 'USD',
    status: 'refunded',
    paymentMethod: 'stripe',
    transactionId: 'txn_2222222222',
    createdAt: new Date('2024-01-12')
  },
  {
    $id: '5',
    userId: 'user5',
    amount: 29.99,
    currency: 'USD',
    status: 'completed',
    paymentMethod: 'apple_pay',
    transactionId: 'txn_3333333333',
    createdAt: new Date('2024-01-11')
  },
  {
    $id: '6',
    userId: 'user6',
    amount: 29.99,
    currency: 'USD',
    status: 'completed',
    paymentMethod: 'google_pay',
    transactionId: 'txn_4444444444',
    createdAt: new Date('2024-01-10')
  },
  {
    $id: '7',
    userId: 'user7',
    amount: 29.99,
    currency: 'USD',
    status: 'completed',
    paymentMethod: 'stripe',
    transactionId: 'txn_5555555555',
    createdAt: new Date('2024-01-09')
  },
  {
    $id: '8',
    userId: 'user8',
    amount: 29.99,
    currency: 'USD',
    status: 'completed',
    paymentMethod: 'paypal',
    transactionId: 'txn_6666666666',
    createdAt: new Date('2024-01-08')
  }
];

export async function GET(request: NextRequest) {
  try {
    // In production, add admin authentication check here
    // const adminUser = await verifyAdminAuth(request);
    // if (!adminUser) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    // In production, fetch actual payment data from database
    const payments = mockPayments;

    const analytics = await PaymentTracker.generateRevenueAnalytics(payments, range);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching payment analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment analytics' },
      { status: 500 }
    );
  }
}