import { NextRequest, NextResponse } from 'next/server';
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
    const format = searchParams.get('format') || 'csv';

    // In production, fetch actual payment data from database based on date range
    const payments = getPaymentsForDateRange(mockPayments, range);

    if (format === 'csv') {
      const csv = generateCSV(payments);
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="payment-data-${range}.csv"`
        }
      });
    } else if (format === 'json') {
      return new NextResponse(JSON.stringify(payments, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="payment-data-${range}.json"`
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Unsupported format. Use csv or json.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error exporting payment data:', error);
    return NextResponse.json(
      { error: 'Failed to export payment data' },
      { status: 500 }
    );
  }
}

function getPaymentsForDateRange(payments: PaymentRecord[], range: string): PaymentRecord[] {
  const now = new Date();
  let startDate: Date;

  switch (range) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return payments.filter(payment => new Date(payment.createdAt) >= startDate);
}

function generateCSV(payments: PaymentRecord[]): string {
  const headers = [
    'Payment ID',
    'User ID',
    'Amount',
    'Currency',
    'Status',
    'Payment Method',
    'Transaction ID',
    'Created At'
  ];

  const rows = payments.map(payment => [
    payment.$id,
    payment.userId,
    payment.amount.toString(),
    payment.currency,
    payment.status,
    payment.paymentMethod,
    payment.transactionId,
    new Date(payment.createdAt).toISOString()
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(field => `"${field}"`).join(','))
  ].join('\n');

  return csvContent;
}