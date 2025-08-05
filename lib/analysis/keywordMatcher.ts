/**
 * Keyword Matching Engine
 * Compares resume content against job description requirements
 */

import { ResumeData } from '@/types/resume';
import { JobDescription, KeywordAnalysis } from '@/types/analysis';

export interface KeywordMatchResult {
  found: string[];
  missing: string[];
  matchPercentage: number;
  density: number;
  suggestions: string[];
  categoryBreakdown: {
    technicalSkills: {
      found: string[];
      missing: string[];
      matchPercentage: number;
    };
    softSkills: {
      found: string[];
      missing: string[];
      matchPercentage: number;
    };
    experience: {
      found: string[];
      missing: string[];
      matchPercentage: number;
    };
    education: {
      found: string[];
      missing: string[];
      matchPercentage: number;
    };
  };
  priorityMissing: string[];
  strengthAreas: string[];
}

export interface KeywordMatchOptions {
  caseSensitive?: boolean;
  fuzzyMatching?: boolean;
  synonymMatching?: boolean;
  minimumMatchThreshold?: number;
  prioritizeRequiredSkills?: boolean;
}

export class KeywordMatchException extends Error {
  constructor(
    public error: {
      code: string;
      message: string;
      details?: any;
    }
  ) {
    super(error.message);
    this.name = 'KeywordMatchException';
  }
}

export class KeywordMatcher {
  // Technical skills synonyms for better matching
  private static readonly TECHNICAL_SYNONYMS: Record<string, string[]> = {
    'javascript': ['js', 'ecmascript', 'es6', 'es2015', 'es2020'],
    'typescript': ['ts'],
    'react': ['reactjs', 'react.js'],
    'angular': ['angularjs', 'angular.js'],
    'vue': ['vuejs', 'vue.js'],
    'node.js': ['nodejs', 'node'],
    'python': ['py'],
    'java': ['jvm'],
    'c++': ['cpp', 'cplusplus'],
    'c#': ['csharp', 'dotnet'],
    'sql': ['mysql', 'postgresql', 'sqlite'],
    'nosql': ['mongodb', 'cassandra', 'dynamodb'],
    'aws': ['amazon web services'],
    'gcp': ['google cloud platform', 'google cloud'],
    'azure': ['microsoft azure'],
    'docker': ['containerization'],
    'kubernetes': ['k8s', 'container orchestration'],
    'git': ['version control', 'source control'],
    'agile': ['scrum', 'kanban'],
    'ci/cd': ['continuous integration', 'continuous deployment', 'devops']
  };

  // Soft skills patterns
  private static readonly SOFT_SKILLS = [
    'communication', 'leadership', 'teamwork', 'problem solving', 'analytical',
    'creative', 'adaptable', 'organized', 'detail oriented', 'time management',
    'collaboration', 'mentoring', 'project management', 'critical thinking'
  ];

  // Experience-related keywords
  private static readonly EXPERIENCE_KEYWORDS = [
    'years experience', 'senior', 'junior', 'lead', 'manager', 'architect',
    'principal', 'staff', 'expert', 'specialist', 'consultant', 'developer',
    'engineer', 'analyst', 'designer', 'administrator'
  ];

  // Education-related keywords
  private static readonly EDUCATION_KEYWORDS = [
    'bachelor', 'master', 'phd', 'degree', 'university', 'college',
    'certification', 'certified', 'diploma', 'graduate', 'undergraduate'
  ];

