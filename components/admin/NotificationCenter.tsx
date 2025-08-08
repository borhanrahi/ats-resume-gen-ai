/**
 * Admin notification center component
 * Displays real-time notifications and allows management of notification preferences
 * Requirements: 13.3, 13.4 - System monitoring with admin notification management
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  X, 
  Settings, 
  Mail, 
  Smartphone, 
  MessageSquare,
  Clock,
  User,
  Shield,
  Zap,
  Filter,
  Search,
  Download,
  TestTube
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

interface Notification {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: number;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'acknowledged';
  channels: string[];
  recipients: string[];
  source: {
    component: string;
    userId?: string;
    adminId?: string;
  };
  data?: Record<string, unknown>;
}

interface NotificationStats {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalAcknowledged: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  byChannel: Record<string, number>;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    severity: '',
    type: '',
    status: '',
    search: '',
  });
  const [showSettings, setShowSettings] = useState(false);
  const [testEmailDialog, setTestEmailDialog] = useState(false);
  const { toast } = useToast();

  // Load notifications and stats
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load notifications (mock data for now)
      const mockNotifications: Notification[] = [
        {
          id: 'notif_1',
          type: 'critical_error',
          severity: 'critical',
          title: 'AI API Service Down',
          message: 'OpenRouter API is returning 503 errors. All AI analysis requests are failing.',
          timestamp: Date.now() - 300000, // 5 minutes ago
          status: 'delivered',
          channels: ['email', 'console'],
          recipients: ['admin@example.com'],
          source: { component: 'ai_analysis' },
          data: { errorCount: 15, lastError: 'Service Unavailable' },
        },
        {
          id: 'notif_2',
          type: 'high_error_rate',
          severity: 'high',
          title: 'High Error Rate Detected',
          message: 'Error rate has exceeded 10% in the last 5 minutes.',
          timestamp: Date.now() - 600000, // 10 minutes ago
          status: 'acknowledged',
          channels: ['email'],
          recipients: ['admin@example.com'],
          source: { component: 'system' },
          data: { errorRate: 12.5, timeWindow: '5 minutes' },
        },
        {
          id: 'notif_3',
          type: 'auth_failure',
          severity: 'medium',
          title: 'Multiple Authentication Failures',
          message: '5 failed login attempts detected from IP 192.168.1.100',
          timestamp: Date.now() - 900000, // 15 minutes ago
          status: 'delivered',
          channels: ['console'],
          recipients: ['admin@example.com'],
          source: { component: 'auth' },
          data: { ip: '192.168.1.100', attempts: 5 },
        },
      ];

      const mockStats: NotificationStats = {
        totalSent: 25,
        totalDelivered: 23,
        totalFailed: 1,
        totalAcknowledged: 15,
        byType: {
          critical_error: 3,
          system_error: 8,
          high_error_rate: 4,
          auth_failure: 6,
          security_event: 2,
          performance_issue: 2,
        },
        bySeverity: {
          low: 5,
          medium: 10,
          high: 7,
          critical: 3,
        },
        byChannel: {
          email: 20,
          console: 15,
          webhook: 5,
        },
      };

      setNotifications(mockNotifications);
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to load notification data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notification data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
    
    // Set up polling for real-time updates
    const interval = setInterval(loadData, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [loadData]);

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter.severity && notification.severity !== filter.severity) return false;
    if (filter.type && notification.type !== filter.type) return false;
    if (filter.status && notification.status !== filter.status) return false;
    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      return (
        notification.title.toLowerCase().includes(searchTerm) ||
        notification.message.toLowerCase().includes(searchTerm)
      );
    }
    return true;
  });

  // Acknowledge notification
  const acknowledgeNotification = async (notificationId: string) => {
    try {
      // TODO: Call API to acknowledge notification
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, status: 'acknowledged' as const }
            : n
        )
      );
      
      toast({
        title: 'Success',
        description: 'Notification acknowledged',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to acknowledge notification',
        variant: 'destructive',
      });
    }
  };

  // Send test email
  const sendTestEmail = async (data: { recipient: string; template: string; subject?: string; message?: string }) => {
    try {
      const response = await fetch('/api/admin/notifications/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to send test email');
      }

      toast({
        title: 'Success',
        description: `Test email sent to ${data.recipient}`,
      });
      
      setTestEmailDialog(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send test email',
        variant: 'destructive',
      });
    }
  };

  // Get severity icon and color
  const getSeverityDisplay = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' };
      case 'high':
        return { icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50' };
      case 'medium':
        return { icon: Info, color: 'text-yellow-500', bg: 'bg-yellow-50' };
      default:
        return { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50' };
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'critical_error':
      case 'system_error':
        return AlertTriangle;
      case 'auth_failure':
        return User;
      case 'security_event':
        return Shield;
      case 'performance_issue':
        return Zap;
      default:
        return Bell;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Center</h1>
          <p className="text-gray-600">Monitor system alerts and manage notification preferences</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={testEmailDialog} onOpenChange={setTestEmailDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <TestTube className="h-4 w-4 mr-2" />
                Test Email
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Test Email</DialogTitle>
              </DialogHeader>
              <TestEmailForm onSend={sendTestEmail} />
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Sent</p>
                  <p className="text-2xl font-bold">{stats.totalSent}</p>
                </div>
                <Mail className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Delivered</p>
                  <p className="text-2xl font-bold text-green-600">{stats.totalDelivered}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{stats.totalFailed}</p>
                </div>
                <X className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Acknowledged</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalAcknowledged}</p>
                </div>
                <Bell className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search notifications..."
                      value={filter.search}
                      onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="severity">Severity</Label>
                  <Select value={filter.severity} onValueChange={(value) => setFilter(prev => ({ ...prev, severity: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All severities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All severities</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={filter.type} onValueChange={(value) => setFilter(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      <SelectItem value="critical_error">Critical Error</SelectItem>
                      <SelectItem value="system_error">System Error</SelectItem>
                      <SelectItem value="high_error_rate">High Error Rate</SelectItem>
                      <SelectItem value="auth_failure">Auth Failure</SelectItem>
                      <SelectItem value="security_event">Security Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={filter.status} onValueChange={(value) => setFilter(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="acknowledged">Acknowledged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications List */}
          <div className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No notifications found</p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification) => {
                const severityDisplay = getSeverityDisplay(notification.severity);
                const TypeIcon = getTypeIcon(notification.type);
                const SeverityIcon = severityDisplay.icon;

                return (
                  <Card key={notification.id} className={`${severityDisplay.bg} border-l-4 ${
                    notification.severity === 'critical' ? 'border-l-red-500' :
                    notification.severity === 'high' ? 'border-l-orange-500' :
                    notification.severity === 'medium' ? 'border-l-yellow-500' :
                    'border-l-blue-500'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className={`p-2 rounded-full ${severityDisplay.bg}`}>
                            <SeverityIcon className={`h-5 w-5 ${severityDisplay.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                              <Badge variant={
                                notification.severity === 'critical' ? 'destructive' :
                                notification.severity === 'high' ? 'secondary' :
                                'outline'
                              }>
                                {notification.severity}
                              </Badge>
                              <Badge variant="outline">
                                {notification.type.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-gray-700 mb-2">{notification.message}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {new Date(notification.timestamp).toLocaleString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <TypeIcon className="h-4 w-4" />
                                {notification.source.component}
                              </div>
                              <div className="flex items-center gap-1">
                                <Badge variant={
                                  notification.status === 'delivered' ? 'default' :
                                  notification.status === 'acknowledged' ? 'secondary' :
                                  notification.status === 'failed' ? 'destructive' :
                                  'outline'
                                }>
                                  {notification.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {notification.status !== 'acknowledged' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => acknowledgeNotification(notification.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Acknowledge
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="analytics">
          <NotificationAnalytics stats={stats} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Test Email Form Component
function TestEmailForm({ onSend }: { onSend: (data: any) => void }) {
  const [formData, setFormData] = useState({
    recipient: '',
    template: 'basic',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSend(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="recipient">Recipient Email</Label>
        <Input
          id="recipient"
          type="email"
          value={formData.recipient}
          onChange={(e) => setFormData(prev => ({ ...prev, recipient: e.target.value }))}
          placeholder="admin@example.com"
          required
        />
      </div>
      <div>
        <Label htmlFor="template">Template</Label>
        <Select value={formData.template} onValueChange={(value) => setFormData(prev => ({ ...prev, template: value }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="basic">Basic Test</SelectItem>
            <SelectItem value="critical">Critical Alert</SelectItem>
            <SelectItem value="system_error">System Error</SelectItem>
            <SelectItem value="security">Security Alert</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="subject">Subject (Optional)</Label>
        <Input
          id="subject"
          value={formData.subject}
          onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
          placeholder="Custom subject..."
        />
      </div>
      <div>
        <Label htmlFor="message">Message (Optional)</Label>
        <Textarea
          id="message"
          value={formData.message}
          onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
          placeholder="Custom message..."
          rows={3}
        />
      </div>
      <Button type="submit" className="w-full">
        Send Test Email
      </Button>
    </form>
  );
}

// Notification Settings Component
function NotificationSettings() {
  const [settings, setSettings] = useState({
    emailEnabled: true,
    webhookEnabled: false,
    pushEnabled: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
    },
    severityFilters: {
      critical: true,
      high: true,
      medium: false,
      low: false,
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Channels</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-gray-500" />
                <Label>Email Notifications</Label>
              </div>
              <Switch
                checked={settings.emailEnabled}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailEnabled: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-gray-500" />
                <Label>Webhook Notifications</Label>
              </div>
              <Switch
                checked={settings.webhookEnabled}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, webhookEnabled: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-gray-500" />
                <Label>Push Notifications</Label>
              </div>
              <Switch
                checked={settings.pushEnabled}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, pushEnabled: checked }))}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Severity Filters</h3>
          <div className="space-y-4">
            {Object.entries(settings.severityFilters).map(([severity, enabled]) => (
              <div key={severity} className="flex items-center justify-between">
                <Label className="capitalize">{severity} Severity</Label>
                <Switch
                  checked={enabled}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    severityFilters: { ...prev.severityFilters, [severity]: checked }
                  }))}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Quiet Hours</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Enable Quiet Hours</Label>
              <Switch
                checked={settings.quietHours.enabled}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  quietHours: { ...prev.quietHours, enabled: checked }
                }))}
              />
            </div>
            {settings.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={settings.quietHours.start}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      quietHours: { ...prev.quietHours, start: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="end-time">End Time</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={settings.quietHours.end}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      quietHours: { ...prev.quietHours, end: e.target.value }
                    }))}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <Button className="w-full">Save Settings</Button>
      </CardContent>
    </Card>
  );
}

// Notification Analytics Component
function NotificationAnalytics({ stats }: { stats: NotificationStats | null }) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>By Severity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats.bySeverity).map(([severity, count]) => (
              <div key={severity} className="flex items-center justify-between">
                <span className="capitalize">{severity}</span>
                <div className="flex items-center gap-2">
                  <div className={`w-20 h-2 rounded-full ${
                    severity === 'critical' ? 'bg-red-200' :
                    severity === 'high' ? 'bg-orange-200' :
                    severity === 'medium' ? 'bg-yellow-200' :
                    'bg-blue-200'
                  }`}>
                    <div 
                      className={`h-2 rounded-full ${
                        severity === 'critical' ? 'bg-red-500' :
                        severity === 'high' ? 'bg-orange-500' :
                        severity === 'medium' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`}
                      style={{ width: `${(count / Math.max(...Object.values(stats.bySeverity))) * 100}%` }}
                    />
                  </div>
                  <span className="font-semibold">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By Channel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats.byChannel).map(([channel, count]) => (
              <div key={channel} className="flex items-center justify-between">
                <span className="capitalize">{channel}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-blue-500 rounded-full"
                      style={{ width: `${(count / Math.max(...Object.values(stats.byChannel))) * 100}%` }}
                    />
                  </div>
                  <span className="font-semibold">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}