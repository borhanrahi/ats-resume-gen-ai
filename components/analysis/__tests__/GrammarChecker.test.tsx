import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import GrammarChecker from '../GrammarChecker';
import { GrammarIssue } from '@/types/analysis';

const mockIssues: GrammarIssue[] = [
  {
    id: '1',
    type: 'grammar',
    text: 'I has experience',
    suggestion: 'I have experience',
    position: { start: 0, end: 16 },
    severity: 'high'
  },
  {
    id: '2',
    type: 'spelling',
    text: 'managment',
    suggestion: 'management',
    position: { start: 20, end: 29 },
    severity: 'medium'
  },
  {
    id: '3',
    type: 'tone',
    text: 'I think I can do this job',
    suggestion: 'I am qualified for this position',
    position: { start: 35, end: 60 },
    severity: 'low'
  },
  {
    id: '4',
    type: 'clarity',
    text: 'stuff',
    suggestion: 'responsibilities',
    position: { start: 65, end: 70 },
    severity: 'medium'
  }
];

const mockOriginalText = 'I has experience in managment and I think I can do this job with stuff.';

describe('GrammarChecker', () => {
  it('renders the component with issues', () => {
    render(
      <GrammarChecker 
        issues={mockIssues} 
        originalText={mockOriginalText} 
      />
    );
    
    expect(screen.getByText('Grammar & Style Analysis')).toBeInTheDocument();
    expect(screen.getByText('4 issues found in your resume')).toBeInTheDocument();
  });

  it('displays severity stats correctly', () => {
    render(
      <GrammarChecker 
        issues={mockIssues} 
        originalText={mockOriginalText} 
      />
    );
    
    // Should show severity counts: 1 high, 2 medium, 1 low
    const severityBadges = screen.getAllByText('1');
    expect(severityBadges.length).toBeGreaterThanOrEqual(2); // high and low each have 1
    
    const mediumBadges = screen.getAllByText('2');
    expect(mediumBadges.length).toBeGreaterThanOrEqual(1); // medium has 2
  });

  it('shows highlighted text preview', () => {
    render(
      <GrammarChecker 
        issues={mockIssues} 
        originalText={mockOriginalText} 
      />
    );
    
    expect(screen.getByText('Resume Text Preview')).toBeInTheDocument();
    expect(screen.getByText('Click on highlighted text to view issue details')).toBeInTheDocument();
  });

  it('toggles text highlights', () => {
    render(
      <GrammarChecker 
        issues={mockIssues} 
        originalText={mockOriginalText} 
      />
    );
    
    const toggleButton = screen.getByText('Hide Issues');
    expect(toggleButton).toBeInTheDocument();
    
    fireEvent.click(toggleButton);
    
    expect(screen.getByText('Show Issues')).toBeInTheDocument();
  });

  it('expands and collapses issue cards', () => {
    render(
      <GrammarChecker 
        issues={mockIssues} 
        originalText={mockOriginalText} 
      />
    );
    
    const grammarIssue = screen.getByText(/grammar issue/i).closest('button');
    expect(grammarIssue).toBeInTheDocument();
    
    // Initially, detailed content should not be visible
    expect(screen.queryByText('Original Text:')).not.toBeInTheDocument();
    
    // Click to expand
    fireEvent.click(grammarIssue!);
    
    // Detailed content should now be visible
    expect(screen.getByText('Original Text:')).toBeInTheDocument();
    expect(screen.getByText('Suggested Fix:')).toBeInTheDocument();
  });

  it('shows filters and allows filtering', () => {
    render(
      <GrammarChecker 
        issues={mockIssues} 
        originalText={mockOriginalText} 
      />
    );
    
    const filtersButton = screen.getByText('Filters');
    expect(filtersButton).toBeInTheDocument();
    
    // Click to show filters
    fireEvent.click(filtersButton);
    
    expect(screen.getByText('Filter by Type:')).toBeInTheDocument();
    expect(screen.getByText('Filter by Severity:')).toBeInTheDocument();
  });

  it('filters issues by type', () => {
    render(
      <GrammarChecker 
        issues={mockIssues} 
        originalText={mockOriginalText} 
      />
    );
    
    // Open filters
    fireEvent.click(screen.getByText('Filters'));
    
    // Filter by grammar type
    const filterSelect = screen.getByDisplayValue('All Issues');
    fireEvent.change(filterSelect, { target: { value: 'grammar' } });
    
    // Should show filtered count
    expect(screen.getByText('Showing 1 of 4 issues')).toBeInTheDocument();
  });

  it('handles premium features for non-premium users', () => {
    render(
      <GrammarChecker 
        issues={mockIssues} 
        originalText={mockOriginalText} 
        isPremium={false}
      />
    );
    
    // Expand first issue
    const firstIssue = screen.getByText(/grammar issue/i).closest('button');
    fireEvent.click(firstIssue!);
    
    // Should show premium feature message
    expect(screen.getByText('Premium feature')).toBeInTheDocument();
    
    // Should show upgrade prompt
    expect(screen.getByText('Upgrade to Premium')).toBeInTheDocument();
    expect(screen.getByText('Upgrade Now')).toBeInTheDocument();
  });

  it('handles premium features for premium users', () => {
    const mockOnFix = vi.fn();
    
    render(
      <GrammarChecker 
        issues={mockIssues} 
        originalText={mockOriginalText} 
        isPremium={true}
        onFixIssue={mockOnFix}
      />
    );
    
    // Expand first issue
    const firstIssue = screen.getByText(/grammar issue/i).closest('button');
    fireEvent.click(firstIssue!);
    
    // Should show apply fix button
    const applyFixButton = screen.getByText('Apply Fix');
    expect(applyFixButton).toBeInTheDocument();
    
    // Click apply fix
    fireEvent.click(applyFixButton);
    
    // Should call the fix handler
    expect(mockOnFix).toHaveBeenCalledWith('1', 'I have experience');
  });

  it('handles empty issues list', () => {
    render(
      <GrammarChecker 
        issues={[]} 
        originalText={mockOriginalText} 
      />
    );
    
    expect(screen.getByText('Excellent Writing!')).toBeInTheDocument();
    expect(screen.getByText('No grammar or style issues detected in your resume.')).toBeInTheDocument();
  });

  it('clears filters when no results found', () => {
    render(
      <GrammarChecker 
        issues={mockIssues} 
        originalText={mockOriginalText} 
      />
    );
    
    // Open filters
    fireEvent.click(screen.getByText('Filters'));
    
    // Filter by grammar type first
    const filterSelect = screen.getByDisplayValue('All Issues');
    fireEvent.change(filterSelect, { target: { value: 'grammar' } });
    
    // Then change back to all
    fireEvent.change(filterSelect, { target: { value: 'all' } });
    
    expect(screen.getByText('Showing 4 of 4 issues')).toBeInTheDocument();
  });

  it('displays issue type badges correctly', () => {
    render(
      <GrammarChecker 
        issues={mockIssues} 
        originalText={mockOriginalText} 
      />
    );
    
    // Expand first issue to see type badge
    const firstIssue = screen.getByText(/grammar issue/i).closest('button');
    fireEvent.click(firstIssue!);
    
    // Should show grammar type badge
    expect(screen.getByText('Grammar')).toBeInTheDocument();
  });

  it('shows original and suggested text correctly', () => {
    render(
      <GrammarChecker 
        issues={mockIssues} 
        originalText={mockOriginalText} 
      />
    );
    
    // Expand first issue
    const firstIssue = screen.getByText(/grammar issue/i).closest('button');
    fireEvent.click(firstIssue!);
    
    // Should show original and suggested text sections
    expect(screen.getByText('Original Text:')).toBeInTheDocument();
    expect(screen.getByText('Suggested Fix:')).toBeInTheDocument();
    
    // Should show the text content (there are multiple instances, so use getAllByText)
    const originalTexts = screen.getAllByText('"I has experience"');
    expect(originalTexts.length).toBeGreaterThan(0);
    
    const suggestedTexts = screen.getAllByText('"I have experience"');
    expect(suggestedTexts.length).toBeGreaterThan(0);
  });
});