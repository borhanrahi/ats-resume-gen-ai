import { User } from '@/types/user';

export interface SubscriptionModification {
  id: string;
  userId: string;
  userEmail: string;
  currentPlan: string;
  newPlan: string;
  action: 'upgrade' | 'downgrade' | 'extend' | 'cancel' | 'reactivate';
  reason: string;
  effectiveDate: Date;
  adminId: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

export interface PaymentFailure {
  id: string;
  userId: string;
  userEmail: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  failureReason: string;
  retryCount: number;
  maxRetries: number;
  nextRetryDate?: Date;
  lastAttemptDate: Date;
  status: 'retrying' | 'failed' | 'resolved';
  paymentMethod: string;
  subscriptionPlan: string;
}

export interface SubscriptionStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  cancelledSubscriptions: number;
  expiredSubscriptions: number;
  pendingRenewals: number;
  failedPayments: number;
  monthlyRecurringRevenue: number;
  churnRate: number;
  averageLifetimeValue: number;
  conversionRate: number;
}

export interface RetryConfiguration {
  maxRetries: number;
  retryIntervals: number[]; // in hours
  backoffMultiplier: number;
  finalActionOnFailure: 'cancel' | 'suspend' | 'notify';
}

export class SubscriptionManager {
  private static readonly DEFAULT_RETRY_CONFIG: RetryConfiguration = {
    maxRetries: 3,
    retryIntervals: [24, 72, 168], // 1 day, 3 days, 1 week
    backoffMultiplier: 1.5,
    finalActionOnFailure: 'cancel'
  };

