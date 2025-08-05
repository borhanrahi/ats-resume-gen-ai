import { text } from "stream/consumers";
import { text } from "stream/consumers";
import { text } from "stream/consumers";
import { text } from "stream/consumers";
import { text } from "stream/consumers";
import { text } from "stream/consumers";
import { string } from "zod";
import { text } from "stream/consumers";
import { text } from "stream/consumers";
import { text } from "stream/consumers";
import { text } from "stream/consumers";
import { string } from "zod";
import { text } from "stream/consumers";
import { text } from "stream/consumers";
import { string } from "zod";
import { string } from "zod";
import { text } from "stream/consumers";
import { text } from "stream/consumers";
import { text } from "stream/consumers";
import { string } from "zod";
import { text } from "stream/consumers";
import { text } from "stream/consumers";
import { string } from "zod";
import { text } from "stream/consumers";
import { text } from "stream/consumers";
import { text } from "stream/consumers";
import { string } from "zod";
import { text } from "stream/consumers";
import { text } from "stream/consumers";
import { text } from "stream/consumers";
import { string } from "zod";
import { string } from "zod";
import { text } from "stream/consumers";
import { text } from "stream/consumers";
import { text } from "stream/consumers";
import { text } from "stream/consumers";
import { string } from "zod";
import { string } from "zod";
import { text } from "stream/consumers";
import { text } from "stream/consumers";
import { text } from "stream/consumers";
import { text } from "stream/consumers";
import { text } from "stream/consumers";
import { text } from "stream/consumers";
import { text } from "stream/consumers";
import { text } from "stream/consumers";
import { text } from "stream/consumers";

export interface ATSScoreResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  dimensions: {
    textExtraction: DimensionScore;
    structure: DimensionScore;
    formatting: DimensionScore;
    keywords: DimensionScore;
    content: DimensionScore;
    language: DimensionScore;
  };
  penalties: Penalty[];
  recommendations: string[];
  detailedFeedback: string;
}

export interface DimensionScore {
  name: string;
  score: number;
  maxScore: number;
  percentage: number;
  details: ScoreDetail[];
}

export interface ScoreDetail {
  criterion: string;
  score: number;
  maxScore: number;
  feedback: string;
}

export interface Penalty {
  type: string;
  description: string;
  points: number;
}

export interface ParsedDocument {
  text: string;
  fileType: string;
  extractionRate: number;
  hasHiddenText: boolean;
  encoding: string;
  structure: DocumentStructure;
  formatting: DocumentFormatting;
}

export interface DocumentStructure {
  sections: DetectedSection[];
  contactInfo: ContactInfo;
  hasProperHeadings: boolean;
}

export interface DetectedSection {
  name: string;
  content: string;
  startIndex: number;
  endIndex: number;
}

export interface ContactInfo {
  name?: string;
  email?: string;
  phone?: string;
  position: 'top' | 'middle' | 'bottom' | 'missing';
}

export interface DocumentFormatting {
  layout: 'single-column' | 'multi-column' | 'mixed';
  hasGraphics: boolean;
  hasTables: boolean;
  fontConsistency: 'good' | 'minor-issues' | 'major-issues';
  spacing: 'good' | 'acceptable' | 'poor';
}

export class ATSScoringEngine {
  private actionVerbs: string[] = [
    'achieved', 'accomplished', 'delivered', 'exceeded', 'generated', 'increased', 'improved', 'optimized',
    'managed', 'led', 'supervised', 'coordinated', 'directed', 'mentored', 'trained', 'guided',
    'developed', 'created', 'designed', 'built', 'implemented', 'launched', 'established', 'founded',
    'analyzed', 'researched', 'evaluated', 'assessed', 'investigated', 'identified', 'solved', 'resolved',
    'collaborated', 'communicated', 'presented', 'negotiated', 'facilitated', 'supported', 'assisted'
  ];

  private commonSkills: string[] = [
    'javascript', 'python', 'java', 'react', 'node', 'angular', 'vue', 'html', 'css', 'sql',
    'mongodb', 'postgresql', 'mysql', 'aws', 'azure', 'docker', 'kubernetes', 'git', 'typescript',
    'project management', 'agile', 'scrum', 'leadership', 'communication', 'teamwork', 'problem solving'
  ];

  constructor() {}

