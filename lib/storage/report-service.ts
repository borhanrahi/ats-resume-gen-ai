import { AnalysisHistoryItem, AnalysisComparison } from '@/types/history';
import { jsPDF } from 'jspdf';

export interface ReportOptions {
  includeRecommendations?: boolean;
  includeKeywordAnalysis?: boolean;
  includeGrammarIssues?: boolean;
  includeComparison?: boolean;
  format: 'pdf' | 'json' | 'csv';
}

export class ReportService {
  private static instance: ReportService;

  static getInstance(): ReportService {
    if (!ReportService.instance) {
      ReportService.instance = new ReportService();
    }
    return ReportService.instance;
  }

  /**
   * Generate report for a single analysis
   */
  async generateAnalysisReport(
    analysis: AnalysisHistoryItem,
    options: ReportOptions = { format: 'pdf' }
  ): Promise<Blob> {
    switch (options.format) {
      case 'pdf':
        return this.generatePDFReport(analysis, options);
      case 'json':
        return this.generateJSONReport(analysis, options);
      case 'csv':
        return this.generateCSVReport(analysis, options);
      default:
        throw new Error('Unsupported report format');
    }
  }

  /**
   * Generate comparison report
   */
  async generateComparisonReport(
    comparison: AnalysisComparison,
    options: ReportOptions = { format: 'pdf' }
  ): Promise<Blob> {
    switch (options.format) {
      case 'pdf':
        return this.generateComparisonPDFReport(comparison, options);
      case 'json':
        return this.generateComparisonJSONReport(comparison, options);
      default:
        throw new Error('Unsupported report format for comparison');
    }
  }

