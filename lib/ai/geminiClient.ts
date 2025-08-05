import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import type { GrammarIssue } from '@/types/analysis';

export interface GeminiConfig {
  apiKey: string;
  model?: string;
  maxRetries?: number;
  timeoutMs?: number;
  rateLimitPerMinute?: number;
}

export interface GrammarAnalysisResult {
  grammarIssues: GrammarIssue[];
  overallScore: number;
  suggestions: {
    summary: string[];
    titles: string[];
    improvements: string[];
  };
  readabilityScore: number;
  toneAnalysis: {
    score: number;
    feedback: string;
    suggestions: string[];
  };
}

export interface ContentAnalysisResult {
  contentQuality: number;
  strengthsWeaknesses: {
    strengths: string[];
    weaknesses: string[];
  };
  suggestions: {
    summaryOptions: string[];
    titleOptions: string[];
    contentImprovements: string[];
  };
  professionalTone: {
    score: number;
    feedback: string;
  };
}

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private config: Required<GeminiConfig>;
  private requestCount: number = 0;
  private requestTimes: number[] = [];

  constructor(config: GeminiConfig) {
    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'gemini-1.5-flash',
      maxRetries: config.maxRetries || 3,
      timeoutMs: config.timeoutMs || 30000,
      rateLimitPerMinute: config.rateLimitPerMinute || 15, // Conservative rate limit
    };

    if (!this.config.apiKey) {
      throw new Error('Gemini API key is required');
    }

    this.genAI = new GoogleGenerativeAI(this.config.apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: this.config.model,
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });
  }

  /**
   * Analyze grammar and writing quality of resume content
   */
  async analyzeGrammar(resumeContent: string): Promise<GrammarAnalysisResult> {
    const prompt = this.buildGrammarPrompt(resumeContent);
    
    try {
      const response = await this.makeRequest(prompt);
      return this.parseGrammarResponse(response);
    } catch (error) {
      throw new Error(`Gemini grammar analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze content quality and provide improvement suggestions
   */
  async analyzeContent(resumeContent: string, jobDescription?: string): Promise<ContentAnalysisResult> {
    const prompt = this.buildContentPrompt(resumeContent, jobDescription);
    
    try {
      const response = await this.makeRequest(prompt);
      return this.parseContentResponse(response);
    } catch (error) {
      throw new Error(`Gemini content analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate resume summary suggestions
   */
  async generateSummaryOptions(resumeContent: string, jobDescription?: string): Promise<string[]> {
    const prompt = `
Based on this resume content${jobDescription ? ' and job description' : ''}, generate 3 professional summary options that are:
1. ATS-friendly with relevant keywords
2. Concise (2-3 sentences each)
3. Highlight key achievements and skills
4. Professional and impactful

Resume Content:
${resumeContent}

${jobDescription ? `Job Description:\n${jobDescription}\n` : ''}

Provide your response as a JSON array of strings:
["Summary option 1", "Summary option 2", "Summary option 3"]
`;

    try {
      const response = await this.makeRequest(prompt);
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
    } catch (error) {
      throw new Error(`Failed to generate summary options: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate professional title suggestions
   */
  async generateTitleOptions(resumeContent: string, jobDescription?: string): Promise<string[]> {
    const prompt = `
Based on this resume content${jobDescription ? ' and target job description' : ''}, generate 5 professional title options that are:
1. Specific and relevant to the person's experience
2. ATS-friendly with industry keywords
3. Professional and concise
4. Aligned with career level and expertise

Resume Content:
${resumeContent}

${jobDescription ? `Target Job Description:\n${jobDescription}\n` : ''}

Provide your response as a JSON array of strings:
["Title option 1", "Title option 2", "Title option 3", "Title option 4", "Title option 5"]
`;

    try {
      const response = await this.makeRequest(prompt);
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
    } catch (error) {
      throw new Error(`Failed to generate title options: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Make request to Gemini API with retry logic and rate limiting
   */
  private async makeRequest(prompt: string): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        // Enforce rate limiting
        await this.enforceRateLimit();

        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), this.config.timeoutMs);
        });

        // Make the API call
        const apiPromise = this.model.generateContent(prompt);

        const result = await Promise.race([apiPromise, timeoutPromise]);
        const response = result.response;
        const text = response.text();

        if (!text || text.trim().length === 0) {
          throw new Error('Empty response from Gemini API');
        }

        this.requestCount++;
        return text;
      } catch (error) {
        lastError = this.handleGeminiError(error);
        
        if (attempt < this.config.maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await this.delay(delay);
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Build grammar analysis prompt
   */
  private buildGrammarPrompt(resumeContent: string): string {
    return `
Analyze this resume content for grammar, spelling, tone, and clarity issues. Provide detailed feedback and suggestions.

Resume Content:
${resumeContent}

Please provide your analysis in the following JSON format:
{
  "grammarIssues": [
    {
      "id": "<unique-id>",
      "type": "<grammar|spelling|tone|clarity>",
      "text": "<problematic text>",
      "suggestion": "<corrected text or suggestion>",
      "position": {
        "start": <character position>,
        "end": <character position>
      },
      "severity": "<low|medium|high>"
    }
  ],
  "overallScore": <number between 0-100>,
  "suggestions": {
    "summary": ["<summary improvement 1>", "<summary improvement 2>"],
    "titles": ["<title suggestion 1>", "<title suggestion 2>"],
    "improvements": ["<general improvement 1>", "<general improvement 2>"]
  },
  "readabilityScore": <number between 0-100>,
  "toneAnalysis": {
    "score": <number between 0-100>,
    "feedback": "<tone feedback>",
    "suggestions": ["<tone suggestion 1>", "<tone suggestion 2>"]
  }
}

Focus on:
1. Grammar and spelling errors
2. Weak or passive language
3. Unclear or confusing sentences
4. Professional tone and clarity
5. Consistency in tense and style
6. Readability and flow

Provide specific, actionable suggestions for improvement.`;
  }

  /**
   * Build content analysis prompt
   */
  private buildContentPrompt(resumeContent: string, jobDescription?: string): string {
    return `
Analyze this resume content for quality, effectiveness, and professional presentation.

Resume Content:
${resumeContent}

${jobDescription ? `Job Description:\n${jobDescription}\n` : ''}

Please provide your analysis in the following JSON format:
{
  "contentQuality": <number between 0-100>,
  "strengthsWeaknesses": {
    "strengths": ["<strength 1>", "<strength 2>"],
    "weaknesses": ["<weakness 1>", "<weakness 2>"]
  },
  "suggestions": {
    "summaryOptions": ["<summary option 1>", "<summary option 2>", "<summary option 3>"],
    "titleOptions": ["<title option 1>", "<title option 2>", "<title option 3>"],
    "contentImprovements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"]
  },
  "professionalTone": {
    "score": <number between 0-100>,
    "feedback": "<professional tone feedback>"
  }
}

Focus on:
1. Content relevance and impact
2. Achievement quantification
3. Skills presentation
4. Professional language use
5. Overall effectiveness
6. ${jobDescription ? 'Alignment with job requirements' : 'General best practices'}

Provide specific, actionable recommendations for improvement.`;
  }

  /**
   * Parse grammar analysis response
   */
  private parseGrammarResponse(response: string): GrammarAnalysisResult {
    try {
      // Extract JSON from response (handle potential markdown formatting)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Gemini response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        grammarIssues: this.validateGrammarIssues(parsed.grammarIssues || []),
        overallScore: Math.max(0, Math.min(100, parsed.overallScore || 0)),
        suggestions: {
          summary: Array.isArray(parsed.suggestions?.summary) 
            ? parsed.suggestions.summary.slice(0, 5) 
            : [],
          titles: Array.isArray(parsed.suggestions?.titles) 
            ? parsed.suggestions.titles.slice(0, 5) 
            : [],
          improvements: Array.isArray(parsed.suggestions?.improvements) 
            ? parsed.suggestions.improvements.slice(0, 10) 
            : [],
        },
        readabilityScore: Math.max(0, Math.min(100, parsed.readabilityScore || 0)),
        toneAnalysis: {
          score: Math.max(0, Math.min(100, parsed.toneAnalysis?.score || 0)),
          feedback: String(parsed.toneAnalysis?.feedback || ''),
          suggestions: Array.isArray(parsed.toneAnalysis?.suggestions) 
            ? parsed.toneAnalysis.suggestions.slice(0, 5) 
            : [],
        },
      };
    } catch (error) {
      throw new Error(`Failed to parse Gemini grammar response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse content analysis response
   */
  private parseContentResponse(response: string): ContentAnalysisResult {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Gemini response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        contentQuality: Math.max(0, Math.min(100, parsed.contentQuality || 0)),
        strengthsWeaknesses: {
          strengths: Array.isArray(parsed.strengthsWeaknesses?.strengths) 
            ? parsed.strengthsWeaknesses.strengths.slice(0, 5) 
            : [],
          weaknesses: Array.isArray(parsed.strengthsWeaknesses?.weaknesses) 
            ? parsed.strengthsWeaknesses.weaknesses.slice(0, 5) 
            : [],
        },
        suggestions: {
          summaryOptions: Array.isArray(parsed.suggestions?.summaryOptions) 
            ? parsed.suggestions.summaryOptions.slice(0, 3) 
            : [],
          titleOptions: Array.isArray(parsed.suggestions?.titleOptions) 
            ? parsed.suggestions.titleOptions.slice(0, 3) 
            : [],
          contentImprovements: Array.isArray(parsed.suggestions?.contentImprovements) 
            ? parsed.suggestions.contentImprovements.slice(0, 10) 
            : [],
        },
        professionalTone: {
          score: Math.max(0, Math.min(100, parsed.professionalTone?.score || 0)),
          feedback: String(parsed.professionalTone?.feedback || ''),
        },
      };
    } catch (error) {
      throw new Error(`Failed to parse Gemini content response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate and sanitize grammar issues
   */
  private validateGrammarIssues(issues: any[]): GrammarIssue[] {
    return issues
      .filter(issue => issue && typeof issue === 'object')
      .map((issue, index) => ({
        id: issue.id || `grammar-${index}`,
        type: ['grammar', 'spelling', 'tone', 'clarity'].includes(issue.type) 
          ? issue.type 
          : 'grammar',
        text: String(issue.text || ''),
        suggestion: String(issue.suggestion || ''),
        position: {
          start: Math.max(0, issue.position?.start || 0),
          end: Math.max(0, issue.position?.end || 0),
        },
        severity: ['low', 'medium', 'high'].includes(issue.severity) 
          ? issue.severity 
          : 'medium',
      }))
      .slice(0, 20); // Limit to 20 issues
  }

  /**
   * Handle Gemini-specific errors
   */
  private handleGeminiError(error: any): Error {
    if (error instanceof Error) {
      if (error.message.includes('API_KEY_INVALID')) {
        return new Error('Invalid Gemini API key');
      }
      if (error.message.includes('QUOTA_EXCEEDED')) {
        return new Error('Gemini API quota exceeded');
      }
      if (error.message.includes('SAFETY')) {
        return new Error('Content blocked by Gemini safety filters');
      }
      if (error.message.includes('timeout')) {
        return new Error('Gemini API request timeout');
      }
      return new Error(`Gemini API error: ${error.message}`);
    }
    return new Error('Unknown Gemini API error');
  }

  /**
   * Enforce rate limiting
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Remove requests older than 1 minute
    this.requestTimes = this.requestTimes.filter(time => time > oneMinuteAgo);

    // Check if we're at the rate limit
    if (this.requestTimes.length >= this.config.rateLimitPerMinute) {
      const oldestRequest = Math.min(...this.requestTimes);
      const waitTime = 60000 - (now - oldestRequest);
      
      if (waitTime > 0) {
        await this.delay(waitTime);
      }
    }

    this.requestTimes.push(now);
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<{ success: boolean; response?: string; error?: string }> {
    try {
      const result = await this.makeRequest('Say "Connection successful" to confirm the API is working.');
      return { success: true, response: result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error connecting to Gemini API' 
      };
    }
  }

  /**
   * Get client statistics
   */
  getStats() {
    return {
      requestCount: this.requestCount,
      recentRequests: this.requestTimes.length,
      model: this.config.model,
      rateLimitPerMinute: this.config.rateLimitPerMinute,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<GeminiConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Recreate model if model name changed
    if (newConfig.model) {
      this.model = this.genAI.getGenerativeModel({ 
        model: this.config.model,
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      });
    }
  }
}

// Default instance for free tier - only create if API key is available
export const geminiClient = process.env.GEMINI_API_KEY 
  ? new GeminiClient({
      apiKey: process.env.GEMINI_API_KEY,
      model: 'gemini-1.5-flash',
      rateLimitPerMinute: 15,
    })
  : null;