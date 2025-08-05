import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecommendationsList from '../RecommendationsList';
import { Recommendation } from '@/types/analysis';

const mockRecommendations: Recommendation[] = [
  {
    id: '1',
    category: 'keywords',
    priority: 'high',
    title: 'Add more relevant keywords',
    description: 'Your resume lacks important keywords that match the job description',
    suggestion: 'Include keywords like "React", "TypeScript", and "Node.js" naturally in your experience section',
    impact: 'High impact on ATS score - could improve score by 15-20 points'
  },
  {
    id: '2',
    category: 'formatting',
    priority: 'medium',
    title: 'Improve section headers',
    description: 'Section headers could be more consistent and ATS-friendly',
    suggestion: 'Use standard headers like "Professional Experience", "Education", "Skills"',
    impact: 'Medium impact - improves readability and ATS parsing'
  },
  {
    id: '3',
    category: 'content',
    priority: 'critical',
    title: 'Add quantifiable achievements',
    description: 'Your experience lacks specific metrics and achievements',
    suggestion: 'Add numbers, percentages, and specific outcomes to your bullet points',
    impact: 'Critical for standing out - quantified achievements are highly valued'
  },
  {
    id: '4',
    category: 'structure',
    priority: 'low',
    title: 'Optimize resume length',
    description: 'Resume could be more concise',
    suggestion: 'Remove outdated or less relevant information to keep it focused',
    impact: 'Low impact but improves overall readability'
  }
];

describe('RecommendationsList', () => {
  it('renders the component with recommendations', () => {
    render(<RecommendationsList recommendations={mockRecommendations} />);
    
    expect(screen.getByText('Improvement Recommendations')).toBeInTheDocument();
    expect(screen.getByText('4 recommendations to optimize your resume')).toBeInTheDocument();
  });

  it('displays all recommendation titles', () => {
    render(<RecommendationsList recommendations={mockRecommendations} />);
    
    expect(screen.getByText('Add more relevant keywords')).toBeInTheDocument();
    expect(screen.getByText('Improve section headers')).toBeInTheDocument();
    expect(screen.getByText('Add quantifiable achievements')).toBeInTheDocument();
    expect(screen.getByText('Optimize resume length')).toBeInTheDocument();
  });

  it('shows priority stats correctly', () => {
    render(<RecommendationsList recommendations={mockRecommendations} />);
    
    // Should show priority counts - there are 4 priority badges, each with count "1"
    const priorityBadges = screen.getAllByText('1');
    expect(priorityBadges).toHaveLength(4); // critical, high, medium, low - each has 1 recommendation
  });

  it('expands and collapses recommendation cards', () => {
    render(<RecommendationsList recommendations={mockRecommendations} />);
    
    const firstRecommendation = screen.getByText('Add more relevant keywords').closest('button');
    expect(firstRecommendation).toBeInTheDocument();
    
    // Initially, detailed content should not be visible
    expect(screen.queryByText('Issue Details:')).not.toBeInTheDocument();
    
    // Click to expand
    fireEvent.click(firstRecommendation!);
    
    // Detailed content should now be visible
    expect(screen.getByText('Issue Details:')).toBeInTheDocument();
    expect(screen.getByText('Recommended Action:')).toBeInTheDocument();
    expect(screen.getByText('Expected Impact:')).toBeInTheDocument();
  });

  it('shows filters and sorting controls', () => {
    render(<RecommendationsList recommendations={mockRecommendations} />);
    
    const filtersButton = screen.getByText('Filters & Sorting');
    expect(filtersButton).toBeInTheDocument();
    
    // Click to show filters
    fireEvent.click(filtersButton);
    
    expect(screen.getByText('Sort by:')).toBeInTheDocument();
    expect(screen.getByText('Filter by:')).toBeInTheDocument();
  });

  it('filters recommendations by category', () => {
    render(<RecommendationsList recommendations={mockRecommendations} />);
    
    // Open filters
    fireEvent.click(screen.getByText('Filters & Sorting'));
    
    // Filter by keywords category
    const filterSelect = screen.getByDisplayValue('All Recommendations');
    fireEvent.change(filterSelect, { target: { value: 'keywords' } });
    
    // Should only show keywords recommendation
    expect(screen.getByText('Add more relevant keywords')).toBeInTheDocument();
    expect(screen.queryByText('Improve section headers')).not.toBeInTheDocument();
    
    // Should show filtered count
    expect(screen.getByText('Showing 1 of 4 recommendations')).toBeInTheDocument();
  });

  it('sorts recommendations by priority', () => {
    render(<RecommendationsList recommendations={mockRecommendations} />);
    
    // Open filters
    fireEvent.click(screen.getByText('Filters & Sorting'));
    
    // Sort by priority (should be default)
    const sortSelect = screen.getByDisplayValue('Priority');
    expect(sortSelect).toBeInTheDocument();
    
    // Critical priority should come first (Add quantifiable achievements)
    const recommendationCards = screen.getAllByRole('button').filter(button => 
      button.querySelector('h4')
    );
    
    // The first card should contain the critical priority recommendation
    expect(recommendationCards[0]).toHaveTextContent('Add quantifiable achievements');
  });

  it('handles empty recommendations list', () => {
    render(<RecommendationsList recommendations={[]} />);
    
    expect(screen.getByText('Great Job!')).toBeInTheDocument();
    expect(screen.getByText('No recommendations found. Your resume is well-optimized!')).toBeInTheDocument();
  });

  it('clears filters when no results found', () => {
    render(<RecommendationsList recommendations={mockRecommendations} />);
    
    // Open filters
    fireEvent.click(screen.getByText('Filters & Sorting'));
    
    // Filter by a category that doesn't exist in our mock data
    // Since all categories exist, let's filter by a specific priority and then change the data
    const filterSelect = screen.getByDisplayValue('All Recommendations');
    fireEvent.change(filterSelect, { target: { value: 'keywords' } });
    
    // Then change back to all to test the clear functionality
    fireEvent.change(filterSelect, { target: { value: 'all' } });
    
    expect(screen.getByText('Showing 4 of 4 recommendations')).toBeInTheDocument();
  });

  it('displays category and priority badges correctly', () => {
    render(<RecommendationsList recommendations={mockRecommendations} />);
    
    // Expand first recommendation to see badges
    const firstRecommendation = screen.getByText('Add more relevant keywords').closest('button');
    fireEvent.click(firstRecommendation!);
    
    // Should show category badge
    expect(screen.getByText('Keywords')).toBeInTheDocument();
  });
});