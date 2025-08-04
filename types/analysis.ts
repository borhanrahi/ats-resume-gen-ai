export interface Recommendation {
  id: string;
  category: 'formatting' | 'content' | 'keywords' | 'structure';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  suggestion: string;
  impact: string;
}

export interface KeywordAnalysis {
  found: string[];
  missing: string[];
  matchPercentage: number;
  density: number;
  suggestions: string[];
}

export interface GrammarIssue {
  id: string;
  type: 'grammar' | 'spelling' | 'tone' | 'clarity';
  text: string;
  suggestion: string;
  position: {
    start: number;
    end: number;
  };
  severity: 'low' | 'medium' | 'high';
}

export interface ATSAnalysis {
  score: number;
  breakdown: {
    formatting: number;
    keywords: number;
    structure: number;
    length: number;
  };
  recommendations: Recommendation[];
  keywordMatch: KeywordAnalysis;
  grammarIssues: GrammarIssue[];
  modelUsed: string;
  fallbacksUsed: string[];
}

export interface JobDescription {
  content: string;
  extractedKeywords: string[];
  requiredSkills: string[];
  experienceLevel: string;
  jobTitle: string;
}