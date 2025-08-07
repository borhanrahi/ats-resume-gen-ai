import { PaymentRecord } from '@/types/user';

export interface PaymentStats {
  totalRevenue: number;
  monthlyRevenue: number;
  dailyRevenue: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  refundedTransactions: number;
  averageTransactionValue: number;
  revenueGrowth: number;
  conversionRate: number;
}

export interface PaymentDispute {
  id: string;
  paymentId: string;
  userId: string;
  userEmail: string;
  amount: number;
  currency: string;
  reason: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  createdAt: Date;
  resolvedAt?: Date;
  adminNotes: string;
}

export interface RevenueAnalytics {
  daily: { date: string; revenue: number; transactions: number }[];
  monthly: { month: string; revenue: number; transactions: number }[];
  byPlan: { plan: string; revenue: number; users: number }[];
  byPaymentMethod: { method: string; revenue: number; percentage: number }[];
}

export interface SubscriptionRenewal {
  userId: string;
  userEmail: string;
  currentPlan: string;
  renewalDate: Date;
  amount: number;
  status: 'upcoming' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  lastAttempt?: Date;
  nextRetry?: Date;
}

export class PaymentTracker {
  /**
   * Calculate payment statistics for a given date range
   */
  static async calculatePaymentStats(
    payments: PaymentRecord[],
    dateRange: string = '30d'
  ): Promise<PaymentStats> {
    const now = new Date();
    const rangeStart = this.getDateRangeStart(dateRange, now);
    
    // Filter payments within date range
    const filteredPayments = payments.filter(
      payment => new Date(payment.createdAt) >= rangeStart
    );

    // Calculate basic stats
    const totalTransactions = filteredPayments.length;
    const successfulTransactions = filteredPayments.filter(p => p.status === 'completed').length;
    const failedTransactions = filteredPayments.filter(p => p.status === 'failed').length;
    const refundedTransactions = filteredPayments.filter(p => p.status === 'refunded').length;

    // Calculate revenue
    const totalRevenue = filteredPayments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    const monthlyRevenue = this.calculateMonthlyRevenue(filteredPayments);
    const dailyRevenue = this.calculateDailyRevenue(filteredPayments);

    // Calculate average transaction value
    const averageTransactionValue = successfulTransactions > 0 
      ? totalRevenue / successfulTransactions 
      : 0;

    // Calculate revenue growth (compared to previous period)
    const revenueGrowth = await this.calculateRevenueGrowth(payments, dateRange);

    // Calculate conversion rate (this would need user data)
    const conversionRate = await this.calculateConversionRate(dateRange);

    return {
      totalRevenue,
      monthlyRevenue,
      dailyRevenue,
      totalTransactions,
      successfulTransactions,
      failedTransactions,
      refundedTransactions,
      averageTransactionValue,
      revenueGrowth,
      conversionRate
    };
  }

  /**
   * Generate revenue analytics for charts and reports
   */
  static async generateRevenueAnalytics(
    payments: PaymentRecord[],
    dateRange: string = '30d'
  ): Promise<RevenueAnalytics> {
    const now = new Date();
    const rangeStart = this.getDateRangeStart(dateRange, now);
    
    const filteredPayments = payments.filter(
      payment => new Date(payment.createdAt) >= rangeStart &&
                 payment.status === 'completed'
    );

    // Daily revenue data
    const daily = this.generateDailyRevenueData(filteredPayments, rangeStart, now);
    
    // Monthly revenue data
    const monthly = this.generateMonthlyRevenueData(filteredPayments);
    
    // Revenue by plan (would need subscription data)
    const byPlan = await this.getRevenueByPlan(filteredPayments);
    
    // Revenue by payment method
    const byPaymentMethod = this.getRevenueByPaymentMethod(filteredPayments);

    return {
      daily,
      monthly,
      byPlan,
      byPaymentMethod
    };
  }

  /**
   * Track subscription renewals and identify upcoming renewals
   */
  static async trackSubscriptionRenewals(): Promise<SubscriptionRenewal[]> {
    try {
      // This would integrate with your user/subscription system
      const response = await fetch('/api/admin/subscriptions/renewals');
      if (!response.ok) {
        throw new Error('Failed to fetch renewal data');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error tracking subscription renewals:', error);
      return [];
    }
  }

  /**
   * Process payment refund
   */
  static async processRefund(
    paymentId: string,
    reason: string,
    adminId: string
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    try {
      const response = await fetch(`/api/admin/payments/${paymentId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason,
          adminId,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message };
      }

      const result = await response.json();
      return { success: true, refundId: result.refundId };
    } catch (error) {
      console.error('Error processing refund:', error);
      return { success: false, error: 'Failed to process refund' };
    }
  }

  /**
   * Handle payment failure retry logic
   */
  static async retryFailedPayment(
    paymentId: string,
    maxRetries: number = 3
  ): Promise<{ success: boolean; newStatus?: string; error?: string }> {
    try {
      const response = await fetch(`/api/admin/payments/${paymentId}/retry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxRetries,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message };
      }

      const result = await response.json();
      return { success: true, newStatus: result.status };
    } catch (error) {
      console.error('Error retrying payment:', error);
      return { success: false, error: 'Failed to retry payment' };
    }
  }

  /**
   * Export payment data to CSV
   */
  static async exportPaymentData(
    dateRange: string = '30d',
    format: 'csv' | 'json' = 'csv'
  ): Promise<Blob> {
    const response = await fetch(`/api/admin/payments/export?range=${dateRange}&format=${format}`);
    
    if (!response.ok) {
      throw new Error('Failed to export payment data');
    }
    
    return await response.blob();
  }