  /**
   * Generate PDF report for single analysis
   */
  private async generatePDFReport(
    analysis: AnalysisHistoryItem,
    options: ReportOptions
  ): Promise<Blob> {
    const doc = new jsPDF();
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.text('ATS Resume Analysis Report', 20, yPosition);
    yPosition += 20;

    // Basic info
    doc.setFontSize(12);
    doc.text(`Resume: ${analysis.resumeName}`, 20, yPosition);
    yPosition += 10;
    
    if (analysis.jobTitle) {
      doc.text(`Job Title: ${analysis.jobTitle}`, 20, yPosition);
      yPosition += 10;
    }
    
    doc.text(`Analysis Date: ${analysis.createdAt.toLocaleDateString()}`, 20, yPosition);
    yPosition += 10;
    
    doc.text(`Overall Score: ${analysis.score}/100`, 20, yPosition);
    yPosition += 20;

    // Score breakdown
    doc.setFontSize(16);
    doc.text('Score Breakdown', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(12);
    Object.entries(analysis.analysis.breakdown).forEach(([category, score]) => {
      doc.text(`${category.charAt(0).toUpperCase() + category.slice(1)}: ${score}/100`, 30, yPosition);
      yPosition += 8;
    });
    yPosition += 10;

    // Keyword analysis
    if (options.includeKeywordAnalysis !== false) {
      doc.setFontSize(16);
      doc.text('Keyword Analysis', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(12);
      doc.text(`Match Percentage: ${analysis.analysis.keywordMatch.matchPercentage}%`, 30, yPosition);
      yPosition += 10;
      
      if (analysis.analysis.keywordMatch.found.length > 0) {
        doc.text('Found Keywords:', 30, yPosition);
        yPosition += 8;
        const foundKeywords = analysis.analysis.keywordMatch.found.join(', ');
        const lines = doc.splitTextToSize(foundKeywords, 150);
        doc.text(lines, 40, yPosition);
        yPosition += lines.length * 6 + 5;
      }
      
      if (analysis.analysis.keywordMatch.missing.length > 0) {
        doc.text('Missing Keywords:', 30, yPosition);
        yPosition += 8;
        const missingKeywords = analysis.analysis.keywordMatch.missing.join(', ');
        const lines = doc.splitTextToSize(missingKeywords, 150);
        doc.text(lines, 40, yPosition);
        yPosition += lines.length * 6 + 10;
      }
    }

    // Recommendations
    if (options.includeRecommendations !== false && analysis.analysis.recommendations.length > 0) {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(16);
      doc.text('Recommendations', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(12);
      analysis.analysis.recommendations.slice(0, 10).forEach((rec, index) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.text(`${index + 1}. ${rec.title}`, 30, yPosition);
        yPosition += 8;
        
        const descLines = doc.splitTextToSize(rec.description, 150);
        doc.text(descLines, 40, yPosition);
        yPosition += descLines.length * 6 + 5;
        
        const suggestionLines = doc.splitTextToSize(`Suggestion: ${rec.suggestion}`, 150);
        doc.text(suggestionLines, 40, yPosition);
        yPosition += suggestionLines.length * 6 + 10;
      });
    }

    // Grammar issues
    if (options.includeGrammarIssues !== false && analysis.analysis.grammarIssues.length > 0) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(16);
      doc.text('Grammar Issues', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(12);
      analysis.analysis.grammarIssues.slice(0, 10).forEach((issue, index) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.text(`${index + 1}. ${issue.type.toUpperCase()}: ${issue.text}`, 30, yPosition);
        yPosition += 8;
        
        const suggestionLines = doc.splitTextToSize(`Suggestion: ${issue.suggestion}`, 150);
        doc.text(suggestionLines, 40, yPosition);
        yPosition += suggestionLines.length * 6 + 10;
      });
    }

    return new Blob([doc.output('blob')], { type: 'application/pdf' });
  }

  /**
   * Generate JSON report
   */
  private async generateJSONReport(
    analysis: AnalysisHistoryItem,
    options: ReportOptions
  ): Promise<Blob> {
    const reportData = {
      resumeName: analysis.resumeName,
      jobTitle: analysis.jobTitle,
      analysisDate: analysis.createdAt.toISOString(),
      score: analysis.score,
      breakdown: analysis.analysis.breakdown,
      ...(options.includeKeywordAnalysis !== false && {
        keywordAnalysis: analysis.analysis.keywordMatch,
      }),
      ...(options.includeRecommendations !== false && {
        recommendations: analysis.analysis.recommendations,
      }),
      ...(options.includeGrammarIssues !== false && {
        grammarIssues: analysis.analysis.grammarIssues,
      }),
      modelUsed: analysis.analysis.modelUsed,
      fallbacksUsed: analysis.analysis.fallbacksUsed,
    };

    const jsonString = JSON.stringify(reportData, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  }

  /**
   * Generate CSV report
   */
  private async generateCSVReport(
    analysis: AnalysisHistoryItem,
    options: ReportOptions
  ): Promise<Blob> {
    const rows = [
      ['Field', 'Value'],
      ['Resume Name', analysis.resumeName],
      ['Job Title', analysis.jobTitle || ''],
      ['Analysis Date', analysis.createdAt.toISOString()],
      ['Overall Score', analysis.score.toString()],
      ['Formatting Score', analysis.analysis.breakdown.formatting.toString()],
      ['Keywords Score', analysis.analysis.breakdown.keywords.toString()],
      ['Structure Score', analysis.analysis.breakdown.structure.toString()],
      ['Length Score', analysis.analysis.breakdown.length.toString()],
      ['Keyword Match %', analysis.analysis.keywordMatch.matchPercentage.toString()],
      ['Found Keywords', analysis.analysis.keywordMatch.found.join('; ')],
      ['Missing Keywords', analysis.analysis.keywordMatch.missing.join('; ')],
      ['Model Used', analysis.analysis.modelUsed],
    ];

    const csvContent = rows.map(row => 
      row.map(field => `"${field.replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    return new Blob([csvContent], { type: 'text/csv' });
  }

  /**
   * Generate comparison PDF report
   */
  private async generateComparisonPDFReport(
    comparison: AnalysisComparison,
    options: ReportOptions
  ): Promise<Blob> {
    const doc = new jsPDF();
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.text('Resume Analysis Comparison Report', 20, yPosition);
    yPosition += 20;

    // Basic info
    doc.setFontSize(12);
    doc.text(`Base Analysis: ${comparison.baseAnalysis.resumeName}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Date: ${comparison.baseAnalysis.createdAt.toLocaleDateString()}`, 30, yPosition);
    yPosition += 8;
    doc.text(`Score: ${comparison.baseAnalysis.score}/100`, 30, yPosition);
    yPosition += 15;

    doc.text(`Compare Analysis: ${comparison.compareAnalysis.resumeName}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Date: ${comparison.compareAnalysis.createdAt.toLocaleDateString()}`, 30, yPosition);
    yPosition += 8;
    doc.text(`Score: ${comparison.compareAnalysis.score}/100`, 30, yPosition);
    yPosition += 15;

    // Score difference
    doc.setFontSize(16);
    const scoreDiffText = comparison.scoreDifference >= 0 
      ? `Score Improvement: +${comparison.scoreDifference} points`
      : `Score Decrease: ${comparison.scoreDifference} points`;
    doc.text(scoreDiffText, 20, yPosition);
    yPosition += 20;

    // Improvements
    if (comparison.improvements.length > 0) {
      doc.setFontSize(14);
      doc.text('Improvements:', 20, yPosition);
      yPosition += 12;
      
      doc.setFontSize(12);
      comparison.improvements.forEach((improvement, index) => {
        doc.text(`• ${improvement}`, 30, yPosition);
        yPosition += 8;
      });
      yPosition += 10;
    }

    // Regressions
    if (comparison.regressions.length > 0) {
      doc.setFontSize(14);
      doc.text('Areas of Concern:', 20, yPosition);
      yPosition += 12;
      
      doc.setFontSize(12);
      comparison.regressions.forEach((regression, index) => {
        doc.text(`• ${regression}`, 30, yPosition);
        yPosition += 8;
      });
      yPosition += 10;
    }

    // Keyword changes
    if (comparison.keywordChanges.added.length > 0 || comparison.keywordChanges.removed.length > 0) {
      doc.setFontSize(14);
      doc.text('Keyword Changes:', 20, yPosition);
      yPosition += 12;
      
      doc.setFontSize(12);
      if (comparison.keywordChanges.added.length > 0) {
        doc.text(`Added: ${comparison.keywordChanges.added.join(', ')}`, 30, yPosition);
        yPosition += 8;
      }
      
      if (comparison.keywordChanges.removed.length > 0) {
        doc.text(`Removed: ${comparison.keywordChanges.removed.join(', ')}`, 30, yPosition);
        yPosition += 8;
      }
    }

    return new Blob([doc.output('blob')], { type: 'application/pdf' });
  }

  /**
   * Generate comparison JSON report
   */
  private async generateComparisonJSONReport(
    comparison: AnalysisComparison,
    options: ReportOptions
  ): Promise<Blob> {
    const reportData = {
      comparisonId: comparison.id,
      baseAnalysis: {
        resumeName: comparison.baseAnalysis.resumeName,
        date: comparison.baseAnalysis.createdAt.toISOString(),
        score: comparison.baseAnalysis.score,
        breakdown: comparison.baseAnalysis.analysis.breakdown,
      },
      compareAnalysis: {
        resumeName: comparison.compareAnalysis.resumeName,
        date: comparison.compareAnalysis.createdAt.toISOString(),
        score: comparison.compareAnalysis.score,
        breakdown: comparison.compareAnalysis.analysis.breakdown,
      },
      scoreDifference: comparison.scoreDifference,
      improvements: comparison.improvements,
      regressions: comparison.regressions,
      keywordChanges: comparison.keywordChanges,
      recommendationChanges: comparison.recommendationChanges,
    };

    const jsonString = JSON.stringify(reportData, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  }

  /**
   * Get suggested filename for report
   */
  getReportFilename(
    analysis: AnalysisHistoryItem,
    format: 'pdf' | 'json' | 'csv',
    isComparison: boolean = false
  ): string {
    const date = analysis.createdAt.toISOString().split('T')[0];
    const resumeName = analysis.resumeName.replace(/[^a-zA-Z0-9]/g, '_');
    const prefix = isComparison ? 'comparison' : 'analysis';
    
    return `${prefix}_${resumeName}_${date}.${format}`;
  }
}

// Export singleton instance
export const reportService = ReportService.getInstance();