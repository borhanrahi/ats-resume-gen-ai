import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AnalysisEngine } from '../analysisEngine';
import { OpenRouterClient } from '../openRouterClient';
import { GeminiClient } from '../geminiClient';
import type { ResumeData } from '@/types/resume';
import type { JobDescription, ATSAnalysis } from '@/types/analysis';
import type { AnalysisOptions } from '../analysisEngine';

// Mock the AI clients
vi.mock('../openRouterClient');
vi.mock('../geminiClient');

describe('AnalysisEngine', () => {
  let analysisEngine: AnalysisEngine;
  let mockOpenRouterClient: vi.Mocked<OpenRouterClient>;
  let mockGeminiClient: vi.Mocked<GeminiClient>;

  const mockResumeData: ResumeData = {
    id: 'test-resume-1',
    content: 'John Doe\nSoftware Engineer\nExperienced developer with 5 years in JavaScript, React, and Node.js',
    metadata: {
      fileName: 'resume.pdf',
      fileType: 'pdf',
      uploadDate: new Date(),
      wordCount: 150,
    },
    sections: {
      contact: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-0123',
        location: 'San Francisco, CA',
      },
      summary: 'Experienced software engineer with expertise in full-stack development',
      experience: [{
        id: 'exp-1',
        company: 'Tech Corp',
        position: 'Software Engineer',
        startDate: '2020-01',
        endDate: '2024-01',
        description: 'Developed web applications using React and Node.js',
        achievements: ['Improved performance by 30%', 'Led team of 3 developers'],
      }],
      education: [{
        id: 'edu-1',
        institution: 'University of Technology',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        startDate: '2016-09',
        endDate: '2020-05',
      }],
      skills: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL'],
      certifications: [],
    },
  };

  const mockJobDescription: JobDescription = {
    content: 'We are looking for a Senior Software Engineer with experience in React, Node.js, Python, and AWS',
    extractedKeywords: ['React', 'Node.js', 'Python', 'AWS'],
    requiredSkills: ['React', 'Node.js', 'Python', 'AWS', 'Docker'],
    experienceLevel: 'Senior',
    jobTitle: 'Senior Software Engineer',
  };

  const mockATSAnalysis: ATSAnalysis = {
    score: 85,
    breakdown: {
      formatting: 90,
      keywords: 80,
      structure: 85,
      length: 85,
    },
    recommendations: [{
      id: 'rec-1',
      category: 'keywords',
      priority: 'high',
      title: 'Add missing keywords',
      description: 'Include more relevant keywords',
      suggestion: 'Add AWS and Docker to your skills',
      impact: 'Improve keyword matching by 15%',
    }],
    keywordMatch: {
      found: ['React', 'Node.js', 'Python'],
      missing: ['AWS', 'Docker'],
      matchPercentage: 60,
      density: 2.5,
      suggestions: ['Add AWS experience', 'Include Docker projects'],
    },
    grammarIssues: [],
    modelUsed: 'meta-llama/llama-3.1-8b-instruct:free',
    fallbacksUsed: [],
  };

  beforeEach(() => {
    // Create mock instances
    mockOpenRouterClient = {
      analyzeResume: vi.fn(),
      updateConfig: vi.fn(),
      getStats: vi.fn(() => ({ requestCount: 1, lastRequestTime: Date.now(), model: 'test-model' })),
    } as any;

    mockGeminiClient = {
      analyzeGrammar: vi.fn(),
      analyzeContent: vi.fn(),
      updateConfig: vi.fn(),
      getStats: vi.fn(() => ({ requestCount: 1, recentRequests: 1, model: 'gemini-1.5-flash', rateLimitPerMinute: 15 })),
    } as any;

    // Create analysis engine with mocked clients
    analysisEngine = new AnalysisEngine(mockOpenRouterClient, mockGeminiClient);

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create analysis engine with provided clients', () => {
      expect(analysisEngine).toBeInstanceOf(AnalysisEngine);
    });

    it('should create analysis engine with default clients when none provided', () => {
      const defaultEngine = new AnalysisEngine();
      expect(defaultEngine).toBeInstanceOf(AnalysisEngine);
    });
  });

  const baseAnalysisOptions: AnalysisOptions = {
    resumeData: mockResumeData,
    config: {
      tier: 'free',
      includeGrammarCheck: false,
      includeContentAnalysis: false,
      includeKeywordMatching: false,
    },
  };

  describe('analyze', () => {

    it('should perform basic ATS analysis successfully', async () => {
      mockOpenRouterClient.analyzeResume.mockResolvedValueOnce(mockATSAnalysis);

      const result = await analysisEngine.analyze(baseAnalysisOptions);

      expect(result.score).toBe(85);
      expect(result.breakdown).toEqual(mockATSAnalysis.breakdown);
      expect(result.recommendations.length).toBeGreaterThanOrEqual(1);
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
      expect(result.errors).toHaveLength(0);
      expect(mockOpenRouterClient.analyzeResume).toHaveBeenCalledWith(
        expect.stringContaining('John Doe'),
        undefined
      );
    });

    it('should perform analysis with job description', async () => {
      mockOpenRouterClient.analyzeResume.mockResolvedValueOnce(mockATSAnalysis);

      const optionsWithJD = {
        ...baseAnalysisOptions,
        jobDescription: mockJobDescription,
        config: {
          ...baseAnalysisOptions.config,
          includeKeywordMatching: true,
        },
      };

      const result = await analysisEngine.analyze(optionsWithJD);

      expect(result.score).toBeDefined();
      expect(mockOpenRouterClient.analyzeResume).toHaveBeenCalledWith(
        expect.stringContaining('John Doe'),
        mockJobDescription.content
      );
    });

    it('should include grammar analysis when enabled', async () => {
      mockOpenRouterClient.analyzeResume.mockResolvedValueOnce(mockATSAnalysis);
      mockGeminiClient.analyzeGrammar.mockResolvedValueOnce({
        grammarIssues: [{
          id: 'grammar-1',
          type: 'grammar',
          text: 'incorrect text',
          suggestion: 'correct text',
          position: { start: 0, end: 10 },
          severity: 'medium',
        }],
        overallScore: 90,
        suggestions: { summary: [], titles: [], improvements: [] },
        readabilityScore: 85,
        toneAnalysis: { score: 88, feedback: 'Good tone', suggestions: [] },
      });

      const optionsWithGrammar = {
        ...baseAnalysisOptions,
        config: {
          ...baseAnalysisOptions.config,
          includeGrammarCheck: true,
        },
      };

      const result = await analysisEngine.analyze(optionsWithGrammar);

      expect(result.grammarIssues).toHaveLength(1);
      expect(result.grammarIssues[0].text).toBe('incorrect text');
      expect(mockGeminiClient.analyzeGrammar).toHaveBeenCalledWith(
        expect.stringContaining('John Doe')
      );
    });

    it('should handle grammar analysis failure gracefully', async () => {
      mockOpenRouterClient.analyzeResume.mockResolvedValueOnce(mockATSAnalysis);
      mockGeminiClient.analyzeGrammar.mockRejectedValueOnce(new Error('Grammar API failed'));

      const optionsWithGrammar = {
        ...baseAnalysisOptions,
        config: {
          ...baseAnalysisOptions.config,
          includeGrammarCheck: true,
        },
      };

      const result = await analysisEngine.analyze(optionsWithGrammar);

      expect(result.grammarIssues).toHaveLength(0);
      expect(result.errors).toContain('Grammar analysis failed: Grammar API failed');
      expect(result.warnings).toContain('Grammar analysis was skipped due to an error');
    });

    it('should enhance keyword matching when enabled', async () => {
      mockOpenRouterClient.analyzeResume.mockResolvedValueOnce(mockATSAnalysis);

      const optionsWithKeywords = {
        ...baseAnalysisOptions,
        jobDescription: mockJobDescription,
        config: {
          ...baseAnalysisOptions.config,
          includeKeywordMatching: true,
        },
      };

      const result = await analysisEngine.analyze(optionsWithKeywords);

      expect(result.keywordMatch).toBeDefined();
      expect(result.keywordMatch.found).toContain('react');
      expect(result.keywordMatch.missing).toContain('aws');
    });

    it('should calculate final score with adjustments', async () => {
      const analysisWithGrammarIssues = {
        ...mockATSAnalysis,
        score: 90,
      };

      mockOpenRouterClient.analyzeResume.mockResolvedValueOnce(analysisWithGrammarIssues);
      mockGeminiClient.analyzeGrammar.mockResolvedValueOnce({
        grammarIssues: [
          {
            id: 'grammar-1',
            type: 'grammar',
            text: 'error',
            suggestion: 'correction',
            position: { start: 0, end: 5 },
            severity: 'high',
          },
          {
            id: 'grammar-2',
            type: 'spelling',
            text: 'typo',
            suggestion: 'correct',
            position: { start: 10, end: 14 },
            severity: 'medium',
          },
        ],
        overallScore: 80,
        suggestions: { summary: [], titles: [], improvements: [] },
        readabilityScore: 75,
        toneAnalysis: { score: 85, feedback: 'Needs improvement', suggestions: [] },
      });

      const optionsWithGrammar = {
        ...baseAnalysisOptions,
        config: {
          ...baseAnalysisOptions.config,
          includeGrammarCheck: true,
        },
      };

      const result = await analysisEngine.analyze(optionsWithGrammar);

      // Score should be adjusted down due to grammar issues (90 - 3 - 1 = 86)
      expect(result.score).toBeLessThan(90);
    });

    it('should merge recommendations from different sources', async () => {
      mockOpenRouterClient.analyzeResume.mockResolvedValueOnce(mockATSAnalysis);
      mockGeminiClient.analyzeGrammar.mockResolvedValueOnce({
        grammarIssues: [{
          id: 'grammar-1',
          type: 'grammar',
          text: 'error',
          suggestion: 'correction',
          position: { start: 0, end: 5 },
          severity: 'high',
        }],
        overallScore: 80,
        suggestions: { summary: [], titles: [], improvements: [] },
        readabilityScore: 75,
        toneAnalysis: { score: 85, feedback: 'Good', suggestions: [] },
      });

      const optionsWithAll = {
        ...baseAnalysisOptions,
        jobDescription: mockJobDescription,
        config: {
          ...baseAnalysisOptions.config,
          includeGrammarCheck: true,
          includeKeywordMatching: true,
        },
      };

      const result = await analysisEngine.analyze(optionsWithAll);

      // Should have original recommendations plus grammar and keyword recommendations
      expect(result.recommendations.length).toBeGreaterThan(1);
      expect(result.recommendations.some(rec => rec.id === 'grammar-issues')).toBe(true);
      expect(result.recommendations.some(rec => rec.id === 'missing-keywords')).toBe(true);
    });

    it('should validate inputs and return fallback for invalid data', async () => {
      const invalidOptions = {
        ...baseAnalysisOptions,
        resumeData: {
          ...mockResumeData,
          content: '', // Empty content
          sections: {
            ...mockResumeData.sections,
            contact: { ...mockResumeData.sections.contact, name: '' },
            summary: '',
            experience: [],
            education: [],
            skills: [],
            certifications: [],
          },
        },
      };

      const result = await analysisEngine.analyze(invalidOptions);
      
      expect(result.score).toBe(0);
      expect(result.modelUsed).toBe('fallback');
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle ATS analysis failure and return fallback result', async () => {
      mockOpenRouterClient.analyzeResume.mockRejectedValueOnce(new Error('ATS API failed'));

      const result = await analysisEngine.analyze(baseAnalysisOptions);

      expect(result.score).toBe(0);
      expect(result.errors).toContain('ATS analysis failed: ATS API failed');
      expect(result.recommendations[0].id).toBe('analysis-failed');
      expect(result.modelUsed).toBe('fallback');
    });

    it('should extract resume content from structured sections when content is empty', async () => {
      const resumeWithoutContent = {
        ...mockResumeData,
        content: '',
      };

      mockOpenRouterClient.analyzeResume.mockResolvedValueOnce(mockATSAnalysis);

      const options = {
        ...baseAnalysisOptions,
        resumeData: resumeWithoutContent,
      };

      const result = await analysisEngine.analyze(options);

      expect(mockOpenRouterClient.analyzeResume).toHaveBeenCalledWith(
        expect.stringContaining('John Doe'),
        undefined
      );
      expect(result.score).toBe(85);
    });
  });

  describe('keyword extraction and matching', () => {
    it('should extract technical keywords correctly', async () => {
      const techResumeData = {
        ...mockResumeData,
        content: 'Experienced in JavaScript, React, Node.js, Python, AWS, Docker, and Kubernetes',
      };

      mockOpenRouterClient.analyzeResume.mockResolvedValueOnce(mockATSAnalysis);

      const options = {
        ...baseAnalysisOptions,
        resumeData: techResumeData,
        jobDescription: mockJobDescription,
        config: {
          ...baseAnalysisOptions.config,
          includeKeywordMatching: true,
        },
      };

      const result = await analysisEngine.analyze(options);

      expect(result.keywordMatch.found.length).toBeGreaterThan(0);
      expect(result.keywordMatch.missing.length).toBeGreaterThan(0);
    });

    it('should calculate keyword match percentage correctly', async () => {
      mockOpenRouterClient.analyzeResume.mockResolvedValueOnce(mockATSAnalysis);

      const options = {
        ...baseAnalysisOptions,
        jobDescription: mockJobDescription,
        config: {
          ...baseAnalysisOptions.config,
          includeKeywordMatching: true,
        },
      };

      const result = await analysisEngine.analyze(options);

      expect(result.keywordMatch.matchPercentage).toBeGreaterThanOrEqual(0);
      expect(result.keywordMatch.matchPercentage).toBeLessThanOrEqual(100);
    });

    it('should generate keyword suggestions', async () => {
      mockOpenRouterClient.analyzeResume.mockResolvedValueOnce(mockATSAnalysis);

      const options = {
        ...baseAnalysisOptions,
        jobDescription: mockJobDescription,
        config: {
          ...baseAnalysisOptions.config,
          includeKeywordMatching: true,
        },
      };

      const result = await analysisEngine.analyze(options);

      expect(result.keywordMatch.suggestions).toBeDefined();
      expect(Array.isArray(result.keywordMatch.suggestions)).toBe(true);
    });
  });

  describe('configuration management', () => {
    it('should update client configurations', () => {
      const newConfig = {
        openRouterConfig: { apiKey: 'new-key', model: 'new-model' },
        geminiConfig: { apiKey: 'new-gemini-key', model: 'gemini-pro' },
      };

      analysisEngine.updateConfig(newConfig);

      expect(mockOpenRouterClient.updateConfig).toHaveBeenCalledWith(newConfig.openRouterConfig);
      expect(mockGeminiClient.updateConfig).toHaveBeenCalledWith(newConfig.geminiConfig);
    });

    it('should get statistics from both clients', () => {
      const stats = analysisEngine.getStats();

      expect(stats.openRouter).toBeDefined();
      expect(stats.gemini).toBeDefined();
      expect(mockOpenRouterClient.getStats).toHaveBeenCalled();
      expect(mockGeminiClient.getStats).toHaveBeenCalled();
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle missing job description gracefully', async () => {
      mockOpenRouterClient.analyzeResume.mockResolvedValueOnce(mockATSAnalysis);

      const result = await analysisEngine.analyze(baseAnalysisOptions);

      expect(result.score).toBeDefined();
      expect(result.keywordMatch).toBeDefined();
    });

    it('should handle empty skills array', async () => {
      const resumeWithoutSkills = {
        ...mockResumeData,
        sections: {
          ...mockResumeData.sections,
          skills: [],
        },
      };

      mockOpenRouterClient.analyzeResume.mockResolvedValueOnce(mockATSAnalysis);

      const options = {
        ...baseAnalysisOptions,
        resumeData: resumeWithoutSkills,
      };

      const result = await analysisEngine.analyze(options);

      expect(result.score).toBeDefined();
    });

    it('should handle invalid tier configuration', async () => {
      const invalidOptions = {
        ...baseAnalysisOptions,
        config: {
          ...baseAnalysisOptions.config,
          tier: 'invalid' as any,
        },
      };

      const result = await analysisEngine.analyze(invalidOptions);
      
      expect(result.score).toBe(0);
      expect(result.modelUsed).toBe('fallback');
      expect(result.errors).toContain('Invalid tier specified');
    });

    it('should limit recommendations to maximum count', async () => {
      const manyRecommendations = Array(20).fill(0).map((_, i) => ({
        id: `rec-${i}`,
        category: 'content' as const,
        priority: 'medium' as const,
        title: `Recommendation ${i}`,
        description: `Description ${i}`,
        suggestion: `Suggestion ${i}`,
        impact: `Impact ${i}`,
      }));

      const analysisWithManyRecs = {
        ...mockATSAnalysis,
        recommendations: manyRecommendations,
      };

      mockOpenRouterClient.analyzeResume.mockResolvedValueOnce(analysisWithManyRecs);

      const result = await analysisEngine.analyze(baseAnalysisOptions);

      expect(result.recommendations.length).toBeLessThanOrEqual(15);
    });
  });
});