  // Private helper methods

  private static getDateRangeStart(range: string, now: Date): Date {
    const start = new Date(now);
    
    switch (range) {
      case '7d':
        start.setDate(now.getDate() - 7);
        break;
      case '30d':
        start.setDate(now.getDate() - 30);
        break;
      case '90d':
        start.setDate(now.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(now.getFullYear() - 1);
        break;
      default:
        start.setDate(now.getDate() - 30);
    }
    
    return start;
  }

  private static calculateMonthlyRevenue(payments: PaymentRecord[]): number {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return payments
      .filter(p => 
        new Date(p.createdAt) >= monthStart && 
        p.status === 'completed'
      )
      .reduce((sum, p) => sum + p.amount, 0);
  }

  private static calculateDailyRevenue(payments: PaymentRecord[]): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return payments
      .filter(p => 
        new Date(p.createdAt) >= today && 
        p.status === 'completed'
      )
      .reduce((sum, p) => sum + p.amount, 0);
  }

  private static async calculateRevenueGrowth(
    payments: PaymentRecord[],
    dateRange: string
  ): Promise<number> {
    const now = new Date();
    const currentPeriodStart = this.getDateRangeStart(dateRange, now);
    
    // Calculate previous period
    const periodLength = now.getTime() - currentPeriodStart.getTime();
    const previousPeriodStart = new Date(currentPeriodStart.getTime() - periodLength);
    
    const currentRevenue = payments
      .filter(p => 
        new Date(p.createdAt) >= currentPeriodStart && 
        p.status === 'completed'
      )
      .reduce((sum, p) => sum + p.amount, 0);
    
    const previousRevenue = payments
      .filter(p => 
        new Date(p.createdAt) >= previousPeriodStart && 
        new Date(p.createdAt) < currentPeriodStart &&
        p.status === 'completed'
      )
      .reduce((sum, p) => sum + p.amount, 0);
    
    if (previousRevenue === 0) return 0;
    
    return ((currentRevenue - previousRevenue) / previousRevenue) * 100;
  }

  private static async calculateConversionRate(dateRange: string): Promise<number> {
    // This would need to integrate with your user analytics
    // For now, return a placeholder
    return 12.5; // 12.5% conversion rate
  }

  private static generateDailyRevenueData(
    payments: PaymentRecord[],
    startDate: Date,
    endDate: Date
  ): { date: string; revenue: number; transactions: number }[] {
    const data: { date: string; revenue: number; transactions: number }[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayPayments = payments.filter(p => 
        new Date(p.createdAt).toISOString().split('T')[0] === dateStr
      );
      
      data.push({
        date: dateStr,
        revenue: dayPayments.reduce((sum, p) => sum + p.amount, 0),
        transactions: dayPayments.length
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return data;
  }

  private static generateMonthlyRevenueData(
    payments: PaymentRecord[]
  ): { month: string; revenue: number; transactions: number }[] {
    const monthlyData = new Map<string, { revenue: number; transactions: number }>();
    
    payments.forEach(payment => {
      const date = new Date(payment.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { revenue: 0, transactions: 0 });
      }
      
      const data = monthlyData.get(monthKey)!;
      data.revenue += payment.amount;
      data.transactions += 1;
    });
    
    return Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      ...data
    }));
  }

  private static async getRevenueByPlan(
    payments: PaymentRecord[]
  ): Promise<{ plan: string; revenue: number; users: number }[]> {
    // This would need to integrate with subscription data
    // For now, return placeholder data
    return [
      { plan: 'premium', revenue: payments.reduce((sum, p) => sum + p.amount, 0), users: payments.length },
      { plan: 'free', revenue: 0, users: 0 }
    ];
  }

  private static getRevenueByPaymentMethod(
    payments: PaymentRecord[]
  ): { method: string; revenue: number; percentage: number }[] {
    const methodData = new Map<string, number>();
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    
    payments.forEach(payment => {
      const current = methodData.get(payment.paymentMethod) || 0;
      methodData.set(payment.paymentMethod, current + payment.amount);
    });
    
    return Array.from(methodData.entries()).map(([method, revenue]) => ({
      method,
      revenue,
      percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0
    }));
  }
}

/**
 * Dispute management utilities
 */
export class DisputeManager {
  /**
   * Create a new payment dispute
   */
  static async createDispute(
    paymentId: string,
    userId: string,
    reason: string
  ): Promise<PaymentDispute> {
    const response = await fetch('/api/admin/payments/disputes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentId,
        userId,
        reason,
        status: 'open',
        createdAt: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create dispute');
    }

    return await response.json();
  }

  /**
   * Update dispute status and add admin notes
   */
  static async updateDispute(
    disputeId: string,
    status: PaymentDispute['status'],
    adminNotes: string,
    adminId: string
  ): Promise<PaymentDispute> {
    const response = await fetch(`/api/admin/payments/disputes/${disputeId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
        adminNotes,
        updatedBy: adminId,
        updatedAt: new Date().toISOString(),
        ...(status === 'resolved' && { resolvedAt: new Date().toISOString() })
      })
    });

    if (!response.ok) {
      throw new Error('Failed to update dispute');
    }

    return await response.json();
  }

  /**
   * Get all disputes with optional filtering
   */
  static async getDisputes(
    status?: PaymentDispute['status'],
    limit: number = 50
  ): Promise<PaymentDispute[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(status && { status })
    });

    const response = await fetch(`/api/admin/payments/disputes?${params}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch disputes');
    }

    return await response.json();
  }
}