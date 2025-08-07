import { NextRequest, NextResponse } from 'next/server';

// Mock user data generator
const generateMockUsers = (count: number = 50) => {
  const plans = ['free', 'premium'];
  const statuses = ['active', 'suspended', 'pending'];
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'company.com', 'example.org'];
  
  return Array.from({ length: count }, (_, i) => {
    const userId = `user_${String(i + 1).padStart(3, '0')}`;
    const firstName = `User${i + 1}`;
    const lastName = `Test${i + 1}`;
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const registrationDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
    
    return {
      $id: userId,
      email: `${firstName.toLowerCase()}${i + 1}@${domain}`,
      name: `${firstName} ${lastName}`,
      subscription: {
        plan: plans[Math.random() > 0.7 ? 1 : 0], // 30% premium, 70% free
        status: Math.random() > 0.1 ? 'active' : 'cancelled',
        expiresAt: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000),
        paymentHistory: []
      },
      preferences: {
        theme: Math.random() > 0.5 ? 'light' : 'dark',
        language: 'en',
        notifications: Math.random() > 0.3,
        emailUpdates: Math.random() > 0.4
      },
      createdAt: registrationDate,
      updatedAt: new Date(),
      totalAnalyses: Math.floor(Math.random() * 150),
      lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      registrationDate,
      status: statuses[Math.floor(Math.random() * (Math.random() > 0.05 ? 1 : statuses.length))] // 95% active, 5% other
    };
  });
};

export async function GET(request: NextRequest) {
  try {
    // In production, you would:
    // 1. Verify admin authentication
    // 2. Parse query parameters for filtering, pagination, sorting
    // 3. Query your database with proper filters
    // 4. Return paginated results with metadata
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const plan = searchParams.get('plan') || 'all';
    const status = searchParams.get('status') || 'all';
    
    // Generate mock data
    let users = generateMockUsers(100);
    
    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(user => 
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.$id.toLowerCase().includes(searchLower)
      );
    }
    
    if (plan !== 'all') {
      users = users.filter(user => user.subscription.plan === plan);
    }
    
    if (status !== 'all') {
      users = users.filter(user => user.status === status);
    }
    
    // Sort by registration date (newest first)
    users.sort((a, b) => b.registrationDate.getTime() - a.registrationDate.getTime());
    
    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = users.slice(startIndex, endIndex);
    
    return NextResponse.json({
      users: paginatedUsers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(users.length / limit),
        totalUsers: users.length,
        usersPerPage: limit,
        hasNextPage: endIndex < users.length,
        hasPreviousPage: page > 1
      },
      filters: {
        search,
        plan,
        status
      }
    });
  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Create new user (admin function)
    const userData = await request.json();
    
    // In production, you would:
    // 1. Verify admin authentication and permissions
    // 2. Validate user data
    // 3. Create user in database
    // 4. Send welcome email if needed
    // 5. Log admin action
    
    const newUser = {
      $id: `user_${Date.now()}`,
      email: userData.email,
      name: userData.name,
      subscription: {
        plan: userData.plan || 'free',
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        paymentHistory: []
      },
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: true,
        emailUpdates: true
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      totalAnalyses: 0,
      lastActivity: new Date(),
      registrationDate: new Date(),
      status: 'active'
    };
    
    return NextResponse.json({
      success: true,
      user: newUser,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('User creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}