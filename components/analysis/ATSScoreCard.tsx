'use client';

import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, FileText, Hash, Ruler, Info } from 'lucide-react';
import { ATSAnalysis } from '@/types/analysis';
import { getATSScoreClass } from '@/lib/theme';

interface ATSScoreCardProps {
  analysis: ATSAnalysis;
  className?: string;
}

interface ScoreBreakdownItem {
  key: keyof ATSAnalysis['breakdown'];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  tips: string[];
}

const scoreBreakdownItems: ScoreBreakdownItem[] = [
  {
    key: 'formatting',
    label: 'Formatting',
    icon: FileText,
    description: 'Document structure and readability',
    tips: [
      'Use standard fonts like Arial or Calibri',
      'Maintain consistent spacing and margins',
      'Use clear section headers',
      'Avoid complex formatting or graphics'
    ]
  },
  {
    key: 'keywords',
    label: 'Keywords',
    icon: Hash,
    description: 'Relevant keywords and skills matching',
    tips: [
      'Include job-specific keywords naturally',
      'Use industry terminology',
      'Match skills from job description',
      'Avoid keyword stuffing'
    ]
  },
  {
    key: 'structure',
    label: 'Structure',
    icon: TrendingUp,
    description: 'Resume organization and flow',
    tips: [
      'Start with contact information',
      'Use reverse chronological order',
      'Include clear section breaks',
      'Maintain logical information flow'
    ]
  },
  {
    key: 'length',
    label: 'Length',
    icon: Ruler,
    description: 'Appropriate resume length',
    tips: [
      '1-2 pages for most professionals',
      'Be concise but comprehensive',
      'Remove outdated information',
      'Focus on relevant experience'
    ]
  }
];

function AnimatedProgressBar({ 
  value, 
  className = '', 
  delay = 0 
}: { 
  value: number; 
  className?: string; 
  delay?: number; 
}) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  const getProgressColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 75) return 'bg-green-400';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 md:h-3 ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-1000 ease-out ${getProgressColor(value)}`}
        style={{ width: `${animatedValue}%` }}
      />
    </div>
  );
}

function ScoreBreakdownCard({ 
  item, 
  score, 
  isExpanded, 
  onToggle,
  delay 
}: { 
  item: ScoreBreakdownItem; 
  score: number; 
  isExpanded: boolean;
  onToggle: () => void;
  delay: number;
}) {
  const Icon = item.icon;
  const scoreClass = getATSScoreClass(score);

  return (
    <div className="bg-card border border-border rounded-lg p-3 md:p-4 transition-all duration-200 hover:shadow-md">
      <button
        onClick={onToggle}
        className="w-full text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            <span className="font-medium text-sm md:text-base">{item.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`font-bold text-sm md:text-base ${scoreClass}`}>
              {score}%
            </span>
            <Info className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
          </div>
        </div>
        
        <AnimatedProgressBar value={score} delay={delay} />
        
        <p className="text-xs md:text-sm text-muted-foreground mt-2">
          {item.description}
        </p>
      </button>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-border animate-in slide-in-from-top-2 duration-200">
          <h4 className="font-medium text-sm mb-2">Improvement Tips:</h4>
          <ul className="space-y-1">
            {item.tips.map((tip, index) => (
              <li key={index} className="text-xs md:text-sm text-muted-foreground flex items-start gap-2">
                <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function ATSScoreCard({ analysis, className = '' }: ATSScoreCardProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(analysis.score);
    }, 300);

    return () => clearTimeout(timer);
  }, [analysis.score]);

  const handleCardToggle = (key: string) => {
    setExpandedCard(expandedCard === key ? null : key);
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  const getScoreDescription = (score: number) => {
    if (score >= 90) return 'Your resume is highly optimized for ATS systems';
    if (score >= 75) return 'Your resume performs well with most ATS systems';
    if (score >= 60) return 'Your resume may pass some ATS systems but needs improvement';
    return 'Your resume may struggle with ATS systems and needs significant improvement';
  };

  const scoreClass = getATSScoreClass(analysis.score);

  return (
    <div className={`w-full ${className}`}>
      {/* Mobile-First Main Score Display */}
      <div className="bg-card border border-border rounded-lg p-4 md:p-6 mb-4 md:mb-6">
        {/* Mobile: Vertical Layout, Desktop: Horizontal Layout */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-3 bg-primary/10 rounded-full">
              <Target className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold">ATS Compatibility Score</h2>
              <p className="text-sm md:text-base text-muted-foreground">
                How well your resume works with ATS systems
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-2">
            <div className={`text-4xl md:text-5xl font-bold ${scoreClass} transition-all duration-1000`}>
              {animatedScore}%
            </div>
            <div className="text-center md:text-right">
              <div className={`font-medium ${scoreClass}`}>
                {getScoreLabel(analysis.score)}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground max-w-xs">
                {getScoreDescription(analysis.score)}
              </div>
            </div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="mt-4 md:mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Overall Score</span>
            <span className="text-sm text-muted-foreground">
              {analysis.score}/100
            </span>
          </div>
          <AnimatedProgressBar value={analysis.score} delay={500} className="h-3 md:h-4" />
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-3 md:space-y-4">
        <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">
          Detailed Breakdown
        </h3>
        
        {/* Mobile: Single Column, Desktop: Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {scoreBreakdownItems.map((item, index) => (
            <ScoreBreakdownCard
              key={item.key}
              item={item}
              score={analysis.breakdown[item.key]}
              isExpanded={expandedCard === item.key}
              onToggle={() => handleCardToggle(item.key)}
              delay={700 + (index * 200)}
            />
          ))}
        </div>
      </div>

      {/* Model Information */}
      <div className="mt-4 md:mt-6 p-3 md:p-4 bg-muted/50 rounded-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs md:text-sm text-muted-foreground">
          <span>Analyzed by: {analysis.modelUsed}</span>
          {analysis.fallbacksUsed.length > 0 && (
            <span>Fallbacks used: {analysis.fallbacksUsed.join(', ')}</span>
          )}
        </div>
      </div>
    </div>
  );
}