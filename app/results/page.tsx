"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RecommendationsList from "@/components/results/RecommendationsList";
import LoadingState from "@/components/results/LoadingState";
import ErrorState from "@/components/results/ErrorState";
import ResultsHeader from "@/components/results/ResultsHeader";
import ScoreOverview from "@/components/results/ScoreOverview";
import DetailedBreakdown from "@/components/results/DetailedBreakdown";
import GrammarIssues from "@/components/results/GrammarIssues";


interface AnalysisResult {
  fileName: string;
  analysisType: string;
  analysis: {
    atsScore: number;
    matchPercentage?: number;
    breakdown: {
      formatting: number;
      keywords: number;
      structure: number;
      length: number;
    };
    keywordMatch?: {
      found: string[];
      missing: string[];
      matchPercentage: number;
      suggestions: string[];
    };
    recommendations: Array<{
      id: string;
      category: string;
      priority: string;
      title: string;
      description: string;
      suggestion: string;
      impact: string;
    }>;
    grammarIssues: Array<{
      id: string;
      type: string;
      text: string;
      suggestion: string;
      severity: string;
    }>;
  };
  createdAt: string;
}

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Get the latest analysis result from localStorage or session
    const latestResult = localStorage.getItem("latestAnalysis");

    if (latestResult) {
      try {
        const parsedResult = JSON.parse(latestResult);
        setResult(parsedResult);
      } catch {
        setError("Failed to load results");
      }
    } else {
      setError("No analysis results found");
    }

    setLoading(false);
  }, []);

  if (loading) {
    return <LoadingState />;
  }

  if (error || !result) {
    return <ErrorState error={error} onBackHome={() => router.push("/")} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <ResultsHeader
        fileName={result.fileName}
        createdAt={result.createdAt}
        onBackHome={() => router.push("/")}
      />

      <div className="container-mobile py-8">
        <ScoreOverview
          analysis={result.analysis}
          analysisType={result.analysisType}
        />

        <DetailedBreakdown
          breakdown={result.analysis.breakdown}
          keywordMatch={result.analysis.keywordMatch}
        />

        <RecommendationsList
          recommendations={result.analysis.recommendations}
        />

        {result.analysis.grammarIssues.length > 0 && (
          <GrammarIssues issues={result.analysis.grammarIssues} />
        )}
      </div>
    </div>
  );
}
