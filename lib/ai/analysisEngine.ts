import { OpenRouterClient } from './openRouterClient';
import { GeminiClient } from './geminiClient';
import { analysisCache } from '@/lib/utils/cacheManager';
import { performanceMonitor } from '@/lib/utils/performanceMonitor';
import type { ATSAnalysis, JobDescription, Recommendation, KeywordAnalysis, GrammarIssue } from '@/types/analysis';
import type { ResumeData } from '@/types/resume';

export interface AnalysisConfig {
  tier: 'free' | 'premium';
  includeGrammarCheck: boolean;
  includeContentAnalysis: boolean;
  includeKeywordMatching: boolean;
  openRouterConfig?: {
    apiKey: string;
    model?: string;
  };
  geminiConfig?: {
    apiKey: string;
    model?: string;
  };
}

export interface AnalysisOptions {
  resumeData: ResumeData;
  jobDescription?: JobDescription;
  config: AnalysisConfig;
}

export interface AnalysisResult extends ATSAnalysis {
  processingTime: number;
  errors: string[];
  warnings: string[];
}

export class AnalysisEngine {
  private openRouterClient: OpenRouterClient;
  private geminiClient: GeminiClient;

  constructor(
    openRouterClient?: OpenRouterClient,
    geminiClient?: GeminiClient
  ) {
    // Use provided clients or create default ones
    this.openRouterClient = openRouterClient || new OpenRouterClient({
      apiKey: process.env.OPENROUTER_API_KEY || 'test-key',
    });
    
    this.geminiClient = geminiClient || new GeminiClient({
      apiKey: process.env.GEMINI_API_KEY || 'test-key',
    });
  }

