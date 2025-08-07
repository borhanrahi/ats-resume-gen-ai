'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Ban, 
  CheckCircle, 
  XCircle,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Users,
  Crown,
  Calendar,
  Mail,
  AlertTriangle
} from 'lucide-react';
import { User } from '@/types/user';

interface UserManagementProps {
  onUserSelect?: (user: User) => void;
}

interface UserWithStats {
  $id: string;
  email: string;
  name: string;
  subscription: {
    plan: 'free' | 'premium';
    status: 'active' | 'cancelled' | 'expired';
    expiresAt: Date;
    paymentHistory: any[];
  };
  preferences: {
    theme: 'light' | 'dark';
    language: string;
    notifications: boolean;
    emailUpdates: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  totalAnalyses: number;
  lastActivity: Date;
  registrationDate: Date;
  status: 'active' | 'suspended' | 'pending';
}

interface UserFilters {
  search: string;
  plan: 'all' | 'free' | 'premium';
  status: 'all' | 'active' | 'suspended' | 'pending';
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  usersPerPage: number;
}

export default function UserManagement({ onUserSelect }: UserManagementProps) {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showUserDetail, setShowUserDetail] = useState<UserWithStats | null>(null);
  
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    plan: 'all',
    status: 'all',
    dateRange: 'all'
  });
  
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    usersPerPage: 20
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, filters]);

  useEffect(() => {
    updatePagination();
  }, [filteredUsers, pagination.usersPerPage]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/users');
      
      if (!response.ok) {
        throw new Error('Failed to load users');
      }
      
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Users loading failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users');
      
      // Set mock data for development
      const mockUsers: UserWithStats[] = Array.from({ length: 50 }, (_, i) => ({
        $id: `user_${i + 1}`,
        email: `user${i + 1}@example.com`,
        name: `User ${i + 1}`,
        subscription: {
          plan: Math.random() > 0.7 ? 'premium' : 'free',
          status: Math.random() > 0.1 ? 'active' : 'cancelled',
          expiresAt: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000),
          paymentHistory: []
        },
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: true,
          emailUpdates: true
        },
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        totalAnalyses: Math.floor(Math.random() * 100),
        lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        registrationDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        status: Math.random() > 0.05 ? 'active' : (Math.random() > 0.5 ? 'suspended' : 'pending')
      }));
      
      setUsers(mockUsers);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.$id.toLowerCase().includes(searchLower)
      );
    }

    // Plan filter
    if (filters.plan !== 'all') {
      filtered = filtered.filter(user => user.subscription.plan === filters.plan);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(user => user.status === filters.status);
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let cutoffDate: Date;
      
      switch (filters.dateRange) {
        case 'today':
          cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = new Date(0);
      }
      
      filtered = filtered.filter(user => user.registrationDate >= cutoffDate);
    }

    setFilteredUsers(filtered);
  };

  const updatePagination = () => {
    const totalPages = Math.ceil(filteredUsers.length / pagination.usersPerPage);
    setPagination(prev => ({
      ...prev,
      totalPages,
      totalUsers: filteredUsers.length,
      currentPage: Math.min(prev.currentPage, totalPages || 1)
    }));
  };

  const getCurrentPageUsers = () => {
    const startIndex = (pagination.currentPage - 1) * pagination.usersPerPage;
    const endIndex = startIndex + pagination.usersPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  };

  const handleUserAction = async (userId: string, action: 'suspend' | 'activate' | 'upgrade' | 'downgrade' | 'delete') => {
    try {
      const response = await fetch('/api/admin/users/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} user`);
      }

      // Refresh users list
      await loadUsers();
      
      // Show success message (you might want to add a toast notification system)
      console.log(`User ${action} successful`);
    } catch (err) {
      console.error(`User ${action} failed:`, err);
      setError(err instanceof Error ? err.message : `Failed to ${action} user`);
    }
  };

  const handleBulkAction = async (action: 'suspend' | 'activate' | 'delete' | 'export') => {
    if (selectedUsers.size === 0) return;

    try {
      if (action === 'export') {
        // Export selected users
        const selectedUserData = users.filter(user => selectedUsers.has(user.$id));
        const csvContent = generateCSV(selectedUserData);
        downloadCSV(csvContent, 'selected_users.csv');
        return;
      }

      const response = await fetch('/api/admin/users/bulk-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userIds: Array.from(selectedUsers), 
          action 
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} users`);
      }

      // Clear selection and refresh
      setSelectedUsers(new Set());
      await loadUsers();
      
      console.log(`Bulk ${action} successful`);
    } catch (err) {
      console.error(`Bulk ${action} failed:`, err);
      setError(err instanceof Error ? err.message : `Failed to ${action} users`);
    }
  };

  const generateCSV = (userData: UserWithStats[]) => {
    const headers = ['ID', 'Name', 'Email', 'Plan', 'Status', 'Total Analyses', 'Registration Date', 'Last Activity'];
    const rows = userData.map(user => [
      user.$id,
      user.name,
      user.email,
      user.subscription.plan,
      user.status,
      user.totalAnalyses,
      user.registrationDate.toISOString().split('T')[0],
      user.lastActivity.toISOString().split('T')[0]
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportAllUsers = () => {
    const csvContent = generateCSV(filteredUsers);
    downloadCSV(csvContent, 'all_users.csv');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'suspended': return 'text-red-600 bg-red-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPlanIcon = (plan: string) => {
    return plan === 'premium' ? 
      <Crown className="w-4 h-4 text-yellow-500" /> : 
      <Users className="w-4 h-4 text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-4"></div>
          <div className="h-12 bg-muted rounded mb-6"></div>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">User Management</h2>
          <p className="text-sm text-muted-foreground">
            {pagination.totalUsers} users found
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={exportAllUsers}
            className="flex items-center space-x-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button
            onClick={loadUsers}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Plan Filter */}
          <select
            value={filters.plan}
            onChange={(e) => setFilters(prev => ({ ...prev, plan: e.target.value as any }))}
            className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="premium">Premium</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
            className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
          </select>

          {/* Date Range Filter */}
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
            className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm text-blue-800">
              {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('suspend')}
                className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors"
              >
                Suspend
              </button>
              <button
                onClick={() => handleBulkAction('export')}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              >
                Export
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === getCurrentPageUsers().length && getCurrentPageUsers().length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(new Set(getCurrentPageUsers().map(u => u.$id)));
                      } else {
                        setSelectedUsers(new Set());
                      }
                    }}
                    className="rounded border-border"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Plan</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Analyses</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Last Activity</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {getCurrentPageUsers().map((user) => (
                <tr key={user.$id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.$id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedUsers);
                        if (e.target.checked) {
                          newSelected.add(user.$id);
                        } else {
                          newSelected.delete(user.$id);
                        }
                        setSelectedUsers(newSelected);
                      }}
                      className="rounded border-border"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      {getPlanIcon(user.subscription.plan)}
                      <span className="text-sm capitalize">{user.subscription.plan}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {user.totalAnalyses}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDate(user.lastActivity)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowUserDetail(user)}
                        className="p-1 hover:bg-muted rounded transition-colors"
                        title="View Details"
                      >
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </button>
                      
                      {user.status === 'active' ? (
                        <button
                          onClick={() => handleUserAction(user.$id, 'suspend')}
                          className="p-1 hover:bg-muted rounded transition-colors"
                          title="Suspend User"
                        >
                          <Ban className="w-4 h-4 text-yellow-600" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUserAction(user.$id, 'activate')}
                          className="p-1 hover:bg-muted rounded transition-colors"
                          title="Activate User"
                        >
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleUserAction(user.$id, 'delete')}
                        className="p-1 hover:bg-muted rounded transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Showing {((pagination.currentPage - 1) * pagination.usersPerPage) + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.usersPerPage, pagination.totalUsers)} of{' '}
              {pagination.totalUsers} users
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                disabled={pagination.currentPage === 1}
                className="p-2 border border-border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="px-3 py-1 text-sm">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                disabled={pagination.currentPage === pagination.totalPages}
                className="p-2 border border-border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* User Detail Modal */}
      {showUserDetail && (
        <UserDetailModal
          user={showUserDetail}
          onClose={() => setShowUserDetail(null)}
          onUserUpdate={loadUsers}
        />
      )}
    </div>
  );
}

// User Detail Modal Component
interface UserDetailModalProps {
  user: UserWithStats;
  onClose: () => void;
  onUserUpdate: () => void;
}

function UserDetailModal({ user, onClose, onUserUpdate }: UserDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    plan: user.subscription.plan,
    status: user.status
  });

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/admin/users/${user.$id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      onUserUpdate();
      setEditMode(false);
    } catch (err) {
      console.error('User update failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">User Details</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Name</label>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                ) : (
                  <p className="text-foreground">{user.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                {editMode ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                ) : (
                  <p className="text-foreground">{user.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Plan</label>
                {editMode ? (
                  <select
                    value={formData.plan}
                    onChange={(e) => setFormData(prev => ({ ...prev, plan: e.target.value as unknown }))}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="free">Free</option>
                    <option value="premium">Premium</option>
                  </select>
                ) : (
                  <div className="flex items-center space-x-2">
                    {user.subscription.plan === 'premium' ? 
                      <Crown className="w-4 h-4 text-yellow-500" /> : 
                      <Users className="w-4 h-4 text-gray-500" />
                    }
                    <span className="capitalize">{user.subscription.plan}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                {editMode ? (
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'suspended' | 'pending' }))}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending">Pending</option>
                  </select>
                ) : (
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    user.status === 'active' ? 'text-green-600 bg-green-50' :
                    user.status === 'suspended' ? 'text-red-600 bg-red-50' :
                    'text-yellow-600 bg-yellow-50'
                  }`}>
                    {user.status}
                  </span>
                )}
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-sm text-muted-foreground">Total Analyses</div>
                <div className="text-2xl font-bold text-foreground">{user.totalAnalyses}</div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-sm text-muted-foreground">Registration Date</div>
                <div className="text-lg font-semibold text-foreground">
                  {user.registrationDate.toLocaleDateString()}
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-sm text-muted-foreground">Last Activity</div>
                <div className="text-lg font-semibold text-foreground">
                  {user.lastActivity.toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              {editMode ? (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setEditMode(false);
                      setFormData({
                        name: user.name,
                        email: user.email,
                        plan: user.subscription.plan,
                        status: user.status
                      });
                    }}
                    className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditMode(true)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Edit User
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}