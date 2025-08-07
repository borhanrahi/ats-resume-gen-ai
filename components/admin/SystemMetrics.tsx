'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  RefreshCw, 
  Server, 
  TrendingUp, 
  Users, 
  Zap,
  AlertCircle,
  Cpu,
  HardDrive,
  Network
} from 'lucide-react';
import { SystemMetrics as SystemMetricsType } from '@/types/admin';

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  lastUpdated: Date;
  services: {
    api: 'online' | 'offline' | 'degraded';
    database: 'online' | 'offline' | 'degraded';
    aiModels: 'online' | 'offline' | 'degraded';
    storage: 'online' | 'offline' | 'degraded';
  };
}

interface PerformanceMetrics {
  responseTime: {
    avg: number;
    p95: number;
    p99: number;
  };
  throughput: {
    requestsPerSecond: number;
    analysesPerHour: number;
  };
  resourceUsage: {
    cpu: number;
    memory: number;
    storage: number;
  };
}

interface ErrorMetrics {
  errorRate: number;
  criticalErrors: number;
  warningCount: number;
  recentErrors: Array<{
    id: string;
    timestamp: Date;
    level: 'error' | 'warning' | 'critical';
    message: string;
    service: string;
  }>;
}

interface AlertConfig {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  isActive: boolean;
  lastTriggered?: Date;
}

