import { NextRequest, NextResponse } from 'next/server';
import { PaymentDispute } from '@/lib/admin/paymentTracking';

// Mock dispute data for development - replace with actual database queries
const mockDisputes: PaymentDispute[] = [
  {
    id: 'dispute_1',
    paymentId: '1',
    userId: 'user1',
    userEmail: 'user1@example.com',
    amount: 29.99,
    currency: 'USD',
    reason: 'Service not as described',
    status: 'open',
    createdAt: new Date('2024-01-14'),
    adminNotes: ''
  },
  {
    id: 'dispute_2',
    paymentId: '2',
    userId: 'user2',
    userEmail: 'user2@example.com',
    amount: 29.99,
    currency: 'USD',
    reason: 'Unauthorized charge',
    status: 'investigating',
    createdAt: new Date('2024-01-13'),
    adminNotes: 'Checking with payment processor'
  },
  {
    id: 'dispute_3',
    paymentId: '4',
    userId: 'user4',
    userEmail: 'user4@example.com',
    amount: 29.99,
    currency: 'USD',
    reason: 'Duplicate charge',
    status: 'resolved',
    createdAt: new Date('2024-01-12'),
    resolvedAt: new Date('2024-01-13'),
    adminNotes: 'Refund processed successfully'
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

    // In production, fetch actual dispute data from database
    let disputes = mockDisputes;

    // Filter by status if provided
    if (status && status !== 'all') {
      disputes = disputes.filter(dispute => dispute.status === status);
    }

    // Sort by creation date (newest first)
    disputes = disputes
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    return NextResponse.json(disputes);
  } catch (error) {
    console.error('Error fetching disputes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch disputes' },
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
    const { paymentId, userId, reason } = body;

    if (!paymentId || !userId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: paymentId, userId, reason' },
        { status: 400 }
      );
    }

    // In production, create dispute in database
    const newDispute: PaymentDispute = {
      id: `dispute_${Date.now()}`,
      paymentId,
      userId,
      userEmail: `${userId}@example.com`, // In production, fetch from user data
      amount: 29.99, // In production, fetch from payment data
      currency: 'USD', // In production, fetch from payment data
      reason,
      status: 'open',
      createdAt: new Date(),
      adminNotes: ''
    };

    // Add to mock data (in production, save to database)
    mockDisputes.push(newDispute);

    return NextResponse.json(newDispute, { status: 201 });
  } catch (error) {
    console.error('Error creating dispute:', error);
    return NextResponse.json(
      { error: 'Failed to create dispute' },
      { status: 500 }
    );
  }
}

// Helper function to get disputes from database (to be implemented)
async function getDisputesFromDatabase(
  status?: string,
  limit: number = 50
): Promise<PaymentDispute[]> {
  // This would integrate with your actual database
  // For example, with Appwrite:
  // const database = new Databases(client);
  // const queries = [
  //   Query.limit(limit),
  //   Query.orderDesc('createdAt')
  // ];
  // 
  // if (status && status !== 'all') {
  //   queries.push(Query.equal('status', status));
  // }
  // 
  // const response = await database.listDocuments(
  //   'your-database-id',
  //   'disputes-collection-id',
  //   queries
  // );
  // return response.documents as PaymentDispute[];
  
  return mockDisputes;
}