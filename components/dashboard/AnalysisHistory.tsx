'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar,
  FileText,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  X,
  ArrowUpDown,
  MoreVertical,
  Trash2,
  Copy,
  Share2,
  Plus,
  Tag,
  CheckCircle2,
  AlertCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AnalysisHistoryItem, HistoryFilters, HistorySortOptions, AnalysisComparison } from '@/types/history';
import { historyService } from '@/lib/storage/history-service';
import { reportService, ReportOptions } from '@/lib/storage/report-service';
import { useAuth } from '@/lib/hooks/useAuth';

interface AnalysisHistoryProps {
  className?: string;
}

type SortField = 'createdAt' | 'score' | 'resumeName' | 'jobTitle';
expor
t default function AnalysisHistory({ className }: AnalysisHistoryProps) {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<AnalysisHistoryItem[]>([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState<AnalysisHistoryItem[]>([]);
  const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [comparison, setComparison] = useState<AnalysisComparison | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  // Filter states
  const [filters, setFilters] = useState<HistoryFilters>({});
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });
  const [scoreRange, setScoreRange] = useState<{ min: number; max: number }>({
    min: 0,
    max: 100
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Load analyses on component mount
  useEffect(() => {
    if (user) {
      loadAnalyses();
    }
  }, [user]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...analyses];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(analysis =>
        analysis.resumeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (analysis.jobTitle && analysis.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
        analysis.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply date range filter
    if (filters.dateRange) {
      filtered = filtered.filter(analysis =>
        analysis.createdAt >= filters.dateRange!.start &&
        analysis.createdAt <= filters.dateRange!.end
      );
    }

    // Apply score range filter
    if (filters.scoreRange) {
      filtered = filtered.filter(analysis =>
        analysis.score >= filters.scoreRange!.min &&
        analysis.score <= filters.scoreRange!.max
      );
    }

    // Apply tags filter
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(analysis =>
        filters.tags!.some(tag => analysis.tags.includes(tag))
      );
    }

    // Apply job title filter
    if (filters.jobTitle) {
      filtered = filtered.filter(analysis =>
        analysis.jobTitle && analysis.jobTitle.toLowerCase().includes(filters.jobTitle!.toLowerCase())
      );
    }

    // Apply resume name filter
    if (filters.resumeName) {
      filtered = filtered.filter(analysis =>
        analysis.resumeName.toLowerCase().includes(filters.resumeName!.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'createdAt') {
        aValue = a.createdAt.getTime();
        bValue = b.createdAt.getTime();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredAnalyses(filtered);
  }, [analyses, searchTerm, filters, sortField, sortDirection]);

  const loadAnalyses = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const userAnalyses = await historyService.getHistory(user.$id);
      setAnalyses(userAnalyses);
    } catch (error) {
      console.error('Failed to load analyses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReport = async (analysisId: string, format: 'pdf' | 'json' | 'csv' = 'pdf') => {
    try {
      const analysis = analyses.find(a => a.$id === analysisId);
      if (!analysis) return;

      const options: ReportOptions = {
        format,
        includeRecommendations: true,
        includeKeywordAnalysis: true,
        includeGrammarIssues: true,
      };

      const reportBlob = await reportService.generateAnalysisReport(analysis, options);
      const filename = reportService.getReportFilename(analysis, format);

      // Create download link
      const url = URL.createObjectURL(reportBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download report:', error);
    }
  };

  const handleDeleteAnalysis = async (analysisId: string) => {
    if (!user) return;

    try {
      await historyService.deleteAnalysis(analysisId, user.$id);
      setAnalyses(prev => prev.filter(a => a.$id !== analysisId));
      setSelectedAnalyses(prev => prev.filter(id => id !== analysisId));
    } catch (error) {
      console.error('Failed to delete analysis:', error);
    }
  };

  const handleCompareAnalyses = async () => {
    if (selectedAnalyses.length !== 2 || !user) return;

    try {
      const comparisonResult = await historyService.compareAnalyses(
        selectedAnalyses[0],
        selectedAnalyses[1],
        user.$id
      );
      setComparison(comparisonResult);
      setShowComparison(true);
    } catch (error) {
      console.error('Failed to compare analyses:', error);
    }
  };

  const handleDownloadComparison = async (format: 'pdf' | 'json' = 'pdf') => {
    if (!comparison) return;

    try {
      const options: ReportOptions = { format };
      const reportBlob = await reportService.generateComparisonReport(comparison, options);
      const filename = `comparison_${comparison.baseAnalysis.resumeName}_vs_${comparison.compareAnalysis.resumeName}.${format}`;

      const url = URL.createObjectURL(reportBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download comparison:', error);
    }
  };

  const handleSelectAnalysis = (analysisId: string, checked: boolean) => {
    if (checked) {
      setSelectedAnalyses(prev => [...prev, analysisId]);
    } else {
      setSelectedAnalyses(prev => prev.filter(id => id !== analysisId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAnalyses(filteredAnalyses.map(a => a.$id));
    } else {
      setSelectedAnalyses([]);
    }
  };

  const applyFilters = () => {
    const newFilters: HistoryFilters = {};

    if (dateRange.start && dateRange.end) {
      newFilters.dateRange = {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end)
      };
    }

    if (scoreRange.min > 0 || scoreRange.max < 100) {
      newFilters.scoreRange = scoreRange;
    }

    if (selectedTags.length > 0) {
      newFilters.tags = selectedTags;
    }

    setFilters(newFilters);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({});
    setDateRange({ start: '', end: '' });
    setScoreRange({ min: 0, max: 100 });
    setSelectedTags([]);
    setShowFilters(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    analyses.forEach(analysis => {
      analysis.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }, [analyses]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Analysis History</h2>
          <p className="text-muted-foreground">
            View and manage your resume analysis history
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedAnalyses.length === 2 && (
            <Button onClick={handleCompareAnalyses} variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Compare
            </Button>
          )}
          
          {selectedAnalyses.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Bulk Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => {
                  selectedAnalyses.forEach(id => handleDownloadReport(id, 'pdf'));
                }}>
                  Download PDFs
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  selectedAnalyses.forEach(id => handleDownloadReport(id, 'json'));
                }}>
                  Download JSON
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => {
                    selectedAnalyses.forEach(id => handleDeleteAnalysis(id));
                  }}
                  className="text-destructive"
                >
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by resume name, job title, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {Object.keys(filters).length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {Object.keys(filters).length}
              </Badge>
            )}
          </Button>
          
          <Select value={`${sortField}-${sortDirection}`} onValueChange={(value) => {
            const [field, direction] = value.split('-') as [SortField, 'asc' | 'desc'];
            setSortField(field);
            setSortDirection(direction);
          }}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt-desc">Newest First</SelectItem>
              <SelectItem value="createdAt-asc">Oldest First</SelectItem>
              <SelectItem value="score-desc">Highest Score</SelectItem>
              <SelectItem value="score-asc">Lowest Score</SelectItem>
              <SelectItem value="resumeName-asc">Name A-Z</SelectItem>
              <SelectItem value="resumeName-desc">Name Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <div className="space-y-2">
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    placeholder="Start date"
                  />
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    placeholder="End date"
                  />
                </div>
              </div>

              {/* Score Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Score Range</label>
                <div className="space-y-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={scoreRange.min}
                    onChange={(e) => setScoreRange(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
                    placeholder="Min score"
                  />
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={scoreRange.max}
                    onChange={(e) => setScoreRange(prev => ({ ...prev, max: parseInt(e.target.value) || 100 }))}
                    placeholder="Max score"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags</label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {allTags.map(tag => (
                    <div key={tag} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag}`}
                        checked={selectedTags.includes(tag)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTags(prev => [...prev, tag]);
                          } else {
                            setSelectedTags(prev => prev.filter(t => t !== tag));
                          }
                        }}
                      />
                      <label htmlFor={`tag-${tag}`} className="text-sm">
                        {tag}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
              <Button onClick={applyFilters}>
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Selection */}
      {filteredAnalyses.length > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
          <Checkbox
            checked={selectedAnalyses.length === filteredAnalyses.length}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm">
            {selectedAnalyses.length > 0 
              ? `${selectedAnalyses.length} of ${filteredAnalyses.length} selected`
              : `Select all ${filteredAnalyses.length} analyses`
            }
          </span>
        </div>
      )}

      {/* Analysis List */}
      <div className="space-y-4">
        {filteredAnalyses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No analyses found</h3>
              <p className="text-muted-foreground text-center">
                {analyses.length === 0 
                  ? "You haven't run any analyses yet. Start by analyzing your first resume!"
                  : "No analyses match your current filters. Try adjusting your search criteria."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAnalyses.map((analysis) => (
            <Card key={analysis.$id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <Checkbox
                      checked={selectedAnalyses.includes(analysis.$id)}
                      onCheckedChange={(checked) => handleSelectAnalysis(analysis.$id, checked as boolean)}
                    />
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{analysis.resumeName}</h3>
                        <Badge variant={getScoreBadgeVariant(analysis.score)}>
                          {analysis.score}/100
                        </Badge>
                        {analysis.jobTitle && (
                          <Badge variant="outline">
                            <Target className="h-3 w-3 mr-1" />
                            {analysis.jobTitle}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {analysis.createdAt.toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {analysis.createdAt.toLocaleTimeString()}
                        </div>
                      </div>

                      {/* Score Breakdown */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        {Object.entries(analysis.analysis.breakdown).map(([category, score]) => (
                          <div key={category} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="capitalize">{category}</span>
                              <span className={getScoreColor(score)}>{score}%</span>
                            </div>
                            <Progress value={score} className="h-2" />
                          </div>
                        ))}
                      </div>

                      {/* Tags */}
                      {analysis.tags.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          {analysis.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Quick Stats */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{analysis.analysis.keywordMatch.found.length} keywords found</span>
                        <span>{analysis.analysis.recommendations.length} recommendations</span>
                        {analysis.analysis.grammarIssues.length > 0 && (
                          <span>{analysis.analysis.grammarIssues.length} grammar issues</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {/* Navigate to analysis view */}}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDownloadReport(analysis.$id, 'pdf')}>
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownloadReport(analysis.$id, 'json')}>
                        <Download className="h-4 w-4 mr-2" />
                        Download JSON
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownloadReport(analysis.$id, 'csv')}>
                        <Download className="h-4 w-4 mr-2" />
                        Download CSV
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => {/* Copy analysis link */}}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Link
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {/* Share analysis */}}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteAnalysis(analysis.$id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Comparison Dialog */}
      <Dialog open={showComparison} onOpenChange={setShowComparison}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Analysis Comparison</DialogTitle>
          </DialogHeader>
          
          {comparison && (
            <div className="space-y-6">
              {/* Comparison Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Base Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="font-medium">{comparison.baseAnalysis.resumeName}</p>
                      <p className="text-sm text-muted-foreground">
                        {comparison.baseAnalysis.createdAt.toLocaleDateString()}
                      </p>
                      <Badge variant={getScoreBadgeVariant(comparison.baseAnalysis.score)}>
                        {comparison.baseAnalysis.score}/100
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Compare Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="font-medium">{comparison.compareAnalysis.resumeName}</p>
                      <p className="text-sm text-muted-foreground">
                        {comparison.compareAnalysis.createdAt.toLocaleDateString()}
                      </p>
                      <Badge variant={getScoreBadgeVariant(comparison.compareAnalysis.score)}>
                        {comparison.compareAnalysis.score}/100
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Score Difference */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {comparison.scoreDifference > 0 ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : comparison.scoreDifference < 0 ? (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    ) : (
                      <Minus className="h-5 w-5 text-gray-600" />
                    )}
                    Score Change: {comparison.scoreDifference > 0 ? '+' : ''}{comparison.scoreDifference} points
                  </CardTitle>
                </CardHeader>
              </Card>

              <Tabs defaultValue="improvements" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="improvements">Improvements</TabsTrigger>
                  <TabsTrigger value="regressions">Concerns</TabsTrigger>
                  <TabsTrigger value="keywords">Keywords</TabsTrigger>
                  <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                </TabsList>
                
                <TabsContent value="improvements" className="space-y-4">
                  {comparison.improvements.length > 0 ? (
                    comparison.improvements.map((improvement, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                        <p>{improvement}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No improvements detected</p>
                  )}
                </TabsContent>
                
                <TabsContent value="regressions" className="space-y-4">
                  {comparison.regressions.length > 0 ? (
                    comparison.regressions.map((regression, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <p>{regression}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No regressions detected</p>
                  )}
                </TabsContent>
                
                <TabsContent value="keywords" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-green-600 mb-2">Added Keywords</h4>
                      {comparison.keywordChanges.added.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {comparison.keywordChanges.added.map(keyword => (
                            <Badge key={keyword} variant="secondary" className="bg-green-100 text-green-800">
                              +{keyword}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No keywords added</p>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-red-600 mb-2">Removed Keywords</h4>
                      {comparison.keywordChanges.removed.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {comparison.keywordChanges.removed.map(keyword => (
                            <Badge key={keyword} variant="secondary" className="bg-red-100 text-red-800">
                              -{keyword}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No keywords removed</p>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="recommendations" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-green-600 mb-2">Resolved Issues</h4>
                      {comparison.recommendationChanges.resolved.length > 0 ? (
                        <ul className="space-y-2">
                          {comparison.recommendationChanges.resolved.map(recId => (
                            <li key={recId} className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span className="text-sm">{recId}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground">No issues resolved</p>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-orange-600 mb-2">New Issues</h4>
                      {comparison.recommendationChanges.new.length > 0 ? (
                        <ul className="space-y-2">
                          {comparison.recommendationChanges.new.map(recId => (
                            <li key={recId} className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-orange-600" />
                              <span className="text-sm">{recId}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground">No new issues</p>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Download Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => handleDownloadComparison('json')}>
                  <Download className="h-4 w-4 mr-2" />
                  Download JSON
                </Button>
                <Button onClick={() => handleDownloadComparison('pdf')}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}