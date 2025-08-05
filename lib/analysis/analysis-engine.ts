import { ATSScoringEngine, ATSScoreResult } from './ats-scoring-engine';
import { DocumentParser } from './document-parser';
import { aiIntegration, AISuggestion } from './ai-integration';
import { resumeDetector, ResumeDetectionResult } from './resume-detector';
import { getActiveModels } from '../models-storage';
import { ModelConfig } from '../models-storage';

export interface AnalysisRequest {
  resumeFile: File;
  jobDescription?: string;
  targetKeywords?: string[];
  userTier: 'free' | 'premium';
}

export interface AnalysisResult {
  isValidResume: boolean;
  resumeDetection?: ResumeDetectionResult;
  atsScore?: ATSScoreResult;
  aiSuggestions: AISuggestion[];
  keywordMatching?: KeywordMatchingResult;
  improvementPlan?: ImprovementPlan;
  processingTime: number;
  error?: string;
}

// AISuggestion interface is now imported from ai-integration module

export interface KeywordMatchingResult {
  foundKeywords: string[];
  missingKeywords: string[];
  matchPercentage: number;
  suggestions: string[];
  // Legacy properties for backward compatibility
  totalKeywords?: number;
  matchedKeywords?: number;
  keywordDensity?: number;
}

export interface ImprovementPlan {
  currentScore: number;
  targetScore: number;
  estimatedTimeToImprove: string;
  priorityActions: PriorityAction[];
  quickWins: string[];
}

export interface PriorityAction {
  action: string;
  impact: number;
  difficulty: 'easy' | 'medium' | 'hard';
  timeEstimate: string;
}

export class AnalysisEngine {
  private scoringEngine: ATSScoringEngine;
  private documentParser: DocumentParser;

  constructor() {
    this.scoringEngine = new ATSScoringEngine();
    this.documentParser = new DocumentParser();
  }

