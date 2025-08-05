import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/auth/appwrite';
import { Query, ID } from 'appwrite';
import { AnalysisHistoryItem, HistoryFilters, HistorySortOptions, HistoryStats, AnalysisComparison } from '@/types/history';
import { ATSAnalysis, JobDescription } from '@/types/analysis';
import { ResumeData } from '@/types/resume';

export class HistoryService {
  private static instance: HistoryService;

  static getInstance(): HistoryService {
    if (!HistoryService.instance) {
      HistoryService.instance = new HistoryService();
    }
    return HistoryService.instance;
  }

  /**
   * Save analysis to history
   */
  async saveAnalysis(
    userId: string,
    resumeName: string,
    resumeData: ResumeData,
    analysis: ATSAnalysis,
    jobDescription?: JobDescription,
    tags: string[] = []
  ): Promise<AnalysisHistoryItem> {
    try {
      const historyItem = {
        userId,
        resumeName,
        resumeData,
        jobTitle: jobDescription?.jobTitle || '',
        jobDescription,
        analysis,
        score: analysis.score,
        tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const document = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.ANALYSES,
        ID.unique(),
        historyItem
      );

      return {
        ...historyItem,
        $id: document.$id,
        createdAt: new Date(historyItem.createdAt),
        updatedAt: new Date(historyItem.updatedAt),
      };
    } catch (error) {
      console.error('Failed to save analysis to history:', error);
      throw new Error('Failed to save analysis to history');
    }
  }