  /**
   * Match resume content against job description requirements
   */
  static async match(
    resume: ResumeData,
    jobDescription: JobDescription,
    options: KeywordMatchOptions = {}
  ): Promise<KeywordMatchResult> {
    try {
      // Validate inputs first
      const validation = this.validate(resume, jobDescription);
      if (!validation.isValid) {
        throw new KeywordMatchException({
          code: 'VALIDATION_ERROR',
          message: validation.errors.join(', '),
          details: validation.errors
        });
      }

      const {
        caseSensitive = false,
        fuzzyMatching = true,
        synonymMatching = true,
        minimumMatchThreshold = 0.8,
        prioritizeRequiredSkills = true
      } = options;

      // Extract all keywords from resume
      const resumeKeywords = this.extractResumeKeywords(resume, caseSensitive);
      
      // Get job description keywords
      const jobKeywords = this.normalizeKeywords(
        [...jobDescription.extractedKeywords, ...jobDescription.requiredSkills],
        caseSensitive
      );

      // Perform matching
      const matchResult = this.performMatching(
        resumeKeywords,
        jobKeywords,
        {
          fuzzyMatching,
          synonymMatching,
          minimumMatchThreshold
        }
      );

      // Calculate category breakdowns
      const categoryBreakdown = this.calculateCategoryBreakdown(
        resume,
        jobDescription,
        caseSensitive
      );

      // Generate suggestions
      const suggestions = this.generateSuggestions(
        matchResult.missing,
        categoryBreakdown,
        prioritizeRequiredSkills
      );

      // Identify priority missing keywords
      const priorityMissing = this.identifyPriorityMissing(
        matchResult.missing,
        jobDescription.requiredSkills,
        caseSensitive
      );

      // Identify strength areas
      const strengthAreas = this.identifyStrengthAreas(
        matchResult.found,
        categoryBreakdown
      );

      return {
        found: matchResult.found,
        missing: matchResult.missing,
        matchPercentage: matchResult.matchPercentage,
        density: this.calculateKeywordDensity(matchResult.found, resume.content),
        suggestions,
        categoryBreakdown,
        priorityMissing,
        strengthAreas
      };

    } catch (error) {
      throw new KeywordMatchException({
        code: 'MATCH_ERROR',
        message: 'Failed to perform keyword matching',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Extract keywords from resume content
   */
  private static extractResumeKeywords(resume: ResumeData, caseSensitive: boolean): string[] {
    const keywords = new Set<string>();

    // Extract from main content
    const contentWords = this.extractWordsFromText(resume.content, caseSensitive);
    contentWords.forEach(word => keywords.add(word));

    // Extract from skills section
    resume.sections.skills.forEach(skill => {
      const normalizedSkill = caseSensitive ? skill : skill.toLowerCase();
      keywords.add(normalizedSkill);
    });

    // Extract from experience descriptions
    resume.sections.experience.forEach(exp => {
      const expWords = this.extractWordsFromText(
        `${exp.description} ${exp.achievements.join(' ')}`,
        caseSensitive
      );
      expWords.forEach(word => keywords.add(word));
    });

    // Extract from education
    resume.sections.education.forEach(edu => {
      const eduWords = this.extractWordsFromText(
        `${edu.degree} ${edu.field}`,
        caseSensitive
      );
      eduWords.forEach(word => keywords.add(word));
    });

    return Array.from(keywords);
  }

  /**
   * Extract meaningful words from text
   */
  private static extractWordsFromText(text: string, caseSensitive: boolean): string[] {
    const normalizedText = caseSensitive ? text : text.toLowerCase();
    
    // Extract single words and multi-word phrases
    const words = normalizedText
      .split(/\s+/)
      .map(word => word.replace(/[^\w\s.-]/g, '').trim())
      .filter(word => word.length > 2);

    // Also extract common multi-word technical terms
    const phrases = this.extractTechnicalPhrases(normalizedText);
    
    return [...words, ...phrases];
  }

  /**
   * Extract technical phrases from text
   */
  private static extractTechnicalPhrases(text: string): string[] {
    const phrases: string[] = [];
    
    const technicalPhrases = [
      'machine learning', 'data science', 'artificial intelligence',
      'web development', 'mobile development', 'full stack',
      'front end', 'back end', 'user experience', 'user interface',
      'project management', 'agile development', 'test driven development',
      'continuous integration', 'continuous deployment', 'version control',
      'database design', 'system architecture', 'cloud computing',
      'software engineering', 'quality assurance', 'code review'
    ];

    technicalPhrases.forEach(phrase => {
      if (text.includes(phrase)) {
        phrases.push(phrase);
      }
    });

    return phrases;
  }

  /**
   * Normalize keywords for comparison
   */
  private static normalizeKeywords(keywords: string[], caseSensitive: boolean): string[] {
    return keywords.map(keyword => {
      let normalized = caseSensitive ? keyword : keyword.toLowerCase();
      normalized = normalized.trim().replace(/[^\w\s.-]/g, '');
      return normalized;
    }).filter(keyword => keyword.length > 0);
  }

  /**
   * Perform the actual keyword matching
   */
  private static performMatching(
    resumeKeywords: string[],
    jobKeywords: string[],
    options: {
      fuzzyMatching: boolean;
      synonymMatching: boolean;
      minimumMatchThreshold: number;
    }
  ): { found: string[]; missing: string[]; matchPercentage: number } {
    const found: string[] = [];
    const missing: string[] = [];

    for (const jobKeyword of jobKeywords) {
      let isFound = false;

      // Direct match
      if (resumeKeywords.includes(jobKeyword)) {
        found.push(jobKeyword);
        isFound = true;
      }
      // Synonym matching
      else if (options.synonymMatching) {
        const synonymMatch = this.findSynonymMatch(jobKeyword, resumeKeywords);
        if (synonymMatch) {
          found.push(jobKeyword);
          isFound = true;
        }
      }
      // Fuzzy matching
      else if (options.fuzzyMatching) {
        const fuzzyMatch = this.findFuzzyMatch(
          jobKeyword,
          resumeKeywords,
          options.minimumMatchThreshold
        );
        if (fuzzyMatch) {
          found.push(jobKeyword);
          isFound = true;
        }
      }

      if (!isFound) {
        missing.push(jobKeyword);
      }
    }

    const matchPercentage = jobKeywords.length > 0 
      ? Math.round((found.length / jobKeywords.length) * 100)
      : 0;

    return { found, missing, matchPercentage };
  }

  /**
   * Find synonym matches
   */
  private static findSynonymMatch(keyword: string, resumeKeywords: string[]): boolean {
    // Check if keyword has synonyms
    const synonyms = this.TECHNICAL_SYNONYMS[keyword] || [];
    
    // Check if any synonym is in resume
    for (const synonym of synonyms) {
      if (resumeKeywords.includes(synonym)) {
        return true;
      }
    }

    // Check reverse - if resume keyword has synonyms that match job keyword
    for (const resumeKeyword of resumeKeywords) {
      const resumeSynonyms = this.TECHNICAL_SYNONYMS[resumeKeyword] || [];
      if (resumeSynonyms.includes(keyword)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Find fuzzy matches using string similarity
   */
  private static findFuzzyMatch(
    keyword: string,
    resumeKeywords: string[],
    threshold: number
  ): boolean {
    for (const resumeKeyword of resumeKeywords) {
      const similarity = this.calculateStringSimilarity(keyword, resumeKeyword);
      if (similarity >= threshold) {
        return true;
      }
    }
    return false;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private static calculateStringSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    const matrix: number[][] = [];

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletion
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len1][len2]) / maxLen;
  }

  /**
   * Calculate category breakdown
   */
  private static calculateCategoryBreakdown(
    resume: ResumeData,
    jobDescription: JobDescription,
    caseSensitive: boolean
  ) {
    const resumeContent = caseSensitive ? resume.content : resume.content.toLowerCase();
    const jobContent = caseSensitive ? jobDescription.content : jobDescription.content.toLowerCase();

    // Technical skills
    const technicalSkills = this.matchCategory(
      resume.sections.skills,
      jobDescription.requiredSkills,
      caseSensitive
    );

    // Soft skills
    const softSkills = this.matchCategory(
      this.extractSoftSkills(resumeContent),
      this.extractSoftSkills(jobContent),
      caseSensitive
    );

    // Experience
    const experience = this.matchCategory(
      this.extractExperienceKeywords(resumeContent),
      this.extractExperienceKeywords(jobContent),
      caseSensitive
    );

    // Education
    const education = this.matchCategory(
      this.extractEducationKeywords(resumeContent),
      this.extractEducationKeywords(jobContent),
      caseSensitive
    );

    return {
      technicalSkills,
      softSkills,
      experience,
      education
    };
  }

  /**
   * Match keywords within a specific category
   */
  private static matchCategory(
    resumeKeywords: string[],
    jobKeywords: string[],
    caseSensitive: boolean
  ) {
    const normalizedResumeKeywords = this.normalizeKeywords(resumeKeywords, caseSensitive);
    const normalizedJobKeywords = this.normalizeKeywords(jobKeywords, caseSensitive);

    const found = normalizedJobKeywords.filter(keyword => 
      normalizedResumeKeywords.includes(keyword)
    );
    const missing = normalizedJobKeywords.filter(keyword => 
      !normalizedResumeKeywords.includes(keyword)
    );

    const matchPercentage = normalizedJobKeywords.length > 0
      ? Math.round((found.length / normalizedJobKeywords.length) * 100)
      : 0;

    return { found, missing, matchPercentage };
  }

  /**
   * Extract soft skills from text
   */
  private static extractSoftSkills(text: string): string[] {
    return this.SOFT_SKILLS.filter(skill => text.includes(skill));
  }

  /**
   * Extract experience keywords from text
   */
  private static extractExperienceKeywords(text: string): string[] {
    return this.EXPERIENCE_KEYWORDS.filter(keyword => text.includes(keyword));
  }

  /**
   * Extract education keywords from text
   */
  private static extractEducationKeywords(text: string): string[] {
    return this.EDUCATION_KEYWORDS.filter(keyword => text.includes(keyword));
  }

  /**
   * Calculate keyword density in resume
   */
  private static calculateKeywordDensity(foundKeywords: string[], resumeContent: string): number {
    const totalWords = resumeContent.split(/\s+/).length;
    const keywordCount = foundKeywords.length;
    
    return totalWords > 0 ? Math.round((keywordCount / totalWords) * 100 * 100) / 100 : 0;
  }

  /**
   * Generate improvement suggestions
   */
  private static generateSuggestions(
    missingKeywords: string[],
    categoryBreakdown: any,
    prioritizeRequiredSkills: boolean
  ): string[] {
    const suggestions: string[] = [];

    // Technical skills suggestions
    if (categoryBreakdown.technicalSkills.missing.length > 0) {
      const topMissing = categoryBreakdown.technicalSkills.missing.slice(0, 3);
      suggestions.push(
        `Add technical skills: ${topMissing.join(', ')} to better match job requirements`
      );
    }

    // Experience suggestions
    if (categoryBreakdown.experience.matchPercentage < 50) {
      suggestions.push(
        'Highlight relevant experience using keywords from the job description'
      );
    }

    // Soft skills suggestions
    if (categoryBreakdown.softSkills.missing.length > 0) {
      suggestions.push(
        'Include soft skills mentioned in the job posting in your summary or experience descriptions'
      );
    }

    // General keyword density suggestion
    if (missingKeywords.length > 5) {
      suggestions.push(
        'Consider incorporating more job-specific keywords throughout your resume'
      );
    }

    // Education suggestions
    if (categoryBreakdown.education.missing.length > 0) {
      suggestions.push(
        'Ensure your education section includes relevant qualifications mentioned in the job posting'
      );
    }

    return suggestions;
  }

  /**
   * Identify priority missing keywords
   */
  private static identifyPriorityMissing(
    missingKeywords: string[],
    requiredSkills: string[],
    caseSensitive: boolean
  ): string[] {
    const normalizedRequired = this.normalizeKeywords(requiredSkills, caseSensitive);
    const normalizedMissing = this.normalizeKeywords(missingKeywords, caseSensitive);

    return normalizedMissing.filter(keyword => 
      normalizedRequired.includes(keyword)
    ).slice(0, 5); // Top 5 priority missing
  }

  /**
   * Identify strength areas
   */
  private static identifyStrengthAreas(
    foundKeywords: string[],
    categoryBreakdown: unknown
  ): string[] {
    const strengths: string[] = [];

    if (categoryBreakdown.technicalSkills.matchPercentage >= 70) {
      strengths.push('Strong technical skills match');
    }

    if (categoryBreakdown.experience.matchPercentage >= 70) {
      strengths.push('Relevant experience highlighted');
    }

    if (categoryBreakdown.softSkills.matchPercentage >= 70) {
      strengths.push('Good soft skills alignment');
    }

    if (foundKeywords.length >= 10) {
      strengths.push('Comprehensive keyword coverage');
    }

    return strengths;
  }

  /**
   * Validate inputs for keyword matching
   */
  static validate(resume: ResumeData, jobDescription: JobDescription): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!resume || !resume.content) {
      errors.push('Resume content is required');
    }

    if (!jobDescription || !jobDescription.content) {
      errors.push('Job description content is required');
    }

    if (resume && resume.content && resume.content.trim().length < 20) {
      errors.push('Resume content is too short for meaningful analysis');
    }

    if (jobDescription && jobDescription.content && jobDescription.content.trim().length < 20) {
      errors.push('Job description content is too short for meaningful analysis');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}