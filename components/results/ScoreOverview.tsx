'use client';

import { Target, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { getATSScoreClass } from '@/lib/theme';

interface ScoreOverviewProps {
  analysis: {
    atsScore: number;
    matchPercentage?: number;
    recommendations: Array<{ id: string }>;
    grammarIssues: Array<{ id: string }>;
  };
  analysisType: string;
}

export default function ScoreOverview({ analysis, analysisType }: ScoreOverviewProps) {
  const scoreClass = getATSScoreClass(analysis.atsScore);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="analysis-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">ATS Score</h3>
          <Target className="w-5 h-5 text-primary" />
        </div>
        <div className={`text-3xl font-bold mb-2 ${scoreClass}`}>
          {analysis.atsScore}%
        </div>
        <p className="text-sm text-muted-foreground">
          {analysis.atsScore >= 90 ? 'Excellent' : 
           analysis.atsScore >= 75 ? 'Good' : 
           analysis.atsScore >= 60 ? 'Fair' : 'Needs Improvement'}
        </p>
      </div>

      {analysis.matchPercentage && analysisType === 'job' && (
        <div className="analysis-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Job Match</h3>
            <Zap className="w-5 h-5 text-accent-foreground" />
          </div>
          <div className="text-3xl font-bold mb-2 text-accent-foreground">
            {analysis.matchPercentage}%
          </div>
          <p className="text-sm text-muted-foreground">
            Keyword compatibility
          </p>
        </div>
      )}

      <div className="analysis-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Issues Found</h3>
          <AlertCircle className="w-5 h-5 text-warning" />
        </div>
        <div className="text-3xl font-bold mb-2 text-warning">
          {analysis.recommendations.length}
        </div>
        <p className="text-sm text-muted-foreground">
          Recommendations
        </p>
      </div>

      <div className="analysis-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Grammar</h3>
          <CheckCircle className="w-5 h-5 text-success" />
        </div>
        <div className="text-3xl font-bold mb-2 text-success">
          {analysis.grammarIssues.length}
        </div>
        <p className="text-sm text-muted-foreground">
          Issues detected
        </p>
      </div>
    </div>
  );
}