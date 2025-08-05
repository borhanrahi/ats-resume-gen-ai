import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GeminiClient } from '../geminiClient';
import type { GrammarAnalysisResult, ContentAnalysisResult } from '../geminiClient';

// Mock the Google Generative AI
const mockGenerateContent = vi.fn();
const mockGetGenerativeModel = vi.fn(() => ({
  generateContent: mockGenerateContent,
}));

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
}));

describe('GeminiClient', () => {
  let client: GeminiClient;
  const mockApiKey = 'test-gemini-api-key';

  beforeEach(() => {
    client = new GeminiClient({
      apiKey: mockApiKey,
      maxRetries: 2,
      timeoutMs: 5000,
      rateLimitPerMinute: 5,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create client with valid config', () => {
      expect(client).toBeInstanceOf(GeminiClient);
      expect(client.getStats().model).toBe('gemini-1.5-flash');
    });

    it('should throw error without API key', () => {
      expect(() => new GeminiClient({ apiKey: '' })).toThrow('Gemini API key is required');
    });

    it('should use default values for optional config', () => {
      const defaultClient = new GeminiClient({ apiKey: 'test' });
      expect(defaultClient.getStats().model).toBe('gemini-1.5-flash');
      expect(defaultClient.getStats().rateLimitPerMinute).toBe(15);
    });
  });

  describe('analyzeGrammar', () => {
    const mockGrammarResponse: GrammarAnalysisResult = {
      grammarIssues: [{
        id: 'grammar-1',
        type: 'grammar',
        text: 'I has experience',
        suggestion: 'I have experience',
        position: { start: 0, end: 15 },
        severity: 'high'
      }],
      overallScore: 85,
      suggestions: {
        summary: ['Improve verb tenses'],
        titles: ['Software Engineer'],
        improvements: ['Use active voice']
      },
      readabilityScore: 80,
      toneAnalysis: {
        score: 90,
        feedback: 'Professional tone maintained',
        suggestions: ['Use more action verbs']
      }
    };

    it('should analyze grammar successfully', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify(mockGrammarResponse)
        }
      });

      const result = await client.analyzeGrammar('Test resume content');

      expect(result.overallScore).toBe(85);
      expect(result.grammarIssues).toHaveLength(1);
      expect(result.grammarIssues[0].text).toBe('I has experience');
      expect(result.grammarIssues[0].suggestion).toBe('I have experience');
      expect(result.readabilityScore).toBe(80);
      expect(result.toneAnalysis.score).toBe(90);
    });

    it('should handle API errors with retry', async () => {
      mockGenerateContent
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          response: {
            text: () => JSON.stringify(mockGrammarResponse)
          }
        });

      const result = await client.analyzeGrammar('Test resume');
      expect(result.overallScore).toBe(85);
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API error'));

      await expect(client.analyzeGrammar('Test resume')).rejects.toThrow('Gemini grammar analysis failed');
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });

    it('should handle empty response', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => ''
        }
      });

      await expect(client.analyzeGrammar('Test resume')).rejects.toThrow('Gemini grammar analysis failed');
    });

    it('should handle malformed JSON response', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => 'Invalid JSON response'
        }
      });

      await expect(client.analyzeGrammar('Test resume')).rejects.toThrow('No JSON found in Gemini response');
    });

    it('should validate and sanitize grammar issues', async () => {
      const invalidResponse = {
        grammarIssues: [{
          // Missing required fields
          type: 'invalid-type',
          severity: 'invalid-severity'
        }, {
          id: 'valid-issue',
          type: 'spelling',
          text: 'teh',
          suggestion: 'the',
          position: { start: 0, end: 3 },
          severity: 'medium'
        }],
        overallScore: 150, // Invalid score
        readabilityScore: -10, // Invalid score
        toneAnalysis: {
          score: 200, // Invalid score
          feedback: 'Good tone'
        }
      };

      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify(invalidResponse)
        }
      });

      const result = await client.analyzeGrammar('Test resume');

      // Should clamp scores to valid range
      expect(result.overallScore).toBe(100);
      expect(result.readabilityScore).toBe(0);
      expect(result.toneAnalysis.score).toBe(100);

      // Should sanitize grammar issues
      expect(result.grammarIssues).toHaveLength(2);
      expect(result.grammarIssues[0].type).toBe('grammar'); // Default type
      expect(result.grammarIssues[0].severity).toBe('medium'); // Default severity
      expect(result.grammarIssues[1].type).toBe('spelling'); // Valid type preserved
    });
  });

  describe('analyzeContent', () => {
    const mockContentResponse: ContentAnalysisResult = {
      contentQuality: 88,
      strengthsWeaknesses: {
        strengths: ['Strong technical skills', 'Good experience'],
        weaknesses: ['Lacks quantified achievements', 'Weak summary']
      },
      suggestions: {
        summaryOptions: ['Option 1', 'Option 2', 'Option 3'],
        titleOptions: ['Title 1', 'Title 2', 'Title 3'],
        contentImprovements: ['Add metrics', 'Improve formatting']
      },
      professionalTone: {
        score: 92,
        feedback: 'Professional and clear'
      }
    };

    it('should analyze content successfully', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify(mockContentResponse)
        }
      });

      const result = await client.analyzeContent('Test resume content');

      expect(result.contentQuality).toBe(88);
      expect(result.strengthsWeaknesses.strengths).toHaveLength(2);
      expect(result.strengthsWeaknesses.weaknesses).toHaveLength(2);
      expect(result.suggestions.summaryOptions).toHaveLength(3);
      expect(result.professionalTone.score).toBe(92);
    });

    it('should analyze content with job description', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify(mockContentResponse)
        }
      });

      const result = await client.analyzeContent('Test resume', 'Test job description');

      expect(result.contentQuality).toBe(88);
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining('Test job description')
      );
    });

    it('should handle content analysis errors', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Content analysis failed'));

      await expect(client.analyzeContent('Test resume')).rejects.toThrow('Gemini content analysis failed');
    });
  });

  describe('generateSummaryOptions', () => {
    it('should generate summary options successfully', async () => {
      const mockSummaries = [
        'Experienced software engineer with 5+ years',
        'Full-stack developer specializing in React',
        'Results-driven engineer with proven track record'
      ];

      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify(mockSummaries)
        }
      });

      const result = await client.generateSummaryOptions('Test resume content');

      expect(result).toHaveLength(3);
      expect(result[0]).toBe('Experienced software engineer with 5+ years');
    });

    it('should handle invalid JSON response for summaries', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => 'Invalid JSON'
        }
      });

      await expect(client.generateSummaryOptions('Test resume')).rejects.toThrow('Failed to generate summary options');
    });

    it('should limit summary options to 3', async () => {
      const mockSummaries = ['Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5'];

      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify(mockSummaries)
        }
      });

      const result = await client.generateSummaryOptions('Test resume');
      expect(result).toHaveLength(3);
    });
  });

  describe('generateTitleOptions', () => {
    it('should generate title options successfully', async () => {
      const mockTitles = [
        'Senior Software Engineer',
        'Full Stack Developer',
        'Frontend Engineer',
        'React Developer',
        'JavaScript Engineer'
      ];

      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify(mockTitles)
        }
      });

      const result = await client.generateTitleOptions('Test resume content');

      expect(result).toHaveLength(5);
      expect(result[0]).toBe('Senior Software Engineer');
    });

    it('should handle title generation errors', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Title generation failed'));

      await expect(client.generateTitleOptions('Test resume')).rejects.toThrow('Failed to generate title options');
    });
  });

  describe('rate limiting', () => {
    it('should enforce rate limiting', async () => {
      // Mock successful responses
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify({ overallScore: 80, grammarIssues: [] })
        }
      });

      const start = Date.now();

      // Make 3 requests (within rate limit of 5 per minute)
      const promises = Array(3).fill(0).map(() => 
        client.analyzeGrammar('Test content')
      );

      await Promise.all(promises);

      const elapsed = Date.now() - start;

      // Should complete without significant delay for small number of requests
      expect(elapsed).toBeLessThan(5000);
    }, 10000);

    it('should track request statistics', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify({ overallScore: 80, grammarIssues: [] })
        }
      });

      const initialStats = client.getStats();
      expect(initialStats.requestCount).toBe(0);
      expect(initialStats.recentRequests).toBe(0);

      await client.analyzeGrammar('Test resume');

      const updatedStats = client.getStats();
      expect(updatedStats.requestCount).toBe(1);
      expect(updatedStats.recentRequests).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should handle Gemini-specific errors', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('API_KEY_INVALID'));

      await expect(client.analyzeGrammar('Test resume')).rejects.toThrow('Gemini grammar analysis failed');
    });

    it('should handle quota exceeded errors', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('QUOTA_EXCEEDED'));

      await expect(client.analyzeGrammar('Test resume')).rejects.toThrow('Gemini grammar analysis failed');
    });

    it('should handle safety filter errors', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('SAFETY violation'));

      await expect(client.analyzeGrammar('Test resume')).rejects.toThrow('Gemini grammar analysis failed');
    });

    it('should handle timeout errors', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('Request timeout'));

      await expect(client.analyzeGrammar('Test resume')).rejects.toThrow('Gemini grammar analysis failed');
    });
  });

  describe('configuration management', () => {
    it('should update configuration', () => {
      const newModel = 'gemini-1.5-pro';
      client.updateConfig({ model: newModel });
      expect(client.getStats().model).toBe(newModel);
    });

    it('should update rate limit configuration', () => {
      client.updateConfig({ rateLimitPerMinute: 10 });
      expect(client.getStats().rateLimitPerMinute).toBe(10);
    });
  });

  describe('testConnection', () => {
    it('should test connection successfully', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => 'Connection successful'
        }
      });

      const result = await client.testConnection();

      expect(result.success).toBe(true);
      expect(result.response).toBe('Connection successful');
    });

    it('should handle connection test failure', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await client.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Gemini API error');
    });
  });
});