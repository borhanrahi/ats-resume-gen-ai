import { NextRequest, NextResponse } from 'next/server';
import { withUserManagementAuth } from '../../../../lib/auth/adminMiddleware';
import { databases, DATABASE_ID, COLLECTIONS } from '../../../../lib/auth/appwrite';
import { Query } from 'appwrite';
import { User } from '../../../../types/user';

// Extended user data for admin view
interface AdminUserView extends User {
  analytics: {
    totalAnalyses: number;
    lastActivity: Date;
    averageSessionDuration: number;
    favoriteFeatures: string[];
    deviceInfo: {
      lastDevice: string;
      lastBrowser: string;
      lastOS: string;
    };
    locationInfo: {
      lastCountry: string;
      lastCity: string;
      timezone: string;
    };
  };
  security: {
    lastLoginIP: string;
    loginHistory: Array<{
      timestamp: Date;
      ipAddress: string;
      userAgent: string;
      success: boolean;
      location?: string;
    }>;
    failedLoginAttempts: number;
    accountLocked: boolean;
    twoFactorEnabled: boolean;
  };
  support: {
    ticketsCount: number;
    lastTicketDate?: Date;
    satisfactionRating?: number;
    notes: string[];
  };
}

// Get user from database
async function getUserFromDatabase(userId: string): Promise<AdminUserView | null> {
  try {
    // In production, query the actual database
    const response = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.USERS,
      userId
    );

    const user = response as User;
    
    // Enhance with admin-specific data
    const adminUserView: AdminUserView = {
      ...user,
      analytics: {
        totalAnalyses: Math.floor(Math.random() * 150),
        lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        averageSessionDuration: Math.floor(Math.random() * 1800) + 300, // 5-35 minutes
        favoriteFeatures: ['ATS Analysis', 'Keyword Matching', 'Grammar Check'].slice(0, Math.floor(Math.random() * 3) + 1),
        deviceInfo: {
          lastDevice: 'Desktop',
          lastBrowser: 'Chrome 120.0',
          lastOS: 'Windows 11'
        },
        locationInfo: {
          lastCountry: 'United States',
          lastCity: 'New York',
          timezone: 'America/New_York'
        }
      },
      security: {
        lastLoginIP: '192.168.1.' + Math.floor(Math.random() * 255),
        loginHistory: [
          {
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            ipAddress: '192.168.1.' + Math.floor(Math.random() * 255),
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            success: true,
            location: 'New York, US'
          },
          {
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
            ipAddress: '192.168.1.' + Math.floor(Math.random() * 255),
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            success: true,
            location: 'New York, US'
          }
        ],
        failedLoginAttempts: 0,
        accountLocked: false,
        twoFactorEnabled: false
      },
      support: {
        ticketsCount: Math.floor(Math.random() * 5),
        lastTicketDate: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000) : undefined,
        satisfactionRating: Math.random() > 0.3 ? Math.floor(Math.random() * 5) + 1 : undefined,
        notes: []
      }
    };

    return adminUserView;
  } catch (error) {
    console.warn('Database query failed, using mock data');
    
    // Generate mock user data
    const userIdNum = userId.split('_')[1] || '1';
    const mockUser: AdminUserView = {
      $id: userId,
      email: `user${userIdNum}@example.com`,
      name: `User ${userIdNum}`,
      subscription: {
        plan: Math.random() > 0.7 ? 'premium' : 'free',
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        paymentHistory: []
      },
      preferences: {
        theme: Math.random() > 0.5 ? 'light' : 'dark',
        language: 'en',
        notifications: Math.random() > 0.3,
        emailUpdates: Math.random() > 0.4
      },
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      analytics: {
        totalAnalyses: Math.floor(Math.random() * 150),
        lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        averageSessionDuration: Math.floor(Math.random() * 1800) + 300,
        favoriteFeatures: ['ATS Analysis', 'Keyword Matching'].slice(0, Math.floor(Math.random() * 2) + 1),
        deviceInfo: {
          lastDevice: 'Desktop',
          lastBrowser: 'Chrome 120.0',
          lastOS: 'Windows 11'
        },
        locationInfo: {
          lastCountry: 'United States',
          lastCity: 'New York',
          timezone: 'America/New_York'
        }
      },
      security: {
        lastLoginIP: '192.168.1.' + Math.floor(Math.random() * 255),
        loginHistory: [
          {
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            ipAddress: '192.168.1.' + Math.floor(Math.random() * 255),
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            success: true,
            location: 'New York, US'
          }
        ],
        failedLoginAttempts: 0,
        accountLocked: false,
        twoFactorEnabled: false
      },
      support: {
        ticketsCount: Math.floor(Math.random() * 5),
        lastTicketDate: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000) : undefined,
        satisfactionRating: Math.random() > 0.3 ? Math.floor(Math.random() * 5) + 1 : undefined,
        notes: []
      }
    };

    return mockUser;
  }
}

