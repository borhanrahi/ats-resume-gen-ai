'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  CreditCard, 
  AlertTriangle,
  Search,
  Download,
  RefreshCw,
  Calendar,
  Filter
} from 'lucide-react';
import { PaymentRecord } from '@/types/user';

interface PaymentStats {
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

interface PaymentDispute {
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

interface RevenueAnalytics {
  daily: { date: string; revenue: number; transactions: number }[];
  monthly: { month: string; revenue: number; transactions: number }[];
  byPlan: { plan: string; revenue: number; users: number }[];
  byPaymentMethod: { method: string; revenue: number; percentage: number }[];
}

export default function PaymentOverview() {
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [recentPayments, setRecentPayments] = useState<PaymentRecord[]>([]);
  const [disputes, setDisputes] = useState<PaymentDispute[]>([]);
  const [analytics, setAnalytics] = useState<RevenueAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30d');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadPaymentData();
  }, [dateRange, statusFilter]);

  const loadPaymentData = async () => {
    setLoading(true);
    try {
      // Load payment statistics
      const statsResponse = await fetch(`/api/admin/payments/stats?range=${dateRange}`);
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setPaymentStats(stats);
      }

      // Load recent payments
      const paymentsResponse = await fetch(`/api/admin/payments?limit=50&status=${statusFilter}`);
      if (paymentsResponse.ok) {
        const payments = await paymentsResponse.json();
        setRecentPayments(payments);
      }

      // Load disputes
      const disputesResponse = await fetch('/api/admin/payments/disputes');
      if (disputesResponse.ok) {
        const disputesData = await disputesResponse.json();
        setDisputes(disputesData);
      }

      // Load analytics
      const analyticsResponse = await fetch(`/api/admin/payments/analytics?range=${dateRange}`);
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData);
      }
    } catch (error) {
      console.error('Error loading payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (paymentId: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/payments/${paymentId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        await loadPaymentData();
      }
    } catch (error) {
      console.error('Error processing refund:', error);
    }
  };

  const handleDisputeUpdate = async (disputeId: string, status: string, notes: string) => {
    try {
      const response = await fetch(`/api/admin/payments/disputes/${disputeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes: notes })
      });

      if (response.ok) {
        await loadPaymentData();
      }
    } catch (error) {
      console.error('Error updating dispute:', error);
    }
  };

  const exportPaymentData = async () => {
    try {
      const response = await fetch(`/api/admin/payments/export?range=${dateRange}&format=csv`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payment-data-${dateRange}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting payment data:', error);
    }
  };

  const filteredPayments = recentPayments.filter(payment => 
    payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.userId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Mobile-First Header */}
      <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Payment Overview</h1>
          <p className="text-sm text-muted-foreground">
            Monitor revenue, transactions, and payment disputes
          </p>
        </div>
        <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full md:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportPaymentData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={loadPaymentData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="text-xs md:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="transactions" className="text-xs md:text-sm">Transactions</TabsTrigger>
          <TabsTrigger value="disputes" className="text-xs md:text-sm">Disputes</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs md:text-sm">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Revenue Stats Cards - Mobile-First Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">
                  {paymentStats ? formatCurrency(paymentStats.totalRevenue) : '$0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {paymentStats && paymentStats.revenueGrowth > 0 ? (
                    <span className="text-green-600 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{paymentStats.revenueGrowth.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      {paymentStats?.revenueGrowth.toFixed(1)}%
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">
                  {paymentStats ? formatCurrency(paymentStats.monthlyRevenue) : '$0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">
                  {paymentStats?.totalTransactions || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {paymentStats?.successfulTransactions || 0} successful
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">
                  {paymentStats?.conversionRate.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Free to premium
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium">Process Refunds</div>
                    <div className="text-sm text-muted-foreground">
                      {disputes.filter(d => d.status === 'open').length} pending
                    </div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium">Review Disputes</div>
                    <div className="text-sm text-muted-foreground">
                      {disputes.filter(d => d.status === 'investigating').length} investigating
                    </div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium">Failed Payments</div>
                    <div className="text-sm text-muted-foreground">
                      {paymentStats?.failedTransactions || 0} failed
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by transaction ID or user ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transactions Table - Mobile-First */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Latest payment transactions and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredPayments.map((payment) => (
                  <div key={payment.$id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
                      <div className="space-y-1">
                        <div className="font-medium text-sm">
                          {payment.transactionId}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          User: {payment.userId}
                        </div>
                      </div>
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Amount</div>
                        <div className="font-medium">
                          {formatCurrency(payment.amount, payment.currency)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Method</div>
                        <div className="font-medium">{payment.paymentMethod}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Date</div>
                        <div className="font-medium">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {payment.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRefund(payment.$id, 'Admin refund')}
                          >
                            Refund
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disputes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Payment Disputes
              </CardTitle>
              <CardDescription>
                Manage payment disputes and refund requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {disputes.map((dispute) => (
                  <div key={dispute.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
                      <div className="space-y-1">
                        <div className="font-medium">
                          Dispute #{dispute.id.slice(-8)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {dispute.userEmail} • {formatCurrency(dispute.amount, dispute.currency)}
                        </div>
                      </div>
                      <Badge className={getStatusColor(dispute.status)}>
                        {dispute.status}
                      </Badge>
                    </div>
                    
                    <div className="text-sm">
                      <div className="font-medium mb-1">Reason:</div>
                      <div className="text-muted-foreground">{dispute.reason}</div>
                    </div>
                    
                    {dispute.adminNotes && (
                      <div className="text-sm">
                        <div className="font-medium mb-1">Admin Notes:</div>
                        <div className="text-muted-foreground">{dispute.adminNotes}</div>
                      </div>
                    )}
                    
                    <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleDisputeUpdate(dispute.id, 'investigating', 'Under review')}
                        disabled={dispute.status === 'resolved'}
                      >
                        Investigate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDisputeUpdate(dispute.id, 'resolved', 'Resolved by admin')}
                        disabled={dispute.status === 'resolved'}
                      >
                        Resolve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Revenue Analytics Charts would go here */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.byPlan.map((plan) => (
                    <div key={plan.plan} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium capitalize">{plan.plan}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {formatCurrency(plan.revenue)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {plan.users} users
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.byPaymentMethod.map((method) => (
                    <div key={method.method} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">{method.method}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {formatCurrency(method.revenue)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {method.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}