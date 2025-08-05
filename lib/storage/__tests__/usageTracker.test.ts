import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UsageTracker } from '../usageTracker';
import { ResumeData } from '@/types/resume';
import { ATSAnalysis, JobDescription } from '@/types/analysis';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock data
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

const mockJobDescription: JobDescription = {
  content: 'Software Engineer position',
  extractedKeywords: ['JavaScript', 'React', 'Node.js'],
  requiredSkills: ['JavaScript', 'React'],
  experienceLevel: 'Mid-level',
  jobTitle: 'Software Engineer',
};

describe('UsageTracker', () => {
  let usageTracker: UsageTracker;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Reset localStorage mock
    localStorageMock.getItem.mockReturnValue(null);
    
    // Get fresh instance
    usageTracker = UsageTracker.getInstance();
    
    // Mock Date to ensure consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getCurrentUsage', () => {
    it('should return default usage for new user', () => {
      const usage = usageTracker.getCurrentUsage();
      
      expect(usage.dailyCount).toBe(0);
      expect(usage.totalAnalyses).toBe(0);
      expect(usage.isPremium).toBe(false);
      expect(usage.lastReset.toDateString()).toBe(new Date().toDateString());
    });

    it('should reset daily count for new day', () => {
      // Mock existing usage from yesterday
      const yesterday = new Date('2024-01-14T10:00:00Z').toDateString();
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        count: 3,
        lastReset: yesterday,
        analyses: ['analysis1', 'analysis2', 'analysis3'],
      }));

      const usage = usageTracker.getCurrentUsage();
      
      expect(usage.dailyCount).toBe(0);
      expect(usage.lastReset.toDateString()).toBe(new Date().toDateString());
      expect(usage.totalAnalyses).toBe(3);
    });

    it('should maintain count for same day', () => {
      // Mock existing usage from today
      const today = new Date().toDateString();
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        count: 2,
        lastReset: today,
        analyses: ['analysis1', 'analysis2'],
      }));

      const usage = usageTracker.getCurrentUsage();
      
      expect(usage.dailyCount).toBe(2);
      expect(usage.totalAnalyses).toBe(2);
    });
  });

  describe('canAnalyze', () => {
    it('should return true when under daily limit', () => {
      const today = new Date().toDateString();
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        count: 3,
        lastReset: today,
        analyses: ['analysis1', 'analysis2', 'analysis3'],
      }));

      expect(usageTracker.canAnalyze()).toBe(true);
    });

    it('should return false when at daily limit', () => {
      const today = new Date().toDateString();
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        count: 5,
        lastReset: today,
        analyses: ['analysis1', 'analysis2', 'analysis3', 'analysis4', 'analysis5'],
      }));

      expect(usageTracker.canAnalyze()).toBe(false);
    });

    it('should return true after daily reset', () => {
      const yesterday = new Date('2024-01-14T10:00:00Z').toDateString();
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        count: 5,
        lastReset: yesterday,
        analyses: ['analysis1', 'analysis2', 'analysis3', 'analysis4', 'analysis5'],
      }));

      expect(usageTracker.canAnalyze()).toBe(true);
    });
  });

  describe('getRemainingAnalyses', () => {
    it('should return correct remaining count', () => {
      const today = new Date().toDateString();
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        count: 2,
        lastReset: today,
        analyses: ['analysis1', 'analysis2'],
      }));

      expect(usageTracker.getRemainingAnalyses()).toBe(3);
    });

    it('should return 0 when at limit', () => {
      const today = new Date().toDateString();
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        count: 5,
        lastReset: today,
        analyses: ['analysis1', 'analysis2', 'analysis3', 'analysis4', 'analysis5'],
      }));

      expect(usageTracker.getRemainingAnalyses()).toBe(0);
    });
  });

  describe('recordAnalysis', () => {
    it('should record analysis successfully when under limit', () => {
      const today = new Date().toDateString();
      localStorageMock.getItem
        .mockReturnValueOnce(JSON.stringify({
          count: 2,
          lastReset: today,
          analyses: ['analysis1', 'analysis2'],
        }))
        .mockReturnValueOnce('{}'); // For analyses storage

      const analysisId = usageTracker.recordAnalysis(
        mockResumeData,
        mockAnalysis,
        mockJobDescription
      );

      expect(analysisId).toMatch(/^analysis_\d+_[a-z0-9]+$/);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should throw error when at daily limit', () => {
      const today = new Date().toDateString();
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        count: 5,
        lastReset: today,
        analyses: ['analysis1', 'analysis2', 'analysis3', 'analysis4', 'analysis5'],
      }));

      expect(() => {
        usageTracker.recordAnalysis(mockResumeData, mockAnalysis);
      }).toThrow('Daily analysis limit exceeded');
    });

    it('should record analysis without job description', () => {
      const today = new Date().toDateString();
      localStorageMock.getItem
        .mockReturnValueOnce(JSON.stringify({
          count: 1,
          lastReset: today,
          analyses: ['analysis1'],
        }))
        .mockReturnValueOnce('{}');

      const analysisId = usageTracker.recordAnalysis(mockResumeData, mockAnalysis);

      expect(analysisId).toMatch(/^analysis_\d+_[a-z0-9]+$/);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('getAllAnalyses', () => {
    it('should return all analyses sorted by timestamp', () => {
      const mockAnalyses = {
        analysis1: {
          id: 'analysis1',
          resumeData: mockResumeData,
          analysis: mockAnalysis,
          timestamp: '2024-01-15T09:00:00Z',
        },
        analysis2: {
          id: 'analysis2',
          resumeData: mockResumeData,
          analysis: mockAnalysis,
          timestamp: '2024-01-15T10:00:00Z',
        },
      };

      localStorageMock.getItem
        .mockReturnValueOnce(JSON.stringify({
          count: 2,
          lastReset: new Date().toDateString(),
          analyses: ['analysis1', 'analysis2'],
        }))
        .mockReturnValueOnce(JSON.stringify(mockAnalyses));

      const analyses = usageTracker.getAllAnalyses();

      expect(analyses).toHaveLength(2);
      expect(analyses[0].id).toBe('analysis2'); // Most recent first
      expect(analyses[1].id).toBe('analysis1');
    });

    it('should return empty array when no analyses', () => {
      localStorageMock.getItem
        .mockReturnValueOnce(JSON.stringify({
          count: 0,
          lastReset: new Date().toDateString(),
          analyses: [],
        }))
        .mockReturnValueOnce('{}');

      const analyses = usageTracker.getAllAnalyses();

      expect(analyses).toHaveLength(0);
    });
  });

  describe('getUsageStats', () => {
    it('should return correct usage statistics', () => {
      const today = new Date().toDateString();
      const mockAnalyses = {
        analysis1: {
          id: 'analysis1',
          resumeData: mockResumeData,
          analysis: { ...mockAnalysis, score: 80 },
          timestamp: '2024-01-15T09:00:00Z',
        },
        analysis2: {
          id: 'analysis2',
          resumeData: mockResumeData,
          analysis: { ...mockAnalysis, score: 90 },
          timestamp: '2024-01-15T10:00:00Z',
        },
      };

      // Mock the calls in the order they happen
      localStorageMock.getItem
        .mockReturnValueOnce(JSON.stringify({
          count: 2,
          lastReset: today,
          analyses: ['analysis1', 'analysis2'],
        }))
        .mockReturnValueOnce(JSON.stringify({
          count: 2,
          lastReset: today,
          analyses: ['analysis1', 'analysis2'],
        }))
        .mockReturnValueOnce(JSON.stringify(mockAnalyses));

      const stats = usageTracker.getUsageStats();

      expect(stats).toHaveProperty('totalAnalyses');
      expect(stats).toHaveProperty('todayAnalyses');
      expect(stats).toHaveProperty('remainingToday');
      expect(stats).toHaveProperty('averageScore');
      expect(stats).toHaveProperty('lastAnalysisDate');
    });

    it('should handle empty analyses correctly', () => {
      const today = new Date().toDateString();
      localStorageMock.getItem
        .mockReturnValueOnce(JSON.stringify({
          count: 0,
          lastReset: today,
          analyses: [],
        }))
        .mockReturnValueOnce('{}');

      const stats = usageTracker.getUsageStats();

      expect(stats).toEqual({
        totalAnalyses: 0,
        todayAnalyses: 0,
        remainingToday: 5,
        averageScore: 0,
        lastAnalysisDate: null,
      });
    });
  });

  describe('deleteAnalysis', () => {
    it('should delete analysis successfully', () => {
      const mockAnalyses = {
        analysis1: {
          id: 'analysis1',
          resumeData: mockResumeData,
          analysis: mockAnalysis,
          timestamp: '2024-01-15T09:00:00Z',
        },
        analysis2: {
          id: 'analysis2',
          resumeData: mockResumeData,
          analysis: mockAnalysis,
          timestamp: '2024-01-15T10:00:00Z',
        },
      };

      localStorageMock.getItem
        .mockReturnValueOnce(JSON.stringify({
          count: 2,
          lastReset: new Date().toDateString(),
          analyses: ['analysis1', 'analysis2'],
        }))
        .mockReturnValueOnce(JSON.stringify(mockAnalyses));

      const result = usageTracker.deleteAnalysis('analysis1');

      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2);
    });

    it('should return false for non-existent analysis', () => {
      localStorageMock.getItem
        .mockReturnValueOnce(JSON.stringify({
          count: 0,
          lastReset: new Date().toDateString(),
          analyses: [],
        }))
        .mockReturnValueOnce('{}');

      const result = usageTracker.deleteAnalysis('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('clearAllData', () => {
    it('should clear all localStorage data', () => {
      usageTracker.clearAllData();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('ats_usage_tracker');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('ats_analyses');
    });
  });
});