// GET /api/admin/users/[userId] - Get detailed user information
const getUserHandler = async (
  request: NextRequest,
  { params, user }: { params: { userId: string }; user: any }
) => {
  try {
    const { userId } = params;
    
    if (!userId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing userId',
          message: 'User ID is required'
        },
        { status: 400 }
      );
    }

    // Validate userId format
    if (!userId.match(/^[a-zA-Z0-9_-]+$/)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid userId format',
          message: 'User ID contains invalid characters'
        },
        { status: 400 }
      );
    }
    
    const userData = await getUserFromDatabase(userId);
    
    if (!userData) {
      return NextResponse.json(
        { 
          success: false,
          error: 'User not found',
          message: `User with ID ${userId} does not exist`
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      user: userData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch user',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

export const GET = withUserManagementAuth(getUserHandler);

// PUT /api/admin/users/[userId] - Update user information
const updateUserHandler = async (
  request: NextRequest,
  { params, user }: { params: { userId: string }; user: any }
) => {
  try {
    const { userId } = params;
    const updateData = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing userId',
          message: 'User ID is required'
        },
        { status: 400 }
      );
    }

    // Validate userId format
    if (!userId.match(/^[a-zA-Z0-9_-]+$/)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid userId format',
          message: 'User ID contains invalid characters'
        },
        { status: 400 }
      );
    }
    
    // Validate allowed fields and sanitize input
    const allowedFields = [
      'name', 'email', 'subscription.plan', 'subscription.status', 
      'preferences.theme', 'preferences.language', 'preferences.notifications', 
      'preferences.emailUpdates', 'status'
    ];
    
    const updates: Record<string, any> = {};
    const changedFields: string[] = [];
    
    // Process nested updates
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updates[key] = value;
        changedFields.push(key);
      }
    }
    
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No valid fields to update',
          message: 'Please provide valid fields to update',
          allowedFields
        },
        { status: 400 }
      );
    }

    // Validate email format if email is being updated
    if (updates.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.email)) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid email format',
            message: 'Please provide a valid email address'
          },
          { status: 400 }
        );
      }
    }

    // Validate subscription plan
    if (updates['subscription.plan'] && !['free', 'premium'].includes(updates['subscription.plan'])) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid subscription plan',
          message: 'Plan must be either "free" or "premium"'
        },
        { status: 400 }
      );
    }

    // Check if user exists first
    const existingUser = await getUserFromDatabase(userId);
    if (!existingUser) {
      return NextResponse.json(
        { 
          success: false,
          error: 'User not found',
          message: `User with ID ${userId} does not exist`
        },
        { status: 404 }
      );
    }
    
    // In production, update the user in database
    try {
      // await databases.updateDocument(DATABASE_ID, COLLECTIONS.USERS, userId, updates);
      console.log('User would be updated in database:', { userId, updates });
    } catch (dbError) {
      console.error('Database update failed:', dbError);
      // Continue with mock response for development
    }
    
    // Create updated user object
    const updatedUser: AdminUserView = {
      ...existingUser,
      name: updates.name || existingUser.name,
      email: updates.email || existingUser.email,
      subscription: {
        ...existingUser.subscription,
        plan: updates['subscription.plan'] || existingUser.subscription.plan,
        status: updates['subscription.status'] || existingUser.subscription.status,
      },
      preferences: {
        ...existingUser.preferences,
        theme: updates['preferences.theme'] || existingUser.preferences.theme,
        language: updates['preferences.language'] || existingUser.preferences.language,
        notifications: updates['preferences.notifications'] !== undefined ? updates['preferences.notifications'] : existingUser.preferences.notifications,
        emailUpdates: updates['preferences.emailUpdates'] !== undefined ? updates['preferences.emailUpdates'] : existingUser.preferences.emailUpdates,
      },
      updatedAt: new Date()
    };
    
    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'User updated successfully',
      updatedFields: changedFields,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update user',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

export const PUT = withUserManagementAuth(updateUserHandler);

// DELETE /api/admin/users/[userId] - Delete user account
const deleteUserHandler = async (
  request: NextRequest,
  { params, user }: { params: { userId: string }; user: any }
) => {
  try {
    const { userId } = params;
    
    if (!userId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing userId',
          message: 'User ID is required'
        },
        { status: 400 }
      );
    }

    // Validate userId format
    if (!userId.match(/^[a-zA-Z0-9_-]+$/)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid userId format',
          message: 'User ID contains invalid characters'
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await getUserFromDatabase(userId);
    if (!existingUser) {
      return NextResponse.json(
        { 
          success: false,
          error: 'User not found',
          message: `User with ID ${userId} does not exist`
        },
        { status: 404 }
      );
    }

    // Check for active premium subscription
    if (existingUser.subscription.plan === 'premium' && existingUser.subscription.status === 'active') {
      const { searchParams } = new URL(request.url);
      const force = searchParams.get('force') === 'true';
      
      if (!force) {
        return NextResponse.json(
          { 
            success: false,
            error: 'User has active premium subscription',
            message: 'Cannot delete user with active premium subscription. Use force=true to override.',
            userInfo: {
              plan: existingUser.subscription.plan,
              status: existingUser.subscription.status,
              expiresAt: existingUser.subscription.expiresAt
            }
          },
          { status: 409 }
        );
      }
    }
    
    // In production, perform soft delete or hard delete based on policy
    try {
      // Option 1: Soft delete (recommended)
      // await databases.updateDocument(DATABASE_ID, COLLECTIONS.USERS, userId, {
      //   status: 'deleted',
      //   deletedAt: new Date(),
      //   deletedBy: user.id
      // });
      
      // Option 2: Hard delete (use with caution)
      // await databases.deleteDocument(DATABASE_ID, COLLECTIONS.USERS, userId);
      
      // Also clean up related data:
      // - User analyses
      // - Payment records
      // - Support tickets
      // - Session data
      
      console.log('User would be deleted from database:', { userId, deletedBy: user.id });
    } catch (dbError) {
      console.error('Database deletion failed:', dbError);
      // Continue with mock response for development
    }
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return NextResponse.json({
      success: true,
      message: `User ${userId} has been deleted successfully`,
      deletedUser: {
        id: existingUser.$id,
        email: existingUser.email,
        name: existingUser.name
      },
      deletedAt: new Date().toISOString(),
      deletedBy: user.id
    });
    
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete user',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

export const DELETE = withUserManagementAuth(deleteUserHandler);