  /**
   * Modify a user's subscription
   */
  static async modifySubscription(
    userId: string,
    modification: Omit<SubscriptionModification, 'id' | 'userId' | 'userEmail' | 'status' | 'createdAt'>
  ): Promise<{ success: boolean; modificationId?: string; error?: string }> {
    try {
      const response = await fetch('/api/admin/subscriptions/modify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...modification
        })
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message };
      }

      const result = await response.json();
      return { success: true, modificationId: result.id };
    } catch (error) {
      console.error('Error modifying subscription:', error);
      return { success: false, error: 'Failed to modify subscription' };
    }
  }

  /**
   * Cancel a subscription with optional immediate or end-of-period cancellation
   */
  static async cancelSubscription(
    userId: string,
    reason: string,
    immediate: boolean = false,
    adminId: string
  ): Promise<{ success: boolean; error?: string }> {
    const effectiveDate = immediate ? new Date() : await this.getSubscriptionEndDate(userId);
    
    return this.modifySubscription(userId, {
      currentPlan: await this.getCurrentPlan(userId),
      newPlan: 'free',
      action: 'cancel',
      reason,
      effectiveDate,
      adminId
    });
  }

  /**
   * Extend a subscription by a specified number of days
   */
  static async extendSubscription(
    userId: string,
    extensionDays: number,
    reason: string,
    adminId: string
  ): Promise<{ success: boolean; newExpiryDate?: Date; error?: string }> {
    try {
      const currentUser = await this.getUserById(userId);
      if (!currentUser) {
        return { success: false, error: 'User not found' };
      }

      const currentExpiry = new Date(currentUser.subscription.expiresAt);
      const newExpiry = new Date(currentExpiry.getTime() + (extensionDays * 24 * 60 * 60 * 1000));

      const result = await this.modifySubscription(userId, {
        currentPlan: currentUser.subscription.plan,
        newPlan: currentUser.subscription.plan,
        action: 'extend',
        reason,
        effectiveDate: newExpiry,
        adminId
      });

      if (result.success) {
        return { success: true, newExpiryDate: newExpiry };
      }

      return result;
    } catch (error) {
      console.error('Error extending subscription:', error);
      return { success: false, error: 'Failed to extend subscription' };
    }
  }

  /**
   * Reactivate a cancelled or expired subscription
   */
  static async reactivateSubscription(
    userId: string,
    newPlan: string,
    reason: string,
    adminId: string
  ): Promise<{ success: boolean; error?: string }> {
    const effectiveDate = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1); // Default to 1 month

    return this.modifySubscription(userId, {
      currentPlan: 'free',
      newPlan,
      action: 'reactivate',
      reason,
      effectiveDate,
      adminId
    });
  }

  /**
   * Handle payment failure and set up retry mechanism
   */
  static async handlePaymentFailure(
    userId: string,
    subscriptionId: string,
    failureReason: string,
    amount: number,
    currency: string = 'USD',
    paymentMethod: string
  ): Promise<{ success: boolean; failureId?: string; nextRetryDate?: Date; error?: string }> {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const retryConfig = this.DEFAULT_RETRY_CONFIG;
      const nextRetryDate = new Date();
      nextRetryDate.setHours(nextRetryDate.getHours() + retryConfig.retryIntervals[0]);

      const paymentFailure: Omit<PaymentFailure, 'id'> = {
        userId,
        userEmail: user.email,
        subscriptionId,
        amount,
        currency,
        failureReason,
        retryCount: 0,
        maxRetries: retryConfig.maxRetries,
        nextRetryDate,
        lastAttemptDate: new Date(),
        status: 'retrying',
        paymentMethod,
        subscriptionPlan: user.subscription.plan
      };

      const response = await fetch('/api/admin/subscriptions/payment-failures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentFailure)
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message };
      }

      const result = await response.json();
      
      // Schedule retry job (this would integrate with your job queue system)
      await this.schedulePaymentRetry(result.id, nextRetryDate);

      return { 
        success: true, 
        failureId: result.id, 
        nextRetryDate 
      };
    } catch (error) {
      console.error('Error handling payment failure:', error);
      return { success: false, error: 'Failed to handle payment failure' };
    }
  }

  /**
   * Retry a failed payment
   */
  static async retryFailedPayment(
    failureId: string
  ): Promise<{ success: boolean; paymentStatus?: string; nextRetryDate?: Date; error?: string }> {
    try {
      const response = await fetch(`/api/admin/subscriptions/payment-failures/${failureId}/retry`, {
        method: 'POST'
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message };
      }

      const result = await response.json();
      return { 
        success: true, 
        paymentStatus: result.status,
        nextRetryDate: result.nextRetryDate 
      };
    } catch (error) {
      console.error('Error retrying payment:', error);
      return { success: false, error: 'Failed to retry payment' };
    }
  }

  /**
   * Cancel payment retries and handle final action
   */
  static async cancelPaymentRetries(
    failureId: string,
    finalAction: 'cancel' | 'suspend' | 'notify' = 'cancel'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`/api/admin/subscriptions/payment-failures/${failureId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ finalAction })
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error cancelling payment retries:', error);
      return { success: false, error: 'Failed to cancel payment retries' };
    }
  }

  /**
   * Get subscription statistics
   */
  static async getSubscriptionStats(): Promise<SubscriptionStats> {
    try {
      const response = await fetch('/api/admin/subscriptions/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch subscription stats');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching subscription stats:', error);
      // Return default stats on error
      return {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        cancelledSubscriptions: 0,
        expiredSubscriptions: 0,
        pendingRenewals: 0,
        failedPayments: 0,
        monthlyRecurringRevenue: 0,
        churnRate: 0,
        averageLifetimeValue: 0,
        conversionRate: 0
      };
    }
  }

  /**
   * Get upcoming subscription renewals
   */
  static async getUpcomingRenewals(
    daysAhead: number = 7
  ): Promise<User[]> {
    try {
      const response = await fetch(`/api/admin/subscriptions/renewals?days=${daysAhead}`);
      if (!response.ok) {
        throw new Error('Failed to fetch upcoming renewals');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching upcoming renewals:', error);
      return [];
    }
  }

  /**
   * Bulk subscription operations
   */
  static async bulkModifySubscriptions(
    userIds: string[],
    modification: Omit<SubscriptionModification, 'id' | 'userId' | 'userEmail' | 'status' | 'createdAt' | 'currentPlan'>
  ): Promise<{ success: boolean; results: { userId: string; success: boolean; error?: string }[]; error?: string }> {
    try {
      const response = await fetch('/api/admin/subscriptions/bulk-modify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds,
          modification
        })
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, results: [], error: error.message };
      }

      const result = await response.json();
      return { success: true, results: result.results };
    } catch (error) {
      console.error('Error performing bulk subscription modifications:', error);
      return { success: false, results: [], error: 'Failed to perform bulk modifications' };
    }
  }

  // Private helper methods

  private static async getUserById(userId: string): Promise<User | null> {
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      if (!response.ok) {
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  private static async getCurrentPlan(userId: string): Promise<string> {
    const user = await this.getUserById(userId);
    return user?.subscription.plan || 'free';
  }

  private static async getSubscriptionEndDate(userId: string): Promise<Date> {
    const user = await this.getUserById(userId);
    return user ? new Date(user.subscription.expiresAt) : new Date();
  }

  private static async schedulePaymentRetry(
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
}

/**
 * Subscription analytics and reporting utilities
 */
export class SubscriptionAnalytics {
  /**
   * Calculate churn rate for a given period
   */
  static async calculateChurnRate(
    periodStart: Date,
    periodEnd: Date
  ): Promise<number> {
    try {
      const response = await fetch('/api/admin/subscriptions/analytics/churn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          periodStart: periodStart.toISOString(),
          periodEnd: periodEnd.toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to calculate churn rate');
      }

      const result = await response.json();
      return result.churnRate;
    } catch (error) {
      console.error('Error calculating churn rate:', error);
      return 0;
    }
  }

  /**
   * Calculate Monthly Recurring Revenue (MRR)
   */
  static async calculateMRR(): Promise<number> {
    try {
      const response = await fetch('/api/admin/subscriptions/analytics/mrr');
      if (!response.ok) {
        throw new Error('Failed to calculate MRR');
      }

      const result = await response.json();
      return result.mrr;
    } catch (error) {
      console.error('Error calculating MRR:', error);
      return 0;
    }
  }

  /**
   * Get subscription cohort analysis
   */
  static async getCohortAnalysis(
    cohortType: 'monthly' | 'weekly' = 'monthly',
    periods: number = 12
  ): Promise<any[]> {
    try {
      const response = await fetch(`/api/admin/subscriptions/analytics/cohort?type=${cohortType}&periods=${periods}`);
      if (!response.ok) {
        throw new Error('Failed to get cohort analysis');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting cohort analysis:', error);
      return [];
    }
  }

  /**
   * Export subscription data for analysis
   */
  static async exportSubscriptionData(
    format: 'csv' | 'json' = 'csv',
    dateRange?: { start: Date; end: Date }
  ): Promise<Blob> {
    const params = new URLSearchParams({
      format
    });

    if (dateRange) {
      params.append('start', dateRange.start.toISOString());
      params.append('end', dateRange.end.toISOString());
    }

    const response = await fetch(`/api/admin/subscriptions/export?${params}`);
    
    if (!response.ok) {
      throw new Error('Failed to export subscription data');
    }
    
    return await response.blob();
  }
}