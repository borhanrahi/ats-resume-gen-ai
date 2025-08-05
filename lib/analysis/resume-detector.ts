export interface ResumeDetectionResult {
  isResume: boolean;
  confidence: number;
  reasons: string[];
  suggestions?: string[];
}

export class ResumeDetector {
  
  // Keywords and patterns that indicate a resume/CV
  private readonly resumeKeywords = [
    // Contact patterns
    'email', 'phone', 'address', 'linkedin', 'github',
    
    // Section headers
    'experience', 'education', 'skills', 'summary', 'objective',
    'work experience', 'professional experience', 'employment',
    'qualifications', 'achievements', 'projects', 'certifications',
    'training', 'languages', 'references', 'profile',
    
    // Professional terms
    'resume', 'curriculum vitae', 'cv', 'professional summary',
    'career objective', 'work history', 'job title', 'company',
    'responsibilities', 'accomplishments', 'degree', 'university',
    'college', 'bachelor', 'master', 'phd', 'diploma',
    
    // Action verbs commonly used in resumes
    'managed', 'developed', 'created', 'implemented', 'led',
    'achieved', 'improved', 'increased', 'reduced', 'organized',
    'coordinated', 'supervised', 'analyzed', 'designed', 'built'
  ];
  
  // Patterns that suggest it's NOT a resume
  private readonly nonResumePatterns = [
    // Academic papers
    'abstract', 'introduction', 'methodology', 'conclusion', 'references',
    'bibliography', 'literature review', 'hypothesis', 'research',
    
    // Business documents
    'invoice', 'receipt', 'contract', 'agreement', 'terms and conditions',
    'privacy policy', 'user manual', 'instructions', 'tutorial',
    
    // Personal documents
    'dear', 'sincerely', 'yours truly', 'cover letter', 'application letter',
    
    // Technical documents
    'api documentation', 'user guide', 'installation', 'configuration',
    'troubleshooting', 'faq', 'frequently asked questions'
  ];
  
  detectResume(text: string, fileName: string): ResumeDetectionResult {
    const normalizedText = text.toLowerCase();
    const normalizedFileName = fileName.toLowerCase();
    
    let confidence = 0;
    const reasons: string[] = [];
    const suggestions: string[] = [];
    
    // Check file name indicators
    const fileNameScore = this.analyzeFileName(normalizedFileName);
    confidence += fileNameScore.score;
    reasons.push(...fileNameScore.reasons);
    
    // Check content structure
    const structureScore = this.analyzeStructure(normalizedText);
    confidence += structureScore.score;
    reasons.push(...structureScore.reasons);
    
    // Check for resume keywords
    const keywordScore = this.analyzeKeywords(normalizedText);
    confidence += keywordScore.score;
    reasons.push(...keywordScore.reasons);
    
    // Check for non-resume patterns
    const nonResumeScore = this.checkNonResumePatterns(normalizedText);
    confidence -= nonResumeScore.penalty;
    if (nonResumeScore.reasons.length > 0) {
      reasons.push(...nonResumeScore.reasons);
      suggestions.push(...nonResumeScore.suggestions);
    }
    
    // Check document length (resumes are typically 1-4 pages)
    const lengthScore = this.analyzeLengthAndFormat(text);
    confidence += lengthScore.score;
    reasons.push(...lengthScore.reasons);
    
    // Normalize confidence to 0-100 scale
    confidence = Math.max(0, Math.min(100, confidence));
    
    // Debug logging
    console.log('Resume Detection Debug:', {
      fileName,
      confidence,
      fileNameScore: fileNameScore.score,
      structureScore: structureScore.score,
      keywordScore: keywordScore.score,
      nonResumeScore: nonResumeScore.penalty,
      lengthScore: lengthScore.score,
      textLength: text.length
    });
    
    let isResume = confidence >= 30; // Very lenient threshold - focus on content over length
    
    // Fallback logic: if we have any basic resume indicators, consider it a resume
    if (!isResume) {
      const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
      const phonePattern = /(\+?1[-.\ s]?)?\(?[0-9]{3}\)?[-.\ s]?[0-9]{3}[-.\ s]?[0-9]{4}/;
      
      const hasBasicIndicators = (
        emailPattern.test(text) || // Has email
        phonePattern.test(text) || // Has phone
        text.toLowerCase().includes('experience') || // Has experience section
        text.toLowerCase().includes('education') || // Has education section
        text.toLowerCase().includes('skills') || // Has skills section
        fileName.toLowerCase().includes('resume') || // Filename suggests resume
        fileName.toLowerCase().includes('cv') // Filename suggests CV
      );
      
      if (hasBasicIndicators) {
        isResume = true;
        confidence = Math.max(confidence, 45); // Boost confidence for fallback
        reasons.push('Detected basic resume indicators - proceeding with analysis');
      }
    }
    
    if (!isResume) {
      suggestions.push(
        'Ensure your document contains standard resume sections like Contact Information, Professional Experience, Education, and Skills',
        'Use clear section headings and professional formatting',
        'Include relevant keywords for your industry and role',
        'Keep the document focused on your professional background and qualifications'
      );
    }
    
    return {
      isResume,
      confidence,
      reasons: reasons.filter(r => r.length > 0),
      suggestions: suggestions.length > 0 ? suggestions : undefined
    };
  }
  
  private analyzeFileName(fileName: string): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    let score = 0;
    
    // Positive indicators in filename
    if (fileName.includes('resume') || fileName.includes('cv')) {
      score += 20;
      reasons.push('Filename contains "resume" or "CV"');
    }
    
    if (fileName.includes('curriculum')) {
      score += 15;
      reasons.push('Filename suggests curriculum vitae');
    }
    