  /**
   * Main analysis method that orchestrates all AI calls
   */
  async analyze(options: AnalysisOptions): Promise<AnalysisResult> {
    return performanceMonitor.trackAnalysisPerformance(async () => {
      const startTime = Date.now();
      const errors: string[] = [];
      const warnings: string[] = [];

      try {
        // Validate inputs
        this.validateInputs(options);

        // Extract resume content for analysis
        const resumeContent = this.extractResumeContent(options.resumeData);

        // Check cache first
        const cacheKey = analysisCache.generateAnalysisKey(
          resumeContent,
          options.jobDescription?.content
        );
        
        const cachedResult = analysisCache.get<AnalysisResult>(cacheKey);
        if (cachedResult) {
          console.log('📦 Using cached analysis result');
          return {
            ...cachedResult,
            processingTime: Date.now() - startTime, // Update processing time
          };
        }

      // Perform ATS analysis using OpenRouter
      const atsAnalysis = await this.performATSAnalysis(
        resumeContent,
        options.jobDescription,
        options.config
      );

      // Perform grammar analysis using Gemini (if enabled)
      let grammarIssues: GrammarIssue[] = [];
      if (options.config.includeGrammarCheck) {
        try {
          const grammarResult = await this.geminiClient.analyzeGrammar(resumeContent);
          grammarIssues = grammarResult.grammarIssues;
        } catch (error) {
          errors.push(`Grammar analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          warnings.push('Grammar analysis was skipped due to an error');
        }
      }

      // Enhance keyword matching if job description is provided
      let enhancedKeywordMatch = atsAnalysis.keywordMatch;
      if (options.jobDescription && options.config.includeKeywordMatching) {
        try {
          enhancedKeywordMatch = await this.enhanceKeywordMatching(
            resumeContent,
            options.jobDescription,
            atsAnalysis.keywordMatch
          );
        } catch (error) {
          errors.push(`Enhanced keyword matching failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          warnings.push('Using basic keyword matching instead of enhanced analysis');
        }
      }

      // Calculate final score with adjustments
      const finalScore = this.calculateFinalScore(
        atsAnalysis.score,
        grammarIssues,
        enhancedKeywordMatch
      );

      // Merge recommendations
      const allRecommendations = this.mergeRecommendations(
        atsAnalysis.recommendations,
        grammarIssues,
        enhancedKeywordMatch
      );

      const processingTime = Date.now() - startTime;

      const result: AnalysisResult = {
        score: finalScore,
        breakdown: atsAnalysis.breakdown,
        recommendations: allRecommendations,
        keywordMatch: enhancedKeywordMatch,
        grammarIssues,
        modelUsed: atsAnalysis.modelUsed,
        fallbacksUsed: atsAnalysis.fallbacksUsed,
        processingTime,
        errors,
        warnings,
      };

      // Cache the result for future use (1 hour TTL)
      analysisCache.set(cacheKey, result, 60 * 60 * 1000);
      console.log('💾 Analysis result cached');

      return result;
      } catch (error) {
        const processingTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown analysis error';
        errors.push(errorMessage);

        // Return a fallback analysis result
        return this.createFallbackResult(processingTime, errors, warnings);
      }
    });
  }

  /**
   * Perform ATS analysis using OpenRouter
   */
  private async performATSAnalysis(
    resumeContent: string,
    jobDescription?: JobDescription,
    config?: AnalysisConfig
  ): Promise<ATSAnalysis> {
    try {
      // Update OpenRouter client config if provided
      if (config?.openRouterConfig) {
        this.openRouterClient.updateConfig(config.openRouterConfig);
      }

      const jobDescriptionText = jobDescription?.content;
      return await this.openRouterClient.analyzeResume(resumeContent, jobDescriptionText);
    } catch (error) {
      throw new Error(`ATS analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Enhance keyword matching with additional analysis
   */
  private async enhanceKeywordMatching(
    resumeContent: string,
    jobDescription: JobDescription,
    basicKeywordMatch: KeywordAnalysis
  ): Promise<KeywordAnalysis> {
    try {
      // Extract keywords from job description
      const jobKeywords = this.extractJobKeywords(jobDescription);
      
      // Analyze resume content for keyword density and context
      const resumeKeywords = this.extractResumeKeywords(resumeContent);
      
      // Calculate enhanced matching
      const foundKeywords = this.findMatchingKeywords(resumeKeywords, jobKeywords);
      const missingKeywords = this.findMissingKeywords(resumeKeywords, jobKeywords);
      
      // Calculate match percentage with context weighting
      const matchPercentage = this.calculateKeywordMatchPercentage(
        foundKeywords,
        jobKeywords,
        resumeContent
      );
      
      // Calculate keyword density
      const density = this.calculateKeywordDensity(foundKeywords, resumeContent);
      
      // Generate contextual suggestions
      const suggestions = this.generateKeywordSuggestions(
        missingKeywords,
        jobDescription,
        resumeContent
      );

      return {
        found: foundKeywords,
        missing: missingKeywords,
        matchPercentage,
        density,
        suggestions,
      };
    } catch (error) {
      // Return the basic keyword match if enhancement fails
      return basicKeywordMatch;
    }
  }

  /**
   * Extract keywords from job description
   */
  private extractJobKeywords(jobDescription: JobDescription): string[] {
    const keywords = new Set<string>();
    
    // Add explicitly extracted keywords
    jobDescription.extractedKeywords.forEach(keyword => keywords.add(keyword.toLowerCase()));
    
    // Add required skills
    jobDescription.requiredSkills.forEach(skill => keywords.add(skill.toLowerCase()));
    
    // Extract additional keywords from content using simple NLP
    const contentKeywords = this.extractKeywordsFromText(jobDescription.content);
    contentKeywords.forEach(keyword => keywords.add(keyword));
    
    return Array.from(keywords);
  }

  /**
   * Extract keywords from resume content
   */
  private extractResumeKeywords(resumeContent: string): string[] {
    return this.extractKeywordsFromText(resumeContent);
  }

  /**
   * Simple keyword extraction from text
   */
  private extractKeywordsFromText(text: string): string[] {
    // Common technical and professional keywords patterns
    const keywordPatterns = [
      // Programming languages
      /\b(javascript|python|java|c\+\+|c#|php|ruby|go|rust|swift|kotlin|typescript)\b/gi,
      // Frameworks and libraries
      /\b(react|angular|vue|node\.?js|express|django|flask|spring|laravel|rails)\b/gi,
      // Databases
      /\b(mysql|postgresql|mongodb|redis|elasticsearch|oracle|sql server)\b/gi,
      // Cloud platforms
      /\b(aws|azure|gcp|google cloud|docker|kubernetes|terraform)\b/gi,
      // Tools and technologies
      /\b(git|jenkins|jira|confluence|slack|figma|photoshop|excel)\b/gi,
      // Methodologies
      /\b(agile|scrum|kanban|devops|ci\/cd|tdd|bdd)\b/gi,
      // Soft skills
      /\b(leadership|communication|teamwork|problem.solving|analytical|creative)\b/gi,
    ];

    const keywords = new Set<string>();
    
    keywordPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => keywords.add(match.toLowerCase()));
      }
    });

    // Extract capitalized words (likely to be important terms)
    const capitalizedWords = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
    if (capitalizedWords) {
      capitalizedWords.forEach(word => {
        if (word.length > 2 && !this.isCommonWord(word)) {
          keywords.add(word.toLowerCase());
        }
      });
    }

    return Array.from(keywords);
  }

  /**
   * Check if a word is a common word that shouldn't be considered a keyword
   */
  private isCommonWord(word: string): boolean {
    const commonWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
      'after', 'above', 'below', 'between', 'among', 'this', 'that', 'these',
      'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
      'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
      'Company', 'Team', 'Project', 'Work', 'Experience', 'Skills', 'Education'
    ]);
    
    return commonWords.has(word.toLowerCase());
  }

  /**
   * Find matching keywords between resume and job description
   */
  private findMatchingKeywords(resumeKeywords: string[], jobKeywords: string[]): string[] {
    const matches = new Set<string>();
    
    resumeKeywords.forEach(resumeKeyword => {
      jobKeywords.forEach(jobKeyword => {
        // Exact match
        if (resumeKeyword === jobKeyword) {
          matches.add(resumeKeyword);
        }
        // Partial match (for compound terms)
        else if (resumeKeyword.includes(jobKeyword) || jobKeyword.includes(resumeKeyword)) {
          matches.add(jobKeyword);
        }
      });
    });
    
    return Array.from(matches);
  }

  /**
   * Find missing keywords from job description
   */
  private findMissingKeywords(resumeKeywords: string[], jobKeywords: string[]): string[] {
    const resumeKeywordSet = new Set(resumeKeywords);
    
    return jobKeywords.filter(jobKeyword => {
      // Check for exact match
      if (resumeKeywordSet.has(jobKeyword)) {
        return false;
      }
      
      // Check for partial match
      return !resumeKeywords.some(resumeKeyword => 
        resumeKeyword.includes(jobKeyword) || jobKeyword.includes(resumeKeyword)
      );
    });
  }

  /**
   * Calculate keyword match percentage with context weighting
   */
  private calculateKeywordMatchPercentage(
    foundKeywords: string[],
    jobKeywords: string[],
    resumeContent: string
  ): number {
    if (jobKeywords.length === 0) return 100;
    
    let weightedScore = 0;
    let totalWeight = 0;
    
    jobKeywords.forEach(keyword => {
      const weight = this.getKeywordWeight(keyword, resumeContent);
      totalWeight += weight;
      
      if (foundKeywords.includes(keyword)) {
        weightedScore += weight;
      }
    });
    
    return totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;
  }

  /**
   * Get weight for a keyword based on its importance and context
   */
  private getKeywordWeight(keyword: string, resumeContent: string): number {
    let weight = 1;
    
    // Higher weight for technical skills
    if (this.isTechnicalSkill(keyword)) {
      weight += 2;
    }
    
    // Higher weight for keywords that appear multiple times
    const occurrences = (resumeContent.toLowerCase().match(new RegExp(keyword, 'g')) || []).length;
    weight += Math.min(occurrences * 0.5, 2);
    
    // Higher weight for keywords in important sections
    if (this.isInImportantSection(keyword, resumeContent)) {
      weight += 1;
    }
    
    return weight;
  }

  /**
   * Check if keyword is a technical skill
   */
  private isTechnicalSkill(keyword: string): boolean {
    const technicalKeywords = [
      'javascript', 'python', 'java', 'react', 'angular', 'vue', 'node.js',
      'aws', 'azure', 'docker', 'kubernetes', 'mysql', 'postgresql', 'mongodb'
    ];
    
    return technicalKeywords.some(tech => 
      keyword.toLowerCase().includes(tech) || tech.includes(keyword.toLowerCase())
    );
  }

  /**
   * Check if keyword appears in important sections
   */
  private isInImportantSection(keyword: string, resumeContent: string): boolean {
    const importantSections = [
      'summary', 'objective', 'skills', 'technical skills', 'core competencies'
    ];
    
    const lines = resumeContent.split('\n');
    let inImportantSection = false;
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      // Check if we're entering an important section
      if (importantSections.some(section => lowerLine.includes(section))) {
        inImportantSection = true;
      }
      
      // Check if we're leaving the section (new section header)
      if (inImportantSection && line.match(/^[A-Z\s]+$/)) {
        inImportantSection = false;
      }
      
      // Check if keyword is in this line while in important section
      if (inImportantSection && lowerLine.includes(keyword.toLowerCase())) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Calculate keyword density
   */
  private calculateKeywordDensity(keywords: string[], content: string): number {
    const words = content.split(/\s+/).length;
    const keywordOccurrences = keywords.reduce((total, keyword) => {
      const matches = content.toLowerCase().match(new RegExp(keyword, 'g'));
      return total + (matches ? matches.length : 0);
    }, 0);
    
    return words > 0 ? (keywordOccurrences / words) * 100 : 0;
  }

  /**
   * Generate contextual keyword suggestions
   */
  private generateKeywordSuggestions(
    missingKeywords: string[],
    jobDescription: JobDescription,
    resumeContent: string
  ): string[] {
    const suggestions: string[] = [];
    
    // Prioritize missing keywords by importance
    const prioritizedKeywords = missingKeywords
      .sort((a, b) => this.getKeywordImportance(b, jobDescription) - this.getKeywordImportance(a, jobDescription))
      .slice(0, 10);
    
    prioritizedKeywords.forEach(keyword => {
      const suggestion = this.generateKeywordSuggestion(keyword, resumeContent);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    });
    
    return suggestions;
  }

  /**
   * Get keyword importance score
   */
  private getKeywordImportance(keyword: string, jobDescription: JobDescription): number {
    let importance = 1;
    
    // Higher importance for required skills
    if (jobDescription.requiredSkills.includes(keyword)) {
      importance += 3;
    }
    
    // Higher importance for keywords in job title
    if (jobDescription.jobTitle.toLowerCase().includes(keyword)) {
      importance += 2;
    }
    
    // Higher importance for technical skills
    if (this.isTechnicalSkill(keyword)) {
      importance += 2;
    }
    
    return importance;
  }

  /**
   * Generate specific suggestion for missing keyword
   */
  private generateKeywordSuggestion(keyword: string, resumeContent: string): string | null {
    // Check if keyword is a skill that could be added to skills section
    if (this.isTechnicalSkill(keyword)) {
      return `Add "${keyword}" to your technical skills section if you have experience with it`;
    }
    
    // Check if keyword could be incorporated into experience descriptions
    if (keyword.length > 3) {
      return `Consider incorporating "${keyword}" into your experience descriptions where relevant`;
    }
    
    return `Include "${keyword}" in your resume if you have relevant experience`;
  }

  /**
   * Calculate final score with adjustments
   */
  private calculateFinalScore(
    baseScore: number,
    grammarIssues: GrammarIssue[],
    keywordMatch: KeywordAnalysis
  ): number {
    let finalScore = baseScore;
    
    // Adjust for grammar issues
    const highSeverityGrammar = grammarIssues.filter(issue => issue.severity === 'high').length;
    const mediumSeverityGrammar = grammarIssues.filter(issue => issue.severity === 'medium').length;
    
    finalScore -= (highSeverityGrammar * 3) + (mediumSeverityGrammar * 1);
    
    // Adjust for keyword matching
    if (keywordMatch.matchPercentage < 50) {
      finalScore -= 10;
    } else if (keywordMatch.matchPercentage > 80) {
      finalScore += 5;
    }
    
    // Ensure score is within valid range
    return Math.max(0, Math.min(100, Math.round(finalScore)));
  }

  /**
   * Merge recommendations from different sources
   */
  private mergeRecommendations(
    atsRecommendations: Recommendation[],
    grammarIssues: GrammarIssue[],
    keywordMatch: KeywordAnalysis
  ): Recommendation[] {
    const recommendations: Recommendation[] = [...atsRecommendations];
    
    // Add grammar-based recommendations
    if (grammarIssues.length > 0) {
      const grammarRec: Recommendation = {
        id: 'grammar-issues',
        category: 'content',
        priority: grammarIssues.some(issue => issue.severity === 'high') ? 'high' : 'medium',
        title: 'Fix Grammar and Writing Issues',
        description: `Found ${grammarIssues.length} grammar/writing issues that could impact readability`,
        suggestion: 'Review and correct grammar, spelling, and clarity issues throughout your resume',
        impact: 'Improved readability and professional presentation',
      };
      recommendations.push(grammarRec);
    }
    
    // Add keyword-based recommendations
    if (keywordMatch.missing.length > 0) {
      const keywordRec: Recommendation = {
        id: 'missing-keywords',
        category: 'keywords',
        priority: keywordMatch.matchPercentage < 50 ? 'high' : 'medium',
        title: 'Add Missing Keywords',
        description: `Missing ${keywordMatch.missing.length} important keywords from the job description`,
        suggestion: `Consider adding these keywords: ${keywordMatch.missing.slice(0, 5).join(', ')}`,
        impact: `Could improve ATS matching by ${Math.min(20, keywordMatch.missing.length * 2)}%`,
      };
      recommendations.push(keywordRec);
    }
    
    // Sort by priority and limit to top 15 recommendations
    return recommendations
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 15);
  }

  /**
   * Extract resume content for analysis
   */
  private extractResumeContent(resumeData: ResumeData): string {
    // Use the raw content if available, otherwise construct from sections
    if (resumeData.content && resumeData.content.trim().length > 0) {
      return resumeData.content;
    }
    
    // Construct content from structured sections
    const sections = resumeData.sections;
    let content = '';
    
    // Add contact info
    if (sections.contact) {
      content += `${sections.contact.name}\n`;
      content += `${sections.contact.email} | ${sections.contact.phone}\n`;
      if (sections.contact.location) content += `${sections.contact.location}\n`;
      content += '\n';
    }
    
    // Add summary
    if (sections.summary) {
      content += `SUMMARY\n${sections.summary}\n\n`;
    }
    
    // Add experience
    if (sections.experience && sections.experience.length > 0) {
      content += 'EXPERIENCE\n';
      sections.experience.forEach(exp => {
        content += `${exp.position} at ${exp.company}\n`;
        content += `${exp.startDate} - ${exp.endDate}\n`;
        content += `${exp.description}\n`;
        if (exp.achievements.length > 0) {
          content += exp.achievements.map(achievement => `• ${achievement}`).join('\n') + '\n';
        }
        content += '\n';
      });
    }
    
    // Add education
    if (sections.education && sections.education.length > 0) {
      content += 'EDUCATION\n';
      sections.education.forEach(edu => {
        content += `${edu.degree} in ${edu.field}\n`;
        content += `${edu.institution}\n`;
        content += `${edu.startDate} - ${edu.endDate}\n\n`;
      });
    }
    
    // Add skills
    if (sections.skills && sections.skills.length > 0) {
      content += `SKILLS\n${sections.skills.join(', ')}\n\n`;
    }
    
    // Add certifications
    if (sections.certifications && sections.certifications.length > 0) {
      content += 'CERTIFICATIONS\n';
      sections.certifications.forEach(cert => {
        content += `${cert.name} - ${cert.issuer} (${cert.date})\n`;
      });
    }
    
    return content;
  }

  /**
   * Validate analysis inputs
   */
  private validateInputs(options: AnalysisOptions): void {
    if (!options.resumeData) {
      throw new Error('Resume data is required');
    }
    
    if (!options.config) {
      throw new Error('Analysis configuration is required');
    }
    
    const resumeContent = this.extractResumeContent(options.resumeData);
    if (!resumeContent || resumeContent.trim().length < 50) {
      throw new Error('Resume content is too short or empty');
    }
    
    if (options.config.tier !== 'free' && options.config.tier !== 'premium') {
      throw new Error('Invalid tier specified');
    }
  }

  /**
   * Create fallback result when analysis fails
   */
  private createFallbackResult(
    processingTime: number,
    errors: string[],
    warnings: string[]
  ): AnalysisResult {
    return {
      score: 0,
      breakdown: {
        formatting: 0,
        keywords: 0,
        structure: 0,
        length: 0,
      },
      recommendations: [{
        id: 'analysis-failed',
        category: 'content',
        priority: 'critical',
        title: 'Analysis Failed',
        description: 'Unable to complete resume analysis due to technical issues',
        suggestion: 'Please try again later or contact support if the issue persists',
        impact: 'Analysis could not be completed',
      }],
      keywordMatch: {
        found: [],
        missing: [],
        matchPercentage: 0,
        density: 0,
        suggestions: [],
      },
      grammarIssues: [],
      modelUsed: 'fallback',
      fallbacksUsed: [],
      processingTime,
      errors,
      warnings,
    };
  }

  /**
   * Get analysis engine statistics
   */
  getStats() {
    return {
      openRouter: this.openRouterClient.getStats(),
      gemini: this.geminiClient.getStats(),
    };
  }

  /**
   * Update client configurations
   */
  updateConfig(config: Partial<AnalysisConfig>): void {
    if (config.openRouterConfig) {
      this.openRouterClient.updateConfig(config.openRouterConfig);
    }
    
    if (config.geminiConfig) {
      this.geminiClient.updateConfig(config.geminiConfig);
    }
  }
}

// Default analysis engine instance - only create if API keys are available
export const analysisEngine = (process.env.OPENROUTER_API_KEY && process.env.GEMINI_API_KEY)
  ? new AnalysisEngine()
  : null;