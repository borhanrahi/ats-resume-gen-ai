'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';
import { 
  CalendarIcon,
  Download,
  TrendingUp,
  Users,
  FileText,
  CreditCard,
  Eye,
  MousePointer,
  UserPlus,
  DollarSign,
  Activity,
  Filter,
  RefreshCw
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  premiumUsers: number;
  userGrowth: Array<{
    date: string;
    total: number;
    new: number;
    premium: number;
  }>;
  userBehavior: {
    avgSessionDuration: number;
    avgAnalysesPerUser: number;
    bounceRate: number;
    returnUserRate: number;
  };
}

interface ConversionFunnel {
  steps: Array<{
    name: string;
    users: number;
    conversionRate: number;
  }>;
  overallConversion: number;
}

interface FeatureUsage {
  features: Array<{
    name: string;
    usage: number;
    growth: number;
    tier: 'free' | 'premium';
  }>;
  popularFeatures: string[];
  underutilizedFeatures: string[];
}

interface RevenueAnalytics {
  totalRevenue: number;
  monthlyRecurring: number;
  averageRevenuePerUser: number;
  churnRate: number;
  revenueGrowth: Array<{
    date: string;
    revenue: number;
    subscriptions: number;
  }>;
}

interface DateRange {
  from: Date;
  to: Date;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function AnalyticsCharts() {
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [funnel, setFunnel] = useState<ConversionFunnel | null>(null);
  const [features, setFeatures] = useState<FeatureUsage | null>(null);
  const [revenue, setRevenue] = useState<RevenueAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [selectedMetric, setSelectedMetric] = useState('users');
  const [exportFormat, setExportFormat] = useState('csv');

  // Mobile-first responsive design
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString()
      });

      // Fetch user analytics
      const userResponse = await fetch(`/api/admin/analytics/users?${params}`);
      const userData = await userResponse.json();
      
      // Fetch conversion funnel
      const funnelResponse = await fetch(`/api/admin/analytics/funnel?${params}`);
      const funnelData = await funnelResponse.json();
      
      // Fetch feature usage
      const featuresResponse = await fetch(`/api/admin/analytics/features?${params}`);
      const featuresData = await featuresResponse.json();
      
      // Fetch revenue analytics
      const revenueResponse = await fetch(`/api/admin/analytics/revenue?${params}`);
      const revenueData = await revenueResponse.json();

      setAnalytics(userData.data);
      setFunnel(funnelData.data);
      setFeatures(featuresData.data);
      setRevenue(revenueData.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
        format: exportFormat,
        metric: selectedMetric
      });

      const response = await fetch(`/api/admin/analytics/export?${params}`);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${format(dateRange.from, 'yyyy-MM-dd')}-to-${format(dateRange.to, 'yyyy-MM-dd')}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export analytics:', error);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (isLoading && !analytics) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold">Analytics & Reporting</h1>
          <div className="animate-spin">
            <RefreshCw className="h-5 w-5" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-4 lg:p-6 space-y-4 md:space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">Analytics & Reporting</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            User behavior insights and business metrics
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full lg:w-auto">
          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-h-[44px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dateRange.from, 'MMM dd')} - {format(dateRange.to, 'MMM dd')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="flex flex-col sm:flex-row">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange({ from: range.from, to: range.to });
                    }
                  }}
                  numberOfMonths={isMobile ? 1 : 2}
                />
              </div>
            </PopoverContent>
          </Popover>

          {/* Export Controls */}
          <div className="flex items-center gap-2">
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger className="w-20 min-h-[44px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="xlsx">Excel</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={handleExport} className="min-h-[44px]">
              <Download className="h-4 w-4 mr-1" />
              {!isMobile && 'Export'}
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-lg md:text-2xl font-bold">{formatNumber(analytics.totalUsers)}</p>
                  <p className="text-xs text-green-600">+{analytics.newUsers} new</p>
                </div>
                <Users className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Active Users</p>
                  <p className="text-lg md:text-2xl font-bold">{formatNumber(analytics.activeUsers)}</p>
                  <p className="text-xs text-blue-600">
                    {((analytics.activeUsers / analytics.totalUsers) * 100).toFixed(1)}% of total
                  </p>
                </div>
                <Activity className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Premium Users</p>
                  <p className="text-lg md:text-2xl font-bold">{formatNumber(analytics.premiumUsers)}</p>
                  <p className="text-xs text-purple-600">
                    {((analytics.premiumUsers / analytics.totalUsers) * 100).toFixed(1)}% conversion
                  </p>
                </div>
                <CreditCard className="h-6 w-6 md:h-8 md:w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Revenue</p>
                  <p className="text-lg md:text-2xl font-bold">
                    {revenue ? formatCurrency(revenue.totalRevenue) : '$0'}
                  </p>
                  <p className="text-xs text-green-600">
                    {revenue ? formatCurrency(revenue.averageRevenuePerUser) : '$0'} ARPU
                  </p>
                </div>
                <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger value="users" className="text-xs md:text-sm py-2 md:py-3">Users</TabsTrigger>
          <TabsTrigger value="funnel" className="text-xs md:text-sm py-2 md:py-3">Conversion</TabsTrigger>
          <TabsTrigger value="features" className="text-xs md:text-sm py-2 md:py-3">Features</TabsTrigger>
          <TabsTrigger value="revenue" className="text-xs md:text-sm py-2 md:py-3">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* User Growth Chart */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">User Growth</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Total, new, and premium user growth over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics?.userGrowth || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        fontSize={12}
                        tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                      />
                      <YAxis fontSize={12} />
                      <Tooltip 
                        labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                        formatter={(value: number, name: string) => [formatNumber(value), name]}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        stroke="#8884d8" 
                        name="Total Users"
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="new" 
                        stroke="#82ca9d" 
                        name="New Users"
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="premium" 
                        stroke="#ffc658" 
                        name="Premium Users"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* User Behavior Metrics */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">User Behavior</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Key engagement metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analytics && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Avg Session Duration</span>
                      <span className="text-sm font-mono">
                        {Math.floor(analytics.userBehavior.avgSessionDuration / 60)}m {analytics.userBehavior.avgSessionDuration % 60}s
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Analyses per User</span>
                      <span className="text-sm font-mono">
                        {analytics.userBehavior.avgAnalysesPerUser.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Bounce Rate</span>
                      <span className="text-sm font-mono">
                        {(analytics.userBehavior.bounceRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Return User Rate</span>
                      <span className="text-sm font-mono">
                        {(analytics.userBehavior.returnUserRate * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Conversion Funnel Chart */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Conversion Funnel</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  User journey from landing to premium conversion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <FunnelChart>
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          `${formatNumber(value)} users (${((value / (funnel?.steps[0]?.users || 1)) * 100).toFixed(1)}%)`,
                          name
                        ]}
                      />
                      <Funnel
                        dataKey="users"
                        data={funnel?.steps || []}
                        isAnimationActive
                      >
                        <LabelList position="center" fill="#fff" stroke="none" />
                        {funnel?.steps.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Funnel>
                    </FunnelChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Conversion Rates */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Conversion Rates</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Step-by-step conversion analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {funnel?.steps.map((step, index) => (
                  <div key={step.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{step.name}</span>
                      <span className="text-muted-foreground">
                        {formatNumber(step.users)} users
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Conversion Rate</span>
                      <span className="font-mono">
                        {step.conversionRate.toFixed(1)}%
                      </span>
                    </div>
                    {index < (funnel?.steps.length || 0) - 1 && (
                      <div className="border-b border-gray-100"></div>
                    )}
                  </div>
                ))}
                
                {funnel && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <span>Overall Conversion</span>
                      <span className="text-green-600">
                        {funnel.overallConversion.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Feature Usage Chart */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Feature Usage</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Most and least used features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={features?.features || []} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" fontSize={12} />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        fontSize={10}
                        width={80}
                      />
                      <Tooltip 
                        formatter={(value: number) => [formatNumber(value), 'Usage']}
                      />
                      <Bar dataKey="usage" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Feature Insights */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Feature Insights</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Popular and underutilized features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-green-600">Popular Features</h4>
                  <div className="space-y-1">
                    {features?.popularFeatures.map((feature) => (
                      <div key={feature} className="flex items-center gap-2">
                        <TrendingUp className="h-3 w-3 text-green-600" />
                        <span className="text-xs">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-orange-600">Underutilized Features</h4>
                  <div className="space-y-1">
                    {features?.underutilizedFeatures.map((feature) => (
                      <div key={feature} className="flex items-center gap-2">
                        <Eye className="h-3 w-3 text-orange-600" />
                        <span className="text-xs">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <h4 className="text-sm font-semibold mb-2">Feature Tiers</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <p className="text-xs text-blue-800 font-medium">Free Features</p>
                      <p className="text-lg font-bold text-blue-900">
                        {features?.features.filter(f => f.tier === 'free').length || 0}
                      </p>
                    </div>
                    <div className="text-center p-2 bg-purple-50 rounded">
                      <p className="text-xs text-purple-800 font-medium">Premium Features</p>
                      <p className="text-lg font-bold text-purple-900">
                        {features?.features.filter(f => f.tier === 'premium').length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Revenue Growth Chart */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Revenue Growth</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Revenue and subscription trends over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenue?.revenueGrowth || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        fontSize={12}
                        tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                      />
                      <YAxis fontSize={12} />
                      <Tooltip 
                        labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                        formatter={(value: number, name: string) => [
                          name === 'revenue' ? formatCurrency(value) : formatNumber(value),
                          name === 'revenue' ? 'Revenue' : 'Subscriptions'
                        ]}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#8884d8" 
                        name="Revenue"
                        strokeWidth={2}
                        yAxisId="revenue"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="subscriptions" 
                        stroke="#82ca9d" 
                        name="Subscriptions"
                        strokeWidth={2}
                        yAxisId="subscriptions"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Metrics */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Revenue Metrics</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Key financial indicators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {revenue && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Monthly Recurring</span>
                      <span className="text-sm font-mono">
                        {formatCurrency(revenue.monthlyRecurring)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Average Revenue per User</span>
                      <span className="text-sm font-mono">
                        {formatCurrency(revenue.averageRevenuePerUser)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Churn Rate</span>
                      <span className="text-sm font-mono">
                        {(revenue.churnRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Revenue</span>
                      <span className="text-sm font-mono font-semibold">
                        {formatCurrency(revenue.totalRevenue)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}