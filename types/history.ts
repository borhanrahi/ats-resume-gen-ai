import { ATSAnalysis, JobDescription } from './analysis';
import { ResumeData } from './resume';

export interface AnalysisHistoryItem {
  $id: string;
  userId: string;
  resumeName: string;
  resumeData: ResumeData;
  jobTitle?: string;
  jobDescription?: JobDescription;
  analysis: ATSAnalysis;
  score: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalysisComparison {
  id: string;
  baseAnalysis: AnalysisHistoryItem;
  compareAnalysis: AnalysisHistoryItem;
  scoreDifference: number;
  improvements: string[];
  regressions: string[];
  keywordChanges: {
    added: string[];
    removed: string[];
  };
  recommendationChanges: {
    resolved: string[];
    new: string[];
  };
}

export interface HistoryFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  scoreRange?: {
    min: number;
    max: number;
  };
  tags?: string[];
  jobTitle?: string;
  resumeName?: string;
}

export interface HistorySortOptions {
  field: 'createdAt' | 'score' | 'resumeName' | 'jobTitle';
  direction: 'asc' | 'desc';
}

export interface HistoryStats {
  totalAnalyses: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  scoreImprovement: number;
  mostUsedKeywords: string[];
  analysisFrequency: {
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
  };
}