import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenRouterClient } from '../openRouterClient';
import type { OpenRouterResponse } from '../openRouterClient';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('OpenRouterClient', () => {
  let client: OpenRouterClient;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    client = new OpenRouterClient({
      apiKey: mockApiKey,
      maxRetries: 2,
      timeoutMs: 5000,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create client with valid config', () => {
      expect(client).toBeInstanceOf(OpenRouterClient);
      expect(client.getStats().model).toBe('meta-llama/llama-3.1-8b-instruct:free');
    });

    it('should throw error without API key', () => {
      expect(() => new OpenRouterClient({ apiKey: '' })).toThrow('OpenRouter API key is required');
    });

    it('should use default values for optional config', () => {
      const defaultClient = new OpenRouterClient({ apiKey: 'test' });
      expect(defaultClient.getStats().model).toBe('meta-llama/llama-3.1-8b-instruct:free');
    });
  });

  describe('analyzeResume', () => {
    const mockResponse: OpenRouterResponse = {
      id: 'test-id',
      object: 'chat.completion',
      created: Date.now(),
      model: 'meta-llama/llama-3.1-8b-instruct:free',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: JSON.stringify({
            score: 85,
            breakdown: {
              formatting: 90,
              keywords: 80,
              structure: 85,
              length: 85
            },
            recommendations: [{
              id: 'rec-1',
              category: 'keywords',
              priority: 'high',
              title: 'Add technical skills',
              description: 'Include more relevant technical skills',
              suggestion: 'Add Python, JavaScript, React',
              impact: 'Improve keyword matching by 15%'
            }],
            keywordMatch: {
              found: ['JavaScript', 'React'],
              missing: ['Python', 'Node.js'],
              matchPercentage: 75,
              density: 2.5,
              suggestions: ['Add Python experience', 'Include Node.js projects']
            }
          })
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 200,
        total_tokens: 300
      }
    };

    it('should analyze resume successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.analyzeResume('Test resume content');

      expect(result.score).toBe(85);
      expect(result.breakdown.formatting).toBe(90);
      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].title).toBe('Add technical skills');
      expect(result.keywordMatch.found).toContain('JavaScript');
      expect(result.modelUsed).toBe('meta-llama/llama-3.1-8b-instruct:free');
    });

    it('should analyze resume with job description', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.analyzeResume('Test resume', 'Test job description');

      expect(result.score).toBe(85);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('chat/completions'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockApiKey}`,
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('Test job description')
        })
      );
    });

    it('should handle API errors', async () => {
      const mockErrorResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({
          error: {
            message: 'API rate limit exceeded',
            type: 'rate_limit_error'
          }
        })
      };
      
      mockFetch.mockResolvedValueOnce(mockErrorResponse);

      await expect(client.analyzeResume('Test resume')).rejects.toThrow('OpenRouter API error: API rate limit exceeded');
    });

    it('should handle network errors with retry', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

      const result = await client.analyzeResume('Test resume');
      expect(result.score).toBe(85);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(client.analyzeResume('Test resume')).rejects.toThrow('Network error');
      expect(mockFetch).toHaveBeenCalledTimes(2); // maxRetries = 2
    });

    it('should handle malformed JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          ...mockResponse,
          choices: [{
            ...mockResponse.choices[0],
            message: {
              role: 'assistant',
              content: 'Invalid JSON response'
            }
          }]
        })
      });

      await expect(client.analyzeResume('Test resume')).rejects.toThrow('No JSON found in OpenRouter response');
    });

    it('should validate and sanitize response data', async () => {
      const invalidResponse = {
        ...mockResponse,
        choices: [{
          ...mockResponse.choices[0],
          message: {
            role: 'assistant',
            content: JSON.stringify({
              score: 150, // Invalid score > 100
              breakdown: {
                formatting: -10, // Invalid negative score
                keywords: null, // Invalid type
                structure: 85,
                length: 200 // Invalid score > 100
              },
              recommendations: [{
                // Missing required fields
                category: 'invalid-category',
                priority: 'invalid-priority'
              }],
              keywordMatch: {
                found: 'not-an-array',
                missing: ['valid'],
                matchPercentage: 150, // Invalid percentage
                density: -1 // Invalid negative density
              }
            })
          }
        }]
      };

      const mockValidResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(invalidResponse)
      };

      mockFetch.mockResolvedValueOnce(mockValidResponse);

      const result = await client.analyzeResume('Test resume');

      // Should clamp score to valid range
      expect(result.score).toBe(100);
      expect(result.breakdown.formatting).toBe(0);
      expect(result.breakdown.keywords).toBe(0);
      expect(result.breakdown.length).toBe(100);
      
      // Should sanitize recommendations
      expect(result.recommendations[0].category).toBe('content');
      expect(result.recommendations[0].priority).toBe('medium');
      expect(result.recommendations[0].title).toBe('Improvement Needed');
      
      // Should sanitize keyword match
      expect(result.keywordMatch.found).toEqual([]);
      expect(result.keywordMatch.matchPercentage).toBe(100);
      expect(result.keywordMatch.density).toBe(0);
    });
  });

  describe('configuration management', () => {
    it('should update configuration', () => {
      const newModel = 'gpt-3.5-turbo';
      client.updateConfig({ model: newModel });
      expect(client.getStats().model).toBe(newModel);
    });

    it('should track request statistics', async () => {
      const mockValidResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          ...mockResponse,
          choices: [{
            ...mockResponse.choices[0],
            message: {
              role: 'assistant',
              content: JSON.stringify({
                score: 80,
                breakdown: { formatting: 80, keywords: 80, structure: 80, length: 80 },
                recommendations: [],
                keywordMatch: { found: [], missing: [], matchPercentage: 0, density: 0, suggestions: [] }
              })
            }
          }]
        })
      };

      mockFetch.mockResolvedValueOnce(mockValidResponse);

      const initialStats = client.getStats();
      expect(initialStats.requestCount).toBe(0);

      await client.analyzeResume('Test resume');

      const updatedStats = client.getStats();
      expect(updatedStats.requestCount).toBe(1);
      expect(updatedStats.lastRequestTime).toBeGreaterThan(0);
    });
  });

  describe('rate limiting', () => {
    it('should enforce rate limiting between requests', async () => {
      const mockValidResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          ...mockResponse,
          choices: [{
            ...mockResponse.choices[0],
            message: {
              role: 'assistant',
              content: JSON.stringify({
                score: 80,
                breakdown: { formatting: 80, keywords: 80, structure: 80, length: 80 },
                recommendations: [],
                keywordMatch: { found: [], missing: [], matchPercentage: 0, density: 0, suggestions: [] }
              })
            }
          }]
        })
      };

      mockFetch.mockResolvedValue(mockValidResponse);

      const start = Date.now();
      
      // Make two requests quickly
      await Promise.all([
        client.analyzeResume('Test resume 1'),
        client.analyzeResume('Test resume 2')
      ]);

      const elapsed = Date.now() - start;
      
      // Should take at least 1 second due to rate limiting
      expect(elapsed).toBeGreaterThanOrEqual(1000);
    });
  });
});