'use client';

import React from 'react';
import { AlertCircle, CheckCircle, Lightbulb, Target, TrendingUp, User, MapPin, Mail, Phone, Globe, FileText, Award, Clock } from 'lucide-react';

interface AnalysisResultsProps {
  analysis: {
    atsScore: {
      totalScore: number;
      percentage: number;
      dimensions: {
        textExtraction: { score: number; percentage: number; details: any[] };
        structure: { score: number; percentage: number; details: any[] };
        formatting: { score: number; percentage: number; details: any[] };
        keywords: { score: number; percentage: number; details: any[] };
        content: { score: number; percentage: number; details: any[] };
        language: { score: number; percentage: number; details: any[] };
      };
      penalties: Array<{ type: string; description: string; points: number }>;
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
  };
  fileName: string;
}

export default function AnalysisResults({ analysis, fileName }: AnalysisResultsProps) {
  const { atsScore, aiSuggestions, keywordMatching, improvementPlan } = analysis;
  
  // Determine score color
  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500/20 border-green-500/30';
    if (percentage >= 60) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Header with ATS Score */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">ATS Resume Analysis</h1>
          <p className="text-slate-300 mb-6">Analysis for: {fileName}</p>
          
          {/* Large ATS Score Display */}
          <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full border-4 ${getScoreBgColor(atsScore.percentage)} mb-4`}>
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(atsScore.percentage)}`}>
                {atsScore.percentage}
              </div>
              <div className="text-sm text-slate-300">ATS Score</div>
            </div>
          </div>
          
          <div className="text-lg text-slate-300">
            {atsScore.totalScore} out of 100 points
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Issues Found */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <h2 className="text-xl font-semibold">Issues Found</h2>
            </div>
            
            <div className="space-y-3">
              {atsScore.penalties.map((penalty, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-red-300">{penalty.type}:</div>
                    <div className="text-sm text-slate-300">{penalty.description}</div>
                    <div className="text-xs text-red-400 mt-1">-{penalty.points} points</div>
                  </div>
                </div>
              ))}
              
              {atsScore.penalties.length === 0 && (
                <div className="text-center py-4 text-slate-400">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                  No major issues found!
                </div>
              )}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              <h2 className="text-xl font-semibold">Recommendations</h2>
            </div>
            
            <div className="space-y-3">
              {aiSuggestions.slice(0, 5).map((suggestion, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <Target className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-yellow-300">{suggestion.title}</div>
                    <div className="text-sm text-slate-300">{suggestion.description}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded ${
                        suggestion.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                        suggestion.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-green-500/20 text-green-300'
                      }`}>
                        {suggestion.priority} priority
                      </span>
                      <span className="text-xs text-slate-400">{suggestion.impact}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Keywords Analysis */}
        {keywordMatching && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            
            {/* Keywords Found */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <h2 className="text-xl font-semibold">Keywords Found ({keywordMatching.foundKeywords?.length || 0})</h2>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {keywordMatching.foundKeywords?.map((keyword, index) => (
                  <span key={index} className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm border border-green-500/30">
                    {keyword}
                  </span>
                )) || (
                  <div className="text-slate-400 text-center py-4">
                    No keywords data available
                  </div>
                )}
              </div>
            </div>

            {/* Missing Keywords */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-orange-400" />
                <h2 className="text-xl font-semibold">Missing Keywords ({keywordMatching.missingKeywords?.length || 0})</h2>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {keywordMatching.missingKeywords?.map((keyword, index) => (
                  <span key={index} className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-sm border border-orange-500/30">
                    {keyword}
                  </span>
                )) || (
                  <div className="text-slate-400 text-center py-4">
                    No missing keywords data available
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Skills Analysis */}
        <div className="mt-8 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <h2 className="text-xl font-semibold mb-4">Skills Analysis</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* All Skills from CV */}
            <div className="col-span-full">
              <h3 className="text-lg font-medium mb-3 text-blue-300">Skills Found in Resume</h3>
              <div className="flex flex-wrap gap-2">
                {keywordMatching?.foundKeywords?.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm border border-blue-500/30">
                    {skill}
                  </span>
                )) || (
                  <div className="text-slate-400 text-center py-4">
                    No skills data available from analysis
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="mt-8 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <h2 className="text-xl font-semibold mb-6">Detailed Analysis</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(atsScore.dimensions).map(([key, dimension]) => (
              <div key={key} className="bg-slate-700/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h3>
                  <span className={`font-bold ${getScoreColor(dimension.percentage)}`}>
                    {dimension.percentage}%
                  </span>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      dimension.percentage >= 80 ? 'bg-green-500' :
                      dimension.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${dimension.percentage}%` }}
                  />
                </div>
                <div className="text-sm text-slate-400 mt-1">
                  {dimension.score} / {dimension.score + (100 - dimension.percentage)} points
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Improvement Plan */}
        {improvementPlan && (
          <div className="mt-8 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold">Improvement Plan</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Quick Wins */}
              <div>
                <h3 className="font-medium text-green-300 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Quick Wins (1-2 hours)
                </h3>
                <div className="space-y-2">
                  {improvementPlan.quickWins?.map((item, index) => (
                    <div key={index} className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="font-medium text-green-300 text-sm">{item.title}</div>
                      <div className="text-xs text-slate-300 mt-1">{item.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Medium Term */}
              <div>
                <h3 className="font-medium text-yellow-300 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Medium Term (1-2 days)
                </h3>
                <div className="space-y-2">
                  {improvementPlan.mediumTerm?.map((item, index) => (
                    <div key={index} className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <div className="font-medium text-yellow-300 text-sm">{item.title}</div>
                      <div className="text-xs text-slate-300 mt-1">{item.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Long Term */}
              <div>
                <h3 className="font-medium text-blue-300 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Long Term (1+ weeks)
                </h3>
                <div className="space-y-2">
                  {improvementPlan.longTerm?.map((item, index) => (
                    <div key={index} className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="font-medium text-blue-300 text-sm">{item.title}</div>
                      <div className="text-xs text-slate-300 mt-1">{item.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