  /**
   * Get user's analysis history with filtering and sorting
   */
  async getHistory(
    userId: string,
    filters?: HistoryFilters,
    sort?: HistorySortOptions,
    limit: number = 50,
    offset: number = 0
  ): Promise<AnalysisHistoryItem[]> {
    try {
      const queries = [
        Query.equal('userId', userId),
        Query.limit(limit),
        Query.offset(offset),
      ];

      // Apply filters
      if (filters) {
        if (filters.dateRange) {
          queries.push(Query.greaterThanEqual('createdAt', filters.dateRange.start.toISOString()));
          queries.push(Query.lessThanEqual('createdAt', filters.dateRange.end.toISOString()));
        }

        if (filters.scoreRange) {
          queries.push(Query.greaterThanEqual('score', filters.scoreRange.min));
          queries.push(Query.lessThanEqual('score', filters.scoreRange.max));
        }

        if (filters.tags && filters.tags.length > 0) {
          queries.push(Query.contains('tags', filters.tags));
        }

        if (filters.jobTitle) {
          queries.push(Query.search('jobTitle', filters.jobTitle));
        }

        if (filters.resumeName) {
          queries.push(Query.search('resumeName', filters.resumeName));
        }
      }

      // Apply sorting
      if (sort) {
        const orderType = sort.direction === 'desc' ? Query.orderDesc : Query.orderAsc;
        queries.push(orderType(sort.field));
      } else {
        // Default sort by creation date (newest first)
        queries.push(Query.orderDesc('createdAt'));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ANALYSES,
        queries
      );

      return response.documents.map(doc => ({
        $id: doc.$id,
        userId: doc.userId,
        resumeName: doc.resumeName,
        resumeData: doc.resumeData,
        jobTitle: doc.jobTitle,
        jobDescription: doc.jobDescription,
        analysis: doc.analysis,
        score: doc.score,
        tags: doc.tags || [],
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt),
      }));
    } catch (error) {
      console.error('Failed to get analysis history:', error);
      throw new Error('Failed to get analysis history');
    }
  }

  /**
   * Get a specific analysis by ID
   */
  async getAnalysisById(analysisId: string, userId: string): Promise<AnalysisHistoryItem | null> {
    try {
      const document = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.ANALYSES,
        analysisId
      );

      // Verify the analysis belongs to the user
      if (document.userId !== userId) {
        throw new Error('Unauthorized access to analysis');
      }

      return {
        $id: document.$id,
        userId: document.userId,
        resumeName: document.resumeName,
        resumeData: document.resumeData,
        jobTitle: document.jobTitle,
        jobDescription: document.jobDescription,
        analysis: document.analysis,
        score: document.score,
        tags: document.tags || [],
        createdAt: new Date(document.createdAt),
        updatedAt: new Date(document.updatedAt),
      };
    } catch (error) {
      console.error('Failed to get analysis by ID:', error);
      return null;
    }
  }

  /**
   * Delete analysis from history
   */
  async deleteAnalysis(analysisId: string, userId: string): Promise<void> {
    try {
      // First verify the analysis belongs to the user
      const analysis = await this.getAnalysisById(analysisId, userId);
      if (!analysis) {
        throw new Error('Analysis not found or unauthorized');
      }

      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.ANALYSES,
        analysisId
      );
    } catch (error) {
      console.error('Failed to delete analysis:', error);
      throw new Error('Failed to delete analysis');
    }
  }

  /**
   * Update analysis tags
   */
  async updateAnalysisTags(analysisId: string, userId: string, tags: string[]): Promise<void> {
    try {
      // First verify the analysis belongs to the user
      const analysis = await this.getAnalysisById(analysisId, userId);
      if (!analysis) {
        throw new Error('Analysis not found or unauthorized');
      }

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.ANALYSES,
        analysisId,
        {
          tags,
          updatedAt: new Date().toISOString(),
        }
      );
    } catch (error) {
      console.error('Failed to update analysis tags:', error);
      throw new Error('Failed to update analysis tags');
    }
  }

  /**
   * Get user's history statistics
   */
  async getHistoryStats(userId: string): Promise<HistoryStats> {
    try {
      // Get all user's analyses
      const allAnalyses = await this.getHistory(userId, undefined, undefined, 1000);

      if (allAnalyses.length === 0) {
        return {
          totalAnalyses: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          scoreImprovement: 0,
          mostUsedKeywords: [],
          analysisFrequency: {
            thisWeek: 0,
            thisMonth: 0,
            thisYear: 0,
          },
        };
      }

      const scores = allAnalyses.map(a => a.score);
      const totalAnalyses = allAnalyses.length;
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / totalAnalyses;
      const highestScore = Math.max(...scores);
      const lowestScore = Math.min(...scores);

      // Calculate score improvement (compare first and last analysis)
      const sortedByDate = [...allAnalyses].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      const scoreImprovement = totalAnalyses > 1 
        ? sortedByDate[sortedByDate.length - 1].score - sortedByDate[0].score
        : 0;

      // Extract most used keywords
      const keywordCounts = new Map<string, number>();
      allAnalyses.forEach(analysis => {
        analysis.analysis.keywordMatch.found.forEach(keyword => {
          keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
        });
      });

      const mostUsedKeywords = Array.from(keywordCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([keyword]) => keyword);

      // Calculate frequency
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

      const analysisFrequency = {
        thisWeek: allAnalyses.filter(a => a.createdAt >= oneWeekAgo).length,
        thisMonth: allAnalyses.filter(a => a.createdAt >= oneMonthAgo).length,
        thisYear: allAnalyses.filter(a => a.createdAt >= oneYearAgo).length,
      };

      return {
        totalAnalyses,
        averageScore: Math.round(averageScore),
        highestScore,
        lowestScore,
        scoreImprovement: Math.round(scoreImprovement),
        mostUsedKeywords,
        analysisFrequency,
      };
    } catch (error) {
      console.error('Failed to get history stats:', error);
      throw new Error('Failed to get history stats');
    }
  }

  /**
   * Compare two analyses
   */
  async compareAnalyses(
    baseAnalysisId: string,
    compareAnalysisId: string,
    userId: string
  ): Promise<AnalysisComparison> {
    try {
      const [baseAnalysis, compareAnalysis] = await Promise.all([
        this.getAnalysisById(baseAnalysisId, userId),
        this.getAnalysisById(compareAnalysisId, userId),
      ]);

      if (!baseAnalysis || !compareAnalysis) {
        throw new Error('One or both analyses not found');
      }

      const scoreDifference = compareAnalysis.score - baseAnalysis.score;

      // Analyze improvements and regressions
      const improvements: string[] = [];
      const regressions: string[] = [];

      // Compare breakdown scores
      Object.keys(baseAnalysis.analysis.breakdown).forEach(key => {
        const baseScore = baseAnalysis.analysis.breakdown[key as keyof typeof baseAnalysis.analysis.breakdown];
        const compareScore = compareAnalysis.analysis.breakdown[key as keyof typeof compareAnalysis.analysis.breakdown];
        
        if (compareScore > baseScore) {
          improvements.push(`${key} improved by ${compareScore - baseScore} points`);
        } else if (compareScore < baseScore) {
          regressions.push(`${key} decreased by ${baseScore - compareScore} points`);
        }
      });

      // Compare keywords
      const baseKeywords = new Set(baseAnalysis.analysis.keywordMatch.found);
      const compareKeywords = new Set(compareAnalysis.analysis.keywordMatch.found);

      const addedKeywords = Array.from(compareKeywords).filter(k => !baseKeywords.has(k));
      const removedKeywords = Array.from(baseKeywords).filter(k => !compareKeywords.has(k));

      // Compare recommendations
      const baseRecIds = new Set(baseAnalysis.analysis.recommendations.map(r => r.id));
      const compareRecIds = new Set(compareAnalysis.analysis.recommendations.map(r => r.id));

      const resolvedRecommendations = Array.from(baseRecIds).filter(id => !compareRecIds.has(id));
      const newRecommendations = Array.from(compareRecIds).filter(id => !baseRecIds.has(id));

      return {
        id: `${baseAnalysisId}-vs-${compareAnalysisId}`,
        baseAnalysis,
        compareAnalysis,
        scoreDifference,
        improvements,
        regressions,
        keywordChanges: {
          added: addedKeywords,
          removed: removedKeywords,
        },
        recommendationChanges: {
          resolved: resolvedRecommendations,
          new: newRecommendations,
        },
      };
    } catch (error) {
      console.error('Failed to compare analyses:', error);
      throw new Error('Failed to compare analyses');
    }
  }

  /**
   * Search analyses by content
   */
  async searchAnalyses(
    userId: string,
    searchTerm: string,
    limit: number = 20
  ): Promise<AnalysisHistoryItem[]> {
    try {
      const queries = [
        Query.equal('userId', userId),
        Query.limit(limit),
        Query.orderDesc('createdAt'),
      ];

      // Search in resume name and job title
      const [nameResults, jobResults] = await Promise.all([
        databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.ANALYSES,
          [...queries, Query.search('resumeName', searchTerm)]
        ),
        databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.ANALYSES,
          [...queries, Query.search('jobTitle', searchTerm)]
        ),
      ]);

      // Combine and deduplicate results
      const allResults = [...nameResults.documents, ...jobResults.documents];
      const uniqueResults = allResults.filter((doc, index, self) => 
        index === self.findIndex(d => d.$id === doc.$id)
      );

      return uniqueResults.map(doc => ({
        $id: doc.$id,
        userId: doc.userId,
        resumeName: doc.resumeName,
        resumeData: doc.resumeData,
        jobTitle: doc.jobTitle,
        jobDescription: doc.jobDescription,
        analysis: doc.analysis,
        score: doc.score,
        tags: doc.tags || [],
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt),
      }));
    } catch (error) {
      console.error('Failed to search analyses:', error);
      throw new Error('Failed to search analyses');
    }
  }
}

// Export singleton instance
export const historyService = HistoryService.getInstance();