'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  TrendingUp, 
  RefreshCw, 
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Download,
  Sparkles,
  ArrowRight,
  BarChart3,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AIResumeBuilder } from '@/lib/ai/aiResumeBuilder';
import type { 
  KeywordOptimization, 
  ReanalysisResult, 
  KeywordImprovement 
} from '@/types/ai-builder';
import type { ResumeData } from '@/types/resume';

interface KeywordOptimizerProps {
  resumeData: ResumeData;
  jobDescription?: string;
  targetKeywords?: string[];
  onOptimizationComplete: (optimizedResume: ResumeData, analysis: ReanalysisResult) => void;
  onCancel: () => void;
  className?: string;
}

interface OptimizationState {
  step: 'input' | 'analyzing' | 'results' | 'reanalyzing';
  optimization: KeywordOptimization | null;
  reanalysis: ReanalysisResult | null;
  isLoading: boolean;
  error: string | null;
  progress: number;
}

export function KeywordOptimizer({
  resumeData,
  jobDescription: initialJobDescription = '',
  targetKeywords: initialTargetKeywords = [],
  onOptimizationComplete,
  onCancel,
  className = ''
}: KeywordOptimizerProps) {
  const [state, setState] = useState<OptimizationState>({
    step: 'input',
    optimization: null,
    reanalysis: null,
    isLoading: false,
    error: null,
    progress: 0
  });

  const [jobDescription, setJobDescription] = useState(initialJobDescription);
  const [targetKeywords, setTargetKeywords] = useState<string[]>(initialTargetKeywords);
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [showComparison, setShowComparison] = useState(false);

  // Mobile-first responsive state
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize AI service
  const [aiService] = useState(() => {
    const config = {
      tier: 'premium' as const,
      openRouterConfig: {
        apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || 'test-key',
        model: 'anthropic/claude-3.5-sonnet'
      }
    };
    
    return new AIResumeBuilder(config);
  });

  const addKeyword = useCallback(() => {
    if (currentKeyword.trim() && !targetKeywords.includes(currentKeyword.trim())) {
      setTargetKeywords(prev => [...prev, currentKeyword.trim()]);
      setCurrentKeyword('');
    }
  }, [currentKeyword, targetKeywords]);

  const removeKeyword = useCallback((keyword: string) => {
    setTargetKeywords(prev => prev.filter(k => k !== keyword));
  }, []);

  const extractKeywordsFromJobDescription = useCallback(() => {
    if (!jobDescription.trim()) return;

    // Simple keyword extraction - in production, this would be more sophisticated
    const keywords = jobDescription
      .toLowerCase()
      .match(/\b[a-z]{3,}\b/g)
      ?.filter(word => {
        // Filter out common words
        const commonWords = new Set([
          'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'
        ]);
        return !commonWords.has(word) && word.length > 3;
      })
      ?.slice(0, 20) || [];

    const uniqueKeywords = [...new Set(keywords)];
    const newKeywords = uniqueKeywords.filter(k => !targetKeywords.includes(k));
    
    if (newKeywords.length > 0) {
      setTargetKeywords(prev => [...prev, ...newKeywords.slice(0, 10)]);
    }
  }, [jobDescription, targetKeywords]);

  const handleOptimize = useCallback(async () => {
    if (targetKeywords.length === 0) {
      setState(prev => ({ ...prev, error: 'Please add at least one target keyword' }));
      return;
    }

    setState(prev => ({
      ...prev,
      step: 'analyzing',
      isLoading: true,
      error: null,
      progress: 0
    }));

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 12, 85)
        }));
      }, 600);

      const resumeContent = resumeData.content || buildResumeText(resumeData);
      const optimization = await aiService.optimizeWithKeywords(
        resumeContent,
        targetKeywords,
        jobDescription || undefined
      );

      clearInterval(progressInterval);

      setState(prev => ({
        ...prev,
        step: 'results',
        optimization,
        isLoading: false,
        progress: 100
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        step: 'input',
        isLoading: false,
        error: error instanceof Error ? error.message : 'Optimization failed',
        progress: 0
      }));
    }
  }, [targetKeywords, jobDescription, resumeData, aiService]);

  const handleReanalyze = useCallback(async () => {
    if (!state.optimization) return;

    setState(prev => ({
      ...prev,
      step: 'reanalyzing',
      isLoading: true,
      error: null,
      progress: 0
    }));

    try {
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 15, 90)
        }));
      }, 500);

      const originalContent = resumeData.content || buildResumeText(resumeData);
      const optimizedContent = buildOptimizedResumeText(state.optimization);

      const reanalysis = await aiService.reanalyzeOptimizedResume(
        originalContent,
        optimizedContent,
        jobDescription || undefined
      );

      clearInterval(progressInterval);

      setState(prev => ({
        ...prev,
        step: 'results',
        reanalysis,
        isLoading: false,
        progress: 100
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        step: 'results',
        isLoading: false,
        error: error instanceof Error ? error.message : 'Re-analysis failed'
      }));
    }
  }, [state.optimization, resumeData, jobDescription, aiService]);

  const handleAcceptOptimization = useCallback(() => {
    if (!state.optimization) return;

    // Create optimized resume data
    const optimizedResumeData: ResumeData = {
      ...resumeData,
      content: buildOptimizedResumeText(state.optimization),
      sections: {
        ...resumeData.sections,
        summary: state.optimization.optimizedContent.summary || resumeData.sections.summary,
        // Update experience with optimized content
        experience: resumeData.sections.experience.map((exp, index) => ({
          ...exp,
          description: state.optimization!.optimizedContent.experience[index] || exp.description
        })),
        // Update skills with optimized content
        skills: state.optimization.optimizedContent.skills.length > 0 
          ? state.optimization.optimizedContent.skills 
          : resumeData.sections.skills
      }
    };

    onOptimizationComplete(optimizedResumeData, state.reanalysis || {
      originalScore: 75,
      optimizedScore: 85,
      improvement: 10,
      keywordMatch: { before: 60, after: 80 },
      recommendations: []
    });
  }, [state.optimization, state.reanalysis, resumeData, onOptimizationComplete]);

  const renderInputStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Job Description (Optional)</h3>
        <Textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description here to extract relevant keywords automatically..."
          rows={6}
          className="resize-none"
        />
        <div className="flex justify-end mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={extractKeywordsFromJobDescription}
            disabled={!jobDescription.trim()}
            className="min-h-[36px]"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Extract Keywords
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Target Keywords</h3>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={currentKeyword}
            onChange={(e) => setCurrentKeyword(e.target.value)}
            placeholder="Add a keyword"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
          />
          <Button 
            onClick={addKeyword}
            className="min-h-[44px] px-4"
          >
            Add
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {targetKeywords.map((keyword, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="text-sm px-3 py-1 cursor-pointer hover:bg-red-100 hover:text-red-800"
              onClick={() => removeKeyword(keyword)}
            >
              {keyword} ×
            </Badge>
          ))}
        </div>

        {targetKeywords.length === 0 && (
          <p className="text-sm text-gray-500">
            Add keywords that you want to optimize for in your resume.
          </p>
        )}
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Keyword Optimization</h4>
            <p className="text-sm text-blue-700">
              Our AI will analyze your resume and strategically integrate the target keywords 
              while maintaining natural language and professional tone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalyzingStep = () => (
    <div className="text-center py-8">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-6"
      >
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
          <Zap className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {state.step === 'analyzing' ? 'Optimizing Your Resume' : 'Re-analyzing Results'}
        </h3>
        <p className="text-gray-600 mb-6">
          {state.step === 'analyzing' 
            ? 'Strategically integrating keywords while maintaining professional quality...'
            : 'Comparing original and optimized versions...'
          }
        </p>
      </motion.div>

      <div className="max-w-md mx-auto">
        <Progress value={state.progress} className="mb-4" />
        <p className="text-sm text-gray-500">
          {state.progress}% complete
        </p>
      </div>
    </div>
  );

  const renderResultsStep = () => {
    if (!state.optimization) return null;

    return (
      <div className="space-y-6">
        {/* Results Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {state.optimization.suggestedKeywords.length}
              </div>
              <div className="text-sm text-gray-600">Keywords Added</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {state.optimization.keywordDensity.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Keyword Density</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {state.optimization.improvements.length}
              </div>
              <div className="text-sm text-gray-600">Improvements Made</div>
            </CardContent>
          </Card>
        </div>

        {/* Re-analysis Results */}
        {state.reanalysis && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                Performance Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">ATS Score Improvement</h4>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">
                        {state.reanalysis.originalScore}
                      </div>
                      <div className="text-xs text-gray-500">Original</div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {state.reanalysis.optimizedScore}
                      </div>
                      <div className="text-xs text-gray-500">Optimized</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        +{state.reanalysis.improvement}
                      </div>
                      <div className="text-xs text-gray-500">Points</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Keyword Match Rate</h4>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">
                        {state.reanalysis.keywordMatch.before}%
                      </div>
                      <div className="text-xs text-gray-500">Before</div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {state.reanalysis.keywordMatch.after}%
                      </div>
                      <div className="text-xs text-gray-500">After</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Optimization Details */}
        <Tabs defaultValue="improvements" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="improvements">Improvements</TabsTrigger>
            <TabsTrigger value="keywords">Keywords</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
          </TabsList>

          <TabsContent value="improvements" className="space-y-4">
            {state.optimization.improvements.map((improvement, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                      ${improvement.impact === 'high' ? 'bg-red-100 text-red-600' :
                        improvement.impact === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-green-100 text-green-600'}
                    `}>
                      {improvement.impact === 'high' ? 'H' : improvement.impact === 'medium' ? 'M' : 'L'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1 capitalize">
                        {improvement.section} Section
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Original:</p>
                          <p className="text-sm bg-gray-50 p-2 rounded">
                            {improvement.original}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Optimized:</p>
                          <p className="text-sm bg-green-50 p-2 rounded">
                            {improvement.optimized}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {improvement.addedKeywords.map((keyword, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              +{keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="keywords" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-green-600">Added Keywords</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {state.optimization.suggestedKeywords.map((keyword, index) => (
                      <Badge key={index} className="bg-green-100 text-green-800">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-orange-600">Missing Keywords</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {state.optimization.missingKeywords.map((keyword, index) => (
                      <Badge key={index} variant="outline" className="text-orange-600 border-orange-200">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="comparison">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Content Comparison</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowComparison(!showComparison)}
                  className="min-h-[36px]"
                >
                  {showComparison ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Hide
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Show
                    </>
                  )}
                </Button>
              </div>

              {showComparison && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Original Resume</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm bg-gray-50 p-3 rounded max-h-96 overflow-y-auto">
                        <pre className="whitespace-pre-wrap font-sans">
                          {resumeData.content || buildResumeText(resumeData)}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Optimized Resume</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm bg-green-50 p-3 rounded max-h-96 overflow-y-auto">
                        <pre className="whitespace-pre-wrap font-sans">
                          {buildOptimizedResumeText(state.optimization)}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <div className={`max-w-6xl mx-auto p-4 md:p-6 ${className}`}>
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Keyword Optimization
        </h2>
        <p className="text-gray-600">
          Boost your resume's ATS compatibility by optimizing keyword usage and density.
        </p>
      </div>

      {state.error && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            {state.step === 'input' && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {renderInputStep()}
              </motion.div>
            )}

            {(state.step === 'analyzing' || state.step === 'reanalyzing') && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
              >
                {renderAnalyzingStep()}
              </motion.div>
            )}

            {state.step === 'results' && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {renderResultsStep()}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-between">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="min-h-[44px] flex-1 sm:flex-none"
          >
            Cancel
          </Button>

          {state.step === 'results' && !state.reanalysis && (
            <Button
              variant="outline"
              onClick={handleReanalyze}
              disabled={state.isLoading}
              className="min-h-[44px] flex-1 sm:flex-none"
            >
              {state.isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analyze Impact
                </>
              )}
            </Button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {state.step === 'input' && (
            <Button
              onClick={handleOptimize}
              disabled={state.isLoading || targetKeywords.length === 0}
              className="min-h-[44px] flex-1 sm:flex-none"
            >
              {state.isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Optimize Resume
                </>
              )}
            </Button>
          )}

          {state.step === 'results' && (
            <Button
              onClick={handleAcceptOptimization}
              className="min-h-[44px] flex-1 sm:flex-none"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Accept Optimization
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper functions
function buildResumeText(resumeData: ResumeData): string {
  let text = '';
  
  // Contact info
  if (resumeData.sections.contact) {
    const contact = resumeData.sections.contact;
    text += `${contact.name}\n${contact.email} | ${contact.phone}\n`;
    if (contact.location) text += `${contact.location}\n`;
    text += '\n';
  }

  // Summary
  if (resumeData.sections.summary) {
    text += `PROFESSIONAL SUMMARY\n${resumeData.sections.summary}\n\n`;
  }

  // Experience
  if (resumeData.sections.experience.length > 0) {
    text += 'PROFESSIONAL EXPERIENCE\n';
    resumeData.sections.experience.forEach(exp => {
      text += `${exp.position} | ${exp.company}\n${exp.startDate} - ${exp.endDate}\n`;
      text += `${exp.description}\n`;
      exp.achievements.forEach(achievement => {
        text += `• ${achievement}\n`;
      });
      text += '\n';
    });
  }

  // Skills
  if (resumeData.sections.skills.length > 0) {
    text += `SKILLS\n${resumeData.sections.skills.join(', ')}\n\n`;
  }

  return text;
}

function buildOptimizedResumeText(optimization: KeywordOptimization): string {
  let text = '';
  
  // Summary
  if (optimization.optimizedContent.summary) {
    text += `PROFESSIONAL SUMMARY\n${optimization.optimizedContent.summary}\n\n`;
  }

  // Experience
  if (optimization.optimizedContent.experience.length > 0) {
    text += 'PROFESSIONAL EXPERIENCE\n';
    optimization.optimizedContent.experience.forEach(exp => {
      text += `${exp}\n\n`;
    });
  }

  // Skills
  if (optimization.optimizedContent.skills.length > 0) {
    text += `SKILLS\n${optimization.optimizedContent.skills.join(', ')}\n\n`;
  }

  return text;
}