'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Briefcase, Zap, Shield } from 'lucide-react';
import DocumentUploader from '@/components/upload/DocumentUploader';
import JobDescriptionUploader from '@/components/upload/JobDescriptionUploader';
import { UsageGuard } from '@/components/analysis/UsageGuard';
import { UsageDisplay } from '@/components/analysis/UsageDisplay';

type AnalysisType = 'normal' | 'job';

interface AnalysisState {
  step: 'upload' | 'analyzing' | 'complete';
  analysisType: AnalysisType;
  resumeFile: File | null;
  resumeContent: string | null;
  jobDescription: string | null;
  progress: number;
  error: string | null;
}

function AnalyzePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<AnalysisState>({
    step: 'upload',
    analysisType: (searchParams.get('type') as AnalysisType) || 'normal',
    resumeFile: null,
    resumeContent: null,
    jobDescription: null,
    progress: 0,
    error: null
  });

  // Handle resume upload
  const handleResumeUpload = (result: { file: File; content: string }) => {
    setState(prev => ({
      ...prev,
      resumeFile: result.file,
      resumeContent: result.content,
      error: null
    }));
  };

  // Handle job description input
  const handleJobDescriptionChange = (content: string) => {
    setState(prev => ({
      ...prev,
      jobDescription: content,
      error: null
    }));
  };

  // Handle analysis start
  const handleStartAnalysis = async () => {
    if (!state.resumeContent) {
      setState(prev => ({ ...prev, error: 'Please upload a resume first' }));
      return;
    }

    if (state.analysisType === 'job' && !state.jobDescription?.trim()) {
      setState(prev => ({ ...prev, error: 'Please enter a job description' }));
      return;
    }

    setState(prev => ({ ...prev, step: 'analyzing', progress: 0, error: null }));

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setState(prev => {
          if (prev.progress >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return { ...prev, progress: prev.progress + 10 };
        });
      }, 200);

      // Prepare form data
      const formData = new FormData();
      if (state.resumeFile) {
        formData.append('file', state.resumeFile);
      }
      formData.append('analysisType', state.analysisType);
      if (state.analysisType === 'job' && state.jobDescription) {
        formData.append('jobDescription', state.jobDescription);
      }

      // Make API call
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      
      setState(prev => ({ ...prev, progress: 100 }));
      
      // Store result in localStorage for results page
      if (result.result) {
        localStorage.setItem('latestAnalysis', JSON.stringify(result.result));
      }
      
      // Navigate to results page
      setTimeout(() => {
        router.push('/results');
      }, 500);

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Analysis failed. Please try again.',
        step: 'upload',
        progress: 0
      }));
    }
  };

  // Handle analysis type change
  const handleAnalysisTypeChange = (type: AnalysisType) => {
    setState(prev => ({
      ...prev,
      analysisType: type,
      jobDescription: null,
      error: null
    }));
  };

  // Check if ready to analyze
  const isReadyToAnalyze = state.resumeContent && 
    (state.analysisType === 'normal' || (state.analysisType === 'job' && state.jobDescription?.trim()));

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-First Header */}
      <div className="bg-card border-b border-border sticky top-16 z-40">
        <div className="container-mobile py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="btn-touch p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">
                Resume Analysis
              </h1>
              <p className="text-sm text-muted-foreground">
                {state.analysisType === 'normal' ? 'ATS Compatibility Check' : 'Job-Specific Analysis'}
              </p>
            </div>
            <UsageDisplay />
          </div>
        </div>
      </div>

      <div className="container-mobile py-6 sm:py-8">
        <UsageGuard>
          {/* Analysis Type Selector - Mobile First */}
          <div className="mb-8">
            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4">
              Choose Analysis Type
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => handleAnalysisTypeChange('normal')}
                className={`btn-touch p-4 rounded-xl border-2 transition-all duration-200 text-left touch-manipulation active:scale-95 ${
                  state.analysisType === 'normal'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:border-primary/30 hover:bg-muted/50'
                }`}
                style={{ minHeight: '120px' }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    state.analysisType === 'normal' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base">Normal ATS Check</h3>
                    <p className="text-xs text-muted-foreground">Comprehensive analysis</p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Get ATS compatibility score, format analysis, and improvement recommendations.
                </p>
              </button>

              <button
                onClick={() => handleAnalysisTypeChange('job')}
                className={`btn-touch p-4 rounded-xl border-2 transition-all duration-200 text-left touch-manipulation active:scale-95 ${
                  state.analysisType === 'job'
                    ? 'border-accent bg-accent/5 text-accent-foreground'
                    : 'border-border hover:border-accent/30 hover:bg-muted/50'
                }`}
                style={{ minHeight: '120px' }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    state.analysisType === 'job' ? 'bg-accent text-accent-foreground' : 'bg-muted'
                  }`}>
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base">Job-Specific Analysis</h3>
                    <p className="text-xs text-muted-foreground">Targeted matching</p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Compare your resume against specific job requirements and get targeted feedback.
                </p>
              </button>
            </div>
          </div>

          {/* Upload Section */}
          <div className="space-y-6 sm:space-y-8">
            {/* Resume Upload */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
                Upload Your Resume
              </h3>
              <DocumentUploader
                onUploadComplete={handleResumeUpload}
                onUploadError={(error) => setState(prev => ({ ...prev, error }))}
                className="w-full"
                showPreview={true}
              />
            </div>

            {/* Job Description Input - Only for job-specific analysis */}
            {state.analysisType === 'job' && (
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
                  Job Description
                </h3>
                <JobDescriptionUploader
                  onContentChange={handleJobDescriptionChange}
                  placeholder="Paste the complete job description here..."
                  className="w-full"
                />
              </div>
            )}

            {/* Error Display */}
            {state.error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{state.error}</p>
              </div>
            )}

            {/* Analysis Progress */}
            {state.step === 'analyzing' && (
              <div className="space-y-4 p-6 bg-muted/50 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Analyzing resume...</span>
                  <span className="text-sm text-muted-foreground">{state.progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${state.progress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  {state.progress < 30 && 'Parsing document...'}
                  {state.progress >= 30 && state.progress < 60 && 'Analyzing content...'}
                  {state.progress >= 60 && state.progress < 90 && 'Generating recommendations...'}
                  {state.progress >= 90 && 'Finalizing results...'}
                </p>
              </div>
            )}

            {/* Enhanced Action Button with better mobile touch targets */}
            <div className="pt-4">
              <button
                onClick={handleStartAnalysis}
                disabled={!isReadyToAnalyze || state.step === 'analyzing'}
                className="btn-touch w-full flex items-center justify-center gap-3 px-6 py-4 sm:py-5 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl font-semibold text-base hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95 touch-manipulation"
                style={{ minHeight: '56px' }}
              >
                <Zap className="w-5 h-5" />
                <span>
                  {state.step === 'analyzing' ? 'Analyzing...' : 'Start Analysis'}
                </span>
              </button>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>Privacy Protected</span>
                </div>
                <span className="hidden sm:inline">•</span>
                <div className="flex items-center gap-4">
                  <span>Results in 30 seconds</span>
                  <span className="sm:hidden">•</span>
                  <span className="sm:hidden">Mobile Optimized</span>
                </div>
              </div>
            </div>
          </div>
        </UsageGuard>
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analysis page...</p>
        </div>
      </div>
    }>
      <AnalyzePageContent />
    </Suspense>
  );
}