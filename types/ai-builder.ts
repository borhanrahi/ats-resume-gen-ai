export interface AIResumePrompt {
  jobTitle: string;
  jobDescription?: string;
  industry: string;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  targetCompany?: string;
  keySkills: string[];
  workHistory: WorkHistoryItem[];
  education: EducationItem[];
  preferences: {
    tone: 'professional' | 'creative' | 'technical' | 'executive';
    length: 'concise' | 'detailed' | 'comprehensive';
    focus: 'skills' | 'achievements' | 'experience' | 'education';
  };
}

export interface WorkHistoryItem {
  company: string;
  position: string;
  duration: string;
  keyResponsibilities: string[];
  achievements?: string[];
}

export interface EducationItem {
  institution: string;
  degree: string;
  field: string;
  year: string;
  gpa?: string;
  honors?: string[];
}

export interface AIGeneratedContent {
  summary: string;
  experience: AIGeneratedExperience[];
  skills: {
    technical: string[];
    soft: string[];
    industry: string[];
  };
  achievements: string[];
  keywords: string[];
  suggestions: string[];
}

export interface AIGeneratedExperience {
  company: string;
  position: string;
  duration: string;
  description: string;
  bulletPoints: string[];
  keyAchievements: string[];
}

export interface AIBuilderState {
  step: 'prompt' | 'generating' | 'review' | 'editing';
  prompt: Partial<AIResumePrompt>;
  generatedContent: AIGeneratedContent | null;
  isGenerating: boolean;
  error: string | null;
  progress: number;
}

export interface KeywordOptimization {
  currentKeywords: string[];
  suggestedKeywords: string[];
  missingKeywords: string[];
  keywordDensity: number;
  optimizedContent: {
    summary: string;
    experience: string[];
    skills: string[];
  };
  improvements: KeywordImprovement[];
}

export interface KeywordImprovement {
  section: 'summary' | 'experience' | 'skills';
  original: string;
  optimized: string;
  addedKeywords: string[];
  impact: 'low' | 'medium' | 'high';
}

export interface ReanalysisResult {
  originalScore: number;
  optimizedScore: number;
  improvement: number;
  keywordMatch: {
    before: number;
    after: number;
  };
  recommendations: string[];
}