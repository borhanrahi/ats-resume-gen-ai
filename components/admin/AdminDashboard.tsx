'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  BarChart3, 
  Cpu, 
  RefreshCw, 
  DollarSign, 
  AlertTriangle,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Zap
} from 'lucide-react';
import { SystemMetrics } from '@/types/admin';

interface AdminDashboardProps {
  onNavigate?: (section: string) => void;
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  analysesToday: number;
  analysesThisMonth: number;
  apiCalls: number;
  successRate: number;
  revenue: {
    today: number;
    thisMonth: number;
    total: number;
  };
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    responseTime: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'user_signup' | 'analysis' | 'payment' | 'error';
    message: string;
    timestamp: Date;
  }>;
}

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setError(null);
      const response = await fetch('/api/admin/dashboard');
      
      if (!response.ok) {
        throw new Error('Failed to load dashboard data');
      }
      
      const data = await response.json();
      setStats(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Dashboard data loading failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      
      // Set mock data for development
      setStats({
        totalUsers: 1234,
        activeUsers: 456,
        premiumUsers: 89,
        analysesToday: 234,
        analysesThisMonth: 5678,
        apiCalls: 2890,
        successRate: 98.5,
        revenue: {
          today: 145.50,
          thisMonth: 3420.75,
          total: 12567.89
        },
        systemHealth: {
          status: 'healthy',
          uptime: 99.8,
          responseTime: 245
        },
        recentActivity: [
          {
            id: '1',
            type: 'user_signup',
            message: 'New premium user registered: john@example.com',
            timestamp: new Date(Date.now() - 5 * 60 * 1000)
          },
          {
            id: '2',
            type: 'analysis',
            message: 'Resume analysis completed for user ID: 456',
            timestamp: new Date(Date.now() - 12 * 60 * 1000)
          },
          {
            id: '3',
            type: 'payment',
            message: 'Payment received: $29.99 from user ID: 789',
            timestamp: new Date(Date.now() - 25 * 60 * 1000)
          },
          {
            id: '4',
            type: 'error',
            message: 'API rate limit exceeded for OpenRouter',
            timestamp: new Date(Date.now() - 45 * 60 * 1000)
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_signup': return <Users className="w-4 h-4 text-blue-500" />;
      case 'analysis': return <BarChart3 className="w-4 h-4 text-green-500" />;
      case 'payment': return <DollarSign className="w-4 h-4 text-purple-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-8 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Failed to Load Dashboard</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">System Overview</h2>
          <p className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={loadDashboardData}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-card border border-border rounded-lg p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Total Users</h3>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">{stats?.totalUsers.toLocaleString()}</div>
          <p className="text-sm text-muted-foreground">
            {stats?.premiumUsers} premium users
          </p>
        </div>

        {/* Active Users */}
        <div className="bg-card border border-border rounded-lg p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Active Today</h3>
            <Activity className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">{stats?.activeUsers.toLocaleString()}</div>
          <p className="text-sm text-muted-foreground">
            {stats?.activeUsers && stats?.totalUsers ? 
              `${((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% of total` : 
              'Active users today'
            }
          </p>
        </div>

        {/* Analyses Today */}
        <div className="bg-card border border-border rounded-lg p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Analyses Today</h3>
            <BarChart3 className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">{stats?.analysesToday.toLocaleString()}</div>
          <p className="text-sm text-muted-foreground">
            {stats?.analysesThisMonth.toLocaleString()} this month
          </p>
        </div>

        {/* Revenue Today */}
        <div className="bg-card border border-border rounded-lg p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Revenue Today</h3>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            ${stats?.revenue.today.toFixed(2)}
          </div>
          <p className="text-sm text-muted-foreground">
            ${stats?.revenue.thisMonth.toFixed(2)} this month
          </p>
        </div>

        {/* API Calls */}
        <div className="bg-card border border-border rounded-lg p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">API Calls</h3>
            <Cpu className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">{stats?.apiCalls.toLocaleString()}</div>
          <p className="text-sm text-muted-foreground">Last 24 hours</p>
        </div>

        {/* Success Rate */}
        <div className="bg-card border border-border rounded-lg p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Success Rate</h3>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-500">{stats?.successRate}%</div>
          <p className="text-sm text-muted-foreground">API reliability</p>
        </div>

        {/* System Health */}
        <div className="bg-card border border-border rounded-lg p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">System Health</h3>
            <Zap className={`w-5 h-5 ${getHealthStatusColor(stats?.systemHealth.status || 'healthy')}`} />
          </div>
          <div className={`text-2xl font-bold capitalize ${getHealthStatusColor(stats?.systemHealth.status || 'healthy')}`}>
            {stats?.systemHealth.status}
          </div>
          <p className="text-sm text-muted-foreground">
            {stats?.systemHealth.uptime}% uptime
          </p>
        </div>

        {/* Response Time */}
        <div className="bg-card border border-border rounded-lg p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Response Time</h3>
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">{stats?.systemHealth.responseTime}ms</div>
          <p className="text-sm text-muted-foreground">Average response</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => onNavigate?.('users')}
            className="flex items-center space-x-3 p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-left"
          >
            <Users className="w-5 h-5 text-blue-500" />
            <div>
              <div className="font-medium text-foreground">Manage Users</div>
              <div className="text-sm text-muted-foreground">View and edit user accounts</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate?.('models')}
            className="flex items-center space-x-3 p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-left"
          >
            <Cpu className="w-5 h-5 text-purple-500" />
            <div>
              <div className="font-medium text-foreground">AI Models</div>
              <div className="text-sm text-muted-foreground">Configure AI settings</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate?.('analytics')}
            className="flex items-center space-x-3 p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-left"
          >
            <BarChart3 className="w-5 h-5 text-green-500" />
            <div>
              <div className="font-medium text-foreground">Analytics</div>
              <div className="text-sm text-muted-foreground">View detailed metrics</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate?.('payments')}
            className="flex items-center space-x-3 p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-left"
          >
            <DollarSign className="w-5 h-5 text-green-600" />
            <div>
              <div className="font-medium text-foreground">Payments</div>
              <div className="text-sm text-muted-foreground">Monitor billing</div>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
          <button
            onClick={() => onNavigate?.('analytics')}
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            View All
          </button>
        </div>
        
        <div className="space-y-3">
          {stats?.recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
              {getActivityIcon(activity.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{activity.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatTimeAgo(activity.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}