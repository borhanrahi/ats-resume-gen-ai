import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ATSScoreCard from '../ATSScoreCard';
import { ATSAnalysis } from '@/types/analysis';

const mockAnalysis: ATSAnalysis = {
  score: 85,
  breakdown: {
    formatting: 90,
    keywords: 80,
    structure: 85,
    length: 85
  },
  recommendations: [
    {
      id: '1',
      category: 'keywords',
      priority: 'high',
      title: 'Add more relevant keywords',
      description: 'Include more job-specific keywords',
      suggestion: 'Add keywords like "React", "TypeScript"',
      impact: 'High impact on ATS score'
    }
  ],
  keywordMatch: {
    found: ['JavaScript', 'React'],
    missing: ['TypeScript', 'Node.js'],
    matchPercentage: 60,
    density: 2.5,
    suggestions: ['Add TypeScript experience']
  },
  grammarIssues: [],
  modelUsed: 'gpt-4',
  fallbacksUsed: []
};

describe('ATSScoreCard', () => {
  it('renders the main score correctly', () => {
    render(<ATSScoreCard analysis={mockAnalysis} />);
    
    expect(screen.getByText('ATS Compatibility Score')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.getByText('85/100')).toBeInTheDocument();
  });

  it('renders all breakdown categories', () => {
    render(<ATSScoreCard analysis={mockAnalysis} />);
    
    expect(screen.getByText('Formatting')).toBeInTheDocument();
    expect(screen.getByText('Keywords')).toBeInTheDocument();
    expect(screen.getByText('Structure')).toBeInTheDocument();
    expect(screen.getByText('Length')).toBeInTheDocument();
  });

  it('shows breakdown scores correctly', () => {
    render(<ATSScoreCard analysis={mockAnalysis} />);
    
    expect(screen.getByText('90%')).toBeInTheDocument(); // formatting
    expect(screen.getByText('80%')).toBeInTheDocument(); // keywords
    // Note: 85% appears twice (structure and length), so we check for multiple
    const eightyFivePercents = screen.getAllByText('85%');
    expect(eightyFivePercents).toHaveLength(2);
  });

  it('expands and collapses breakdown cards when clicked', () => {
    render(<ATSScoreCard analysis={mockAnalysis} />);
    
    const formattingCard = screen.getByText('Formatting').closest('button');
    expect(formattingCard).toBeInTheDocument();
    
    // Initially, tips should not be visible
    expect(screen.queryByText('Improvement Tips:')).not.toBeInTheDocument();
    
    // Click to expand
    fireEvent.click(formattingCard!);
    
    // Tips should now be visible
    expect(screen.getByText('Improvement Tips:')).toBeInTheDocument();
    expect(screen.getByText('Use standard fonts like Arial or Calibri')).toBeInTheDocument();
  });

  it('displays model information', () => {
    render(<ATSScoreCard analysis={mockAnalysis} />);
    
    expect(screen.getByText('Analyzed by: gpt-4')).toBeInTheDocument();
  });

  it('displays fallback information when fallbacks were used', () => {
    const analysisWithFallbacks = {
      ...mockAnalysis,
      fallbacksUsed: ['claude-3', 'gemini']
    };
    
    render(<ATSScoreCard analysis={analysisWithFallbacks} />);
    
    expect(screen.getByText('Fallbacks used: claude-3, gemini')).toBeInTheDocument();
  });

  it('applies correct score class for different score ranges', () => {
    const excellentAnalysis = { ...mockAnalysis, score: 95 };
    const { rerender } = render(<ATSScoreCard analysis={excellentAnalysis} />);
    
    expect(screen.getByText('Excellent')).toBeInTheDocument();
    
    const poorAnalysis = { ...mockAnalysis, score: 45 };
    rerender(<ATSScoreCard analysis={poorAnalysis} />);
    
    expect(screen.getByText('Needs Improvement')).toBeInTheDocument();
  });
});