  public async analyzeResume(
    parsedDocument: ParsedDocument,
    jobDescription?: string,
    targetKeywords?: string[]
  ): Promise<ATSScoreResult> {
    console.log('=== DETAILED ATS SCORING START ===');
    console.log('Input:', {
      textLength: parsedDocument.text.length,
      hasJobDescription: !!jobDescription,
      sectionsCount: parsedDocument.structure.sections.length,
      targetKeywords: targetKeywords?.length
    });

    const textExtraction = this.scoreTextExtraction(parsedDocument);
    const structure = this.scoreStructure(parsedDocument);
    const formatting = this.scoreFormatting(parsedDocument);
    const keywords = this.scoreKeywords(parsedDocument, jobDescription, targetKeywords);
    const content = this.scoreContent(parsedDocument);
    const language = await this.scoreLanguage(parsedDocument);

    const dimensions = [textExtraction, structure, formatting, keywords, content, language];
    
    let totalScore = dimensions.reduce((sum, dim) => sum + dim.score, 0);
    const maxScore = dimensions.reduce((sum, dim) => sum + dim.maxScore, 0);

    const penalties = this.calculatePenalties(parsedDocument, { density: 2 }); // Simple fallback
    const penaltyPoints = penalties.reduce((sum: number, p: Penalty) => sum + p.points, 0);
    totalScore = Math.max(0, totalScore - penaltyPoints);

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    const recommendations = this.generateRecommendations(dimensions, penalties);

    const result: ATSScoreResult = {
      totalScore,
      maxScore,
      percentage,
      dimensions: {
        textExtraction,
        structure,
        formatting,
        keywords,
        content,
        language,
      },
      penalties,
      recommendations,
      detailedFeedback: this.generateDetailedFeedback(percentage, dimensions),
    };

    console.log('=== DETAILED ATS SCORING RESULT ===');
    console.log('Final Score:', {
      total: totalScore,
      max: maxScore,
      percentage,
      penalties: penalties.length,
      recommendations: recommendations.length
    });

    return result;
  }

  private scoreTextExtraction(doc: ParsedDocument): DimensionScore {
    const details: ScoreDetail[] = [];
    let totalScore = 0;

    // File Type Support (5 pts)
    let fileTypeScore = 0;
    if (doc.fileType === 'docx' || (doc.fileType === 'pdf' && doc.extractionRate > 0.9)) {
      fileTypeScore = 5;
      details.push({
        criterion: 'File Type Support',
        score: 5,
        maxScore: 5,
        feedback: 'Excellent file format for ATS parsing'
      });
    } else {
      details.push({
        criterion: 'File Type Support',
        score: 0,
        maxScore: 5,
        feedback: 'Consider using .docx or text-based PDF for better ATS compatibility'
      });
    }

    // Extraction Completeness (8 pts)
    let extractionScore = 0;
    if (doc.extractionRate >= 0.95) extractionScore = 8;
    else if (doc.extractionRate >= 0.85) extractionScore = 6;
    else if (doc.extractionRate >= 0.75) extractionScore = 4;
    else extractionScore = 2;

    details.push({
      criterion: 'Extraction Completeness',
      score: extractionScore,
      maxScore: 8,
      feedback: `${Math.round(doc.extractionRate * 100)}% of text successfully extracted`
    });

    // Hidden Text Leakage (4 pts)
    let hiddenTextScore = doc.hasHiddenText ? 0 : 4;
    details.push({
      criterion: 'Hidden Text Leakage',
      score: hiddenTextScore,
      maxScore: 4,
      feedback: doc.hasHiddenText ? 
        'Some text may be hidden in headers/footers - ensure all important info is in main content' :
        'No hidden text detected - good for ATS parsing'
    });

    // Encoding & Character Set (3 pts)
    let encodingScore = 0;
    if (doc.encoding === 'standard') encodingScore = 3;
    else if (doc.encoding === 'minor-issues') encodingScore = 1;

    details.push({
      criterion: 'Encoding & Character Set',
      score: encodingScore,
      maxScore: 3,
      feedback: encodingScore === 3 ? 
        'Standard character encoding detected' :
        'Some special characters may cause parsing issues'
    });

    totalScore = fileTypeScore + extractionScore + hiddenTextScore + encodingScore;

    return {
      name: 'Text Extraction & Parsing Integrity',
      score: totalScore,
      maxScore: 20,
      percentage: Math.round((totalScore / 20) * 100),
      details
    };
  }

  private scoreStructure(doc: ParsedDocument): DimensionScore {
    const details: ScoreDetail[] = [];
    let totalScore = 0;

    // Core Section Presence (10 pts)
    const requiredSections = ['summary', 'experience', 'education', 'skills'];
    const foundSections = doc.structure.sections.map(s => s.name.toLowerCase());
    const matchedSections = requiredSections.filter(req => 
      foundSections.some(found => found.includes(req))
    );

    let sectionScore = 0;
    if (matchedSections.length === 4) sectionScore = 10;
    else if (matchedSections.length === 3) sectionScore = 7;
    else if (matchedSections.length === 2) sectionScore = 4;

    details.push({
      criterion: 'Core Section Presence',
      score: sectionScore,
      maxScore: 10,
      feedback: `Found ${matchedSections.length}/4 required sections: ${matchedSections.join(', ')}`
    });

    // Contact Block Positioning (5 pts)
    let contactScore = 0;
    const contact = doc.structure.contactInfo;
    let contactCount = 0;
    if (contact.name) contactCount++;
    if (contact.email) contactCount++;
    if (contact.phone) contactCount++;

    if (contactCount === 3 && contact.position === 'top') contactScore = 5;
    else if (contactCount >= 2 && contact.position === 'top') contactScore = 3;
    else if (contactCount >= 1 && contact.position === 'top') contactScore = 1;

    details.push({
      criterion: 'Contact Block Positioning',
      score: contactScore,
      maxScore: 5,
      feedback: `${contactCount}/3 contact details found ${contact.position === 'top' ? 'at top' : 'not at top'}`
    });

    totalScore = sectionScore + contactScore;

    return {
      name: 'Structure & Section Compliance',
      score: totalScore,
      maxScore: 15,
      percentage: Math.round((totalScore / 15) * 100),
      details
    };
  }

