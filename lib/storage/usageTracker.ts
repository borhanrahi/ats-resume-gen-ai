import { UserUsage } from '@/types/user';
import { ResumeData } from '@/types/resume';
import { ATSAnalysis, JobDescription } from '@/types/analysis';

// Constants
const DAILY_LIMIT = 5;
const USAGE_STORAGE_KEY = 'ats_usage_tracker';
const ANALYSES_STORAGE_KEY = 'ats_analyses';

// Types for localStorage data structure
interface StoredAnalysis {
  id: string;
  resumeData: ResumeData;
  analysis: ATSAnalysis;
  jobDescription?: JobDescription;
  timestamp: string;
}

interface UsageData {
  count: number;
  lastReset: string;
  analyses: string[]; // Analysis IDs
}

interface LocalStorageData {
  usage: UsageData;
  analyses: {
    [id: string]: StoredAnalysis;
  };
  preferences: {
    theme: 'light' | 'dark';
    language: string;
  };
}

/**
 * Usage Tracker for Free Tier Users
 * Manages daily analysis limits and persistent storage in localStorage
 */
export class UsageTracker {
  private static instance: UsageTracker;
  
  private constructor() {}
  
  static getInstance(): UsageTracker {
    if (!UsageTracker.instance) {
      UsageTracker.instance = new UsageTracker();
    }
    return UsageTracker.instance;
  }

  /**
   * Get current usage data for the user
   */
  getCurrentUsage(): UserUsage {
    // Return default values if not on client side
    if (typeof window === 'undefined') {
      return {
        dailyCount: 0,
        lastReset: new Date(),
        totalAnalyses: 0,
        isPremium: false
      };
    }

    const usageData = this.getUsageData();
    const today = new Date().toDateString();
    
    // Reset count if it's a new day
    if (usageData.lastReset !== today) {
      this.resetDailyUsage();
      return {
        dailyCount: 0,
        lastReset: new Date(),
        totalAnalyses: this.getTotalAnalysesCount(),
        isPremium: false
      };
    }
    
    return {
      dailyCount: usageData.count,
      lastReset: new Date(usageData.lastReset),
      totalAnalyses: this.getTotalAnalysesCount(),
      isPremium: false
    };
  }

  /**
   * Check if user can perform another analysis
   */
  canAnalyze(): boolean {
    // Return true if not on client side (SSR)
    if (typeof window === 'undefined') {
      return true;
    }
    
    const usage = this.getCurrentUsage();
    return usage.dailyCount < DAILY_LIMIT;
  }

  /**
   * Get remaining analyses for today
   */
  getRemainingAnalyses(): number {
    // Return max if not on client side (SSR)
    if (typeof window === 'undefined') {
      return DAILY_LIMIT;
    }
    
    const usage = this.getCurrentUsage();
    return Math.max(0, DAILY_LIMIT - usage.dailyCount);
  }

  /**
   * Record a new analysis and increment usage count
   */
  recordAnalysis(
    resumeData: ResumeData,
    analysis: ATSAnalysis,
    jobDescription?: JobDescription
  ): string {
    if (!this.canAnalyze()) {
      throw new Error('Daily analysis limit exceeded');
    }

    const analysisId = this.generateAnalysisId();
    const timestamp = new Date().toISOString();
    
    // Store the analysis
    const storedAnalysis: StoredAnalysis = {
      id: analysisId,
      resumeData,
      analysis,
      jobDescription,
      timestamp
    };
    
    this.storeAnalysis(analysisId, storedAnalysis);
    this.incrementUsageCount(analysisId);
    
    return analysisId;
  }

