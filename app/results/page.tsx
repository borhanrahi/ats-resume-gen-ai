"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";

interface AnalysisResult {
  id: string;
  fileName: string;
  fileType: string;
  analysisType: string;
  analysis: {
    score: number;
    breakdown: {
      formatting: number;
      keywords: number;
      structure: number;
      length: number;
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
    keywordMatch: {
      found: string[];
      missing: string[];
      matchPercentage: number;
      density: number;
      suggestions: string[];
    };
    grammarIssues: unknown[];
    modelUsed: string;
    fallbacksUsed: string[];
    processingTime: number;
    errors: string[];
    warnings: string[];
  };
  createdAt: string;
}

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Get the latest analysis result from localStorage
    const latestResult = localStorage.getItem("latestAnalysis");

    if (latestResult) {
      try {
        const parsedResult = JSON.parse(latestResult);
        console.log("Loaded analysis result:", parsedResult);
        setResult(parsedResult);
      } catch (err) {
        console.error("Failed to parse analysis result:", err);
        setError("Failed to load results");
      }
    } else {
      setError("No analysis results found");
    }

    setLoading(false);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analysis results...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Results Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {error || "No analysis results found. Please analyze a resume first."}
          </p>
          <button
            onClick={() => router.push("/analyze")}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-semibold"
          >
            Analyze Resume
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/analyze")}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Analysis Results</h1>
              <p className="text-sm text-muted-foreground">{result.fileName}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Overall Score */}
        <div className={`p-6 rounded-xl mb-8 ${getScoreBgColor(result.analysis.score)}`}>
          <div className="text-center">
            <div className={`text-6xl font-bold ${getScoreColor(result.analysis.score)} mb-2`}>
              {result.analysis.score}
            </div>
            <div className="text-lg font-semibold text-foreground mb-2">
              ATS Compatibility Score
            </div>
            <p className="text-muted-foreground">
              {result.analysis.score >= 80 && "Excellent! Your resume is highly ATS-friendly."}
              {result.analysis.score >= 60 && result.analysis.score < 80 && "Good! Your resume has room for improvement."}
              {result.analysis.score < 60 && "Needs work. Your resume may struggle with ATS systems."}
            </p>
          </div>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {Object.entries(result.analysis.breakdown).map(([category, score]) => (
            <div key={category} className="p-4 bg-card border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground capitalize">{category}</h3>
                <span className={`font-bold ${getScoreColor(score)}`}>{score}/100</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        {result.analysis.recommendations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Recommendations
            </h2>
            <div className="space-y-4">
              {result.analysis.recommendations.map((rec) => (
                <div key={rec.id} className="p-4 bg-card border border-border rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      rec.priority === 'critical' ? 'bg-red-500' :
                      rec.priority === 'high' ? 'bg-orange-500' :
                      rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">{rec.title}</h3>
                      <p className="text-muted-foreground text-sm mb-2">{rec.description}</p>
                      <p className="text-sm text-foreground">{rec.suggestion}</p>
                      {rec.impact && (
                        <p className="text-xs text-muted-foreground mt-1">Impact: {rec.impact}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Keywords */}
        {result.analysis.keywordMatch && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Keyword Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-card border border-border rounded-lg">
                <h3 className="font-semibold text-green-600 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Found Keywords ({result.analysis.keywordMatch.found.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.analysis.keywordMatch.found.map((keyword, index) => (
                    <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-card border border-border rounded-lg">
                <h3 className="font-semibold text-red-600 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Missing Keywords ({result.analysis.keywordMatch.missing.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.analysis.keywordMatch.missing.map((keyword, index) => (
                    <span key={index} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Match Percentage: <span className="font-semibold">{result.analysis.keywordMatch.matchPercentage}%</span>
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.push("/analyze")}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-semibold"
          >
            Analyze Another Resume
          </button>
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 font-semibold"
          >
            Print Results
          </button>
        </div>
      </div>
    </div>
  );
}
