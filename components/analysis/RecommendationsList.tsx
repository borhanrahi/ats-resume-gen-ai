'use client';

import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Zap, 
  FileText, 
  Hash, 
  TrendingUp, 
  Ruler,
  ChevronDown,
  ChevronRight,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { Recommendation } from '@/types/analysis';

interface RecommendationsListProps {
  recommendations: Recommendation[];
  className?: string;
}

interface CategoryInfo {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  color: string;
}

const categoryInfo: Record<Recommendation['category'], CategoryInfo> = {
  formatting: {
    icon: FileText,
    label: 'Formatting',
    description: 'Document structure and visual presentation',
    color: 'text-blue-600 bg-blue-50 border-blue-200'
  },
  content: {
    icon: TrendingUp,
    label: 'Content',
    description: 'Resume content quality and relevance',
    color: 'text-green-600 bg-green-50 border-green-200'
  },
  keywords: {
    icon: Hash,
    label: 'Keywords',
    description: 'Keyword optimization and ATS compatibility',
    color: 'text-purple-600 bg-purple-50 border-purple-200'
  },
  structure: {
    icon: Ruler,
    label: 'Structure',
    description: 'Resume organization and flow',
    color: 'text-orange-600 bg-orange-50 border-orange-200'
  }
};

const priorityInfo = {
  critical: {
    icon: AlertTriangle,
    label: 'Critical',
    color: 'text-red-600 bg-red-50 border-red-200',
    order: 1
  },
  high: {
    icon: Zap,
    label: 'High',
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    order: 2
  },
  medium: {
    icon: Info,
    label: 'Medium',
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    order: 3
  },
  low: {
    icon: CheckCircle,
    label: 'Low',
    color: 'text-gray-600 bg-gray-50 border-gray-200',
    order: 4
  }
};

type SortOption = 'priority' | 'category' | 'impact';
type FilterOption = 'all' | Recommendation['category'] | Recommendation['priority'];

function RecommendationCard({ 
  recommendation, 
  isExpanded, 
  onToggle 
}: { 
  recommendation: Recommendation; 
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const categoryData = categoryInfo[recommendation.category];
  const priorityData = priorityInfo[recommendation.priority];
  const CategoryIcon = categoryData.icon;
  const PriorityIcon = priorityData.icon;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md">
      <button
        onClick={onToggle}
        className="w-full p-4 text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <CategoryIcon className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
              <h4 className="font-semibold text-sm md:text-base truncate">
                {recommendation.title}
              </h4>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
              {recommendation.description}
            </p>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${priorityData.color}`}>
              <PriorityIcon className="w-3 h-3" />
              <span className="hidden sm:inline">{priorityData.label}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-border animate-in slide-in-from-top-2 duration-200">
          <div className="pt-4 space-y-3">
            {/* Category Badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${categoryData.color}`}>
              <CategoryIcon className="w-3 h-3" />
              {categoryData.label}
            </div>

            {/* Detailed Description */}
            <div>
              <h5 className="font-medium text-sm mb-2">Issue Details:</h5>
              <p className="text-sm text-muted-foreground">
                {recommendation.description}
              </p>
            </div>

            {/* Actionable Suggestion */}
            <div className="bg-muted/50 rounded-lg p-3">
              <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Recommended Action:
              </h5>
              <p className="text-sm">
                {recommendation.suggestion}
              </p>
            </div>

            {/* Impact */}
            <div className="bg-primary/5 rounded-lg p-3">
              <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Expected Impact:
              </h5>
              <p className="text-sm text-primary">
                {recommendation.impact}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RecommendationsList({ 
  recommendations, 
  className = '' 
}: RecommendationsListProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Sort and filter recommendations
  const processedRecommendations = useMemo(() => {
    let filtered = recommendations;

    // Apply filters
    if (filterBy !== 'all') {
      if (filterBy in categoryInfo) {
        filtered = recommendations.filter(rec => rec.category === filterBy);
      } else if (filterBy in priorityInfo) {
        filtered = recommendations.filter(rec => rec.priority === filterBy);
      }
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return priorityInfo[a.priority].order - priorityInfo[b.priority].order;
        case 'category':
          return a.category.localeCompare(b.category);
        case 'impact':
          // Sort by impact length as a proxy for importance
          return b.impact.length - a.impact.length;
        default:
          return 0;
      }
    });
  }, [recommendations, sortBy, filterBy]);

  // Group recommendations by category for stats
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    recommendations.forEach(rec => {
      stats[rec.category] = (stats[rec.category] || 0) + 1;
    });
    return stats;
  }, [recommendations]);

  const priorityStats = useMemo(() => {
    const stats: Record<string, number> = {};
    recommendations.forEach(rec => {
      stats[rec.priority] = (stats[rec.priority] || 0) + 1;
    });
    return stats;
  }, [recommendations]);

  const handleCardToggle = (id: string) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  if (recommendations.length === 0) {
    return (
      <div className={`bg-card border border-border rounded-lg p-6 text-center ${className}`}>
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Great Job!</h3>
        <p className="text-muted-foreground">
          No recommendations found. Your resume is well-optimized!
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with Stats */}
      <div className="bg-card border border-border rounded-lg p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg md:text-xl font-semibold mb-2">
              Improvement Recommendations
            </h3>
            <p className="text-sm md:text-base text-muted-foreground">
              {recommendations.length} recommendation{recommendations.length !== 1 ? 's' : ''} to optimize your resume
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(priorityStats).map(([priority, count]) => {
              const info = priorityInfo[priority as keyof typeof priorityInfo];
              const Icon = info.icon;
              return (
                <div
                  key={priority}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${info.color}`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters & Sorting
            {showFilters ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          <div className="text-sm text-muted-foreground">
            Showing {processedRecommendations.length} of {recommendations.length} recommendations
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium mb-2">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full p-2 border border-border rounded-md bg-background text-sm"
                >
                  <option value="priority">Priority</option>
                  <option value="category">Category</option>
                  <option value="impact">Impact</option>
                </select>
              </div>

              {/* Filter Options */}
              <div>
                <label className="block text-sm font-medium mb-2">Filter by:</label>
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                  className="w-full p-2 border border-border rounded-md bg-background text-sm"
                >
                  <option value="all">All Recommendations</option>
                  <optgroup label="By Category">
                    {Object.entries(categoryInfo).map(([key, info]) => (
                      <option key={key} value={key}>
                        {info.label} ({categoryStats[key] || 0})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="By Priority">
                    {Object.entries(priorityInfo).map(([key, info]) => (
                      <option key={key} value={key}>
                        {info.label} ({priorityStats[key] || 0})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recommendations List */}
      <div className="space-y-3">
        {processedRecommendations.map((recommendation) => (
          <RecommendationCard
            key={recommendation.id}
            recommendation={recommendation}
            isExpanded={expandedCard === recommendation.id}
            onToggle={() => handleCardToggle(recommendation.id)}
          />
        ))}
      </div>

      {processedRecommendations.length === 0 && filterBy !== 'all' && (
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <Info className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <h4 className="font-medium mb-2">No recommendations found</h4>
          <p className="text-sm text-muted-foreground mb-4">
            No recommendations match the current filter criteria.
          </p>
          <button
            onClick={() => setFilterBy('all')}
            className="text-sm text-primary hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}