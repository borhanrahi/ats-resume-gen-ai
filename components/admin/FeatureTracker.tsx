'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Lightbulb,
  Target,
  Zap,
  Calendar,
  User,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { FeatureRequest } from '@/types/admin';

interface FeatureTrackerProps {
  onNavigate?: (section: string) => void;
}

type SortField = 'createdAt' | 'priority' | 'businessValue' | 'estimatedHours' | 'title';
type SortDirection = 'asc' | 'desc';
type FilterStatus = 'all' | 'idea' | 'planned' | 'in_progress' | 'completed' | 'cancelled';
type FilterPriority = 'all' | 'low' | 'medium' | 'high' | 'critical';

export default function FeatureTracker({ onNavigate }: FeatureTrackerProps) {
  const [features, setFeatures] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState<FeatureRequest | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Mock data for development - replace with actual API call
      const mockFeatures: FeatureRequest[] = [
        {
          id: '1',
          title: 'Advanced Resume Templates',
          description: 'Add industry-specific resume templates with modern designs and ATS optimization',
          priority: 'high',
          status: 'planned',
          complexity: 'medium',
          businessValue: 85,
          requestedBy: 'Product Team',
          createdAt: new Date('2024-01-15'),
          estimatedHours: 40
        },
        {
          id: '2',
          title: 'Multi-language Support',
          description: 'Support for resume analysis in multiple languages including Spanish, French, and German',
          priority: 'medium',
          status: 'idea',
          complexity: 'complex',
          businessValue: 70,
          requestedBy: 'Customer Support',
          createdAt: new Date('2024-01-10'),
          estimatedHours: 80
        },
        {
          id: '3',
          title: 'LinkedIn Integration',
          description: 'Allow users to import their LinkedIn profile data directly into the resume builder',
          priority: 'high',
          status: 'in_progress',
          complexity: 'medium',
          businessValue: 90,
          requestedBy: 'Marketing Team',
          createdAt: new Date('2024-01-20'),
          estimatedHours: 32
        },
        {
          id: '4',
          title: 'Bulk Resume Analysis',
          description: 'Enterprise feature to analyze multiple resumes at once for HR departments',
          priority: 'low',
          status: 'idea',
          complexity: 'complex',
          businessValue: 60,
          requestedBy: 'Sales Team',
          createdAt: new Date('2024-01-05'),
          estimatedHours: 120
        },
        {
          id: '5',
          title: 'Mobile App',
          description: 'Native mobile application for iOS and Android with core resume analysis features',
          priority: 'critical',
          status: 'planned',
          complexity: 'complex',
          businessValue: 95,
          requestedBy: 'CEO',
          createdAt: new Date('2024-01-25'),
          estimatedHours: 200
        }
      ];
      
      setFeatures(mockFeatures);
    } catch (err) {
      console.error('Failed to load features:', err);
      setError(err instanceof Error ? err.message : 'Failed to load features');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: FeatureRequest['status']) => {
    switch (status) {
      case 'idea': return <Lightbulb className="w-4 h-4 text-yellow-500" />;
      case 'planned': return <Target className="w-4 h-4 text-blue-500" />;
      case 'in_progress': return <Zap className="w-4 h-4 text-orange-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: FeatureRequest['priority']) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getComplexityIcon = (complexity: FeatureRequest['complexity']) => {
    switch (complexity) {
      case 'simple': return <ArrowDown className="w-3 h-3 text-green-500" />;
      case 'medium': return <Minus className="w-3 h-3 text-yellow-500" />;
      case 'complex': return <ArrowUp className="w-3 h-3 text-red-500" />;
      default: return <Minus className="w-3 h-3 text-gray-500" />;
    }
  };

  const filteredAndSortedFeatures = features
    .filter(feature => {
      const matchesSearch = feature.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           feature.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           feature.requestedBy.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || feature.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || feature.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleStatusChange = async (featureId: string, newStatus: FeatureRequest['status']) => {
    try {
      // Update local state immediately for better UX
      setFeatures(prev => prev.map(feature => 
        feature.id === featureId ? { ...feature, status: newStatus } : feature
      ));
      
      // TODO: Make API call to update status
      console.log(`Updating feature ${featureId} status to ${newStatus}`);
    } catch (err) {
      console.error('Failed to update feature status:', err);
      // Revert local state on error
      loadFeatures();
    }
  };

  const handleDeleteFeature = async (featureId: string) => {
    if (!confirm('Are you sure you want to delete this feature request?')) {
      return;
    }
    
    try {
      setFeatures(prev => prev.filter(feature => feature.id !== featureId));
      // TODO: Make API call to delete feature
      console.log(`Deleting feature ${featureId}`);
    } catch (err) {
      console.error('Failed to delete feature:', err);
      loadFeatures();
    }
  };

  const handleBulkStatusUpdate = async (status: FeatureRequest['status']) => {
    if (selectedFeatures.size === 0) return;
    
    try {
      setFeatures(prev => prev.map(feature => 
        selectedFeatures.has(feature.id) ? { ...feature, status } : feature
      ));
      setSelectedFeatures(new Set());
      
      // TODO: Make API call for bulk update
      console.log(`Bulk updating ${selectedFeatures.size} features to ${status}`);
    } catch (err) {
      console.error('Failed to bulk update features:', err);
      loadFeatures();
    }
  };

  const toggleFeatureSelection = (featureId: string) => {
    const newSelection = new Set(selectedFeatures);
    if (newSelection.has(featureId)) {
      newSelection.delete(featureId);
    } else {
      newSelection.add(featureId);
    }
    setSelectedFeatures(newSelection);
  };

  const selectAllFeatures = () => {
    if (selectedFeatures.size === filteredAndSortedFeatures.length) {
      setSelectedFeatures(new Set());
    } else {
      setSelectedFeatures(new Set(filteredAndSortedFeatures.map(f => f.id)));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3 mb-2"></div>
              <div className="flex space-x-2">
                <div className="h-6 bg-muted rounded w-16"></div>
                <div className="h-6 bg-muted rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Failed to Load Features</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <button
          onClick={loadFeatures}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Feature Requests</h2>
          <p className="text-sm text-muted-foreground">
            Manage feature ideas and development roadmap
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Feature</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search features..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
            className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="idea">Ideas</option>
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as FilterPriority)}
            className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedFeatures.size > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedFeatures.size} feature{selectedFeatures.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkStatusUpdate('planned')}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  Mark Planned
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('in_progress')}
                  className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                >
                  Mark In Progress
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('completed')}
                  className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                >
                  Mark Completed
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Features List */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="bg-muted/50 border-b border-border p-4">
          <div className="flex items-center space-x-4">
            <input
              type="checkbox"
              checked={selectedFeatures.size === filteredAndSortedFeatures.length && filteredAndSortedFeatures.length > 0}
              onChange={selectAllFeatures}
              className="rounded border-border"
            />
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
              <button
                onClick={() => handleSort('title')}
                className="lg:col-span-4 text-left hover:text-foreground transition-colors flex items-center space-x-1"
              >
                <span>Feature</span>
                {sortField === 'title' && (
                  sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                )}
              </button>
              <button
                onClick={() => handleSort('priority')}
                className="lg:col-span-2 text-left hover:text-foreground transition-colors flex items-center space-x-1"
              >
                <span>Priority</span>
                {sortField === 'priority' && (
                  sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                )}
              </button>
              <div className="lg:col-span-2">Status</div>
              <button
                onClick={() => handleSort('businessValue')}
                className="lg:col-span-1 text-left hover:text-foreground transition-colors flex items-center space-x-1"
              >
                <span>Value</span>
                {sortField === 'businessValue' && (
                  sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                )}
              </button>
              <button
                onClick={() => handleSort('estimatedHours')}
                className="lg:col-span-1 text-left hover:text-foreground transition-colors flex items-center space-x-1"
              >
                <span>Hours</span>
                {sortField === 'estimatedHours' && (
                  sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                )}
              </button>
              <button
                onClick={() => handleSort('createdAt')}
                className="lg:col-span-1 text-left hover:text-foreground transition-colors flex items-center space-x-1"
              >
                <span>Created</span>
                {sortField === 'createdAt' && (
                  sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                )}
              </button>
              <div className="lg:col-span-1">Actions</div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="divide-y divide-border">
          {filteredAndSortedFeatures.map((feature) => (
            <div key={feature.id} className="p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-start space-x-4">
                <input
                  type="checkbox"
                  checked={selectedFeatures.has(feature.id)}
                  onChange={() => toggleFeatureSelection(feature.id)}
                  className="mt-1 rounded border-border"
                />
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Feature Info */}
                  <div className="lg:col-span-4">
                    <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {feature.description}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span>{feature.requestedBy}</span>
                      {getComplexityIcon(feature.complexity)}
                      <span className="capitalize">{feature.complexity}</span>
                    </div>
                  </div>

                  {/* Priority */}
                  <div className="lg:col-span-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(feature.priority)}`}>
                      {feature.priority.charAt(0).toUpperCase() + feature.priority.slice(1)}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="lg:col-span-2">
                    <select
                      value={feature.status}
                      onChange={(e) => handleStatusChange(feature.id, e.target.value as FeatureRequest['status'])}
                      className="flex items-center space-x-2 px-2 py-1 text-xs border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="idea">💡 Idea</option>
                      <option value="planned">🎯 Planned</option>
                      <option value="in_progress">⚡ In Progress</option>
                      <option value="completed">✅ Completed</option>
                      <option value="cancelled">❌ Cancelled</option>
                    </select>
                  </div>

                  {/* Business Value */}
                  <div className="lg:col-span-1">
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="text-sm font-medium text-foreground">{feature.businessValue}</span>
                    </div>
                  </div>

                  {/* Estimated Hours */}
                  <div className="lg:col-span-1">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-blue-500" />
                      <span className="text-sm text-foreground">{feature.estimatedHours}h</span>
                    </div>
                  </div>

                  {/* Created Date */}
                  <div className="lg:col-span-1">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {feature.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="lg:col-span-1">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setEditingFeature(feature)}
                        className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                        title="Edit feature"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteFeature(feature.id)}
                        className="p-1 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Delete feature"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredAndSortedFeatures.length === 0 && (
          <div className="text-center py-12">
            <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Features Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your filters or search terms'
                : 'Start by adding your first feature request'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && priorityFilter === 'all' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Add First Feature
              </button>
            )}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {(['idea', 'planned', 'in_progress', 'completed', 'cancelled'] as const).map(status => {
          const count = features.filter(f => f.status === status).length;
          return (
            <div key={status} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                {getStatusIcon(status)}
                <span className="text-sm font-medium text-foreground capitalize">
                  {status.replace('_', ' ')}
                </span>
              </div>
              <div className="text-2xl font-bold text-foreground">{count}</div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Feature Modal would go here */}
      {/* TODO: Implement AddFeatureModal and EditFeatureModal components */}
    </div>
  );
}