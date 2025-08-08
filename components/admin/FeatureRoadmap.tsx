'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar,
  Clock,
  Users,
  Target,
  TrendingUp,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Star,
  DollarSign,
  Zap,
  CheckCircle,
  XCircle,
  Lightbulb,
  ArrowRight,
  Filter,
  X
} from 'lucide-react';
import { FeatureRequest } from '@/types/admin';

interface FeatureRoadmapProps {
  onNavigate?: (section: string) => void;
}

interface RoadmapQuarter {
  quarter: string;
  year: number;
  startDate: Date;
  endDate: Date;
  features: FeatureWithRoadmapData[];
}

interface FeatureWithRoadmapData extends FeatureRequest {
  priorityScore: number;
  totalScore: number;
  plannedQuarter?: string;
  dependencies?: string[];
  assignedTeam?: string;
  progress?: number;
}

type ViewMode = 'quarters' | 'timeline' | 'dependencies';
type FilterStatus = 'all' | 'planned' | 'in_progress' | 'completed';

export default function FeatureRoadmap({ onNavigate }: FeatureRoadmapProps) {
  const [features, setFeatures] = useState<FeatureWithRoadmapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('quarters');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedFeature, setSelectedFeature] = useState<FeatureWithRoadmapData | null>(null);

  useEffect(() => {
    loadRoadmapData();
  }, []);

  const loadRoadmapData = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await fetch('/api/admin/features');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load roadmap data');
      }
      
      // Convert date strings back to Date objects and add roadmap data
      const featuresWithRoadmapData = result.data.map((feature: any) => ({
        ...feature,
        createdAt: new Date(feature.createdAt),
        priorityScore: calculatePriorityScore(feature.priority),
        totalScore: calculateTotalScore(feature),
        plannedQuarter: getPlannedQuarter(feature),
        dependencies: getMockDependencies(feature.id),
        assignedTeam: getMockAssignedTeam(feature.priority),
        progress: getMockProgress(feature.status)
      }));
      
      setFeatures(featuresWithRoadmapData);
    } catch (err) {
      console.error('Failed to load roadmap data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load roadmap data');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for scoring (same as FeatureTracker)
  const calculatePriorityScore = (priority: FeatureRequest['priority']): number => {
    switch (priority) {
      case 'critical': return 100;
      case 'high': return 75;
      case 'medium': return 50;
      case 'low': return 25;
      default: return 0;
    }
  };

  const calculateTotalScore = (feature: FeatureRequest): number => {
    const priorityScore = calculatePriorityScore(feature.priority);
    const complexityScore = feature.complexity === 'simple' ? 75 : feature.complexity === 'medium' ? 50 : 25;
    const businessValueScore = feature.businessValue;
    
    return Math.round(
      (businessValueScore * 0.4) + 
      (priorityScore * 0.35) + 
      (complexityScore * 0.25)
    );
  };

  // Mock functions for roadmap data (in production, this would come from the database)
  const getPlannedQuarter = (feature: FeatureRequest): string => {
    const quarters = ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024', 'Q1 2025', 'Q2 2025'];
    if (feature.status === 'completed') return 'Q1 2024';
    if (feature.status === 'in_progress') return 'Q2 2024';
    if (feature.status === 'planned') {
      return feature.priority === 'critical' ? 'Q2 2024' : 
             feature.priority === 'high' ? 'Q3 2024' : 'Q4 2024';
    }
    return 'Q1 2025'; // Ideas go to future quarters
  };

  const getMockDependencies = (featureId: string): string[] => {
    const deps: Record<string, string[]> = {
      '2': ['1'], // Multi-language depends on templates
      '3': ['1'], // LinkedIn integration depends on templates
      '4': ['3'], // Bulk analysis depends on LinkedIn integration
    };
    return deps[featureId] || [];
  };

  const getMockAssignedTeam = (priority: FeatureRequest['priority']): string => {
    switch (priority) {
      case 'critical': return 'Core Team';
      case 'high': return 'Product Team';
      case 'medium': return 'Development Team';
      case 'low': return 'Innovation Team';
      default: return 'Unassigned';
    }
  };

  const getMockProgress = (status: FeatureRequest['status']): number => {
    switch (status) {
      case 'completed': return 100;
      case 'in_progress': return 65;
      case 'planned': return 15;
      case 'idea': return 5;
      case 'cancelled': return 0;
      default: return 0;
    }
  };

  // Generate quarters for the roadmap
  const generateQuarters = (year: number): RoadmapQuarter[] => {
    return [
      {
        quarter: 'Q1',
        year,
        startDate: new Date(year, 0, 1),
        endDate: new Date(year, 2, 31),
        features: features.filter(f => f.plannedQuarter === `Q1 ${year}`)
      },
      {
        quarter: 'Q2',
        year,
        startDate: new Date(year, 3, 1),
        endDate: new Date(year, 5, 30),
        features: features.filter(f => f.plannedQuarter === `Q2 ${year}`)
      },
      {
        quarter: 'Q3',
        year,
        startDate: new Date(year, 6, 1),
        endDate: new Date(year, 8, 30),
        features: features.filter(f => f.plannedQuarter === `Q3 ${year}`)
      },
      {
        quarter: 'Q4',
        year,
        startDate: new Date(year, 9, 1),
        endDate: new Date(year, 11, 31),
        features: features.filter(f => f.plannedQuarter === `Q4 ${year}`)
      }
    ];
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
      case 'critical': return 'border-l-red-500 bg-red-50';
      case 'high': return 'border-l-orange-500 bg-orange-50';
      case 'medium': return 'border-l-blue-500 bg-blue-50';
      case 'low': return 'border-l-gray-500 bg-gray-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const filteredFeatures = features.filter(feature => {
    if (statusFilter === 'all') return true;
    return feature.status === statusFilter;
  });

  const quarters = generateQuarters(currentYear);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-muted rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
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
        <h3 className="text-lg font-semibold text-foreground mb-2">Failed to Load Roadmap</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <button
          onClick={loadRoadmapData}
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
            <h2 className="text-xl md:text-2xl font-bold text-foreground">Feature Roadmap</h2>
            <p className="text-sm text-muted-foreground">
              Timeline and dependencies for feature development
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-muted rounded-lg p-1">
              <button
                onClick={() => setViewMode('quarters')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === 'quarters' 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Quarters
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === 'timeline' 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => setViewMode('dependencies')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === 'dependencies' 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Dependencies
              </button>
            </div>
          </div>
        </div>

        {/* Year Navigation and Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentYear(prev => prev - 1)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-semibold text-foreground">{currentYear}</h3>
            <button
              onClick={() => setCurrentYear(prev => prev + 1)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
            className="px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Features</option>
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Roadmap Content */}
      {viewMode === 'quarters' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {quarters.map((quarter) => (
            <div key={`${quarter.quarter}-${quarter.year}`} className="bg-card border border-border rounded-lg">
              {/* Quarter Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground">
                    {quarter.quarter} {quarter.year}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {quarter.features.length} features
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {quarter.startDate.toLocaleDateString()} - {quarter.endDate.toLocaleDateString()}
                </p>
              </div>

              {/* Quarter Features */}
              <div className="p-4 space-y-3">
                {quarter.features.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No features planned</p>
                  </div>
                ) : (
                  quarter.features.map((feature) => (
                    <div
                      key={feature.id}
                      className={`border-l-4 rounded-lg p-3 cursor-pointer hover:shadow-sm transition-all ${getPriorityColor(feature.priority)}`}
                      onClick={() => setSelectedFeature(feature)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-foreground text-sm leading-tight pr-2">
                          {feature.title}
                        </h4>
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-bold border ${getScoreColor(feature.totalScore)}`}>
                          <Star className="w-3 h-3" />
                          <span>{feature.totalScore}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(feature.status)}
                          <span className="capitalize">{feature.status.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{feature.estimatedHours}h</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-muted rounded-full h-1.5 mb-2">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all"
                          style={{ width: `${feature.progress}%` }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{feature.assignedTeam}</span>
                        <span className="font-medium text-foreground">{feature.progress}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'timeline' && (
        <div className="bg-card border border-border rounded-lg p-4 md:p-6">
          <div className="space-y-4">
            {filteredFeatures
              .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
              .map((feature, index) => (
                <div key={feature.id} className="flex items-start space-x-4">
                  {/* Timeline Line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full border-2 ${
                      feature.status === 'completed' ? 'bg-green-500 border-green-500' :
                      feature.status === 'in_progress' ? 'bg-orange-500 border-orange-500' :
                      feature.status === 'planned' ? 'bg-blue-500 border-blue-500' :
                      'bg-gray-300 border-gray-300'
                    }`}></div>
                    {index < filteredFeatures.length - 1 && (
                      <div className="w-0.5 h-16 bg-border mt-2"></div>
                    )}
                  </div>

                  {/* Feature Content */}
                  <div className="flex-1 pb-8">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {feature.description}
                        </p>
                      </div>
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-bold border ${getScoreColor(feature.totalScore)}`}>
                        <Star className="w-3 h-3" />
                        <span>{feature.totalScore}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(feature.status)}
                        <span className="capitalize">{feature.status.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{feature.plannedQuarter}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{feature.assignedTeam}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{feature.estimatedHours}h</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>{feature.progress}% complete</span>
                      </div>
                    </div>

                    {/* Dependencies */}
                    {feature.dependencies && feature.dependencies.length > 0 && (
                      <div className="mt-2 flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">Depends on:</span>
                        {feature.dependencies.map((depId) => {
                          const depFeature = features.find(f => f.id === depId);
                          return depFeature ? (
                            <span key={depId} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                              {depFeature.title}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {viewMode === 'dependencies' && (
        <div className="bg-card border border-border rounded-lg p-4 md:p-6">
          <div className="space-y-6">
            {filteredFeatures
              .filter(f => f.dependencies && f.dependencies.length > 0)
              .map((feature) => (
                <div key={feature.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-bold border ${getScoreColor(feature.totalScore)}`}>
                      <Star className="w-3 h-3" />
                      <span>{feature.totalScore}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 mb-4">
                    {feature.dependencies?.map((depId, index) => {
                      const depFeature = features.find(f => f.id === depId);
                      if (!depFeature) return null;

                      return (
                        <div key={depId} className="flex items-center space-x-2">
                          {index > 0 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
                          <div className="bg-muted rounded-lg p-3 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              {getStatusIcon(depFeature.status)}
                              <span className="font-medium text-foreground text-sm">
                                {depFeature.title}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {depFeature.plannedQuarter} • {depFeature.progress}% complete
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {getStatusIcon(feature.status)}
                        <span className="font-medium text-foreground text-sm">
                          {feature.title}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {feature.plannedQuarter} • {feature.progress}% complete
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{feature.assignedTeam}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{feature.estimatedHours}h estimated</span>
                      </div>
                    </div>
                    <span className="capitalize">{feature.status.replace('_', ' ')}</span>
                  </div>
                </div>
              ))}

            {filteredFeatures.filter(f => f.dependencies && f.dependencies.length > 0).length === 0 && (
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Dependencies Found</h3>
                <p className="text-muted-foreground">
                  Features with dependencies will appear here to help visualize the development flow.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Feature Detail Modal */}
      {selectedFeature && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-foreground mb-2">
                    {selectedFeature.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedFeature.description}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedFeature(null)}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(selectedFeature.status)}
                      <span className="text-sm font-medium text-foreground capitalize">
                        {selectedFeature.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Priority</span>
                    <span className="text-sm font-medium text-foreground capitalize">
                      {selectedFeature.priority}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Complexity</span>
                    <span className="text-sm font-medium text-foreground capitalize">
                      {selectedFeature.complexity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Assigned Team</span>
                    <span className="text-sm font-medium text-foreground">
                      {selectedFeature.assignedTeam}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Business Value</span>
                    <span className="text-sm font-medium text-foreground">
                      {selectedFeature.businessValue}/100
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Score</span>
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-bold border ${getScoreColor(selectedFeature.totalScore)}`}>
                      <Star className="w-3 h-3" />
                      <span>{selectedFeature.totalScore}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Estimated Hours</span>
                    <span className="text-sm font-medium text-foreground">
                      {selectedFeature.estimatedHours}h
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Planned Quarter</span>
                    <span className="text-sm font-medium text-foreground">
                      {selectedFeature.plannedQuarter}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Progress</span>
                  <span className="text-sm text-muted-foreground">{selectedFeature.progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${selectedFeature.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Dependencies */}
              {selectedFeature.dependencies && selectedFeature.dependencies.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-foreground mb-3">Dependencies</h3>
                  <div className="space-y-2">
                    {selectedFeature.dependencies.map((depId) => {
                      const depFeature = features.find(f => f.id === depId);
                      return depFeature ? (
                        <div key={depId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(depFeature.status)}
                            <span className="text-sm font-medium text-foreground">
                              {depFeature.title}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {depFeature.progress}% complete
                          </span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border">
                <div className="flex items-center space-x-1">
                  <Users className="w-3 h-3" />
                  <span>Requested by {selectedFeature.requestedBy}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>Created {selectedFeature.createdAt.toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}