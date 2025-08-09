import type {
  ATSAnalysis,
  Recommendation,
  KeywordAnalysis,
  GrammarIssue,
} from "@/types/analysis";

export interface OpenRouterConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  maxRetries?: number;
  timeoutMs?: number;
}

export interface OpenRouterRequest {
  model: string;
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
}

export interface OpenRouterResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenRouterError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

export class OpenRouterClient {
  private config: Required<OpenRouterConfig>;
  private requestCount: number = 0;
  private lastRequestTime: number = 0;

  constructor(config: OpenRouterConfig) {
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || "https://openrouter.ai/api/v1",
      model:
        config.model ||
        process.env.DEFAULT_FREE_MODEL ||
        "moonshotai/kimi-k2:free",
      maxRetries: config.maxRetries || 3,
      timeoutMs: config.timeoutMs || 30000,
    };

    if (!this.config.apiKey) {
      throw new Error("OpenRouter API key is required");
    }
  }

  /**
   * Analyze resume content for ATS compatibility
   */
  async analyzeResume(
    resumeContent: string,
    jobDescription?: string
  ): Promise<ATSAnalysis> {
    const prompt = this.buildAnalysisPrompt(resumeContent, jobDescription);

    // Try multiple models in order
    const modelsToTry = [
      this.config.model,
      process.env.DEFAULT_FREE_MODEL || "moonshotai/kimi-k2:free",
      process.env.FALLBACK_MODEL || "z-ai/glm-4.5-air:free",
      "google/gemma-2-9b-it:free",
    ].filter((model, index, arr) => arr.indexOf(model) === index); // Remove duplicates

    let lastError: Error | null = null;

    for (const model of modelsToTry) {
      try {
        console.log(`Trying model: ${model}`);
        const response = await this.makeRequest({
          model,
          messages: [
            {
              role: "system",
              content:
                "You are an expert ATS (Applicant Tracking System) analyzer. Provide detailed, actionable feedback on resume optimization for ATS systems. Always respond with valid JSON only.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 2000,
          temperature: 0.3,
        });

        console.log(`Model ${model} succeeded`);
        return this.parseAnalysisResponse(response);
      } catch (error) {
        console.warn(
          `Model ${model} failed:`,
          error instanceof Error ? error.message : "Unknown error"
        );
        lastError = error instanceof Error ? error : new Error("Unknown error");
        continue;
      }
    }

    throw new Error(
      `OpenRouter analysis failed with all models: ${
        lastError?.message || "Unknown error"
      }`
    );
  }

  /**
   * Make HTTP request to OpenRouter API with retry logic (public method)
   */
  async makeRequest(request: OpenRouterRequest): Promise<OpenRouterResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        // Rate limiting - simple implementation
        await this.enforceRateLimit();

        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          this.config.timeoutMs
        );

        const response = await fetch(
          `${this.config.baseUrl}/chat/completions`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${this.config.apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer":
                process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
              "X-Title": "ATS Resume Checker",
            },
            body: JSON.stringify(request),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData: OpenRouterError = await response.json();
          throw new Error(`OpenRouter API error: ${errorData.error.message}`);
        }

        const data: OpenRouterResponse = await response.json();
        this.requestCount++;

        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");

        if (attempt < this.config.maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await this.delay(delay);
        }
      }
    }

    throw lastError || new Error("All retry attempts failed");
  }

  /**
   * Build analysis prompt for resume evaluation
   */
  private buildAnalysisPrompt(
    resumeContent: string,
    jobDescription?: string
  ): string {
    const basePrompt = `
Analyze this resume for ATS (Applicant Tracking System) compatibility and provide a comprehensive evaluation.

Resume Content:
${resumeContent}

${jobDescription ? `Job Description:\n${jobDescription}\n` : ""}

Please provide your analysis in the following JSON format:
{
  "score": <number between 0-100>,
  "breakdown": {
    "formatting": <number between 0-100>,
    "keywords": <number between 0-100>,
    "structure": <number between 0-100>,
    "length": <number between 0-100>
  },
  "recommendations": [
    {
      "id": "<unique-id>",
      "category": "<formatting|content|keywords|structure>",
      "priority": "<low|medium|high|critical>",
      "title": "<short title>",
      "description": "<detailed description>",
      "suggestion": "<specific actionable suggestion>",
      "impact": "<expected impact>"
    }
  ],
  "keywordMatch": {
    "found": ["<keyword1>", "<keyword2>"],
    "missing": ["<missing1>", "<missing2>"],
    "matchPercentage": <number between 0-100>,
    "density": <number>,
    "suggestions": ["<suggestion1>", "<suggestion2>"]
  }
}

Focus on:
1. ATS-friendly formatting (no tables, images, or complex layouts)
2. Keyword optimization and relevance
3. Resume structure and organization
4. Appropriate length and content density
5. ${
      jobDescription
        ? "Alignment with job requirements"
        : "General best practices"
    }

Provide specific, actionable recommendations for improvement.`;

    return basePrompt;
  }

  /**
   * Parse OpenRouter response into ATSAnalysis format
   */
  private parseAnalysisResponse(response: OpenRouterResponse): ATSAnalysis {
    try {
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content in OpenRouter response");
      }

      // Extract JSON from response (handle potential markdown formatting)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in OpenRouter response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and transform the response
      const analysis: ATSAnalysis = {
        score: Math.max(0, Math.min(100, parsed.score || 0)),
        breakdown: {
          formatting: Math.max(
            0,
            Math.min(100, parsed.breakdown?.formatting || 0)
          ),
          keywords: Math.max(0, Math.min(100, parsed.breakdown?.keywords || 0)),
          structure: Math.max(
            0,
            Math.min(100, parsed.breakdown?.structure || 0)
          ),
          length: Math.max(0, Math.min(100, parsed.breakdown?.length || 0)),
        },
        recommendations: this.validateRecommendations(
          parsed.recommendations || []
        ),
        keywordMatch: this.validateKeywordMatch(parsed.keywordMatch || {}),
        grammarIssues: [], // OpenRouter doesn't provide grammar analysis
        modelUsed: response.model,
        fallbacksUsed: [],
      };

      return analysis;
    } catch (error) {
      throw new Error(
        `Failed to parse OpenRouter response: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Validate and sanitize recommendations
   */
  private validateRecommendations(recommendations: any[]): Recommendation[] {
    return recommendations
      .filter((rec) => rec && typeof rec === "object")
      .map((rec, index) => ({
        id: rec.id || `rec-${index}`,
        category: ["formatting", "content", "keywords", "structure"].includes(
          rec.category
        )
          ? rec.category
          : "content",
        priority: ["low", "medium", "high", "critical"].includes(rec.priority)
          ? rec.priority
          : "medium",
        title: String(rec.title || "Improvement Needed"),
        description: String(rec.description || ""),
        suggestion: String(rec.suggestion || ""),
        impact: String(rec.impact || ""),
      }))
      .slice(0, 10); // Limit to 10 recommendations
  }

  /**
   * Validate and sanitize keyword match data
   */
  private validateKeywordMatch(keywordMatch: unknown): KeywordAnalysis {
    return {
      found: Array.isArray(keywordMatch.found)
        ? keywordMatch.found.filter((k) => typeof k === "string").slice(0, 50)
        : [],
      missing: Array.isArray(keywordMatch.missing)
        ? keywordMatch.missing.filter((k) => typeof k === "string").slice(0, 50)
        : [],
      matchPercentage: Math.max(
        0,
        Math.min(100, keywordMatch.matchPercentage || 0)
      ),
      density: Math.max(0, keywordMatch.density || 0),
      suggestions: Array.isArray(keywordMatch.suggestions)
        ? keywordMatch.suggestions
            .filter((s) => typeof s === "string")
            .slice(0, 10)
        : [],
    };
  }

  /**
   * Simple rate limiting implementation
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = 1000; // 1 second between requests

    if (timeSinceLastRequest < minInterval) {
      await this.delay(minInterval - timeSinceLastRequest);
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get client statistics
   */
  getStats() {
    return {
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime,
      model: this.config.model,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<OpenRouterConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Default instance for free tier - only create if API key is available
export const openRouterClient = process.env.OPENROUTER_API_KEY
  ? new OpenRouterClient({
      apiKey: process.env.OPENROUTER_API_KEY,
      model: process.env.DEFAULT_FREE_MODEL || "moonshotai/kimi-k2:free",
    })
  : null;