    // Name patterns (firstname_lastname_resume, etc.)
    if (/[a-z]+[_\-\s][a-z]+[_\-\s]?(resume|cv)/i.test(fileName)) {
      score += 10;
      reasons.push('Filename follows typical resume naming pattern');
    }
    
    // Negative indicators
    if (fileName.includes('cover') && fileName.includes('letter')) {
      score -= 30;
      reasons.push('Filename suggests cover letter, not resume');
    }
    
    if (fileName.includes('invoice') || fileName.includes('receipt') || fileName.includes('contract')) {
      score -= 40;
      reasons.push('Filename suggests business document, not resume');
    }
    
    return { score, reasons };
  }
  
  private analyzeStructure(text: string): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    let score = 0;
    
    // Check for contact information patterns
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const phonePattern = /(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/;
    
    if (emailPattern.test(text)) {
      score += 15;
      reasons.push('Contains email address');
    }
    
    if (phonePattern.test(text)) {
      score += 10;
      reasons.push('Contains phone number');
    }
    
    // Check for section headers
    const sectionHeaders = [
      'experience', 'education', 'skills', 'summary', 'objective',
      'work experience', 'professional experience', 'qualifications'
    ];
    
    let foundSections = 0;
    for (const header of sectionHeaders) {
      if (text.includes(header)) {
        foundSections++;
      }
    }
    
    if (foundSections >= 3) {
      score += 25;
      reasons.push(`Contains ${foundSections} standard resume sections`);
    } else if (foundSections >= 1) {
      score += 10;
      reasons.push(`Contains ${foundSections} resume section(s)`);
    }
    
    // Check for date patterns (employment dates)
    const datePatterns = [
      /\b(19|20)\d{2}\b/g, // Years
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(19|20)\d{2}\b/gi, // Month Year
      /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g // Date formats
    ];
    
    let dateMatches = 0;
    for (const pattern of datePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        dateMatches += matches.length;
      }
    }
    
    if (dateMatches >= 4) {
      score += 15;
      reasons.push('Contains multiple dates (likely employment periods)');
    } else if (dateMatches >= 2) {
      score += 8;
      reasons.push('Contains some date references');
    }
    
    return { score, reasons };
  }
  
  private analyzeKeywords(text: string): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    let score = 0;
    
    let keywordMatches = 0;
    const foundKeywords: string[] = [];
    
    for (const keyword of this.resumeKeywords) {
      if (text.includes(keyword)) {
        keywordMatches++;
        foundKeywords.push(keyword);
      }
    }
    
    // Score based on keyword density
    if (keywordMatches >= 10) {
      score += 20;
      reasons.push(`Contains ${keywordMatches} resume-related keywords`);
    } else if (keywordMatches >= 5) {
      score += 10;
      reasons.push(`Contains ${keywordMatches} resume-related keywords`);
    } else if (keywordMatches >= 2) {
      score += 5;
      reasons.push(`Contains ${keywordMatches} resume-related keywords`);
    }
    
    return { score, reasons };
  }
  
  private checkNonResumePatterns(text: string): { 
    penalty: number; 
    reasons: string[]; 
    suggestions: string[] 
  } {
    const reasons: string[] = [];
    const suggestions: string[] = [];
    let penalty = 0;
    
    let nonResumeMatches = 0;
    const foundPatterns: string[] = [];
    
    for (const pattern of this.nonResumePatterns) {
      if (text.includes(pattern)) {
        nonResumeMatches++;
        foundPatterns.push(pattern);
      }
    }
    
    if (nonResumeMatches >= 5) {
      penalty += 40;
      reasons.push(`Document contains patterns typical of non-resume documents (${foundPatterns.slice(0, 3).join(', ')})`);
      suggestions.push('This appears to be a different type of document. Please upload your resume or CV instead.');
    } else if (nonResumeMatches >= 2) {
      penalty += 20;
      reasons.push(`Document contains some non-resume patterns (${foundPatterns.slice(0, 2).join(', ')})`);
    }
    
    // Check for cover letter patterns
    if (text.includes('dear hiring manager') || text.includes('dear sir/madam') || 
        (text.includes('sincerely') && text.includes('yours'))) {
      penalty += 50;
      reasons.push('Document appears to be a cover letter');
      suggestions.push('This looks like a cover letter. Please upload your resume/CV for ATS analysis.');
    }
    
    // Check for academic paper patterns
    if (text.includes('abstract') && text.includes('methodology') && text.includes('conclusion')) {
      penalty += 60;
      reasons.push('Document appears to be an academic paper');
      suggestions.push('This appears to be an academic paper. Please upload your resume/CV instead.');
    }
    
    return { penalty, reasons, suggestions };
  }
  
  private analyzeLengthAndFormat(text: string): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    let score = 0;
    
    const wordCount = text.split(/\s+/).length;
    const lineCount = text.split('\n').length;
    
    // Focus on content quality rather than length
    // Short resumes with good content should still be valid
    if (wordCount >= 50) {
      // Any document with at least 50 words could potentially be a resume
      // We'll rely on content analysis rather than length
      reasons.push(`Document has ${wordCount} words - analyzing content for resume indicators`);
    }
    
    // Check for bullet points (common in resumes)
    const bulletPatterns = [/^[\s]*[•\-\*]/gm, /^[\s]*\d+\./gm];
    let bulletCount = 0;
    
    for (const pattern of bulletPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        bulletCount += matches.length;
      }
    }
    
    if (bulletCount >= 5) {
      score += 10;
      reasons.push('Contains bullet points typical of resume formatting');
    }
    
    return { score, reasons };
  }
}

// Export singleton instance
export const resumeDetector = new ResumeDetector();