  private scoreFormatting(doc: ParsedDocument): DimensionScore {
    const details: ScoreDetail[] = [];
    let totalScore = 0;

    // Single-Column Layout (5 pts)
    let layoutScore = 0;
    if (doc.formatting.layout === 'single-column') layoutScore = 5;
    else if (doc.formatting.layout === 'mixed') layoutScore = 3;

    details.push({
      criterion: 'Single-Column Layout',
      score: layoutScore,
      maxScore: 5,
      feedback: doc.formatting.layout === 'single-column' ? 
        'Clean single-column layout - excellent for ATS' :
        'Consider using single-column layout for better ATS compatibility'
    });

    // Graphics & Table Usage (7 pts)
    let graphicsScore = 7;
    if (doc.formatting.hasGraphics || doc.formatting.hasTables) {
      graphicsScore = 0;
    }

    details.push({
      criterion: 'Graphics & Table Usage',
      score: graphicsScore,
      maxScore: 7,
      feedback: graphicsScore === 7 ? 
        'No graphics or tables detected - perfect for ATS' :
        'Remove graphics and tables for better ATS parsing'
    });

    // Font & Style Consistency (5 pts)
    let fontScore = 0;
    if (doc.formatting.fontConsistency === 'good') fontScore = 5;
    else if (doc.formatting.fontConsistency === 'minor-issues') fontScore = 2;

    details.push({
      criterion: 'Font & Style Consistency',
      score: fontScore,
      maxScore: 5,
      feedback: fontScore === 5 ? 
        'Consistent standard fonts used' :
        'Use standard fonts like Arial, Calibri, or Times New Roman'
    });

    // Spacing & Margins (3 pts)
    let spacingScore = 0;
    if (doc.formatting.spacing === 'good') spacingScore = 3;
    else if (doc.formatting.spacing === 'acceptable') spacingScore = 1;

    details.push({
      criterion: 'Spacing & Margins',
      score: spacingScore,
      maxScore: 3,
      feedback: spacingScore === 3 ? 
        'Good spacing and margins' :
        'Ensure margins are at least 0.5 inches and proper line spacing'
    });

    totalScore = layoutScore + graphicsScore + fontScore + spacingScore;

    return {
      name: 'Formatting & ATS Compatibility',
      score: totalScore,
      maxScore: 20,
      percentage: Math.round((totalScore / 20) * 100),
      details
    };
  }

  private scoreKeywords(
    doc: ParsedDocument, 
    jobDescription?: string, 
    targetKeywords?: string[]
  ): DimensionScore {
    const details: ScoreDetail[] = [];
    let totalScore = 0;

    const keywordsToFind = targetKeywords || (jobDescription ? this.extractKeywordsFromJD(jobDescription) : []);
    
    if (keywordsToFind.length === 0) {
      details.push({ criterion: 'Keyword Source', score: 0, maxScore: 20, feedback: 'No job description or keywords provided for comparison.' });
      return { name: 'Keyword Relevance & Density', score: 0, maxScore: 20, percentage: 0, details };
    }

    const resumeText = doc.text.toLowerCase();
    const foundKeywords = keywordsToFind.filter(kw => resumeText.includes(kw.toLowerCase()));
    
    const matchPercentage = foundKeywords.length / keywordsToFind.length;
    const keywordScore = Math.round(matchPercentage * 15);
    details.push({
        criterion: 'Keyword Matching',
        score: keywordScore, maxScore: 15,
        feedback: `Matched ${foundKeywords.length}/${keywordsToFind.length} keywords from the job description.`
    });

    const skillsFound = this.commonSkills.filter(skill => resumeText.includes(skill));
    const skillScore = Math.min(5, skillsFound.length);
    details.push({
        criterion: 'Skills Identification',
        score: skillScore, maxScore: 5,
        feedback: `Identified ${skillsFound.length} common skills in your resume.`
    });

    totalScore = keywordScore + skillScore;

    return {
        name: 'Keyword Relevance & Density',
        score: totalScore, maxScore: 20,
        percentage: Math.round((totalScore / 20) * 100),
        details
    };
  }

