import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUsageLimit } from '../useUsageLimit';
import { usageTracker } from '@/lib/storage/usageTracker';
import { ResumeData } from '@/types/resume';
import { ATSAnalysis } from '@/types/analysis';

// Mock the usage tracker
vi.mock('@/lib/storage/usageTracker', () => ({
  usageTracker: {
    getCurrentUsage: vi.fn(),
    canAnalyze: vi.fn(),
    recordAnalysis: vi.fn(),
    getUsageStats: vi.fn(),
  },
}));

const mockUsageTracker = usageTracker as any;

// Mock data
const mockUsage = {
  dailyCount: 2,
  lastReset: new Date(),
  totalAnalyses: 10,
  isPremium: false,
};

const mockResumeData: ResumeData = {
  id: 'test-resume-1',
  content: 'Test resume content',
  metadata: {
    fileName: 'test-resume.pdf',
    fileType: 'pdf',
    uploadDate: new Date(),
    wordCount: 100,
  },
  sections: {
    contact: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
      location: 'New York, NY',
    },
    summary: 'Test summary',
    experience: [],
    education: [],
    skills: ['JavaScript', 'React'],
    certifications: [],
  },
};

const mockAnalysis: ATSAnalysis = {
  score: 85,
  breakdown: {
    formatting: 90,
    keywords: 80,
    structure: 85,
    length: 85,
  },
  recommendations: [],
  keywordMatch: {
    found: ['JavaScript', 'React'],
    missing: ['Node.js'],
    matchPercentage: 75,
    density: 2.5,
    suggestions: ['Add Node.js experience'],
  },
  grammarIssues: [],
  modelUsed: 'test-model',
  fallbacksUsed: [],
};

const mockStats = {
  totalAnalyses: 10,
  todayAnalyses: 2,
  remainingToday: 3,
  averageScore: 85,
  lastAnalysisDate: new Date(),
};

describe('useUsageLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    mockUsageTracker.getCurrentUsage.mockReturnValue(mockUsage);
    mockUsageTracker.canAnalyze.mockReturnValue(true);
    mockUsageTracker.recordAnalysis.mockReturnValue('analysis-123');
    mockUsageTracker.getUsageStats.mockReturnValue(mockStats);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should load usage data on mount', async () => {
      const { result } = renderHook(() => useUsageLimit());

      // Wait for the effect to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockUsageTracker.getCurrentUsage).toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.usage).toEqual(mockUsage);
    });

    it('should handle loading errors gracefully', async () => {
      mockUsageTracker.getCurrentUsage.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => useUsageLimit());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Failed to load usage data');
      expect(result.current.usage).toBeNull();
    });
  });

  describe('usage calculations', () => {
    it('should calculate canAnalyze correctly', async () => {
      const { result } = renderHook(() => useUsageLimit());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.canAnalyze).toBe(true);
      expect(result.current.remaining).toBe(3); // 5 - 2
    });

    it('should handle limit reached state', async () => {
      mockUsageTracker.getCurrentUsage.mockReturnValue({
        ...mockUsage,
        dailyCount: 5,
      });

      const { result } = renderHook(() => useUsageLimit());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.canAnalyze).toBe(false);
      expect(result.current.remaining).toBe(0);
    });

    it('should handle null usage state', () => {
      mockUsageTracker.getCurrentUsage.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => useUsageLimit());

      expect(result.current.canAnalyze).toBe(false);
      expect(result.current.remaining).toBe(0);
    });
  });

  describe('recordAnalysis', () => {
    it('should record analysis successfully', async () => {
      const { result } = renderHook(() => useUsageLimit());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      let analysisId: string;
      await act(async () => {
        analysisId = await result.current.recordAnalysis(
          mockResumeData,
          mockAnalysis
        );
      });

      expect(mockUsageTracker.recordAnalysis).toHaveBeenCalledWith(
        mockResumeData,
        mockAnalysis,
        undefined
      );
      expect(analysisId!).toBe('analysis-123');
      expect(mockUsageTracker.getCurrentUsage).toHaveBeenCalledTimes(2); // Initial load + refresh
    });

    it('should handle recording errors', async () => {
      mockUsageTracker.recordAnalysis.mockImplementation(() => {
        throw new Error('Limit exceeded');
      });

      const { result } = renderHook(() => useUsageLimit());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        try {
          await result.current.recordAnalysis(mockResumeData, mockAnalysis);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Limit exceeded');
        }
      });

      expect(result.current.error).toBe('Limit exceeded');
    });

    it('should record analysis with job description', async () => {
      const mockJobDescription = {
        content: 'Software Engineer position',
        extractedKeywords: ['JavaScript', 'React'],
        requiredSkills: ['JavaScript'],
        experienceLevel: 'Mid-level',
        jobTitle: 'Software Engineer',
      };

      const { result } = renderHook(() => useUsageLimit());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.recordAnalysis(
          mockResumeData,
          mockAnalysis,
          mockJobDescription
        );
      });

      expect(mockUsageTracker.recordAnalysis).toHaveBeenCalledWith(
        mockResumeData,
        mockAnalysis,
        mockJobDescription
      );
    });
  });

  describe('utility functions', () => {
    it('should refresh usage data', async () => {
      const { result } = renderHook(() => useUsageLimit());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Clear the initial call
      mockUsageTracker.getCurrentUsage.mockClear();

      act(() => {
        result.current.refreshUsage();
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockUsageTracker.getCurrentUsage).toHaveBeenCalled();
    });

    it('should check limit without recording', async () => {
      const { result } = renderHook(() => useUsageLimit());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const canAnalyze = result.current.checkLimit();

      expect(mockUsageTracker.canAnalyze).toHaveBeenCalled();
      expect(canAnalyze).toBe(true);
    });

    it('should get usage statistics', async () => {
      const { result } = renderHook(() => useUsageLimit());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const stats = result.current.getUsageStats();

      expect(mockUsageTracker.getUsageStats).toHaveBeenCalled();
      expect(stats).toEqual(mockStats);
    });
  });

  describe('error handling', () => {
    it('should clear error on successful operation', async () => {
      // First, cause an error
      mockUsageTracker.getCurrentUsage.mockImplementationOnce(() => {
        throw new Error('Initial error');
      });

      const { result } = renderHook(() => useUsageLimit());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.error).toBe('Failed to load usage data');

      // Then, fix the error and refresh
      mockUsageTracker.getCurrentUsage.mockReturnValue(mockUsage);

      act(() => {
        result.current.refreshUsage();
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.error).toBeNull();
      expect(result.current.usage).toEqual(mockUsage);
    });

    it('should handle recordAnalysis limit check failure', async () => {
      mockUsageTracker.canAnalyze.mockReturnValue(false);

      const { result } = renderHook(() => useUsageLimit());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        try {
          await result.current.recordAnalysis(mockResumeData, mockAnalysis);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Daily analysis limit exceeded');
        }
      });

      expect(result.current.error).toBe('Daily analysis limit exceeded');
    });
  });
});