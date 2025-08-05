'use client';

import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Target, 
  Award,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  BarChart3,
  PieChart,
  List,
  Grid
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { KeywordMatchResult } from '@/lib/analysis/keywordMatcher';

export interface KeywordMatcherProps {
  matchResult: KeywordMatchResult;
  className?: string;
  showCategoryBreakdown?: boolean;
  showSuggestions?: boolean;
  showPriorityMissing?: boolean;
  compact?: boolean;
}

type ViewMode = 'overview' | 'detailed' | 'categories';
type DisplayMode = 'grid' | 'list';

export default function KeywordMatcher({
  matchResult,
  className,
  showCategoryBreakdown = true,
  showSuggestions = true,
  showPriorityMissing = true,
  compact = false
}: KeywordMatcherProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('grid');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Filter keywords based on search term
  const filteredFound = useMemo(() => {
    if (!searchTerm) return matchResult.found;
    return matchResult.found.filter(keyword => 
      keyword.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [matchResult.found, searchTerm]);

  const filteredMissing = useMemo(() => {
    if (!searchTerm) return matchResult.missing;
    return matchResult.missing.filter(keyword => 
      keyword.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [matchResult.missing, searchTerm]);

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Get match percentage color
  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (percentage >= 40) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  // Get match percentage icon
  const getMatchIcon = (percentage: number) => {
    if (percentage >= 80) return <Award className="w-5 h-5" />;
    if (percentage >= 60) return <TrendingUp className="w-5 h-5" />;
    if (percentage >= 40) return <Target className="w-5 h-5" />;
    return <AlertTriangle className="w-5 h-5" />;
  };

  return (
    <div className={cn("w-full space-y-4 sm:space-y-6", className)}>
      {/* Header with Controls - Mobile-first */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            Keyword Analysis
          </h2>
          <p className="text-sm text-muted-foreground">
            Resume vs Job Description Match
          </p>
        </div>

        {!compact && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full sm:w-48"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('overview')}
                className={cn(
                  "px-3 py-2 text-sm font-medium transition-colors",
                  viewMode === 'overview'
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <BarChart3 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Overview</span>
              </button>
              <button
                onClick={() => setViewMode('detailed')}
                className={cn(
                  "px-3 py-2 text-sm font-medium transition-colors border-l border-border",
                  viewMode === 'detailed'
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <List className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Detailed</span>
              </button>
              <button
                onClick={() => setViewMode('categories')}
                className={cn(
                  "px-3 py-2 text-sm font-medium transition-colors border-l border-border",
                  viewMode === 'categories'
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <PieChart className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Categories</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Overview Cards - Mobile-first grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Match */}
        <div className={cn(
          "p-4 rounded-lg border-2 transition-all",
          getMatchColor(matchResult.matchPercentage)
        )}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-80">Overall Match</p>
              <p className="text-2xl font-bold">{matchResult.matchPercentage}%</p>
            </div>
            {getMatchIcon(matchResult.matchPercentage)}
          </div>
        </div>

        {/* Found Keywords */}
        <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Found Keywords</p>
              <p className="text-2xl font-bold text-green-800">{matchResult.found.length}</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
        </div>

        {/* Missing Keywords */}
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-700">Missing Keywords</p>
              <p className="text-2xl font-bold text-red-800">{matchResult.missing.length}</p>
            </div>
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
        </div>

        {/* Keyword Density */}
        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Keyword Density</p>
              <p className="text-2xl font-bold text-blue-800">{matchResult.density}%</p>
            </div>
            <Target className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'overview' && (
        <div className="space-y-6">
          {/* Strength Areas */}
          {matchResult.strengthAreas.length > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                <Award className="w-5 h-5" />
                Strength Areas
              </h3>
              <div className="flex flex-wrap gap-2">
                {matchResult.strengthAreas.map((strength, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                  >
                    {strength}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Priority Missing Keywords */}
          {showPriorityMissing && matchResult.priorityMissing.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Priority Missing Keywords
              </h3>
              <div className="flex flex-wrap gap-2">
                {matchResult.priorityMissing.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full font-medium"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {showSuggestions && matchResult.suggestions.length > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Improvement Suggestions
              </h3>
              <ul className="space-y-2">
                {matchResult.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-blue-700">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {viewMode === 'detailed' && (
        <div className="space-y-6">
          {/* Display Mode Toggle */}
          <div className="flex justify-end">
            <div className="flex border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setDisplayMode('grid')}
                className={cn(
                  "px-3 py-2 text-sm font-medium transition-colors",
                  displayMode === 'grid'
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDisplayMode('list')}
                className={cn(
                  "px-3 py-2 text-sm font-medium transition-colors border-l border-border",
                  displayMode === 'list'
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Found Keywords */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Found Keywords ({filteredFound.length})
            </h3>
            
            {filteredFound.length > 0 ? (
              <div className={cn(
                displayMode === 'grid' 
                  ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2"
                  : "space-y-2"
              )}>
                {filteredFound.map((keyword, index) => (
                  <div
                    key={index}
                    className={cn(
                      "px-3 py-2 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg",
                      displayMode === 'list' && "flex items-center justify-between"
                    )}
                  >
                    <span className="font-medium">{keyword}</span>
                    {displayMode === 'list' && (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                {searchTerm ? 'No matching found keywords' : 'No keywords found'}
              </p>
            )}
          </div>

          {/* Missing Keywords */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Missing Keywords ({filteredMissing.length})
            </h3>
            
            {filteredMissing.length > 0 ? (
              <div className={cn(
                displayMode === 'grid' 
                  ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2"
                  : "space-y-2"
              )}>
                {filteredMissing.map((keyword, index) => (
                  <div
                    key={index}
                    className={cn(
                      "px-3 py-2 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg",
                      displayMode === 'list' && "flex items-center justify-between"
                    )}
                  >
                    <span className="font-medium">{keyword}</span>
                    {displayMode === 'list' && (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                {searchTerm ? 'No matching missing keywords' : 'No missing keywords'}
              </p>
            )}
          </div>
        </div>
      )}

      {viewMode === 'categories' && showCategoryBreakdown && (
        <div className="space-y-4">
          {/* Technical Skills */}
          <div className="border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleCategory('technical')}
              className="w-full p-4 bg-muted/30 hover:bg-muted/50 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  getMatchColor(matchResult.categoryBreakdown.technicalSkills.matchPercentage).split(' ')[1]
                )} />
                <span className="font-semibold">Technical Skills</span>
                <span className="text-sm text-muted-foreground">
                  {matchResult.categoryBreakdown.technicalSkills.matchPercentage}% match
                </span>
              </div>
              {expandedCategories.has('technical') ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
            
            {expandedCategories.has('technical') && (
              <div className="p-4 border-t border-border space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Found ({matchResult.categoryBreakdown.technicalSkills.found.length})
                    </h4>
                    <div className="space-y-1">
                      {matchResult.categoryBreakdown.technicalSkills.found.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded mr-1 mb-1"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-red-700 mb-2 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      Missing ({matchResult.categoryBreakdown.technicalSkills.missing.length})
                    </h4>
                    <div className="space-y-1">
                      {matchResult.categoryBreakdown.technicalSkills.missing.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs rounded mr-1 mb-1"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Soft Skills */}
          <div className="border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleCategory('soft')}
              className="w-full p-4 bg-muted/30 hover:bg-muted/50 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  getMatchColor(matchResult.categoryBreakdown.softSkills.matchPercentage).split(' ')[1]
                )} />
                <span className="font-semibold">Soft Skills</span>
                <span className="text-sm text-muted-foreground">
                  {matchResult.categoryBreakdown.softSkills.matchPercentage}% match
                </span>
              </div>
              {expandedCategories.has('soft') ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
            
            {expandedCategories.has('soft') && (
              <div className="p-4 border-t border-border space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Found ({matchResult.categoryBreakdown.softSkills.found.length})
                    </h4>
                    <div className="space-y-1">
                      {matchResult.categoryBreakdown.softSkills.found.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded mr-1 mb-1"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-red-700 mb-2 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      Missing ({matchResult.categoryBreakdown.softSkills.missing.length})
                    </h4>
                    <div className="space-y-1">
                      {matchResult.categoryBreakdown.softSkills.missing.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs rounded mr-1 mb-1"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Experience */}
          <div className="border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleCategory('experience')}
              className="w-full p-4 bg-muted/30 hover:bg-muted/50 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  getMatchColor(matchResult.categoryBreakdown.experience.matchPercentage).split(' ')[1]
                )} />
                <span className="font-semibold">Experience</span>
                <span className="text-sm text-muted-foreground">
                  {matchResult.categoryBreakdown.experience.matchPercentage}% match
                </span>
              </div>
              {expandedCategories.has('experience') ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
            
            {expandedCategories.has('experience') && (
              <div className="p-4 border-t border-border space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Found ({matchResult.categoryBreakdown.experience.found.length})
                    </h4>
                    <div className="space-y-1">
                      {matchResult.categoryBreakdown.experience.found.map((exp, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded mr-1 mb-1"
                        >
                          {exp}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-red-700 mb-2 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      Missing ({matchResult.categoryBreakdown.experience.missing.length})
                    </h4>
                    <div className="space-y-1">
                      {matchResult.categoryBreakdown.experience.missing.map((exp, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs rounded mr-1 mb-1"
                        >
                          {exp}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Education */}
          <div className="border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleCategory('education')}
              className="w-full p-4 bg-muted/30 hover:bg-muted/50 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  getMatchColor(matchResult.categoryBreakdown.education.matchPercentage).split(' ')[1]
                )} />
                <span className="font-semibold">Education</span>
                <span className="text-sm text-muted-foreground">
                  {matchResult.categoryBreakdown.education.matchPercentage}% match
                </span>
              </div>
              {expandedCategories.has('education') ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
            
            {expandedCategories.has('education') && (
              <div className="p-4 border-t border-border space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Found ({matchResult.categoryBreakdown.education.found.length})
                    </h4>
                    <div className="space-y-1">
                      {matchResult.categoryBreakdown.education.found.map((edu, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded mr-1 mb-1"
                        >
                          {edu}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-red-700 mb-2 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      Missing ({matchResult.categoryBreakdown.education.missing.length})
                    </h4>
                    <div className="space-y-1">
                      {matchResult.categoryBreakdown.education.missing.map((edu, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs rounded mr-1 mb-1"
                        >
                          {edu}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}