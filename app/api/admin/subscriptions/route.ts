import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/types/user';

// Mock user data for development - replace with actual database queries
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
    preferences: {
      theme: 'light',
      language: 'en',
      notifications: true,
      emailUpdates: true
    },
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
    preferences: {
      theme: 'dark',
      language: 'en',
      notifications: false,
      emailUpdates: false
    },
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
    preferences: {
      theme: 'light',
      language: 'en',
      notifications: true,
      emailUpdates: true
    },
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
    preferences: {
      theme: 'light',
      language: 'en',
      notifications: true,
      emailUpdates: true
    },
    createdAt: new Date('2023-11-01'),
    updatedAt: new Date('2024-01-01')
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
    const plan = searchParams.get('plan');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // In production, fetch actual user data from database
    let users = mockUsers;

    // Filter by status if provided
    if (status && status !== 'all') {
      users = users.filter(user => user.subscription.status === status);
    }

    // Filter by plan if provided
    if (plan && plan !== 'all') {
      users = users.filter(user => user.subscription.plan === plan);
    }

    // Apply pagination
    const paginatedUsers = users
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(offset, offset + limit);

    return NextResponse.json(paginatedUsers);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

// Helper function to get users from database (to be implemented)
async function getUsersFromDatabase(
  status?: string,
  plan?: string,
  limit: number = 50,
  offset: number = 0
): Promise<User[]> {
  // This would integrate with your actual database
  // For example, with Appwrite:
  // const database = new Databases(client);
  // const queries = [
  //   Query.limit(limit),
  //   Query.offset(offset),
  //   Query.orderDesc('updatedAt')
  // ];
  // 
  // if (status && status !== 'all') {
  //   queries.push(Query.equal('subscription.status', status));
  // }
  // 
  // if (plan && plan !== 'all') {
  //   queries.push(Query.equal('subscription.plan', plan));
  // }
  // 
  // const response = await database.listDocuments(
  //   'your-database-id',
  //   'users-collection-id',
  //   queries
  // );
  // return response.documents as User[];
  
  return mockUsers;
}