  private scoreContent(doc: ParsedDocument): DimensionScore {
    const details: ScoreDetail[] = [];
    let totalScore = 0;
    const text = doc.text.toLowerCase();

    const actionVerbCount = this.actionVerbs.filter(verb => text.includes(` ${verb}`)).length;
    let actionVerbScore = 0;
    if (actionVerbCount >= 9) actionVerbScore = 5;
    else if (actionVerbCount >= 6) actionVerbScore = 4;
    else if (actionVerbCount >= 3) actionVerbScore = 3;
    else if (actionVerbCount >= 1) actionVerbScore = 2;
    details.push({
      criterion: 'Action Verbs Usage',
      score: actionVerbScore, maxScore: 5,
      feedback: `Found ${actionVerbCount} action verbs. Using strong action verbs makes your resume more impactful.`
    });

    const quantifiedLines = (text.match(/\d+%?|\d+k|\d+,\d+/g) || []).length;
    let quantifiedScore = Math.min(5, quantifiedLines);
    details.push({
      criterion: 'Quantified Achievements',
      score: quantifiedScore, maxScore: 5,
      feedback: `Found ${quantifiedLines} quantified achievements. Using numbers to show impact is highly effective.`
    });

    const bulletPoints = doc.text.split(/\n\s*?[•*-]/).slice(1);
    const goodBulletPoints = bulletPoints.filter(bp => bp.trim().length > 10 && bp.trim().length < 150).length;
    let bulletScore = Math.min(5, Math.floor(goodBulletPoints / 2));
    details.push({
      criterion: 'Bullet Point Readability',
      score: bulletScore, maxScore: 5,
      feedback: `${goodBulletPoints}/${bulletPoints.length} bullet points are well-structured and easy to read.`
    });

    totalScore = actionVerbScore + quantifiedScore + bulletScore;

    return {
      name: 'Content Impact & Metrics',
      score: totalScore, maxScore: 15,
      percentage: Math.round((totalScore / 15) * 100),
      details
    };
  }

  private scoreLanguage(doc: ParsedDocument): DimensionScore {
    const details: ScoreDetail[] = [];
    let totalScore = 0;
    const text = doc.text;

    const typos = (text.match(/\s(teh|adn|manger)\s/gi) || []).length;
    let grammarScore = Math.max(0, 5 - typos * 2);
    details.push({
      criterion: 'Grammar & Typos',
      score: grammarScore, maxScore: 5,
      feedback: `Found ${typos} potential typos. Proofread carefully to avoid simple mistakes.`
    });

    const unprofessionalWords = (text.toLowerCase().match(/i think|i feel|stuff|things/g) || []).length;
    let toneScore = Math.max(0, 5 - unprofessionalWords);
    details.push({
      criterion: 'Professional Tone',
      score: toneScore, maxScore: 5,
      feedback: toneScore > 0 ? 
        'Resume maintains a professional tone. Avoid using overly casual language.' :
        'Some unprofessional words detected - consider rephrasing.'
    });

    totalScore = grammarScore + toneScore;

    return {
      name: 'Language, Grammar & Tone',
      score: totalScore, maxScore: 10,
      percentage: Math.round((totalScore / 10) * 100),
      details
    };
  }

  private extractKeywordsFromJD(jobDescription: string): string[] {
    const text = jobDescription.toLowerCase();
    const stopWords = new Set(['and', 'the', 'for', 'with', 'our', 'you', 'will', 'be', 'is', 'are', 'a', 'in', 'to', 'of']);
    const words = text.replace(/[^\w\s-]/g, '').split(/\s+/);
    const keywords = words.filter(word => word.length > 3 && !stopWords.has(word));
    return [...new Set(keywords)].slice(0, 50);
  }

