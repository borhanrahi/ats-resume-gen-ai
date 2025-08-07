import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenRouterClient } from '../../lib/ai/openrouter-client';
import { GeminiClient } from '../../lib/ai/gemini-client';
import { AnalysisEngine } from '../../lib/analysis/analysis-engine';

// Comprehensive unit tests for AI analysis functionality

describe('AI Analysis Comprehensive Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('OpenRouter Client', () => {
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    beforeEach(() => {
      mockFetch.mockClear();
    });

    it('should make successful API call for resume analysis', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              ats_score: 85,
              breakdown: {
                formatting: 90,
                keywords: 80,
                structure: 85,
                experience: 88,
                skills: 82
              },
              recommendations: [
                'Add more relevant keywords',
                'Improve formatting consistency'
              ],
              missing_keywords: ['React', 'TypeScript'],
              keyword_matches: ['JavaScript', 'Node.js']
            })
          }
        }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const client = new OpenRouterClient('test-api-key');
      const result = await client.analyzeResume('Sample resume text', 'Software Engineer job description');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          })
        })
      );

      expect(result.ats_score).toBe(85);
      expect(result.breakdown.formatting).toBe(90);
      expect(result.recommendations).toHaveLength(2);
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const client = new OpenRouterClient('test-api-key');
      
      await expect(
        client.analyzeResume('Sample resume text', 'Job description')
      ).rejects.toThrow('Network error');
    });

    it('should retry on rate limit errors', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Rate limit exceeded'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            choices: [{
              message: {
                content: JSON.stringify({
                  ats_score: 75,
                  breakdown: { formatting: 80, keywords: 70, structure: 75 },
                  recommendations: [],
                  missing_keywords: [],
                  keyword_matches: []
                })
              }
            }]
          })
        });

      const client = new OpenRouterClient('test-api-key');
      const result = await client.analyzeResume('Sample resume text', 'Job description');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.ats_score).toBe(75);
    });
  });

  describe('Gemini Client', () => {
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    beforeEach(() => {
      mockFetch.mockClear();
    });

    it('should analyze grammar and provide suggestions', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                grammar_score: 92,
                issues: [
                  {
                    type: 'spelling',
                    text: 'recieve',
                    suggestion: 'receive',
                    position: { start: 10, end: 17 }
                  }
                ],
                suggestions: ['Fix spelling errors', 'Improve sentence structure']
              })
            }]
          }
        }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const client = new GeminiClient('test-api-key');
      const result = await client.checkGrammar('Sample text with recieve error');

      expect(result.grammar_score).toBe(92);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].suggestion).toBe('receive');
    });

    it('should handle empty response gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ candidates: [] })
      });

      const client = new GeminiClient('test-api-key');
      const result = await client.checkGrammar('Perfect text');

      expect(result.grammar_score).toBe(100);
      expect(result.issues).toHaveLength(0);
    });
  });

  describe('Analysis Engine', () => {
    let mockOpenRouterClient: any;
    let mockGeminiClient: any;
    let analysisEngine: AnalysisEngine;

    beforeEach(() => {
      mockOpenRouterClient = {
        analyzeResume: vi.fn()
      };
      mockGeminiClient = {
        checkGrammar: vi.fn()
      };
      analysisEngine = new AnalysisEngine(mockOpenRouterClient, mockGeminiClient);
    });

    it('should perform comprehensive analysis', async () => {
      const mockATSResult = {
        ats_score: 85,
        breakdown: {
          formatting: 90,
          keywords: 80,
          structure: 85,
          experience: 88,
          skills: 82
        },
        recommendations: ['Add more keywords'],
        missing_keywords: ['React'],
        keyword_matches: ['JavaScript']
      };

      const mockGrammarResult = {
        grammar_score: 95,
        issues: [],
        suggestions: []
      };

      mockOpenRouterClient.analyzeResume.mockResolvedValue(mockATSResult);
      mockGeminiClient.checkGrammar.mockResolvedValue(mockGrammarResult);

      const result = await analysisEngine.analyzeResume(
        'Sample resume text',
        'Job description'
      );

      expect(result.ats_analysis).toEqual(mockATSResult);
      expect(result.grammar_analysis).toEqual(mockGrammarResult);
      expect(result.overall_score).toBe(90); // (85 + 95) / 2
    });

    it('should calculate keyword matching score', () => {
      const resumeText = 'JavaScript developer with React experience';
      const jobDescription = 'Looking for JavaScript and React developer with Node.js skills';

      const score = analysisEngine.calculateKeywordMatch(resumeText, jobDescription);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should extract keywords from text', () => {
      const text = 'JavaScript React Node.js TypeScript developer experience';
      const keywords = analysisEngine.extractKeywords(text);

      expect(keywords).toContain('JavaScript');
      expect(keywords).toContain('React');
      expect(keywords).toContain('Node.js');
      expect(keywords).toContain('TypeScript');
    });

    it('should handle analysis errors gracefully', async () => {
      mockOpenRouterClient.analyzeResume.mockRejectedValue(new Error('API Error'));
      mockGeminiClient.checkGrammar.mockResolvedValue({
        grammar_score: 95,
        issues: [],
        suggestions: []
      });

      const result = await analysisEngine.analyzeResume(
        'Sample resume text',
        'Job description'
      );

      expect(result.ats_analysis).toBeNull();
      expect(result.grammar_analysis).toBeDefined();
      expect(result.error).toBe('ATS analysis failed: API Error');
    });
  });

  describe('Keyword Matching Logic', () => {
    it('should identify missing keywords', () => {
      const resumeKeywords = ['JavaScript', 'HTML', 'CSS'];
      const jobKeywords = ['JavaScript', 'React', 'Node.js', 'HTML'];

      const missing = AnalysisEngine.findMissingKeywords(resumeKeywords, jobKeywords);

      expect(missing).toContain('React');
      expect(missing).toContain('Node.js');
      expect(missing).not.toContain('JavaScript');
      expect(missing).not.toContain('HTML');
    });

    it('should calculate match percentage', () => {
      const resumeKeywords = ['JavaScript', 'HTML', 'CSS', 'React'];
      const jobKeywords = ['JavaScript', 'React', 'Node.js', 'TypeScript'];

      const percentage = AnalysisEngine.calculateMatchPercentage(resumeKeywords, jobKeywords);

      expect(percentage).toBe(50); // 2 matches out of 4 job keywords
    });

    it('should handle case insensitive matching', () => {
      const resumeKeywords = ['javascript', 'html'];
      const jobKeywords = ['JavaScript', 'HTML', 'CSS'];

      const percentage = AnalysisEngine.calculateMatchPercentage(resumeKeywords, jobKeywords);

      expect(percentage).toBeGreaterThan(60); // Should match despite case differences
    });
  });

  describe('Score Calculation', () => {
    it('should calculate weighted ATS score', () => {
      const breakdown = {
        formatting: 90,
        keywords: 80,
        structure: 85,
        experience: 88,
        skills: 82
      };

      const score = AnalysisEngine.calculateWeightedScore(breakdown);

      expect(score).toBeGreaterThan(80);
      expect(score).toBeLessThan(90);
    });

    it('should handle missing breakdown categories', () => {
      const breakdown = {
        formatting: 90,
        keywords: 80
      };

      const score = AnalysisEngine.calculateWeightedScore(breakdown);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed API responses', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ invalid: 'response' })
      });

      const client = new OpenRouterClient('test-api-key');
      
      await expect(
        client.analyzeResume('Sample resume text', 'Job description')
      ).rejects.toThrow();
    });

    it('should handle network timeouts', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      mockFetch.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      const client = new OpenRouterClient('test-api-key');
      
      await expect(
        client.analyzeResume('Sample resume text', 'Job description')
      ).rejects.toThrow('Timeout');
    });
  });
});
               