export default function SystemMetrics() {
  const [metrics, setMetrics] = useState<SystemMetricsType | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [errors, setErrors] = useState<ErrorMetrics | null>(null);
  const [alerts, setAlerts] = useState<AlertConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Mobile-first responsive design
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchSystemMetrics = async () => {
    try {
      setIsLoading(true);
      
      // Fetch system metrics
      const metricsResponse = await fetch('/api/admin/system/metrics');
      const metricsData = await metricsResponse.json();
      
      // Fetch system health
      const healthResponse = await fetch('/api/admin/system/health');
      const healthData = await healthResponse.json();
      
      // Fetch performance metrics
      const performanceResponse = await fetch('/api/admin/system/performance');
      const performanceData = await performanceResponse.json();
      
      // Fetch error metrics
      const errorsResponse = await fetch('/api/admin/system/errors');
      const errorsData = await errorsResponse.json();
      
      // Fetch alert configurations
      const alertsResponse = await fetch('/api/admin/system/alerts');
      const alertsData = await alertsResponse.json();

      setMetrics(metricsData.data);
      setHealth(healthData.data);
      setPerformance(performanceData.data);
      setErrors(errorsData.data);
      setAlerts(alertsData.data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch system metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemMetrics();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(fetchSystemMetrics, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return 'text-green-600 bg-green-50';
      case 'warning':
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50';
      case 'critical':
      case 'offline':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
      case 'degraded':
        return <AlertTriangle className="h-4 w-4" />;
      case 'critical':
      case 'offline':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (isLoading && !metrics) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold">System Metrics</h1>
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">System Metrics</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Real-time system health and performance monitoring
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
            <Clock className="h-3 w-3 md:h-4 md:w-4" />
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size={isMobile ? "sm" : "default"}
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="min-h-[44px] min-w-[44px]"
            >
              <Activity className="h-4 w-4 mr-1" />
              {autoRefresh ? 'Auto' : 'Manual'}
            </Button>
            
            <Button
              variant="outline"
              size={isMobile ? "sm" : "default"}
              onClick={fetchSystemMetrics}
              disabled={isLoading}
              className="min-h-[44px] min-w-[44px]"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {!isMobile && <span className="ml-1">Refresh</span>}
            </Button>
          </div>
        </div>
      </div>

      {/* System Health Overview */}
      {health && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">System Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(health.status)}
                    <span className={`text-sm md:text-base font-semibold capitalize ${getStatusColor(health.status)}`}>
                      {health.status}
                    </span>
                  </div>
                </div>
                <Server className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Uptime</p>
                  <p className="text-lg md:text-2xl font-bold">{formatUptime(health.uptime)}</p>
                </div>
                <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Active Users</p>
                  <p className="text-lg md:text-2xl font-bold">{metrics?.activeUsers || 0}</p>
                </div>
                <Users className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Error Rate</p>
                  <p className="text-lg md:text-2xl font-bold">{errors?.errorRate.toFixed(2) || 0}%</p>
                </div>
                <AlertTriangle className={`h-6 w-6 md:h-8 md:w-8 ${
                  (errors?.errorRate || 0) > 5 ? 'text-red-600' : 'text-green-600'
                }`} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Metrics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger value="overview" className="text-xs md:text-sm py-2 md:py-3">Overview</TabsTrigger>
          <TabsTrigger value="performance" className="text-xs md:text-sm py-2 md:py-3">Performance</TabsTrigger>
          <TabsTrigger value="services" className="text-xs md:text-sm py-2 md:py-3">Services</TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs md:text-sm py-2 md:py-3">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* API Usage */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">API Usage</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  AI model usage and performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {metrics?.apiUsage && Object.entries(metrics.apiUsage).map(([modelId, usage]) => (
                  <div key={modelId} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium capitalize">{modelId}</span>
                      <span className="text-muted-foreground">{usage.requests} requests</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Success Rate</span>
                        <span>{((usage.requests - usage.failures) / usage.requests * 100).toFixed(1)}%</span>
                      </div>
                      <Progress 
                        value={(usage.requests - usage.failures) / usage.requests * 100} 
                        className="h-2"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Avg Response Time</span>
                      <span>{usage.avgResponseTime}ms</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Revenue Overview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Revenue</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Daily, monthly, and total revenue
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-xs font-medium text-green-800">Daily Revenue</p>
                      <p className="text-lg font-bold text-green-900">
                        ${metrics?.revenue.daily.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-xs font-medium text-blue-800">Monthly Revenue</p>
                      <p className="text-lg font-bold text-blue-900">
                        ${metrics?.revenue.monthly.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div>
                      <p className="text-xs font-medium text-purple-800">Total Revenue</p>
                      <p className="text-lg font-bold text-purple-900">
                        ${metrics?.revenue.total.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <Database className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {performance && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Response Time Metrics */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base md:text-lg">Response Time</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    API response time percentiles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Average</span>
                      <span className="text-sm font-mono">{performance.responseTime.avg}ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">95th Percentile</span>
                      <span className="text-sm font-mono">{performance.responseTime.p95}ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">99th Percentile</span>
                      <span className="text-sm font-mono">{performance.responseTime.p99}ms</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resource Usage */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base md:text-lg">Resource Usage</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    System resource utilization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Cpu className="h-4 w-4" />
                          <span>CPU Usage</span>
                        </div>
                        <span>{performance.resourceUsage.cpu}%</span>
                      </div>
                      <Progress value={performance.resourceUsage.cpu} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          <span>Memory Usage</span>
                        </div>
                        <span>{performance.resourceUsage.memory}%</span>
                      </div>
                      <Progress value={performance.resourceUsage.memory} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <HardDrive className="h-4 w-4" />
                          <span>Storage Usage</span>
                        </div>
                        <span>{performance.resourceUsage.storage}%</span>
                      </div>
                      <Progress value={performance.resourceUsage.storage} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Throughput Metrics */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base md:text-lg">Throughput</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    System throughput and processing rates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-blue-800">Requests/Second</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {performance.throughput.requestsPerSecond}
                        </p>
                      </div>
                      <Network className="h-6 w-6 text-blue-600" />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-green-800">Analyses/Hour</p>
                        <p className="text-2xl font-bold text-green-900">
                          {performance.throughput.analysesPerHour}
                        </p>
                      </div>
                      <Zap className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          {health && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {Object.entries(health.services).map(([service, status]) => (
                <Card key={service}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base md:text-lg font-semibold capitalize">{service}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          {getStatusIcon(status)}
                          <Badge className={getStatusColor(status)}>
                            {status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Last Check</p>
                        <p className="text-sm font-mono">
                          {health.lastUpdated.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Recent Errors */}
            {errors && errors.recentErrors.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base md:text-lg">Recent Errors</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Latest system errors and warnings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {errors.recentErrors.slice(0, 5).map((error) => (
                      <div key={error.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="flex-shrink-0 mt-0.5">
                          {error.level === 'critical' && <AlertCircle className="h-4 w-4 text-red-600" />}
                          {error.level === 'error' && <AlertTriangle className="h-4 w-4 text-orange-600" />}
                          {error.level === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {error.service}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {error.timestamp.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 break-words">{error.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Alert Configuration */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Alert Configuration</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  System alert rules and thresholds
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">{alert.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {alert.condition} &gt; {alert.threshold}
                        </p>
                        {alert.lastTriggered && (
                          <p className="text-xs text-muted-foreground">
                            Last triggered: {alert.lastTriggered.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <Badge variant={alert.isActive ? "default" : "secondary"}>
                        {alert.isActive ? "Active" : "Inactive"}
                      </Badge>
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