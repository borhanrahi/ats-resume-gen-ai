import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }
    
    // In production, you would:
    // 1. Verify admin authentication and permissions
    // 2. Query your database for the specific user
    // 3. Include additional user data like analysis history, payment records, etc.
    
    // Mock user data
    const user = {
      $id: userId,
      email: `user${userId.split('_')[1]}@example.com`,
      name: `User ${userId.split('_')[1]}`,
      subscription: {
        plan: Math.random() > 0.7 ? 'premium' : 'free',
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
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      totalAnalyses: Math.floor(Math.random() * 100),
      lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      registrationDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      status: 'active',
      // Additional admin-only data
      ipAddress: '192.168.1.' + Math.floor(Math.random() * 255),
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      loginHistory: [
        {
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          ipAddress: '192.168.1.' + Math.floor(Math.random() * 255),
          success: true
        },
        {
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          ipAddress: '192.168.1.' + Math.floor(Math.random() * 255),
          success: true
        }
      ]
    };
    
    return NextResponse.json({
      success: true,
      user
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const updateData = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }
    
    // In production, you would:
    // 1. Verify admin authentication and permissions
    // 2. Validate the update data
    // 3. Update the user in your database
    // 4. Log the admin action
    // 5. Send notifications if needed (e.g., plan change notification)
    
    // Validate allowed fields
    const allowedFields = ['name', 'email', 'plan', 'status'];
    const updates: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updates[key] = value;
      }
    }
    
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock updated user data
    const updatedUser = {
      $id: userId,
      email: updates.email || `user${userId.split('_')[1]}@example.com`,
      name: updates.name || `User ${userId.split('_')[1]}`,
      subscription: {
        plan: updates.plan || 'free',
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
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      totalAnalyses: Math.floor(Math.random() * 100),
      lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      registrationDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      status: updates.status || 'active'
    };
    
    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'User updated successfully',
      updatedFields: Object.keys(updates)
    });
    
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }
    
    // In production, you would:
    // 1. Verify admin authentication and permissions
    // 2. Check if user can be deleted (e.g., no active subscriptions)
    // 3. Perform soft delete or hard delete based on policy
    // 4. Clean up related data (analyses, payments, etc.)
    // 5. Log the admin action
    // 6. Send deletion confirmation email if required
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return NextResponse.json({
      success: true,
      message: `User ${userId} has been deleted successfully`,
      deletedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}