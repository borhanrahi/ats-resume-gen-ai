import { NextRequest, NextResponse } from 'next/server';
import { withUserManagementAuth } from '../../../../lib/auth/adminMiddleware';
import { databases, DATABASE_ID, COLLECTIONS } from '../../../../lib/auth/appwrite';

// Bulk action types
type BulkAction = 'suspend' | 'activate' | 'delete' | 'upgrade' | 'downgrade' | 'export' | 'send_notification';

interface BulkActionRequest {
  userIds: string[];
  action: BulkAction;
  options?: {
    force?: boolean; // For delete action with active subscriptions
    notificationMessage?: string; // For send_notification action
    newPlan?: 'free' | 'premium'; // For upgrade/downgrade actions
    reason?: string; // Admin reason for the action
  };
}

interface BulkActionResult {
  success: boolean;
  message: string;
  processedCount: number;
  failedCount: number;
  totalRequested: number;
  action: BulkAction;
  timestamp: string;
  results: Array<{
    userId: string;
    success: boolean;
    error?: string;
  }>;
  failedUserIds: string[];
}

// Validate user IDs
function validateUserIds(userIds: string[]): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];
  
  for (const userId of userIds) {
    if (typeof userId === 'string' && userId.match(/^[a-zA-Z0-9_-]+$/)) {
      valid.push(userId);
    } else {
      invalid.push(userId);
    }
  }
  
  return { valid, invalid };
}

// Process bulk action for a single user
async function processSingleUserAction(
  userId: string, 
  action: BulkAction, 
  options: BulkActionRequest['options'] = {},
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    switch (action) {
      case 'suspend':
        // In production: await databases.updateDocument(DATABASE_ID, COLLECTIONS.USERS, userId, { status: 'suspended' });
        console.log(`Suspending user ${userId}`);
        break;
        
      case 'activate':
        // In production: await databases.updateDocument(DATABASE_ID, COLLECTIONS.USERS, userId, { status: 'active' });
        console.log(`Activating user ${userId}`);
        break;
        
      case 'delete':
        // Check for active subscriptions unless force is true
        if (!options.force) {
          // In production: check if user has active premium subscription
          // For now, simulate some users having active subscriptions
          if (Math.random() < 0.1) { // 10% chance of active subscription
            return { success: false, error: 'User has active premium subscription' };
          }
        }
        // In production: await databases.deleteDocument(DATABASE_ID, COLLECTIONS.USERS, userId);
        console.log(`Deleting user ${userId}`);
        break;
        
      case 'upgrade':
        // In production: await databases.updateDocument(DATABASE_ID, COLLECTIONS.USERS, userId, { 'subscription.plan': 'premium' });
        console.log(`Upgrading user ${userId} to premium`);
        break;
        
      case 'downgrade':
        // In production: await databases.updateDocument(DATABASE_ID, COLLECTIONS.USERS, userId, { 'subscription.plan': 'free' });
        console.log(`Downgrading user ${userId} to free`);
        break;
        
      case 'send_notification':
        // In production: send notification to user
        console.log(`Sending notification to user ${userId}: ${options.notificationMessage}`);
        break;
        
      case 'export':
        // Export is handled differently, this shouldn't be called per user
        console.log(`Exporting user ${userId} data`);
        break;
        
      default:
        return { success: false, error: 'Invalid action' };
    }
    
    // Simulate occasional failures (5% failure rate)
    if (Math.random() < 0.05) {
      return { success: false, error: 'Database operation failed' };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// POST /api/admin/users/bulk-actions - Perform bulk actions on users
const bulkActionsHandler = async (request: NextRequest, { user }: { user: any }) => {
  try {
    const requestData: BulkActionRequest = await request.json();
    const { userIds, action, options = {} } = requestData;
    
    // Validate input
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing or invalid userIds array',
          message: 'Please provide a non-empty array of user IDs'
        },
        { status: 400 }
      );
    }
    
    if (!action) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing action',
          message: 'Please specify an action to perform'
        },
        { status: 400 }
      );
    }
    
    // Validate action
    const validActions: BulkAction[] = ['suspend', 'activate', 'delete', 'upgrade', 'downgrade', 'export', 'send_notification'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid action',
          message: `Action must be one of: ${validActions.join(', ')}`,
          validActions
        },
        { status: 400 }
      );
    }

    // Validate user IDs
    const { valid: validUserIds, invalid: invalidUserIds } = validateUserIds(userIds);
    
    if (invalidUserIds.length > 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid user IDs found',
          message: `${invalidUserIds.length} user IDs have invalid format`,
          invalidUserIds
        },
        { status: 400 }
      );
    }

    // Check limits (max 100 users per bulk operation)
    if (validUserIds.length > 100) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Too many users',
          message: 'Maximum 100 users allowed per bulk operation',
          requestedCount: validUserIds.length,
          maxAllowed: 100
        },
        { status: 400 }
      );
    }

    // Validate action-specific options
    if (action === 'send_notification' && !options.notificationMessage) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing notification message',
          message: 'Notification message is required for send_notification action'
        },
        { status: 400 }
      );
    }

    if ((action === 'upgrade' || action === 'downgrade') && options.newPlan && !['free', 'premium'].includes(options.newPlan)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid plan',
          message: 'Plan must be either "free" or "premium"'
        },
        { status: 400 }
      );
    }
    
    // Process bulk action
    const results: Array<{ userId: string; success: boolean; error?: string }> = [];
    let processedCount = 0;
    let failedCount = 0;
    
    // Simulate processing time based on number of users
    const processingTime = Math.min(validUserIds.length * 50, 1000);
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    // Process each user
    for (const userId of validUserIds) {
      const result = await processSingleUserAction(userId, action, options, user.id);
      
      results.push({
        userId,
        success: result.success,
        error: result.error
      });
      
      if (result.success) {
        processedCount++;
      } else {
        failedCount++;
      }
    }
    
    // Generate response message
    let message = '';
    switch (action) {
      case 'suspend':
        message = `${processedCount} user${processedCount !== 1 ? 's' : ''} suspended successfully`;
        break;
      case 'activate':
        message = `${processedCount} user${processedCount !== 1 ? 's' : ''} activated successfully`;
        break;
      case 'delete':
        message = `${processedCount} user${processedCount !== 1 ? 's' : ''} deleted successfully`;
        break;
      case 'upgrade':
        message = `${processedCount} user${processedCount !== 1 ? 's' : ''} upgraded successfully`;
        break;
      case 'downgrade':
        message = `${processedCount} user${processedCount !== 1 ? 's' : ''} downgraded successfully`;
        break;
      case 'send_notification':
        message = `Notification sent to ${processedCount} user${processedCount !== 1 ? 's' : ''} successfully`;
        break;
      case 'export':
        message = `${processedCount} user${processedCount !== 1 ? 's' : ''} exported successfully`;
        break;
    }
    
    if (failedCount > 0) {
      message += `, ${failedCount} failed`;
    }
    
    const response: BulkActionResult = {
      success: failedCount === 0,
      message,
      processedCount,
      failedCount,
      totalRequested: validUserIds.length,
      action,
      timestamp: new Date().toISOString(),
      results,
      failedUserIds: results.filter(r => !r.success).map(r => r.userId)
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Bulk user action error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to perform bulk user action',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

export const POST = withUserManagementAuth(bulkActionsHandler);