  private scoreContent(doc: ParsedDocument): DimensionScore {
    const details: ScoreDetail[] = [];
    let totalScore = 0;

    const bullets = this.extractBulletPoints(doc.text);

    // Action Verb Usage (5 pts)
    const actionVerbCount = bullets.filter(bullet =>
      this.actionVerbs.some(verb => 
        bullet.toLowerCase().trim().startsWith(verb.toLowerCase())
      )
    ).length;
  
    let actionVerbScore = 0;
    if (actionVerbCount === 0) {
      actionVerbScore = 0;
    } else if (actionVerbCount <= 2) {
      actionVerbScore = 2;
    } else if (actionVerbCount <= 5) {
      actionVerbScore = 3;
    } else if (actionVerbCount <= 8) {
      actionVerbScore = 4;
    } else {
      actionVerbScore = 5;
    }

    details.push({
      criterion: 'Action Verb Usage',
      score: actionVerbScore,
      maxScore: 5,
      feedback: `${actionVerbCount} bullets start with strong action verbs`
    });

    // Quantified Achievements (6 pts)
    const quantifiedBullets = bullets.filter(bullet => 
      /\d+[%$#]|\d+\s*(percent|dollars?|times?|years?|months?)|\$\d+|[0-9,]+\+?/i.test(bullet)
    ).length;
  
    let quantifiedScore = 0;
    if (quantifiedBullets === 0) {
      quantifiedScore = 0;
    } else if (quantifiedBullets <= 2) {
      quantifiedScore = 3;
    } else if (quantifiedBullets <= 4) {
      quantifiedScore = 4;
    } else if (quantifiedBullets <= 6) {
      quantifiedScore = 5;
    } else {
      quantifiedScore = 6;
    }

    details.push({
      criterion: 'Quantified Achievements',
      score: quantifiedScore,
      maxScore: 6,
      feedback: `${quantifiedBullets} bullets contain quantified results`
    });

    // Bullet Readability (4 pts)
    const idealLengthBullets = bullets.filter(bullet => {
      const wordCount = bullet.split(/\s+/).length;
      return wordCount >= 10 && wordCount <= 30;
    }).length;
  
    let readabilityScore = 0;
    if (bullets.length > 0) {
      const readabilityRatio = idealLengthBullets / bullets.length;
      if (readabilityRatio >= 0.8) {
        readabilityScore = 4;
      } else if (readabilityRatio >= 0.6) {
        readabilityScore = 3;
      } else if (readabilityRatio >= 0.4) {
        readabilityScore = 2;
      } else if (readabilityRatio >= 0.2) {
        readabilityScore = 1;
      }
    }

    details.push({
      criterion: 'Bullet Readability',
      score: readabilityScore,
      maxScore: 4,
      feedback: `${idealLengthBullets}/${bullets.length} bullets have ideal length (10-30 words)`
    });

    totalScore = actionVerbScore + quantifiedScore + readabilityScore;

    return {
      name: 'Content Impact & Metrics',
      score: totalScore,
      maxScore: 15,
      percentage: Math.round((totalScore / 15) * 100),
      details
    };
  }

  private async scoreLanguage(doc: ParsedDocument): Promise<DimensionScore> {
    const details: ScoreDetail[] = [];
    let totalScore = 0;

    // Grammar & Spelling Accuracy (6 pts)
    // Simple heuristic-based approach for basic grammar checking
    const text = doc.text;
    let grammarIssues = 0;
    
    // Check for repeated words (e.g., "the the", "and and")
    const repeatedWords = text.match(/\b(\w+)\s+\1\b/gi);
    grammarIssues += repeatedWords ? repeatedWords.length : 0;
    
    // Check for common spelling errors
    const commonErrors = [
      'definately', 'seperate', 'occured', 'recieve', 'untill', 'wich', 'teh', 'adn'
    ];
    
    commonErrors.forEach(error => {
      const regex = new RegExp(`\\b${error}\\b`, 'gi');
      const matches = text.match(regex);
      grammarIssues += matches ? matches.length : 0;
    });
    
    // Score based on grammar issues found - more lenient scoring
    let grammarScore = 6;
    if (grammarIssues > 0) {
      if (grammarIssues <= 2) {
        grammarScore = 5;
      } else if (grammarIssues <= 4) {
        grammarScore = 4;
      } else if (grammarIssues <= 6) {
        grammarScore = 3;
      } else {
        grammarScore = 2;
      }
    }
    details.push({
      criterion: 'Grammar & Spelling Accuracy',
      score: grammarScore,
      maxScore: 6,
      feedback: grammarIssues > 0 ? 
        `Found ${grammarIssues} potential grammar/spelling issues - review for corrections` :
        'No obvious grammar or spelling issues detected'
    });

    // Tense Consistency (2 pts)
    // Check if past tense is used consistently in experience section
    let tenseScore = 2;
    const experienceSection = text.toLowerCase().split('\n\n').find(section => 
      section.includes('experience') || section.includes('employment'));
    
    if (experienceSection) {
      // Look for obvious present tense issues (more conservative approach)
      const presentTensePatterns = [
        /\b(?:I|we|they)\s+(?:am|are|is)\b/gi
      ];
      
      let presentTenseIssues = 0;
      presentTensePatterns.forEach(pattern => {
        const matches = experienceSection.match(pattern);
        presentTenseIssues += matches ? matches.length : 0;
      });
      
      // More lenient scoring for tense consistency
      if (presentTenseIssues > 3) {
        tenseScore = 1;
      } else if (presentTenseIssues > 0) {
        tenseScore = 2; // Still give full points for minor issues
      }
    }
    
    details.push({
      criterion: 'Tense Consistency',
      score: tenseScore,
      maxScore: 2,
      feedback: tenseScore === 2 ? 
        'Tense consistency maintained' :
        'Some tense inconsistencies found - ensure past tense for previous roles'
    });

    // Tone & Pronoun Usage (2 pts)
    const firstPersonPronouns = (text.match(/\b(I|me|my|mine)\b/gi) || []).length;
    let pronounScore = 2;
    if (firstPersonPronouns > 10) {
      pronounScore = 0;
    } else if (firstPersonPronouns > 6) {
      pronounScore = 1;
    } else {
      pronounScore = 2; // More lenient - allow some first person pronouns
    }

    details.push({
      criterion: 'Tone & Pronoun Usage',
      score: pronounScore,
      maxScore: 2,
      feedback: firstPersonPronouns > 2 ? 
        `${firstPersonPronouns} first-person pronouns found - remove for professional tone` :
        'Professional tone maintained'
    });

    totalScore = grammarScore + tenseScore + pronounScore;

    return {
      name: 'Language, Grammar & Tone',
      score: totalScore,
      maxScore: 10,
      percentage: Math.round((totalScore / 10) * 100),
      details
    };
  }

  private calculatePenalties(doc: ParsedDocument, keywordAnalysis: any): Penalty[] {
    const penalties: Penalty[] = [];

    // Keyword stuffing penalty
    if (keywordAnalysis.density > 5) {
      const penalty = keywordAnalysis.density > 8 ? 4 : 2;
      penalties.push({
        type: 'keyword-stuffing',
        description: `Keyword density too high (${keywordAnalysis.density.toFixed(1)}%)`,
        points: penalty
      });
    }

    // Graphics/tables penalty
    if (doc.formatting.hasGraphics || doc.formatting.hasTables) {
      penalties.push({
        type: 'graphics-tables',
        description: 'Graphics or tables present - may cause parsing issues',
        points: 5
      });
    }

    // Low extraction rate penalty
    if (doc.extractionRate < 0.75) {
      penalties.push({
        type: 'extraction-rate',
        description: `Low text extraction rate (${Math.round(doc.extractionRate * 100)}%)`,
        points: 6
      });
    }

    return penalties;
  }

  private generateRecommendations(dimensions: any, penalties: Penalty[]): string[] {
    const recommendations: string[] = [];

    // Add recommendations based on low scores
    Object.values(dimensions).forEach((dim: any) => {
      if (dim.percentage < 70) {
        recommendations.push(`Improve ${dim.name}: Currently at ${dim.percentage}%`);
      }
    });

    // Add penalty-based recommendations
    penalties.forEach(penalty => {
      switch (penalty.type) {
        case 'keyword-stuffing':
          recommendations.push('Reduce keyword density - focus on natural integration');
          break;
        case 'graphics-tables':
          recommendations.push('Remove graphics and tables for better ATS compatibility');
          break;
        case 'extraction-rate':
          recommendations.push('Use .docx format or text-based PDF for better parsing');
          break;
      }
    });

    return recommendations;
  }

  private generateDetailedFeedback(score: number, dimensions: any): string {
    let feedback = `Your resume scored ${score}/100 (${Math.round((score/100)*100)}%). `;
    
    if (score >= 80) {
      feedback += "Excellent! Your resume is well-optimized for ATS systems.";
    } else if (score >= 60) {
      feedback += "Good foundation, but there's room for improvement.";
    } else {
      feedback += "Significant improvements needed for better ATS compatibility.";
    }

    return feedback;
  }

  // Helper method to extract bullet points from resume text
  private extractBulletPoints(text: string): string[] {
    // Match bullet points with various bullet characters
    const bulletRegex = /^[\s]*[•\-\*\u2022\u2023\u25E6\u2043\u2219]\s*(.+)$/gm;
    const matches = text.match(bulletRegex) || [];
    
    // Clean up the bullet points by removing the bullet character and extra whitespace
    return matches.map(bullet => 
      bullet.replace(/^[\s]*[•\-\*\u2022\u2023\u25E6\u2043\u2219]\s*/, '').trim()
    ).filter(bullet => bullet.length > 0);
  }

  // Helper methods
  private async extractKeywordsFromJD(jobDescription: string): Promise<string[]> {
    // Extract keywords from job description
    const lowerText = jobDescription.toLowerCase();
    
    // Technical skills patterns
    const techSkills = [
      'javascript', 'python', 'java', 'react', 'node.js', 'angular', 'vue',
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
    
    // Find skills mentioned in the job description
    const keywords: string[] = [];
    for (const skill of allSkills) {
      if (lowerText.includes(skill)) {
        // Capitalize first letter for display
        keywords.push(skill.charAt(0).toUpperCase() + skill.slice(1));
      }
    }
    
    // Extract degree/education keywords
    const educationPatterns = [
      /bachelor/gi, /master/gi, /phd/gi, /doctorate/gi, /mba/gi
    ];
    
    for (const pattern of educationPatterns) {
      const matches = lowerText.match(pattern);
      if (matches) {
        keywords.push(...matches.map(match => match.charAt(0).toUpperCase() + match.slice(1)));
      }
    }
    
    return [...new Set(keywords)]; // Remove duplicates
  }
}['s]*\s+(?:of\s+)?(?:science|arts|engineering|business)/gi,
      /master['s]*\s+(?:of\s+)?(?:science|arts|engineering|business|administration)/gi,
      /phd|doctorate|doctoral/gi,
      /computer science|information technology|software engineering/gi,
      /business administration|management|marketing|finance/gi
    ];
    
    for (const pattern of educationPatterns) {
      const matches = jobDescription.match(pattern);
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

  private analyzeKeywords(text: string, keywords: string[]): KeywordAnalysis {
    const lowerText = text.toLowerCase();
    const primaryKeywords: KeywordMatch[] = [];
    const secondaryKeywords: KeywordMatch[] = [];
    
    // Split text into sections to analyze placement
    const sections = lowerText.split('\n\n');
    
    // Analyze each keyword
    keywords.forEach((keyword, index) => {
      const lowerKeyword = keyword.toLowerCase();
      const regex = new RegExp(`\\b${lowerKeyword.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}\\b`, 'gi');
      const matches = text.match(regex);
      const count = matches ? matches.length : 0;
      
      // Find contexts where keyword appears
      const contexts: string[] = [];
      if (count > 0) {
        const lines = text.split('\n');
        lines.forEach(line => {
          if (line.toLowerCase().includes(lowerKeyword) && contexts.length < 3) {
            contexts.push(line.trim());
          }
        });
      }
      
      // Create keyword match object
      const keywordMatch: KeywordMatch = {
        keyword,
        count,
        contexts,
        relevanceScore: count > 0 ? 1 : 0
      };
      
      // Categorize as primary or secondary (simplified approach)
      if (index < Math.min(keywords.length, 10)) {
        primaryKeywords.push(keywordMatch);
      } else {
        secondaryKeywords.push(keywordMatch);
      }
    });
    
    // Calculate keyword density
    const totalWords = lowerText.split(/\s+/).length;
    const totalKeywordOccurrences = primaryKeywords.reduce((sum, kw) => sum + kw.count, 0) + 
                                   secondaryKeywords.reduce((sum, kw) => sum + kw.count, 0);
    const density = totalWords > 0 ? (totalKeywordOccurrences / totalWords) * 100 : 0;
    
    // Check for contextual placement (keywords in experience section)
    let contextualPlacement = false;
    const experienceSection = sections.find(section => 
      section.includes('experience') || section.includes('work') || section.includes('employment'));
    
    if (experienceSection) {
      const experienceKeywords = primaryKeywords.filter(kw => 
        experienceSection.toLowerCase().includes(kw.keyword.toLowerCase()));
      contextualPlacement = experienceKeywords.length > 0;
    }
    
    // Check for keyword overstuffing
    const overstuffing = density > 5;
    
    return {
      primaryKeywords,
      secondaryKeywords,
      density,
      contextualPlacement,
      overstuffing
    };
  }

  private extractBulletPoints(text: string): string[] {
    // Extract bullet points from resume text with multiple formats
    const bulletPatterns = [
      /^[\s]*[•\-\*]\s*(.+)$/gm,  // Standard bullets: •, -, *
      /^[\s]*[▪▫◦‣⁃]\s*(.+)$/gm,  // Alternative bullet symbols
      /^[\s]*[0-9]+\.\s*(.+)$/gm,  // Numbered lists: 1., 2., etc.
      /^[\s]*[a-zA-Z]\)\s*(.+)$/gm, // Lettered lists: a), b), etc.
      /^[\s]*○\s*(.+)$/gm,         // Circle bullets
      /^[\s]*►\s*(.+)$/gm          // Arrow bullets
    ];
    
    const bullets: string[] = [];
    
    bulletPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => {
        // Clean up the bullet text
        const cleaned = match.replace(/^[\s]*[•\-\*▪▫◦‣⁃0-9a-zA-Z\)\.]\s*/, '').trim();
        if (cleaned.length > 10 && !bullets.includes(cleaned)) { // Avoid duplicates and very short bullets
          bullets.push(cleaned);
        }
      });
    });
    
    // Also look for lines that start with action verbs (even without bullet symbols)
    const lines = text.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.length > 15) { // Reasonable length for a bullet point
        const firstWord = trimmed.split(' ')[0].toLowerCase();
        if (this.actionVerbs.includes(firstWord) && !bullets.some(b => b.includes(trimmed))) {
          bullets.push(trimmed);
        }
      }
    });
    
    return bullets;
  }

  // Simple scoring methods that actually work
  private simpleTextScore(text: string): DimensionScore {
    let score = 15; // Base score
    if (text.length > 1000) score += 3;
    if (text.length > 2000) score += 2;
    
    return {
      name: 'Text Extraction & Parsing Integrity',
      score: Math.min(20, score),
      maxScore: 20,
      percentage: Math.round((Math.min(20, score) / 20) * 100),
      details: [{
        criterion: 'Text Quality',
        score: Math.min(20, score),
        maxScore: 20,
        feedback: `Resume contains ${text.length} characters`
      }]
    };
  }

  private simpleStructureScore(text: string): DimensionScore {
    let score = 0;
    const lowerText = text.toLowerCase();
    
    // Check for sections
    if (lowerText.includes('experience') || lowerText.includes('work')) score += 4;
    if (lowerText.includes('education') || lowerText.includes('degree')) score += 3;
    if (lowerText.includes('skills') || lowerText.includes('technical')) score += 3;
    if (lowerText.includes('summary') || lowerText.includes('objective')) score += 3;
    if (lowerText.includes('@') || lowerText.includes('phone')) score += 2;
    
    return {
      name: 'Structure & Section Compliance',
      score: Math.min(15, score),
      maxScore: 15,
      percentage: Math.round((Math.min(15, score) / 15) * 100),
      details: [{
        criterion: 'Section Presence',
        score: Math.min(15, score),
        maxScore: 15,
        feedback: `Found ${score}/15 points worth of sections`
      }]
    };
  }

  private simpleFormattingScore(text: string): DimensionScore {
    let score = 12; // Base score
    
    // Check for bullet points
    const bulletCount = (text.match(/^[\s]*[•\-\*]/gm) || []).length;
    if (bulletCount > 5) score += 4;
    else if (bulletCount > 0) score += 2;
    
    // Check for proper spacing
    const lines = text.split('\n');
    const emptyLines = lines.filter(line => line.trim() === '').length;
    if (emptyLines > lines.length * 0.1) score += 2;
    
    // Avoid too short lines (might indicate formatting issues)
    const shortLines = lines.filter(line => line.trim().length > 0 && line.trim().length < 20).length;
    if (shortLines < lines.length * 0.3) score += 2;
    
    return {
      name: 'Formatting & ATS Compatibility',
      score: Math.min(20, score),
      maxScore: 20,
      percentage: Math.round((Math.min(20, score) / 20) * 100),
      details: [{
        criterion: 'Formatting Quality',
        score: Math.min(20, score),
        maxScore: 20,
        feedback: `Found ${bulletCount} bullet points, good spacing`
      }]
    };
  }

  private simpleKeywordScore(text: string, jobDescription?: string): DimensionScore {
    let score = 5; // Base score
    const lowerText = text.toLowerCase();
    
    // Check for common skills
    const foundSkills = this.commonSkills.filter(skill => lowerText.includes(skill.toLowerCase()));
    score += Math.min(10, foundSkills.length * 2);
    
    // If job description provided, check for matches
    if (jobDescription) {
      const jobLower = jobDescription.toLowerCase();
      const jobSkills = this.commonSkills.filter(skill => jobLower.includes(skill.toLowerCase()));
      const matchedSkills = jobSkills.filter(skill => lowerText.includes(skill.toLowerCase()));
      
      if (jobSkills.length > 0) {
        const matchPercentage = (matchedSkills.length / jobSkills.length) * 100;
        score += Math.round(matchPercentage * 0.05); // Up to 5 bonus points
      }
    }
    
    return {
      name: 'Keyword Relevance & Density',
      score: Math.min(20, score),
      maxScore: 20,
      percentage: Math.round((Math.min(20, score) / 20) * 100),
      details: [{
        criterion: 'Keyword Matching',
        score: Math.min(20, score),
        maxScore: 20,
        feedback: `Found ${foundSkills.length} relevant skills`
      }]
    };
  }

  private simpleContentScore(text: string): DimensionScore {
    let score = 5; // Base score
    
    // Check for action verbs
    const actionVerbCount = this.actionVerbs.filter(verb => 
      text.toLowerCase().includes(verb.toLowerCase())
    ).length;
    score += Math.min(5, actionVerbCount);
    
    // Check for numbers (quantified achievements)
    const numberMatches = text.match(/\d+[%$]|\d+\s*(percent|years?|months?)|\$\d+/gi) || [];
    score += Math.min(3, numberMatches.length);
    
    // Check for bullet points with good content
    const bullets = text.match(/^[\s]*[•\-\*]\s*(.+)$/gm) || [];
    const goodBullets = bullets.filter(bullet => bullet.length > 50 && bullet.length < 200);
    score += Math.min(2, goodBullets.length);
    
    return {
      name: 'Content Impact & Metrics',
      score: Math.min(15, score),
      maxScore: 15,
      percentage: Math.round((Math.min(15, score) / 15) * 100),
      details: [{
        criterion: 'Content Quality',
        score: Math.min(15, score),
        maxScore: 15,
        feedback: `Found ${actionVerbCount} action verbs, ${numberMatches.length} quantified achievements`
      }]
    };
  }

  private simpleLanguageScore(text: string): DimensionScore {
    let score = 8; // Base score (assume good language)
    
    // Check for obvious issues
    const repeatedWords = text.match(/\b(\w+)\s+\1\b/gi) || [];
    score -= Math.min(2, repeatedWords.length);
    
    // Check for excessive first person pronouns
    const firstPersonCount = (text.match(/\b(I|me|my)\b/gi) || []).length;
    if (firstPersonCount > 10) score -= 1;
    if (firstPersonCount > 20) score -= 1;
    
    // Bonus for professional tone indicators
    if (text.toLowerCase().includes('responsible for') || 
        text.toLowerCase().includes('managed') ||
        text.toLowerCase().includes('developed')) {
      score += 1;
    }
    
    return {
      name: 'Language, Grammar & Tone',
      score: Math.max(0, Math.min(10, score)),
      maxScore: 10,
      percentage: Math.round((Math.max(0, Math.min(10, score)) / 10) * 100),
      details: [{
        criterion: 'Language Quality',
        score: Math.max(0, Math.min(10, score)),
        maxScore: 10,
        feedback: `Professional tone, ${firstPersonCount} first-person pronouns`
      }]
    };
  }
}