  async analyzeResume(request: AnalysisRequest): Promise<AnalysisResult> {
    const startTime = Date.now();

    try {
      // 1. Parse the resume document
      console.log('Parsing resume document...');
      const parsedDocument = await this.documentParser.parseDocument(request.resumeFile);

      // 2. Detect if the document is actually a resume/CV
      console.log('Detecting if document is a resume...');
      const resumeDetection = resumeDetector.detectResume(parsedDocument.text, request.resumeFile.name);
      
      console.log('Resume detection result:', resumeDetection);
      
      // If not a valid resume, return early with detection results
      if (!resumeDetection.isResume) {
        const processingTime = Date.now() - startTime;
        return {
          isValidResume: false,
          resumeDetection,
          aiSuggestions: [],
          processingTime,
          error: 'This document does not appear to be a resume or CV. Please upload a valid resume for ATS analysis.'
        };
      }

      // 3. Parse job description if provided
      let jobData = null;
      if (request.jobDescription) {
        console.log('Parsing job description...');
        jobData = await this.documentParser.parseJobDescription(request.jobDescription);
      }

      // 4. Calculate ATS score
      console.log('Calculating ATS score...');
      const atsScore = await this.scoringEngine.analyzeResume(
        parsedDocument,
        request.jobDescription,
        request.targetKeywords || jobData?.keywords
      );
      
      console.log('ATS Score calculated:', {
        totalScore: atsScore.totalScore,
        percentage: atsScore.percentage,
        dimensionsCount: Object.keys(atsScore.dimensions).length,
        penaltiesCount: atsScore.penalties.length,
        recommendationsCount: atsScore.recommendations.length
      });

      // 5. Generate AI suggestions based on user tier
      console.log('Generating AI suggestions...');
      const aiSuggestions = await this.generateAISuggestions(
        parsedDocument,
        atsScore,
        request.userTier,
        jobData
      );

      // 6. Perform keyword matching analysis
      console.log('Analyzing keyword matching...');
      const keywordMatching = this.analyzeKeywordMatching(
        parsedDocument,
        request.targetKeywords || jobData?.keywords || []
      );

      // 7. Create improvement plan
      console.log('Creating improvement plan...');
      const improvementPlan = this.createImprovementPlan(atsScore, aiSuggestions);

      const processingTime = Date.now() - startTime;

      return {
        isValidResume: true,
        resumeDetection,
        atsScore,
        aiSuggestions,
        keywordMatching,
        improvementPlan,
        processingTime
      };

    } catch (error) {
      console.error('Analysis failed:', error);
      const processingTime = Date.now() - startTime;
      return {
        isValidResume: false,
        aiSuggestions: [],
        processingTime,
        error: `Resume analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async generateAISuggestions(
    parsedDocument: any,
    atsScore: ATSScoreResult,
    userTier: 'free' | 'premium',
    jobData: any
  ): Promise<AISuggestion[]> {
    try {
      // Get appropriate AI model based on user tier
      const activeModels = getActiveModels(userTier);
      
      if (activeModels.length === 0) {
        console.warn(`No active models found for ${userTier} tier`);
        return this.generateBasicSuggestions(atsScore);
      }

      // Use primary model for the tier
      const primaryModel = activeModels.find(m => m.priority === 1) || activeModels[0];

      // Use the AI integration to generate suggestions
      const aiSuggestions = await aiIntegration.generateSuggestions(
        primaryModel,
        parsedDocument,
        atsScore,
        jobData?.description || jobData?.text,
        userTier
      );

      return aiSuggestions;

    } catch (error) {
      console.error('AI suggestion generation failed:', error);
      // Fallback to basic suggestions
      return this.generateBasicSuggestions(atsScore);
    }
  }



  private generateBasicSuggestions(atsScore: ATSScoreResult): AISuggestion[] {
    const suggestions: AISuggestion[] = [];

    // Generate basic suggestions based on lowest scoring dimensions
    const dimensions = Object.values(atsScore.dimensions);
    const lowestDimension = dimensions.reduce((min, dim) => 
      dim.percentage < min.percentage ? dim : min
    );

    suggestions.push({
      category: 'content',
      priority: 'high',
      title: `Improve ${lowestDimension.name}`,
      description: `Your ${lowestDimension.name.toLowerCase()} scored ${lowestDimension.percentage}% - focus on this area first`,
      impact: 'Highest impact improvement opportunity'
    });

    return suggestions;
  }

  private generatePremiumSuggestions(parsedDocument: any, jobData: any): AISuggestion[] {
    const premiumSuggestions: AISuggestion[] = [];

    // Advanced suggestions only for premium users
    premiumSuggestions.push({
      category: 'content',
      priority: 'medium',
      title: 'Industry-Specific Optimization',
      description: 'Tailor your resume language to match industry standards and expectations',
      impact: 'Premium feature - industry-specific insights'
    });

    premiumSuggestions.push({
      category: 'keywords',
      priority: 'medium',
      title: 'Advanced Keyword Strategy',
      description: 'Implement semantic keyword variations and context-aware placement',
      impact: 'Premium feature - advanced keyword analysis'
    });

    return premiumSuggestions;
  }

  private analyzeKeywordMatching(parsedDocument: any, targetKeywords: string[]): KeywordMatchingResult {
    console.log('=== KEYWORD MATCHING ANALYSIS START ===');
    
    // Extract keywords from CV content using intelligent analysis
    const extractedKeywords = this.extractKeywordsFromCV(parsedDocument.text);
    console.log('Extracted keywords from resume:', extractedKeywords);
    
    // Always extract keywords from resume, even without job description
    if (targetKeywords.length === 0) {
      console.log('No target keywords provided, showing extracted keywords');
      return {
        foundKeywords: extractedKeywords,
        missingKeywords: [],
        matchPercentage: extractedKeywords.length > 0 ? 100 : 0,
        suggestions: extractedKeywords.length > 0 ? [
          'Add a job description to compare your skills with job requirements',
          `Found ${extractedKeywords.length} skills in your resume: ${extractedKeywords.slice(0, 5).join(', ')}${extractedKeywords.length > 5 ? '...' : ''}`
        ] : [
          'Add more technical skills and keywords to your resume',
          'Include industry-specific terms and technologies'
        ]
      };
    }

    const resumeText = parsedDocument.text.toLowerCase();
    const matchedKeywords = targetKeywords.filter(keyword => 
      resumeText.includes(keyword.toLowerCase())
    );
    const missingKeywords = targetKeywords.filter(keyword => 
      !resumeText.includes(keyword.toLowerCase())
    );

    const matchPercentage = (matchedKeywords.length / targetKeywords.length) * 100;
    
    // Calculate keyword density
    const totalWords = resumeText.split(/\s+/).length;
    const keywordOccurrences = targetKeywords.reduce((count, keyword) => {
      const regex = new RegExp(keyword.toLowerCase().replace(/[.*+?^${}()|[\]\/\\]/g, '\\$&'), 'g');
      const matches = resumeText.match(regex);
      return count + (matches ? matches.length : 0);
    }, 0);
    const keywordDensity = (keywordOccurrences / totalWords) * 100;

    const suggestions = this.generateKeywordSuggestions(missingKeywords, keywordDensity);

    return {
      foundKeywords: matchedKeywords,
      missingKeywords,
      matchPercentage: Math.round(matchPercentage),
      suggestions
    };
  }

  private extractKeywordsFromCV(text: string): string[] {
    const keywords: string[] = [];
    const lowerText = text.toLowerCase();
    
    // Technical skills patterns
    const techSkills = [
      'javascript', 'python', 'java', 'react', 'node', 'angular', 'vue',
      'html', 'css', 'sql', 'mongodb', 'postgresql', 'mysql', 'redis',
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git',
      'typescript', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin',
      'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy',
      'spring', 'django', 'flask', 'express', 'laravel', 'rails'
    ];
    
    // Business skills patterns
    const businessSkills = [
      'project management', 'agile', 'scrum', 'kanban', 'leadership',
      'communication', 'teamwork', 'problem solving', 'analytical',
      'strategic planning', 'budget management', 'stakeholder management',
      'risk management', 'quality assurance', 'process improvement',
      'data analysis', 'market research', 'customer service',
      'sales', 'marketing', 'business development', 'negotiation'
    ];
    
    // Industry-specific terms
    const industryTerms = [
      'healthcare', 'finance', 'banking', 'insurance', 'retail',
      'manufacturing', 'logistics', 'supply chain', 'e-commerce',
      'telecommunications', 'automotive', 'aerospace', 'energy',
      'consulting', 'education', 'government', 'non-profit'
    ];
    
    // Certifications and qualifications
    const certifications = [
      'pmp', 'cissp', 'cisa', 'cism', 'aws certified', 'azure certified',
      'google certified', 'cisco', 'microsoft certified', 'oracle certified',
      'comptia', 'itil', 'six sigma', 'lean', 'prince2'
    ];
    
    // Combine all skill categories
    const allSkills = [...techSkills, ...businessSkills, ...industryTerms, ...certifications];
    
    // Find skills mentioned in the resume
    for (const skill of allSkills) {
      if (lowerText.includes(skill)) {
        // Capitalize first letter for display
        keywords.push(skill.charAt(0).toUpperCase() + skill.slice(1));
      }
    }
    
    // Extract degree/education keywords
    const educationPatterns = [
      /bachelor['\'s]*\s+(?:of\s+)?(?:science|arts|engineering|business)/gi,
      /master['\'s]*\s+(?:of\s+)?(?:science|arts|engineering|business|administration)/gi,
      /phd|doctorate|doctoral/gi,
      /computer science|information technology|software engineering/gi,
      /business administration|management|marketing|finance/gi
    ];
    
    for (const pattern of educationPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          if (!keywords.includes(match)) {
            keywords.push(match);
          }
        });
      }
    }
    
    // Remove duplicates and return
    return [...new Set(keywords)];
  }

  private generateKeywordSuggestions(missingKeywords: string[], density: number): string[] {
    const suggestions: string[] = [];

    if (missingKeywords.length > 0) {
      suggestions.push(`Add these missing keywords: ${missingKeywords.slice(0, 5).join(', ')}`);
    }

    if (density < 1) {
      suggestions.push('Increase keyword density by integrating more relevant terms naturally');
    } else if (density > 5) {
      suggestions.push('Reduce keyword density to avoid appearing as keyword stuffing');
    }

    if (suggestions.length === 0) {
      suggestions.push('Great keyword optimization! Your resume matches the job requirements well.');
    }

    return suggestions;
  }

  private createImprovementPlan(atsScore: ATSScoreResult, suggestions: AISuggestion[]): ImprovementPlan {
    const currentScore = atsScore.totalScore;
    const targetScore = Math.min(100, currentScore + 20); // Aim for 20 point improvement

    // Calculate potential impact of high-priority suggestions
    const highPriorityActions = suggestions
      .filter(s => s.priority === 'high')
      .map(s => ({
        action: s.title,
        impact: this.estimateImpact(s.category),
        difficulty: this.estimateDifficulty(s.category),
        timeEstimate: this.estimateTime(s.category)
      }));

    const quickWins = suggestions
      .filter(s => s.priority !== 'high')
      .slice(0, 3)
      .map(s => s.title);

    return {
      currentScore,
      targetScore,
      estimatedTimeToImprove: this.calculateTimeEstimate(highPriorityActions),
      priorityActions: highPriorityActions,
      quickWins
    };
  }

  private estimateImpact(category: string): number {
    const impactMap: Record<string, number> = {
      'keywords': 15,
      'content': 12,
      'formatting': 10,
      'structure': 8
    };
    return impactMap[category] || 5;
  }

  private estimateDifficulty(category: string): 'easy' | 'medium' | 'hard' {
    const difficultyMap: Record<string, 'easy' | 'medium' | 'hard'> = {
      'formatting': 'easy',
      'structure': 'easy',
      'keywords': 'medium',
      'content': 'hard'
    };
    return difficultyMap[category] || 'medium';
  }

  private estimateTime(category: string): string {
    const timeMap: Record<string, string> = {
      'formatting': '30 minutes',
      'structure': '1 hour',
      'keywords': '2 hours',
      'content': '4-6 hours'
    };
    return timeMap[category] || '2 hours';
  }

  private calculateTimeEstimate(actions: PriorityAction[]): string {
    if (actions.length === 0) return '1-2 hours';
    
    const totalHours = actions.reduce((total, action) => {
      const hours = parseInt(action.timeEstimate) || 2;
      return total + hours;
    }, 0);

    if (totalHours <= 2) return '1-2 hours';
    if (totalHours <= 6) return '4-6 hours';
    return '1-2 days';
  }
}

// Export singleton instance
export const analysisEngine = new AnalysisEngine();
