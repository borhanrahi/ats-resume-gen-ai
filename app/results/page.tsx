"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AnalysisResults from '@/components/results/AnalysisResults';
import ErrorState from '@/components/results/ErrorState';
import NonResumeError from '@/components/results/NonResumeError';
import LoadingState from '@/components/results/LoadingState';
import { AdPlacementOptimizer } from '@/components/monetization';
import { useAuth } from '@/lib/auth/AuthContext';
import { useUsageTracking } from '@/lib/storage/localStorage';

interface AnalysisResult {
  fileName: string;
  analysisType: string;
  analysis: {
    isValidResume: boolean;
    resumeDetection?: {
      isResume: boolean;
      confidence: number;
      reasons: string[];
      suggestions?: string[];
    };
    atsScore: {
      totalScore: number;
      maxScore: number;
      percentage: number;
      dimensions: {
        textExtraction: { name: string; score: number; maxScore: number; percentage: number; details: any[] };
        structure: { name: string; score: number; maxScore: number; percentage: number; details: any[] };
        formatting: { name: string; score: number; maxScore: number; percentage: number; details: any[] };
        keywords: { name: string; score: number; maxScore: number; percentage: number; details: any[] };
        content: { name: string; score: number; maxScore: number; percentage: number; details: any[] };
        language: { name: string; score: number; maxScore: number; percentage: number; details: any[] };
      };
      penalties: Array<{
        type: string;
        description: string;
        points: number;
      }>;
      recommendations: string[];
    };
    aiSuggestions: Array<{
      category: string;
      priority: 'high' | 'medium' | 'low';
      title: string;
      description: string;
      example?: string;
      impact: string;
    }>;
    keywordMatching?: {
      foundKeywords: string[];
      missingKeywords: string[];
      matchPercentage: number;
      suggestions: string[];
    };
    improvementPlan?: {
      quickWins: Array<{ title: string; description: string; timeEstimate: string }>;
      mediumTerm: Array<{ title: string; description: string; timeEstimate: string }>;
      longTerm: Array<{ title: string; description: string; timeEstimate: string }>;
    };
    error?: string;
  };
  createdAt: string;
}

export default function ResultsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { usage } = useUsageTracking();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Get the latest analysis result from localStorage or session
    const latestResult = localStorage.getItem("latestAnalysis");

    if (latestResult) {
      try {
        const parsedResult = JSON.parse(latestResult);
        console.log('Loaded analysis result:', parsedResult);
        setResult(parsedResult);
      } catch (err) {
        console.error('Failed to parse analysis result:', err);
        setError("Failed to load results");
      }
    } else {
      setError("No analysis results found");
    }

    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading analysis results...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return <ErrorState error={error} onBackHome={() => router.push("/")} />;
  }

  // If the document is not a valid resume, show the NonResumeError component
  if (!result.analysis.isValidResume && result.analysis.resumeDetection) {
    return (
      <NonResumeError
        resumeDetection={result.analysis.resumeDetection}
        fileName={result.fileName}
      />
    );
  }

  // If there's an error but no resume detection data, show generic error
  if (!result.analysis.isValidResume || result.analysis.error) {
    return (
      <ErrorState
        error={result.analysis.error || "Analysis failed. Please try again."}
        onBackHome={() => router.push('/')}
      />
    );
  }

  // If no ATS score data, something went wrong
  if (!result.analysis.atsScore) {
    return (
      <ErrorState
        error="ATS analysis data is missing. Please try uploading your resume again."
        onBackHome={() => router.push('/')}
      />
    );
  }

  return (
    <AdPlacementOptimizer
      userTier={user ? 'premium' : 'free'}
      pageType="results"
      usageCount={usage?.dailyCount || 0}
      maxUsage={5}
    >
      <AnalysisResults 
        analysis={result.analysis}
        fileName={result.fileName}
      />
    </AdPlacementOptimizer>
  );
}
