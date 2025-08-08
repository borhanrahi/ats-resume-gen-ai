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
  Minus,
  Star,
  DollarSign,
  Users,
  Briefcase,
  ChevronDown,
  ChevronRight,
  ChevronUp
} from 'lucide-react';
import { FeatureRequest } from '@/types/admin';
import AddFeatureModal from './AddFeatureModal';

interface FeatureTrackerProps {
  onNavigate?: (section: string) => void;
}

type SortField = 'createdAt' | 'priority' | 'businessValue' | 'estimatedHours' | 'title' | 'score';
type SortDirection = 'asc' | 'desc';
type FilterStatus = 'all' | 'idea' | 'planned' | 'in_progress' | 'completed' | 'cancelled';
type FilterPriority = 'all' | 'low' | 'medium' | 'high' | 'critical';
type ViewMode = 'list' | 'cards' | 'kanban';

interface FeatureWithScore extends FeatureRequest {
  priorityScore: number;
  totalScore: number;
}

export default function FeatureTracker({ onNavigate }: FeatureTrackerProps) {
  const [features, setFeatures] = useState<FeatureWithScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>('all');
  const [sortField, setSortField] = useState<SortField>('totalScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState<FeatureRequest | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set());
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFeatures();
  }, []);

  // Reload features when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadFeatures();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter, priorityFilter]);

  // Calculate priority score based on priority level
  const calculatePriorityScore = (priority: FeatureRequest['priority']): number => {
    switch (priority) {
      case 'critical': return 100;
      case 'high': return 75;
      case 'medium': return 50;
      case 'low': return 25;
      default: return 0;
    }
  };

  // Calculate complexity score (inverse - simpler = higher score)
  const calculateComplexityScore = (complexity: FeatureRequest['complexity'], estimatedHours: number): number => {
    const complexityMultiplier = complexity === 'simple' ? 1.5 : complexity === 'medium' ? 1.0 : 0.7;
    const hoursScore = Math.max(0, 100 - (estimatedHours / 2)); // Fewer hours = higher score
    return hoursScore * complexityMultiplier;
  };

  // Calculate total feature score
  const calculateTotalScore = (feature: FeatureRequest): number => {
    const priorityScore = calculatePriorityScore(feature.priority);
    const complexityScore = calculateComplexityScore(feature.complexity, feature.estimatedHours);
    const businessValueScore = feature.businessValue;
    
    // Weighted average: 40% business value, 35% priority, 25% complexity
    return Math.round(
      (businessValueScore * 0.4) + 
      (priorityScore * 0.35) + 
      (complexityScore * 0.25)
    );
  };

  // Add scores to features
  const addScoresToFeatures = (features: FeatureRequest[]): FeatureWithScore[] => {
    return features.map(feature => ({
      ...feature,
      priorityScore: calculatePriorityScore(feature.priority),
      totalScore: calculateTotalScore(feature)
    }));
  };

  const loadFeatures = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/admin/features?${params.toString()}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load features');
      }
      
      // Convert date strings back to Date objects
      const featuresWithDates = result.data.map((feature: any) => ({
        ...feature,
        createdAt: new Date(feature.createdAt)
      }));
      
      setFeatures(addScoresToFeatures(featuresWithDates));
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <Star className="w-3 h-3 text-green-500" />;
    if (score >= 60) return <TrendingUp className="w-3 h-3 text-blue-500" />;
    if (score >= 40) return <DollarSign className="w-3 h-3 text-yellow-500" />;
    return <AlertCircle className="w-3 h-3 text-red-500" />;
  };

  const toggleCardExpansion = (featureId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(featureId)) {
      newExpanded.delete(featureId);
    } else {
      newExpanded.add(featureId);
    }
    setExpandedCards(newExpanded);
  };

  const handleAddFeature = async (featureData: Omit<FeatureRequest, 'id' | 'createdAt'>) => {
    try {
      const response = await fetch('/api/admin/features', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(featureData),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create feature');
      }
      
      // Reload features to get the updated list
      loadFeatures();
    } catch (error) {
      console.error('Failed to add feature:', error);
      throw error;
    }
  };

  const handleEditFeature = async (featureData: Omit<FeatureRequest, 'id' | 'createdAt'>) => {
    if (!editingFeature) return;
    
    try {
      const response = await fetch(`/api/admin/features/${editingFeature.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(featureData),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update feature');
      }
      
      // Reload features to get the updated list
      loadFeatures();
      setEditingFeature(null);
    } catch (error) {
      console.error('Failed to edit feature:', error);
      throw error;
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
        feature.id === featureId ? { 
          ...feature, 
          status: newStatus,
          totalScore: calculateTotalScore({ ...feature, status: newStatus })
        } : feature
      ));
      
      // Make API call to update status
      const response = await fetch(`/api/admin/features/${featureId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update feature status');
      }
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
      // Update local state immediately for better UX
      setFeatures(prev => prev.filter(feature => feature.id !== featureId));
      
      // Make API call to delete feature
      const response = await fetch(`/api/admin/features/${featureId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete feature');
      }
    } catch (err) {
      console.error('Failed to delete feature:', err);
      // Revert local state on error
      loadFeatures();
    }
  };

  const handleBulkStatusUpdate = async (status: FeatureRequest['status']) => {
    if (selectedFeatures.size === 0) return;
    
    try {
      // Update local state immediately for better UX
      setFeatures(prev => prev.map(feature => 
        selectedFeatures.has(feature.id) ? { 
          ...feature, 
          status,
          totalScore: calculateTotalScore({ ...feature, status })
        } : feature
      ));
      
      // Make API call for bulk update
      const response = await fetch('/api/admin/features/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateStatus',
          featureIds: Array.from(selectedFeatures),
          data: { status }
        }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to bulk update features');
      }
      
      setSelectedFeatures(new Set());
    } catch (err) {
      console.error('Failed to bulk update features:', err);
      // Revert local state on error
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
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">Feature Requests</h2>
            <p className="text-sm text-muted-foreground">
              Manage feature ideas and development roadmap with business value scoring
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-muted rounded-lg p-1">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === 'cards' 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                List
              </button>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Feature</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-card border border-border rounded-lg p-3 md:p-4">
        <div className="space-y-3 md:space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search features..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 md:py-2 text-base md:text-sm border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
              className="flex-1 px-3 py-3 md:py-2 text-base md:text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="idea">💡 Ideas</option>
              <option value="planned">🎯 Planned</option>
              <option value="in_progress">⚡ In Progress</option>
              <option value="completed">✅ Completed</option>
              <option value="cancelled">❌ Cancelled</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as FilterPriority)}
              className="flex-1 px-3 py-3 md:py-2 text-base md:text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Priority</option>
              <option value="critical">🔴 Critical</option>
              <option value="high">🟠 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>

            {/* Sort */}
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="flex-1 px-3 py-3 md:py-2 text-base md:text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="totalScore">📊 Total Score</option>
              <option value="businessValue">💰 Business Value</option>
              <option value="priority">⚡ Priority</option>
              <option value="createdAt">📅 Created Date</option>
              <option value="estimatedHours">⏱️ Estimated Hours</option>
              <option value="title">📝 Title</option>
            </select>
          </div>
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

      {/* Features Display */}
      {viewMode === 'cards' ? (
        /* Cards View - Mobile First */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedFeatures.map((feature) => (
            <div key={feature.id} className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all">
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedFeatures.has(feature.id)}
                    onChange={() => toggleFeatureSelection(feature.id)}
                    className="rounded border-border"
                  />
                  {/* Total Score Badge */}
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-bold border ${getScoreColor(feature.totalScore)}`}>
                    {getScoreIcon(feature.totalScore)}
                    <span>{feature.totalScore}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setEditingFeature(feature)}
                    className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="Edit feature"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteFeature(feature.id)}
                    className="p-1 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="Delete feature"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Feature Title */}
              <h3 className="font-semibold text-foreground mb-2 text-base md:text-lg leading-tight">
                {feature.title}
              </h3>

              {/* Feature Description */}
              <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                {feature.description}
              </p>

              {/* Priority and Status Row */}
              <div className="flex items-center justify-between mb-3">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(feature.priority)}`}>
                  {feature.priority.charAt(0).toUpperCase() + feature.priority.slice(1)}
                </span>
                <select
                  value={feature.status}
                  onChange={(e) => handleStatusChange(feature.id, e.target.value as FeatureRequest['status'])}
                  className="px-2 py-1 text-xs border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="idea">💡 Idea</option>
                  <option value="planned">🎯 Planned</option>
                  <option value="in_progress">⚡ In Progress</option>
                  <option value="completed">✅ Completed</option>
                  <option value="cancelled">❌ Cancelled</option>
                </select>
              </div>

              {/* Metrics Row */}
              <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                <div className="flex items-center space-x-1">
                  <DollarSign className="w-3 h-3 text-green-500" />
                  <span className="text-muted-foreground">Value:</span>
                  <span className="font-medium text-foreground">{feature.businessValue}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-blue-500" />
                  <span className="text-muted-foreground">Hours:</span>
                  <span className="font-medium text-foreground">{feature.estimatedHours}h</span>
                </div>
                <div className="flex items-center space-x-1">
                  {getComplexityIcon(feature.complexity)}
                  <span className="text-muted-foreground capitalize">{feature.complexity}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                <div className="flex items-center space-x-1">
                  <User className="w-3 h-3" />
                  <span>{feature.requestedBy}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{feature.createdAt.toLocaleDateString()}</span>
                </div>
              </div>

              {/* Expandable Details */}
              <button
                onClick={() => toggleCardExpansion(feature.id)}
                className="w-full mt-2 flex items-center justify-center space-x-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                {expandedCards.has(feature.id) ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    <span>Less Details</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    <span>More Details</span>
                  </>
                )}
              </button>

              {/* Expanded Details */}
              {expandedCards.has(feature.id) && (
                <div className="mt-2 pt-2 border-t border-border space-y-2 text-xs">
                  <div>
                    <span className="font-medium text-foreground">Priority Score:</span>
                    <span className="ml-2 text-muted-foreground">{feature.priorityScore}/100</span>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Full Description:</span>
                    <p className="mt-1 text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* List View - Desktop Optimized */
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {/* Table Header - Hidden on Mobile */}
          <div className="hidden lg:block bg-muted/50 border-b border-border p-4">
            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                checked={selectedFeatures.size === filteredAndSortedFeatures.length && filteredAndSortedFeatures.length > 0}
                onChange={selectAllFeatures}
                className="rounded border-border"
              />
              <div className="flex-1 grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
                <button
                  onClick={() => handleSort('title')}
                  className="col-span-3 text-left hover:text-foreground transition-colors flex items-center space-x-1"
                >
                  <span>Feature</span>
                  {sortField === 'title' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  )}
                </button>
                <button
                  onClick={() => handleSort('totalScore')}
                  className="col-span-1 text-left hover:text-foreground transition-colors flex items-center space-x-1"
                >
                  <span>Score</span>
                  {sortField === 'totalScore' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  )}
                </button>
                <button
                  onClick={() => handleSort('priority')}
                  className="col-span-1 text-left hover:text-foreground transition-colors flex items-center space-x-1"
                >
                  <span>Priority</span>
                  {sortField === 'priority' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  )}
                </button>
                <div className="col-span-2">Status</div>
                <button
                  onClick={() => handleSort('businessValue')}
                  className="col-span-1 text-left hover:text-foreground transition-colors flex items-center space-x-1"
                >
                  <span>Value</span>
                  {sortField === 'businessValue' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  )}
                </button>
                <button
                  onClick={() => handleSort('estimatedHours')}
                  className="col-span-1 text-left hover:text-foreground transition-colors flex items-center space-x-1"
                >
                  <span>Hours</span>
                  {sortField === 'estimatedHours' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  )}
                </button>
                <button
                  onClick={() => handleSort('createdAt')}
                  className="col-span-1 text-left hover:text-foreground transition-colors flex items-center space-x-1"
                >
                  <span>Created</span>
                  {sortField === 'createdAt' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  )}
                </button>
                <div className="col-span-2">Actions</div>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="divide-y divide-border">
            {filteredAndSortedFeatures.map((feature) => (
              <div key={feature.id} className="p-3 md:p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start space-x-3 md:space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedFeatures.has(feature.id)}
                    onChange={() => toggleFeatureSelection(feature.id)}
                    className="mt-1 rounded border-border"
                  />
                  
                  {/* Mobile Layout */}
                  <div className="flex-1 lg:hidden">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-foreground text-base leading-tight pr-2">
                        {feature.title}
                      </h3>
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-bold border ${getScoreColor(feature.totalScore)}`}>
                        {getScoreIcon(feature.totalScore)}
                        <span>{feature.totalScore}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {feature.description}
                    </p>
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(feature.priority)}`}>
                        {feature.priority.charAt(0).toUpperCase() + feature.priority.slice(1)}
                      </span>
                      <select
                        value={feature.status}
                        onChange={(e) => handleStatusChange(feature.id, e.target.value as FeatureRequest['status'])}
                        className="px-2 py-1 text-xs border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="idea">💡 Idea</option>
                        <option value="planned">🎯 Planned</option>
                        <option value="in_progress">⚡ In Progress</option>
                        <option value="completed">✅ Completed</option>
                        <option value="cancelled">❌ Cancelled</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-3 h-3 text-green-500" />
                          <span>{feature.businessValue}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-blue-500" />
                          <span>{feature.estimatedHours}h</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{feature.requestedBy}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setEditingFeature(feature)}
                          className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                          title="Edit feature"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFeature(feature.id)}
                          className="p-1 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                          title="Delete feature"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden lg:block flex-1">
                    <div className="grid grid-cols-12 gap-4">
                      {/* Feature Info */}
                      <div className="col-span-3">
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

                      {/* Total Score */}
                      <div className="col-span-1">
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-bold border ${getScoreColor(feature.totalScore)}`}>
                          {getScoreIcon(feature.totalScore)}
                          <span>{feature.totalScore}</span>
                        </div>
                      </div>

                      {/* Priority */}
                      <div className="col-span-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(feature.priority)}`}>
                          {feature.priority.charAt(0).toUpperCase() + feature.priority.slice(1)}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="col-span-2">
                        <select
                          value={feature.status}
                          onChange={(e) => handleStatusChange(feature.id, e.target.value as FeatureRequest['status'])}
                          className="w-full px-2 py-1 text-xs border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="idea">💡 Idea</option>
                          <option value="planned">🎯 Planned</option>
                          <option value="in_progress">⚡ In Progress</option>
                          <option value="completed">✅ Completed</option>
                          <option value="cancelled">❌ Cancelled</option>
                        </select>
                      </div>

                      {/* Business Value */}
                      <div className="col-span-1">
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-3 h-3 text-green-500" />
                          <span className="text-sm font-medium text-foreground">{feature.businessValue}</span>
                        </div>
                      </div>

                      {/* Estimated Hours */}
                      <div className="col-span-1">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-blue-500" />
                          <span className="text-sm text-foreground">{feature.estimatedHours}h</span>
                        </div>
                      </div>

                      {/* Created Date */}
                      <div className="col-span-1">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {feature.createdAt.toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="col-span-2">
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
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* Add/Edit Feature Modal */}
      <AddFeatureModal
        isOpen={showAddModal || editingFeature !== null}
        onClose={() => {
          setShowAddModal(false);
          setEditingFeature(null);
        }}
        onSave={editingFeature ? handleEditFeature : handleAddFeature}
        editingFeature={editingFeature}
      />
    </div>
  );
}