import { NextRequest, NextResponse } from 'next/server';
import { PaymentFailure } from '@/lib/admin/subscriptionManager';

// Mock payment failure data for development - replace with actual database queries
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
  },
  {
    id: 'failure_3',
    userId: 'user3',
    userEmail: 'bob.wilson@example.com',
    subscriptionId: 'sub_3',
    amount: 29.99,
    currency: 'USD',
    failureReason: 'Payment method declined',
    retryCount: 0,
    maxRetries: 3,
    nextRetryDate: new Date('2024-01-18'),
    lastAttemptDate: new Date('2024-01-17'),
    status: 'retrying',
    paymentMethod: 'paypal',
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // In production, fetch actual payment failure data from database
    let failures = mockPaymentFailures;

    // Filter by status if provided
    if (status && status !== 'all') {
      failures = failures.filter(failure => failure.status === status);
    }

    // Apply pagination and sorting
    const paginatedFailures = failures
      .sort((a, b) => new Date(b.lastAttemptDate).getTime() - new Date(a.lastAttemptDate).getTime())
      .slice(offset, offset + limit);

    return NextResponse.json(paginatedFailures);
  } catch (error) {
    console.error('Error fetching payment failures:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment failures' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // In production, add admin authentication check here
    // const adminUser = await verifyAdminAuth(request);
    // if (!adminUser) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await request.json();
    const {
      userId,
      subscriptionId,
      amount,
      currency,
      failureReason,
      paymentMethod,
      subscriptionPlan
    } = body;

    if (!userId || !subscriptionId || !amount || !failureReason || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create new payment failure record
    const paymentFailure: PaymentFailure = {
      id: `failure_${Date.now()}`,
      userId,
      userEmail: body.userEmail || `${userId}@example.com`, // In production, fetch from user data
      subscriptionId,
      amount,
      currency: currency || 'USD',
      failureReason,
      retryCount: 0,
      maxRetries: 3,
      nextRetryDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      lastAttemptDate: new Date(),
      status: 'retrying',
      paymentMethod,
      subscriptionPlan: subscriptionPlan || 'premium'
    };

    // In production, save to database
    mockPaymentFailures.push(paymentFailure);

    // Schedule retry job (this would integrate with your job queue system)
    await schedulePaymentRetry(paymentFailure.id, paymentFailure.nextRetryDate!);

    return NextResponse.json(paymentFailure, { status: 201 });
  } catch (error) {
    console.error('Error creating payment failure record:', error);
    return NextResponse.json(
      { error: 'Failed to create payment failure record' },
      { status: 500 }
    );
  }
}

// Helper function to schedule payment retry
async function schedulePaymentRetry(
  failureId: string,
  retryDate: Date
): Promise<void> {
  // This would integrate with your job queue system (e.g., Bull, Agenda, etc.)
  // For now, we'll just log the scheduled retry
  console.log(`Payment retry scheduled for failure ${failureId} at ${retryDate.toISOString()}`);
  
  // Example integration with a job queue:
  // await jobQueue.add('retry-payment', { failureId }, {
  //   delay: retryDate.getTime() - Date.now(),
  //   attempts: 1
  // });
}

// Helper function to get payment failures from database (to be implemented)
async function getPaymentFailuresFromDatabase(
  status?: string,
  limit: number = 50,
  offset: number = 0
): Promise<PaymentFailure[]> {
  // This would integrate with your actual database
  // For example, with Appwrite:
  // const database = new Databases(client);
  // const queries = [
  //   Query.limit(limit),
  //   Query.offset(offset),
  //   Query.orderDesc('lastAttemptDate')
  // ];
  // 
  // if (status && status !== 'all') {
  //   queries.push(Query.equal('status', status));
  // }
  // 
  // const response = await database.listDocuments(
  //   'your-database-id',
  //   'payment-failures-collection-id',
  //   queries
  // );
  // return response.documents as PaymentFailure[];
  
  return mockPaymentFailures;
}