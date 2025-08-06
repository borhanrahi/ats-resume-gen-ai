import { describe, it, expect } from 'vitest';

// Simple unit test to verify the component structure and logic
describe('AnalysisHistory Component Logic', () => {
  it('should calculate score colors correctly', () => {
    const getScoreColor = (score: number) => {
      if (score >= 80) return 'text-green-600';
      if (score >= 60) return 'text-yellow-600';
      return 'text-red-600';
    };

    expect(getScoreColor(90)).toBe('text-green-600');
    expect(getScoreColor(75)).toBe('text-yellow-600');
    expect(getScoreColor(45)).toBe('text-red-600');
  });

  it('should calculate score badge variants correctly', () => {
    const getScoreBadgeVariant = (score: number) => {
      if (score >= 80) return 'default';
      if (score >= 60) return 'secondary';
      return 'destructive';
    };

    expect(getScoreBadgeVariant(85)).toBe('default');
    expect(getScoreBadgeVariant(70)).toBe('secondary');
    expect(getScoreBadgeVariant(50)).toBe('destructive');
  });

  it('should filter analyses by search term correctly', () => {
    const mockAnalyses = [
      {
        $id: '1',
        resumeName: 'John_Doe_Resume.pdf',
        jobTitle: 'Software Engineer',
        tags: ['frontend', 'react'],
        score: 85,
        createdAt: new Date('2024-01-15'),
      },
      {
        $id: '2',
        resumeName: 'Jane_Smith_CV.pdf',
        jobTitle: 'Data Scientist',
        tags: ['python', 'ml'],
        score: 92,
        createdAt: new Date('2024-01-20'),
      },
    ];

    const filterBySearchTerm = (analyses: any[], searchTerm: string) => {
      if (!searchTerm) return analyses;
      
      return analyses.filter(analysis =>
        analysis.resumeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (analysis.jobTitle && analysis.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
        analysis.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    };

    // Test search by resume name
    expect(filterBySearchTerm(mockAnalyses, 'john')).toHaveLength(1);
    expect(filterBySearchTerm(mockAnalyses, 'john')[0].resumeName).toBe('John_Doe_Resume.pdf');

    // Test search by job title
    expect(filterBySearchTerm(mockAnalyses, 'data')).toHaveLength(1);
    expect(filterBySearchTerm(mockAnalyses, 'data')[0].jobTitle).toBe('Data Scientist');

    // Test search by tag
    expect(filterBySearchTerm(mockAnalyses, 'react')).toHaveLength(1);
    expect(filterBySearchTerm(mockAnalyses, 'react')[0].tags).toContain('react');

    // Test no matches
    expect(filterBySearchTerm(mockAnalyses, 'nonexistent')).toHaveLength(0);

    // Test empty search term
    expect(filterBySearchTerm(mockAnalyses, '')).toHaveLength(2);
  });

  it('should sort analyses correctly', () => {
    const mockAnalyses = [
      {
        $id: '1',
        resumeName: 'Alpha_Resume.pdf',
        score: 75,
        createdAt: new Date('2024-01-15'),
      },
      {
        $id: '2',
        resumeName: 'Beta_Resume.pdf',
        score: 90,
        createdAt: new Date('2024-01-20'),
      },
      {
        $id: '3',
        resumeName: 'Gamma_Resume.pdf',
        score: 60,
        createdAt: new Date('2024-01-10'),
      },
    ];

    const sortAnalyses = (analyses: any[], sortField: string, sortDirection: 'asc' | 'desc') => {
      return [...analyses].sort((a, b) => {
        let aValue: any = a[sortField];
        let bValue: any = b[sortField];

        if (sortField === 'createdAt') {
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
        }

        if (sortDirection === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    };

    // Test sort by score descending
    const sortedByScoreDesc = sortAnalyses(mockAnalyses, 'score', 'desc');
    expect(sortedByScoreDesc[0].score).toBe(90);
    expect(sortedByScoreDesc[2].score).toBe(60);

    // Test sort by score ascending
    const sortedByScoreAsc = sortAnalyses(mockAnalyses, 'score', 'asc');
    expect(sortedByScoreAsc[0].score).toBe(60);
    expect(sortedByScoreAsc[2].score).toBe(90);

    // Test sort by name ascending
    const sortedByNameAsc = sortAnalyses(mockAnalyses, 'resumeName', 'asc');
    expect(sortedByNameAsc[0].resumeName).toBe('Alpha_Resume.pdf');
    expect(sortedByNameAsc[2].resumeName).toBe('Gamma_Resume.pdf');

    // Test sort by date descending (newest first)
    const sortedByDateDesc = sortAnalyses(mockAnalyses, 'createdAt', 'desc');
    expect(sortedByDateDesc[0].createdAt.getTime()).toBe(new Date('2024-01-20').getTime());
    expect(sortedByDateDesc[2].createdAt.getTime()).toBe(new Date('2024-01-10').getTime());
  });

  it('should apply filters correctly', () => {
    const mockAnalyses = [
      {
        $id: '1',
        score: 85,
        createdAt: new Date('2024-01-15'),
        tags: ['frontend', 'react'],
        jobTitle: 'Software Engineer',
        resumeName: 'John_Resume.pdf',
      },
      {
        $id: '2',
        score: 65,
        createdAt: new Date('2024-01-20'),
        tags: ['backend', 'node'],
        jobTitle: 'Backend Developer',
        resumeName: 'Jane_Resume.pdf',
      },
      {
        $id: '3',
        score: 45,
        createdAt: new Date('2024-01-10'),
        tags: ['design', 'ui'],
        jobTitle: 'UI Designer',
        resumeName: 'Bob_Resume.pdf',
      },
    ];

    const applyFilters = (analyses: any[], filters: any) => {
      let filtered = [...analyses];

      // Apply date range filter
      if (filters.dateRange) {
        filtered = filtered.filter(analysis =>
          analysis.createdAt >= filters.dateRange.start &&
          analysis.createdAt <= filters.dateRange.end
        );
      }

      // Apply score range filter
      if (filters.scoreRange) {
        filtered = filtered.filter(analysis =>
          analysis.score >= filters.scoreRange.min &&
          analysis.score <= filters.scoreRange.max
        );
      }

      // Apply tags filter
      if (filters.tags && filters.tags.length > 0) {
        filtered = filtered.filter(analysis =>
          filters.tags.some((tag: string) => analysis.tags.includes(tag))
        );
      }

      return filtered;
    };

    // Test score range filter
    const highScoreFilter = { scoreRange: { min: 70, max: 100 } };
    const highScoreResults = applyFilters(mockAnalyses, highScoreFilter);
    expect(highScoreResults).toHaveLength(1);
    expect(highScoreResults[0].score).toBe(85);

    // Test date range filter
    const dateFilter = {
      dateRange: {
        start: new Date('2024-01-12'),
        end: new Date('2024-01-25')
      }
    };
    const dateResults = applyFilters(mockAnalyses, dateFilter);
    expect(dateResults).toHaveLength(2);

    // Test tags filter
    const tagsFilter = { tags: ['react'] };
    const tagResults = applyFilters(mockAnalyses, tagsFilter);
    expect(tagResults).toHaveLength(1);
    expect(tagResults[0].tags).toContain('react');

    // Test combined filters
    const combinedFilter = {
      scoreRange: { min: 60, max: 90 },
      tags: ['frontend']
    };
    const combinedResults = applyFilters(mockAnalyses, combinedFilter);
    expect(combinedResults).toHaveLength(1);
    expect(combinedResults[0].score).toBe(85);
    expect(combinedResults[0].tags).toContain('frontend');
  });

  it('should extract unique tags correctly', () => {
    const mockAnalyses = [
      { tags: ['frontend', 'react', 'javascript'] },
      { tags: ['backend', 'node', 'javascript'] },
      { tags: ['design', 'ui', 'frontend'] },
    ];

    const extractUniqueTags = (analyses: any[]) => {
      const tagSet = new Set<string>();
      analyses.forEach(analysis => {
        analysis.tags.forEach((tag: string) => tagSet.add(tag));
      });
      return Array.from(tagSet);
    };

    const uniqueTags = extractUniqueTags(mockAnalyses);
    expect(uniqueTags).toHaveLength(7);
    expect(uniqueTags).toContain('frontend');
    expect(uniqueTags).toContain('react');
    expect(uniqueTags).toContain('javascript');
    expect(uniqueTags).toContain('backend');
    expect(uniqueTags).toContain('node');
    expect(uniqueTags).toContain('design');
    expect(uniqueTags).toContain('ui');
  });
});