  /**
   * Get all stored analyses for the user
   */
  getAllAnalyses(): StoredAnalysis[] {
    const data = this.getLocalStorageData();
    return Object.values(data.analyses).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Get a specific analysis by ID
   */
  getAnalysis(id: string): StoredAnalysis | null {
    const data = this.getLocalStorageData();
    return data.analyses[id] || null;
  }

  /**
   * Delete an analysis
   */
  deleteAnalysis(id: string): boolean {
    try {
      const data = this.getLocalStorageData();
      
      if (!data.analyses[id]) {
        return false;
      }
      
      // Remove from analyses
      delete data.analyses[id];
      
      // Remove from usage tracking
      data.usage.analyses = data.usage.analyses.filter(analysisId => analysisId !== id);
      
      this.saveLocalStorageData(data);
      return true;
    } catch (error) {
      console.error('Error deleting analysis:', error);
      return false;
    }
  }

  /**
   * Clear all stored data (for privacy/reset purposes)
   */
  clearAllData(): void {
    try {
      localStorage.removeItem(USAGE_STORAGE_KEY);
      localStorage.removeItem(ANALYSES_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): {
    totalAnalyses: number;
    todayAnalyses: number;
    remainingToday: number;
    averageScore: number;
    lastAnalysisDate: Date | null;
  } {
    const usage = this.getCurrentUsage();
    const analyses = this.getAllAnalyses();
    
    const averageScore = analyses.length > 0 
      ? analyses.reduce((sum, analysis) => sum + analysis.analysis.score, 0) / analyses.length
      : 0;
    
    const lastAnalysisDate = analyses.length > 0 
      ? new Date(analyses[0].timestamp)
      : null;
    
    return {
      totalAnalyses: usage.totalAnalyses,
      todayAnalyses: usage.dailyCount,
      remainingToday: this.getRemainingAnalyses(),
      averageScore: Math.round(averageScore),
      lastAnalysisDate
    };
  }

  // Private methods

  private getUsageData(): UsageData {
    // Return default data if not on client side
    if (typeof window === 'undefined') {
      return {
        count: 0,
        lastReset: new Date().toDateString(),
        analyses: []
      };
    }

    try {
      const stored = localStorage.getItem(USAGE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure analyses array exists
        return {
          count: parsed.count || 0,
          lastReset: parsed.lastReset || new Date().toDateString(),
          analyses: parsed.analyses || []
        };
      }
    } catch (error) {
      console.error('Error reading usage data:', error);
    }
    
    // Return default data
    return {
      count: 0,
      lastReset: new Date().toDateString(),
      analyses: []
    };
  }

  private saveUsageData(data: UsageData): void {
    // Don't save if not on client side
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving usage data:', error);
    }
  }

  private getLocalStorageData(): LocalStorageData {
    const usageData = this.getUsageData();
    
    try {
      const analysesStored = localStorage.getItem(ANALYSES_STORAGE_KEY);
      const analyses = analysesStored ? JSON.parse(analysesStored) : {};
      
      return {
        usage: usageData,
        analyses,
        preferences: {
          theme: 'light',
          language: 'en'
        }
      };
    } catch (error) {
      console.error('Error reading localStorage data:', error);
      return {
        usage: usageData,
        analyses: {},
        preferences: {
          theme: 'light',
          language: 'en'
        }
      };
    }
  }

  private saveLocalStorageData(data: LocalStorageData): void {
    try {
      localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(data.usage));
      localStorage.setItem(ANALYSES_STORAGE_KEY, JSON.stringify(data.analyses));
    } catch (error) {
      console.error('Error saving localStorage data:', error);
    }
  }

  private storeAnalysis(id: string, analysis: StoredAnalysis): void {
    const data = this.getLocalStorageData();
    data.analyses[id] = analysis;
    this.saveLocalStorageData(data);
  }

  private incrementUsageCount(analysisId: string): void {
    const usageData = this.getUsageData();
    usageData.count += 1;
    usageData.analyses.push(analysisId);
    this.saveUsageData(usageData);
  }

  private resetDailyUsage(): void {
    const usageData = this.getUsageData();
    usageData.count = 0;
    usageData.lastReset = new Date().toDateString();
    // Keep the analyses array for total count tracking
    this.saveUsageData(usageData);
  }

  private getTotalAnalysesCount(): number {
    const usageData = this.getUsageData();
    return usageData.analyses?.length || 0;
  }

  private generateAnalysisId(): string {
    return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const usageTracker = UsageTracker.getInstance();

// Export utility functions for easier use
export const canAnalyze = () => usageTracker.canAnalyze();
export const getRemainingAnalyses = () => usageTracker.getRemainingAnalyses();
export const getCurrentUsage = () => usageTracker.getCurrentUsage();
export const recordAnalysis = (
  resumeData: ResumeData,
  analysis: ATSAnalysis,
  jobDescription?: JobDescription
) => usageTracker.recordAnalysis(resumeData, analysis, jobDescription);