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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // In production, add admin authentication check here
    // const adminUser = await verifyAdminAuth(request);
    // if (!adminUser) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const disputeId = params.id;
    const body = await request.json();
    const { status, adminNotes, updatedBy } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Find dispute in mock data (in production, query database)
    const disputeIndex = mockDisputes.findIndex(d => d.id === disputeId);
    
    if (disputeIndex === -1) {
      return NextResponse.json(
        { error: 'Dispute not found' },
        { status: 404 }
      );
    }

    // Update dispute
    const updatedDispute: PaymentDispute = {
      ...mockDisputes[disputeIndex],
      status: status as PaymentDispute['status'],
      adminNotes: adminNotes || mockDisputes[disputeIndex].adminNotes,
      ...(status === 'resolved' && { resolvedAt: new Date() })
    };

    // Update in mock data (in production, update in database)
    mockDisputes[disputeIndex] = updatedDispute;

    // In production, log the admin action
    await logAdminAction(updatedBy, 'dispute_update', {
      disputeId,
      oldStatus: mockDisputes[disputeIndex].status,
      newStatus: status,
      adminNotes
    });

    return NextResponse.json(updatedDispute);
  } catch (error) {
    console.error('Error updating dispute:', error);
    return NextResponse.json(
      { error: 'Failed to update dispute' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // In production, add admin authentication check here
    // const adminUser = await verifyAdminAuth(request);
    // if (!adminUser) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const disputeId = params.id;

    // Find dispute in mock data (in production, query database)
    const dispute = mockDisputes.find(d => d.id === disputeId);
    
    if (!dispute) {
      return NextResponse.json(
        { error: 'Dispute not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(dispute);
  } catch (error) {
    console.error('Error fetching dispute:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dispute' },
      { status: 500 }
    );
  }
}

// Helper function to log admin actions (to be implemented)
async function logAdminAction(
  adminId: string,
  action: string,
  details: Record<string, unknown>
): Promise<void> {
  // This would integrate with your audit logging system
  // For example, with Appwrite:
  // const database = new Databases(client);
  // await database.createDocument(
  //   'your-database-id',
  //   'admin-logs-collection-id',
  //   ID.unique(),
  //   {
  //     adminId,
  //     action,
  //     details: JSON.stringify(details),
  //     timestamp: new Date().toISOString()
  //   }
  // );
  
  console.log(`Admin action logged: ${adminId} performed ${action}`, details);
}