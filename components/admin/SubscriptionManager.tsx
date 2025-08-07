'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  Calendar, 
  AlertTriangle,
  Search,
  RefreshCw,
  Edit,
  Pause,
  Play,
  X,
  CheckCircle,
  Clock,
  CreditCard,
  Filter
} from 'lucide-react';
import { User } from '@/types/user';

interface SubscriptionModification {
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
}

interface PaymentFailure {
  id: string;
  userId: string;
  userEmail: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  failureReason: string;
  retryCount: number;
  nextRetryDate?: Date;
  lastAttemptDate: Date;
  status: 'retrying' | 'failed' | 'resolved';
}

interface SubscriptionStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  cancelledSubscriptions: number;
  expiredSubscriptions: number;
  pendingRenewals: number;
  failedPayments: number;
  monthlyRecurringRevenue: number;
  churnRate: number;
}

export default function SubscriptionManager() {
  const [subscriptions, setSubscriptions] = useState<User[]>([]);
  const [modifications, setModifications] = useState<SubscriptionModification[]>([]);
  const [paymentFailures, setPaymentFailures] = useState<PaymentFailure[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('subscriptions');
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modificationDialog, setModificationDialog] = useState(false);
  const [modificationForm, setModificationForm] = useState({
    action: '',
    newPlan: '',
    reason: '',
    effectiveDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadSubscriptionData();
  }, [statusFilter, planFilter]);

  const loadSubscriptionData = async () => {
    setLoading(true);
    try {
      // Load subscription statistics
      const statsResponse = await fetch('/api/admin/subscriptions/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Load subscriptions
      const subscriptionsResponse = await fetch(`/api/admin/subscriptions?status=${statusFilter}&plan=${planFilter}`);
      if (subscriptionsResponse.ok) {
        const subscriptionsData = await subscriptionsResponse.json();
        setSubscriptions(subscriptionsData);
      }

      // Load modifications
      const modificationsResponse = await fetch('/api/admin/subscriptions/modifications');
      if (modificationsResponse.ok) {
        const modificationsData = await modificationsResponse.json();
        setModifications(modificationsData);
      }

      // Load payment failures
      const failuresResponse = await fetch('/api/admin/subscriptions/payment-failures');
      if (failuresResponse.ok) {
        const failuresData = await failuresResponse.json();
        setPaymentFailures(failuresData);
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionModification = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch('/api/admin/subscriptions/modify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.$id,
          ...modificationForm
        })
      });

      if (response.ok) {
        setModificationDialog(false);
        setSelectedUser(null);
        setModificationForm({
          action: '',
          newPlan: '',
          reason: '',
          effectiveDate: new Date().toISOString().split('T')[0]
        });
        await loadSubscriptionData();
      }
    } catch (error) {
      console.error('Error modifying subscription:', error);
    }
  };

  const handleRetryPayment = async (failureId: string) => {
    try {
      const response = await fetch(`/api/admin/subscriptions/payment-failures/${failureId}/retry`, {
        method: 'POST'
      });

      if (response.ok) {
        await loadSubscriptionData();
      }
    } catch (error) {
      console.error('Error retrying payment:', error);
    }
  };

  const handleCancelRetries = async (failureId: string) => {
    try {
      const response = await fetch(`/api/admin/subscriptions/payment-failures/${failureId}/cancel`, {
        method: 'POST'
      });

      if (response.ok) {
        await loadSubscriptionData();
      }
    } catch (error) {
      console.error('Error cancelling retries:', error);
    }
  };

  const filteredSubscriptions = subscriptions.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.$id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'free': return 'bg-blue-100 text-blue-800';
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
          <h1 className="text-xl md:text-2xl font-bold">Subscription Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage user subscriptions, modifications, and payment failures
          </p>
        </div>
        <Button onClick={loadSubscriptionData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="subscriptions" className="text-xs md:text-sm">Subscriptions</TabsTrigger>
          <TabsTrigger value="modifications" className="text-xs md:text-sm">Modifications</TabsTrigger>
          <TabsTrigger value="failures" className="text-xs md:text-sm">Payment Failures</TabsTrigger>
          <TabsTrigger value="stats" className="text-xs md:text-sm">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, name, or user ID..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subscriptions List - Mobile-First */}
          <div className="space-y-4">
            {filteredSubscriptions.map((user) => (
              <Card key={user.$id}>
                <CardContent className="p-4">
                  <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="font-medium">{user.name}</div>
                        <Badge className={getPlanColor(user.subscription.plan)}>
                          {user.subscription.plan}
                        </Badge>
                        <Badge className={getStatusColor(user.subscription.status)}>
                          {user.subscription.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user.email}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Expires: {new Date(user.subscription.expiresAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(user);
                          setModificationDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Modify
                      </Button>
                      {user.subscription.status === 'active' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setModificationForm({
                              action: 'cancel',
                              newPlan: '',
                              reason: '',
                              effectiveDate: new Date().toISOString().split('T')[0]
                            });
                            setModificationDialog(true);
                          }}
                        >
                          <Pause className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setModificationForm({
                              action: 'reactivate',
                              newPlan: 'premium',
                              reason: '',
                              effectiveDate: new Date().toISOString().split('T')[0]
                            });
                            setModificationDialog(true);
                          }}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Reactivate
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="modifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Modifications</CardTitle>
              <CardDescription>
                History of subscription changes and modifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {modifications.map((modification) => (
                  <div key={modification.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
                      <div className="space-y-1">
                        <div className="font-medium">
                          {modification.userEmail}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {modification.action}: {modification.currentPlan} → {modification.newPlan}
                        </div>
                      </div>
                      <Badge className={getStatusColor(modification.status)}>
                        {modification.status}
                      </Badge>
                    </div>
                    
                    <div className="text-sm">
                      <div className="font-medium mb-1">Reason:</div>
                      <div className="text-muted-foreground">{modification.reason}</div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      Effective: {new Date(modification.effectiveDate).toLocaleDateString()} • 
                      Created: {new Date(modification.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failures" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Payment Failures
              </CardTitle>
              <CardDescription>
                Manage failed payments and retry mechanisms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentFailures.map((failure) => (
                  <div key={failure.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
                      <div className="space-y-1">
                        <div className="font-medium">
                          {failure.userEmail}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(failure.amount, failure.currency)} • 
                          Retry {failure.retryCount}/3
                        </div>
                      </div>
                      <Badge className={getStatusColor(failure.status)}>
                        {failure.status}
                      </Badge>
                    </div>
                    
                    <div className="text-sm">
                      <div className="font-medium mb-1">Failure Reason:</div>
                      <div className="text-muted-foreground">{failure.failureReason}</div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      Last Attempt: {new Date(failure.lastAttemptDate).toLocaleDateString()}
                      {failure.nextRetryDate && (
                        <> • Next Retry: {new Date(failure.nextRetryDate).toLocaleDateString()}</>
                      )}
                    </div>
                    
                    <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
                      {failure.status === 'retrying' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleRetryPayment(failure.id)}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry Now
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelRetries(failure.id)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel Retries
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          {/* Subscription Stats Cards - Mobile-First Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">
                  {stats?.totalSubscriptions || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.activeSubscriptions || 0} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">MRR</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">
                  {stats ? formatCurrency(stats.monthlyRecurringRevenue) : '$0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Monthly recurring revenue
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">
                  {stats?.churnRate.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Monthly churn rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed Payments</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">
                  {stats?.failedPayments || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Requiring attention
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modification Dialog */}
      <Dialog open={modificationDialog} onOpenChange={setModificationDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modify Subscription</DialogTitle>
            <DialogDescription>
              Make changes to {selectedUser?.email}'s subscription
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="action" className="text-right">
                Action
              </Label>
              <Select
                value={modificationForm.action}
                onValueChange={(value) => setModificationForm(prev => ({ ...prev, action: value }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upgrade">Upgrade</SelectItem>
                  <SelectItem value="downgrade">Downgrade</SelectItem>
                  <SelectItem value="extend">Extend</SelectItem>
                  <SelectItem value="cancel">Cancel</SelectItem>
                  <SelectItem value="reactivate">Reactivate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {(modificationForm.action === 'upgrade' || modificationForm.action === 'downgrade' || modificationForm.action === 'reactivate') && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="newPlan" className="text-right">
                  New Plan
                </Label>
                <Select
                  value={modificationForm.newPlan}
                  onValueChange={(value) => setModificationForm(prev => ({ ...prev, newPlan: value }))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="effectiveDate" className="text-right">
                Effective Date
              </Label>
              <Input
                id="effectiveDate"
                type="date"
                value={modificationForm.effectiveDate}
                onChange={(e) => setModificationForm(prev => ({ ...prev, effectiveDate: e.target.value }))}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="text-right">
                Reason
              </Label>
              <Textarea
                id="reason"
                placeholder="Reason for modification..."
                value={modificationForm.reason}
                onChange={(e) => setModificationForm(prev => ({ ...prev, reason: e.target.value }))}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSubscriptionModification}>
              Apply Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}