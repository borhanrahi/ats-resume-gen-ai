/**
 * Job Description Parser
 * Extracts keywords, skills, and requirements from job descriptions
 */

import { JobDescription } from '@/types/analysis';

export interface JobDescriptionParseResult {
  content: string;
  extractedKeywords: string[];
  requiredSkills: string[];
  experienceLevel: string;
  jobTitle: string;
  metadata: {
    wordCount: number;
    processedDate: Date;
    source: 'text' | 'file';
  };
}

export class JobDescriptionParseException extends Error {
  constructor(
    public error: {
      code: string;
      message: string;
      details?: any;
    }
  ) {
    super(error.message);
    this.name = 'JobDescriptionParseException';
  }
}

export class JobDescriptionParser {
  // Common technical skills patterns
  private static readonly TECHNICAL_SKILLS_PATTERNS = [
    // Programming languages
    /\b(?:javascript|typescript|python|java|c\+\+|c#|php|ruby|go|rust|swift|kotlin|scala|r|matlab)\b/gi,
    // Frameworks and libraries
    /\b(?:react|angular|vue|node\.?js|express|django|flask|spring|laravel|rails|\.net|asp\.net)\b/gi,
    // Databases
    /\b(?:mysql|postgresql|mongodb|redis|elasticsearch|cassandra|oracle|sql\s+server|sqlite)\b/gi,
    // Cloud platforms
    /\b(?:aws|azure|gcp|google\s+cloud|amazon\s+web\s+services|microsoft\s+azure)\b/gi,
    // DevOps tools
    /\b(?:docker|kubernetes|jenkins|gitlab|github|terraform|ansible|chef|puppet)\b/gi,
    // Other technologies
    /\b(?:git|linux|unix|windows|macos|api|rest|graphql|microservices|agile|scrum)\b/gi
  ];

  // Experience level patterns
  private static readonly EXPERIENCE_PATTERNS = [
    { pattern: /\b(?:principal|staff|architect|10\+?\s+years?|expert|specialist)\b/gi, level: 'expert' },
    { pattern: /\b(?:senior|lead|5\+?\s+years?|6\+?\s+years?|7\+?\s+years?|8\+?\s+years?)\b/gi, level: 'senior' },
    { pattern: /\b(?:mid[\s-]?level|intermediate|2[\s-]?5\s+years?|3[\s-]?5\s+years?)\b/gi, level: 'mid' },
    { pattern: /\b(?:entry[\s-]?level|junior|0[\s-]?2\s+years?|fresh\s+graduate|new\s+grad)\b/gi, level: 'entry' }
  ];

  // Job title extraction patterns
  private static readonly JOB_TITLE_PATTERNS = [
    /(?:position|role|job\s+title|title):\s*([^\n\r.]+)/gi,
    /^([^\n\r]+?)(?:\s*-\s*|\s*\|\s*|\s*at\s+)/gim,
    /we\s+are\s+(?:looking\s+for|seeking|hiring)\s+(?:a|an)\s+([^\n\r.]+?)(?:\s+to\s+|\s+who\s+|\s*\.|\s*$)/gi
  ];

  // Keyword extraction patterns (action verbs, requirements, etc.)
  private static readonly KEYWORD_PATTERNS = [
    // Requirements keywords
    /\b(?:required?|must\s+have|essential|mandatory|necessary|needed|should\s+have)\b/gi,
    // Action verbs
    /\b(?:develop|build|create|design|implement|maintain|manage|lead|collaborate|analyze|optimize|troubleshoot)\b/gi,
    // Qualifications
    /\b(?:bachelor|master|phd|degree|certification|experience|knowledge|skills?|proficiency)\b/gi
  ];

  /**
   * Parse job description text and extract structured information
   */
  static async parse(content: string, source: 'text' | 'file' = 'text'): Promise<JobDescriptionParseResult> {
    try {
      if (!content || content.trim().length === 0) {
        throw new JobDescriptionParseException({
          code: 'EMPTY_CONTENT',
          message: 'Job description content is empty'
        });
      }

      // Clean and normalize content
      const cleanContent = this.cleanContent(content);
      
      // Extract job title
      const jobTitle = this.extractJobTitle(cleanContent);
      
      // Extract technical skills
      const requiredSkills = this.extractTechnicalSkills(cleanContent);
      
      // Extract general keywords
      const extractedKeywords = this.extractKeywords(cleanContent);
      
      // Determine experience level
      const experienceLevel = this.extractExperienceLevel(cleanContent);
      
      // Calculate word count
      const wordCount = cleanContent.split(/\s+/).filter(word => word.length > 0).length;

      return {
        content: cleanContent,
        extractedKeywords,
        requiredSkills,
        experienceLevel,
        jobTitle,
        metadata: {
          wordCount,
          processedDate: new Date(),
          source
        }
      };

    } catch (error) {
      if (error instanceof JobDescriptionParseException) {
        throw error;
      }
      
      throw new JobDescriptionParseException({
        code: 'PARSE_ERROR',
        message: 'Failed to parse job description',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Clean and normalize job description content
   */
  private static cleanContent(content: string): string {
    return content
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove special characters that might interfere with parsing
      .replace(/[^\w\s\-.,;:()\[\]{}'"\/\\@#$%&*+=<>?!]/g, ' ')
      // Normalize line breaks
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove multiple consecutive newlines
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Extract job title from content
   */
  private static extractJobTitle(content: string): string {
    // Try different patterns to extract job title
    for (const pattern of this.JOB_TITLE_PATTERNS) {
      pattern.lastIndex = 0; // Reset regex state
      const match = pattern.exec(content);
      if (match && match[1]) {
        const title = match[1].trim();
        if (title.length > 3 && title.length < 100) {
          return this.cleanJobTitle(title);
        }
      }
    }

    // Fallback: try to extract from first line if it looks like a title
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const firstLine = lines[0];
    
    if (firstLine && firstLine.length > 3 && firstLine.length < 100 && 
        !firstLine.toLowerCase().includes('company') && 
        !firstLine.toLowerCase().includes('about') &&
        !firstLine.toLowerCase().includes('we are')) {
      return this.cleanJobTitle(firstLine);
    }

    return 'Software Engineer'; // Default fallback
  }

  /**
   * Clean extracted job title
   */
  private static cleanJobTitle(title: string): string {
    return title
      .replace(/^(job\s+title|position|role):\s*/gi, '')
      .replace(/\s*-\s*.*$/, '') // Remove everything after dash
      .replace(/\s*\|.*$/, '') // Remove everything after pipe
      .replace(/\s*at\s+.*$/gi, '') // Remove company name after "at"
      .trim();
  }

  /**
   * Extract technical skills from content
   */
  private static extractTechnicalSkills(content: string): string[] {
    const skills = new Set<string>();

    for (const pattern of this.TECHNICAL_SKILLS_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const skill = match.toLowerCase().trim();
          if (skill.length > 1) {
            skills.add(this.normalizeSkill(skill));
          }
        });
      }
    }

    // Also look for skills in common sections
    const skillsSections = this.extractSkillsSections(content);
    skillsSections.forEach(skill => skills.add(skill));

    return Array.from(skills).sort();
  }

  /**
   * Extract skills from dedicated skills sections
   */
  private static extractSkillsSections(content: string): string[] {
    const skills: string[] = [];
    
    // Look for skills sections with more flexible patterns
    const skillsSectionPatterns = [
      /(?:required\s+skills?|technical\s+skills?|technologies?|tools?|skills?):\s*([^\n\r]+(?:\n[^\n\r]+)*)/gi,
      /skills?:\s*([^\n\r]+)/gi,
      /(?:experience\s+with|knowledge\s+of|proficiency\s+in):\s*([^\n\r]+)/gi
    ];
    
    for (const pattern of skillsSectionPatterns) {
      pattern.lastIndex = 0; // Reset regex state
      let match;
      while ((match = pattern.exec(content)) !== null) {
        // Extract individual skills from the section
        const skillsText = match[1];
        const individualSkills = skillsText
          .split(/[,;•\n\r-]/)
          .map(skill => skill.trim().toLowerCase())
          .map(skill => skill.replace(/^[\s\-•]+|[\s\-•]+$/g, '')) // Remove leading/trailing punctuation
          .filter(skill => skill.length > 1 && skill.length < 30)
          .map(skill => this.normalizeSkill(skill));
        
        skills.push(...individualSkills);
      }
    }

    return skills;
  }

  /**
   * Normalize skill names
   */
  private static normalizeSkill(skill: string): string {
    const cleanSkill = skill.toLowerCase().trim();
    const normalizations: Record<string, string> = {
      'js': 'javascript',
      'ts': 'typescript',
      'node': 'node.js',
      'nodejs': 'node.js',
      'reactjs': 'react',
      'vuejs': 'vue',
      'angularjs': 'angular',
      'c++': 'cpp',
      'c#': 'csharp',
      '.net': 'dotnet',
      'asp.net': 'aspnet'
    };

    return normalizations[cleanSkill] || cleanSkill;
  }

  /**
   * Extract general keywords from content
   */
  private static extractKeywords(content: string): string[] {
    const keywords = new Set<string>();

    // Extract important nouns and phrases
    const words = content.toLowerCase().split(/\s+/);
    
    // Look for multi-word technical terms
    for (let i = 0; i < words.length - 1; i++) {
      const twoWordPhrase = `${words[i]} ${words[i + 1]}`;
      const threeWordPhrase = i < words.length - 2 ? `${words[i]} ${words[i + 1]} ${words[i + 2]}` : '';
      
      // Add relevant multi-word phrases
      if (this.isRelevantPhrase(twoWordPhrase)) {
        keywords.add(twoWordPhrase);
      }
      if (threeWordPhrase && this.isRelevantPhrase(threeWordPhrase)) {
        keywords.add(threeWordPhrase);
      }
    }

    // Extract single important words
    words.forEach(word => {
      if (this.isRelevantKeyword(word)) {
        keywords.add(word);
      }
    });

    return Array.from(keywords).sort();
  }

  /**
   * Check if a phrase is relevant for keyword extraction
   */
  private static isRelevantPhrase(phrase: string): boolean {
    const relevantPhrases = [
      'machine learning', 'data science', 'software development', 'web development',
      'full stack', 'front end', 'back end', 'user experience', 'user interface',
      'project management', 'agile development', 'test driven', 'code review',
      'version control', 'continuous integration', 'continuous deployment'
    ];

    return relevantPhrases.some(relevant => phrase.includes(relevant));
  }

  /**
   * Check if a word is relevant for keyword extraction
   */
  private static isRelevantKeyword(word: string): boolean {
    // Skip common words and very short words
    if (word.length < 3) return false;
    
    const commonWords = new Set([
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'
    ]);

    return !commonWords.has(word) && /^[a-z]+$/.test(word);
  }

  /**
   * Extract experience level from content
   */
  private static extractExperienceLevel(content: string): string {
    for (const { pattern, level } of this.EXPERIENCE_PATTERNS) {
      if (pattern.test(content)) {
        return level;
      }
    }

    // Default to mid-level if no specific level found
    return 'mid';
  }

  /**
   * Validate job description content
   */
  static validate(content: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!content || content.trim().length === 0) {
      errors.push('Job description cannot be empty');
    }

    if (content.trim().length < 50) {
      errors.push('Job description is too short (minimum 50 characters)');
    }

    if (content.length > 10000) {
      errors.push('Job description is too long (maximum 10,000 characters)');
    }

    // Check for basic job posting structure
    const hasJobTitle = /(?:position|role|job\s+title|we\s+are\s+(?:looking|seeking|hiring))/gi.test(content);
    const hasRequirements = /(?:require|must|should|need|experience|skill)/gi.test(content);

    if (!hasJobTitle && !hasRequirements) {
      errors.push('Content does not appear to be a valid job description');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}