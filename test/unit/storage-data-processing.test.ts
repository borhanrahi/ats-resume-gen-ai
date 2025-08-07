import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Unit tests for storage and data processing functionality

describe('Storage and Data Processing Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('LocalStorage Service', () => {
    it('should store and retrieve data correctly', async () => {
      const { LocalStorageService } = await import('@/lib/storage/localStorage');
      
      const testData = { name: 'John Doe', score: 85 };
      
      LocalStorageService.setItem('test-key', testData);
      const retrieved = LocalStorageService.getItem('test-key');
      
      expect(retrieved).toEqual(testData);
    });

    it('should handle JSON serialization errors', async () => {
      const { LocalStorageService } = await import('@/lib/storage/localStorage');
      
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj; // Create circular reference
      
      expect(() => LocalStorageService.setItem('circular', circularObj)).not.toThrow();
      
      const retrieved = LocalStorageService.getItem('circular');
      expect(retrieved).toBeNull();
    });

    it('should return null for non-existent keys', async () => {
      const { LocalStorageService } = await import('@/lib/storage/localStorage');
      
      const result = LocalStorageService.getItem('non-existent-key');
      expect(result).toBeNull();
    });

    it('should remove items correctly', async () => {
      const { LocalStorageService } = await import('@/lib/storage/localStorage');
      
      LocalStorageService.setItem('temp-key', 'temp-value');
      expect(LocalStorageService.getItem('temp-key')).toBe('temp-value');
      
      LocalStorageService.removeItem('temp-key');
      expect(LocalStorageService.getItem('temp-key')).toBeNull();
    });

    it('should clear all items', async () => {
      const { LocalStorageService } = await import('@/lib/storage/localStorage');
      
      LocalStorageService.setItem('key1', 'value1');
      LocalStorageService.setItem('key2', 'value2');
      
      LocalStorageService.clear();
      
      expect(LocalStorageService.getItem('key1')).toBeNull();
      expect(LocalStorageService.getItem('key2')).toBeNull();
    });

    it('should handle localStorage quota exceeded', async () => {
      const { LocalStorageService } = await import('@/lib/storage/localStorage');
      
      // Mock localStorage to throw quota exceeded error
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => LocalStorageService.setItem('large-key', 'large-value')).not.toThrow();
      
      // Restore original method
      Storage.prototype.setItem = originalSetItem;
    });
  });

  describe('Usage Tracker', () => {
    it('should initialize with zero usage', async () => {
      const { UsageTracker } = await import('@/lib/storage/usageTracker');
      
      const tracker = new UsageTracker();
      
      expect(tracker.getDailyUsage()).toBe(0);
      expect(tracker.canAnalyze()).toBe(true);
      expect(tracker.getRemainingAnalyses()).toBe(5);
    });

    it('should increment usage correctly', async () => {
      const { UsageTracker } = await import('@/lib/storage/usageTracker');
      
      const tracker = new UsageTracker();
      
      tracker.incrementUsage();
      expect(tracker.getDailyUsage()).toBe(1);
      expect(tracker.getRemainingAnalyses()).toBe(4);
      
      tracker.incrementUsage();
      expect(tracker.getDailyUsage()).toBe(2);
      expect(tracker.getRemainingAnalyses()).toBe(3);
    });

    it('should enforce daily limit', async () => {
      const { UsageTracker } = await import('@/lib/storage/usageTracker');
      
      const tracker = new UsageTracker();
      
      // Use up all 5 daily analyses
      for (let i = 0; i < 5; i++) {
        expect(tracker.canAnalyze()).toBe(true);
        tracker.incrementUsage();
      }
      
      expect(tracker.canAnalyze()).toBe(false);
      expect(tracker.getRemainingAnalyses()).toBe(0);
    });

    it('should reset usage daily', async () => {
      const { UsageTracker } = await import('@/lib/storage/usageTracker');
      
      const tracker = new UsageTracker();
      
      // Use up daily limit
      for (let i = 0; i < 5; i++) {
        tracker.incrementUsage();
      }
      expect(tracker.canAnalyze()).toBe(false);
      
      // Mock date to next day
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      vi.setSystemTime(tomorrow);
      
      // Should reset automatically
      expect(tracker.canAnalyze()).toBe(true);
      expect(tracker.getDailyUsage()).toBe(0);
      expect(tracker.getRemainingAnalyses()).toBe(5);
    });

    it('should persist usage across instances', async () => {
      const { UsageTracker } = await import('@/lib/storage/usageTracker');
      
      const tracker1 = new UsageTracker();
      tracker1.incrementUsage();
      tracker1.incrementUsage();
      
      // Create new instance
      const tracker2 = new UsageTracker();
      expect(tracker2.getDailyUsage()).toBe(2);
      expect(tracker2.getRemainingAnalyses()).toBe(3);
    });

    it('should handle corrupted localStorage data', async () => {
      const { UsageTracker } = await import('@/lib/storage/usageTracker');
      
      // Set invalid data in localStorage
      localStorage.setItem('usage-tracker', 'invalid-json');
      
      const tracker = new UsageTracker();
      
      // Should initialize with defaults
      expect(tracker.getDailyUsage()).toBe(0);
      expect(tracker.canAnalyze()).toBe(true);
    });

    it('should track total lifetime usage', async () => {
      const { UsageTracker } = await import('@/lib/storage/usageTracker');
      
      const tracker = new UsageTracker();
      
      tracker.incrementUsage();
      tracker.incrementUsage();
      
      expect(tracker.getTotalUsage()).toBe(2);
      
      // Mock next day and add more usage
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      vi.setSystemTime(tomorrow);
      
      tracker.incrementUsage();
      expect(tracker.getTotalUsage()).toBe(3);
      expect(tracker.getDailyUsage()).toBe(1); // Daily resets but total persists
    });
  });

  describe('History Service', () => {
    it('should save analysis to history', async () => {
      const { HistoryService } = await import('@/lib/storage/history-service');
      
      const analysisData = {
        id: 'analysis-1',
        resumeData: {
          id: 'resume-1',
          content: 'John Doe Software Engineer',
          metadata: {
            fileName: 'resume.pdf',
            fileType: 'pdf' as const,
            uploadDate: new Date(),
            wordCount: 4
          },
          sections: {
            contact: { name: 'John Doe', email: 'john@example.com' },
            summary: 'Software Engineer',
            experience: [],
            education: [],
            skills: ['JavaScript'],
            certifications: []
          }
        },
        analysis: {
          score: 85,
          breakdown: {
            formatting: 90,
            keywords: 80,
            structure: 85,
            length: 85
          },
          recommendations: [
            {
              category: 'keywords',
              priority: 'high' as const,
              title: 'Add more keywords',
              description: 'Include more relevant keywords',
              impact: 'High impact on ATS score'
            }
          ],
          keywordMatch: {
            found: ['JavaScript'],
            missing: ['React'],
            matchPercentage: 50,
            suggestions: ['Add React to skills']
          },
          grammarIssues: [],
          modelUsed: 'gpt-3.5-turbo',
          fallbacksUsed: []
        },
        timestamp: new Date()
      };

      HistoryService.saveAnalysis(analysisData);
      
      const history = HistoryService.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].id).toBe('analysis-1');
      expect(history[0].analysis.score).toBe(85);
    });

    it('should retrieve analysis by ID', async () => {
      const { HistoryService } = await import('@/lib/storage/history-service');
      
      const analysisData = {
        id: 'analysis-2',
        resumeData: {
          id: 'resume-2',
          content: 'Jane Smith Designer',
          metadata: {
            fileName: 'resume.pdf',
            fileType: 'pdf' as const,
            uploadDate: new Date(),
            wordCount: 3
          },
          sections: {
            contact: { name: 'Jane Smith', email: 'jane@example.com' },
            summary: 'Designer',
            experience: [],
            education: [],
            skills: ['Design'],
            certifications: []
          }
        },
        analysis: {
          score: 78,
          breakdown: {
            formatting: 80,
            keywords: 75,
            structure: 80,
            length: 78
          },
          recommendations: [],
          keywordMatch: {
            found: ['Design'],
            missing: [],
            matchPercentage: 100,
            suggestions: []
          },
          grammarIssues: [],
          modelUsed: 'gpt-3.5-turbo',
          fallbacksUsed: []
        },
        timestamp: new Date()
      };

      HistoryService.saveAnalysis(analysisData);
      
      const retrieved = HistoryService.getAnalysisById('analysis-2');
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('analysis-2');
      expect(retrieved?.analysis.score).toBe(78);
    });

    it('should return null for non-existent analysis ID', async () => {
      const { HistoryService } = await import('@/lib/storage/history-service');
      
      const result = HistoryService.getAnalysisById('non-existent');
      expect(result).toBeNull();
    });

    it('should delete analysis from history', async () => {
      const { HistoryService } = await import('@/lib/storage/history-service');
      
      const analysisData = {
        id: 'analysis-to-delete',
        resumeData: {
          id: 'resume-delete',
          content: 'Test content',
          metadata: {
            fileName: 'test.pdf',
            fileType: 'pdf' as const,
            uploadDate: new Date(),
            wordCount: 2
          },
          sections: {
            contact: {},
            summary: '',
            experience: [],
            education: [],
            skills: [],
            certifications: []
          }
        },
        analysis: {
          score: 70,
          breakdown: {
            formatting: 70,
            keywords: 70,
            structure: 70,
            length: 70
          },
          recommendations: [],
          keywordMatch: {
            found: [],
            missing: [],
            matchPercentage: 0,
            suggestions: []
          },
          grammarIssues: [],
          modelUsed: 'gpt-3.5-turbo',
          fallbacksUsed: []
        },
        timestamp: new Date()
      };

      HistoryService.saveAnalysis(analysisData);
      expect(HistoryService.getAnalysisById('analysis-to-delete')).toBeDefined();
      
      HistoryService.deleteAnalysis('analysis-to-delete');
      expect(HistoryService.getAnalysisById('analysis-to-delete')).toBeNull();
    });

    it('should limit history size', async () => {
      const { HistoryService } = await import('@/lib/storage/history-service');
      
      // Clear existing history
      HistoryService.clearHistory();
      
      // Add more than the limit (assuming limit is 50)
      for (let i = 0; i < 55; i++) {
        const analysisData = {
          id: `analysis-${i}`,
          resumeData: {
            id: `resume-${i}`,
            content: `Content ${i}`,
            metadata: {
              fileName: `resume-${i}.pdf`,
              fileType: 'pdf' as const,
              uploadDate: new Date(),
              wordCount: 2
            },
            sections: {
              contact: {},
              summary: '',
              experience: [],
              education: [],
              skills: [],
              certifications: []
            }
          },
          analysis: {
            score: 70,
            breakdown: {
              formatting: 70,
              keywords: 70,
              structure: 70,
              length: 70
            },
            recommendations: [],
            keywordMatch: {
              found: [],
              missing: [],
              matchPercentage: 0,
              suggestions: []
            },
            grammarIssues: [],
            modelUsed: 'gpt-3.5-turbo',
            fallbacksUsed: []
          },
          timestamp: new Date()
        };
        
        HistoryService.saveAnalysis(analysisData);
      }
      
      const history = HistoryService.getHistory();
      expect(history.length).toBeLessThanOrEqual(50);
      
      // Should keep the most recent ones
      expect(history[0].id).toBe('analysis-54'); // Most recent
    });

    it('should clear all history', async () => {
      const { HistoryService } = await import('@/lib/storage/history-service');
      
      // Add some analyses
      for (let i = 0; i < 3; i++) {
        const analysisData = {
          id: `analysis-clear-${i}`,
          resumeData: {
            id: `resume-clear-${i}`,
            content: `Content ${i}`,
            metadata: {
              fileName: `resume-${i}.pdf`,
              fileType: 'pdf' as const,
              uploadDate: new Date(),
              wordCount: 2
            },
            sections: {
              contact: {},
              summary: '',
              experience: [],
              education: [],
              skills: [],
              certifications: []
            }
          },
          analysis: {
            score: 70,
            breakdown: {
              formatting: 70,
              keywords: 70,
              structure: 70,
              length: 70
            },
            recommendations: [],
            keywordMatch: {
              found: [],
              missing: [],
              matchPercentage: 0,
              suggestions: []
            },
            grammarIssues: [],
            modelUsed: 'gpt-3.5-turbo',
            fallbacksUsed: []
          },
          timestamp: new Date()
        };
        
        HistoryService.saveAnalysis(analysisData);
      }
      
      expect(HistoryService.getHistory().length).toBe(3);
      
      HistoryService.clearHistory();
      expect(HistoryService.getHistory().length).toBe(0);
    });

    it('should get history statistics', async () => {
      const { HistoryService } = await import('@/lib/storage/history-service');
      
      HistoryService.clearHistory();
      
      // Add analyses with different scores
      const scores = [85, 78, 92, 67, 88];
      
      for (let i = 0; i < scores.length; i++) {
        const analysisData = {
          id: `analysis-stats-${i}`,
          resumeData: {
            id: `resume-stats-${i}`,
            content: `Content ${i}`,
            metadata: {
              fileName: `resume-${i}.pdf`,
              fileType: 'pdf' as const,
              uploadDate: new Date(),
              wordCount: 2
            },
            sections: {
              contact: {},
              summary: '',
              experience: [],
              education: [],
              skills: [],
              certifications: []
            }
          },
          analysis: {
            score: scores[i],
            breakdown: {
              formatting: scores[i],
              keywords: scores[i],
              structure: scores[i],
              length: scores[i]
            },
            recommendations: [],
            keywordMatch: {
              found: [],
              missing: [],
              matchPercentage: 0,
              suggestions: []
            },
            grammarIssues: [],
            modelUsed: 'gpt-3.5-turbo',
            fallbacksUsed: []
          },
          timestamp: new Date()
        };
        
        HistoryService.saveAnalysis(analysisData);
      }
      
      const stats = HistoryService.getStatistics();
      
      expect(stats.totalAnalyses).toBe(5);
      expect(stats.averageScore).toBe(82); // (85+78+92+67+88)/5 = 82
      expect(stats.highestScore).toBe(92);
      expect(stats.lowestScore).toBe(67);
      expect(stats.improvementTrend).toBeGreaterThanOrEqual(-100);
      expect(stats.improvementTrend).toBeLessThanOrEqual(100);
    });
  });

  describe('Report Service', () => {
    it('should generate PDF report data', async () => {
      const { ReportService } = await import('@/lib/storage/report-service');
      
      const analysisData = {
        id: 'report-analysis',
        resumeData: {
          id: 'report-resume',
          content: 'John Doe Software Engineer with JavaScript experience',
          metadata: {
            fileName: 'john-doe-resume.pdf',
            fileType: 'pdf' as const,
            uploadDate: new Date('2024-01-15'),
            wordCount: 8
          },
          sections: {
            contact: { name: 'John Doe', email: 'john@example.com', phone: '555-0123' },
            summary: 'Experienced Software Engineer',
            experience: [
              {
                title: 'Software Engineer',
                company: 'Tech Corp',
                startDate: '2020-01-01',
                endDate: '2024-01-01',
                description: 'Developed web applications using JavaScript'
              }
            ],
            education: [
              {
                degree: 'Bachelor of Science',
                field: 'Computer Science',
                school: 'University',
                graduationDate: '2019-12-01'
              }
            ],
            skills: ['JavaScript', 'React', 'Node.js'],
            certifications: []
          }
        },
        analysis: {
          score: 85,
          breakdown: {
            formatting: 90,
            keywords: 80,
            structure: 85,
            length: 85
          },
          recommendations: [
            {
              category: 'keywords',
              priority: 'high' as const,
              title: 'Add TypeScript',
              description: 'Consider adding TypeScript to your skills',
              impact: 'Would improve keyword matching'
            }
          ],
          keywordMatch: {
            found: ['JavaScript', 'React'],
            missing: ['TypeScript', 'AWS'],
            matchPercentage: 50,
            suggestions: ['Add TypeScript', 'Include AWS experience']
          },
          grammarIssues: [],
          modelUsed: 'gpt-3.5-turbo',
          fallbacksUsed: []
        },
        jobDescription: {
          content: 'Looking for JavaScript developer with React and TypeScript experience',
          extractedKeywords: ['JavaScript', 'React', 'TypeScript', 'AWS'],
          requiredSkills: ['JavaScript', 'React', 'TypeScript'],
          experienceLevel: '3+ years',
          jobTitle: 'Senior JavaScript Developer'
        },
        timestamp: new Date('2024-01-15T10:30:00')
      };

      const reportData = ReportService.generatePDFReportData(analysisData);

      expect(reportData).toHaveProperty('title');
      expect(reportData).toHaveProperty('sections');
      expect(reportData.title).toContain('john-doe-resume.pdf');
      expect(reportData.sections).toHaveLength.greaterThan(0);
      
      // Check that all required sections are present
      const sectionTitles = reportData.sections.map(s => s.title);
      expect(sectionTitles).toContain('Resume Overview');
      expect(sectionTitles).toContain('ATS Compatibility Score');
      expect(sectionTitles).toContain('Keyword Analysis');
      expect(sectionTitles).toContain('Recommendations');
    });

    it('should generate downloadable report blob', async () => {
      const { ReportService } = await import('@/lib/storage/report-service');
      
      const analysisData = {
        id: 'blob-analysis',
        resumeData: {
          id: 'blob-resume',
          content: 'Test content',
          metadata: {
            fileName: 'test.pdf',
            fileType: 'pdf' as const,
            uploadDate: new Date(),
            wordCount: 2
          },
          sections: {
            contact: { name: 'Test User' },
            summary: '',
            experience: [],
            education: [],
            skills: [],
            certifications: []
          }
        },
        analysis: {
          score: 75,
          breakdown: {
            formatting: 75,
            keywords: 75,
            structure: 75,
            length: 75
          },
          recommendations: [],
          keywordMatch: {
            found: [],
            missing: [],
            matchPercentage: 0,
            suggestions: []
          },
          grammarIssues: [],
          modelUsed: 'gpt-3.5-turbo',
          fallbacksUsed: []
        },
        timestamp: new Date()
      };

      const blob = await ReportService.generateDownloadableReport(analysisData, 'pdf');

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/pdf');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should generate CSV export data', async () => {
      const { ReportService } = await import('@/lib/storage/report-service');
      
      const historyData = [
        {
          id: 'csv-1',
          resumeData: {
            id: 'csv-resume-1',
            content: 'John Doe',
            metadata: {
              fileName: 'john.pdf',
              fileType: 'pdf' as const,
              uploadDate: new Date('2024-01-01'),
              wordCount: 2
            },
            sections: {
              contact: { name: 'John Doe' },
              summary: '',
              experience: [],
              education: [],
              skills: [],
              certifications: []
            }
          },
          analysis: {
            score: 85,
            breakdown: {
              formatting: 90,
              keywords: 80,
              structure: 85,
              length: 85
            },
            recommendations: [],
            keywordMatch: {
              found: [],
              missing: [],
              matchPercentage: 0,
              suggestions: []
            },
            grammarIssues: [],
            modelUsed: 'gpt-3.5-turbo',
            fallbacksUsed: []
          },
          timestamp: new Date('2024-01-01T10:00:00')
        },
        {
          id: 'csv-2',
          resumeData: {
            id: 'csv-resume-2',
            content: 'Jane Smith',
            metadata: {
              fileName: 'jane.pdf',
              fileType: 'pdf' as const,
              uploadDate: new Date('2024-01-02'),
              wordCount: 2
            },
            sections: {
              contact: { name: 'Jane Smith' },
              summary: '',
              experience: [],
              education: [],
              skills: [],
              certifications: []
            }
          },
          analysis: {
            score: 78,
            breakdown: {
              formatting: 80,
              keywords: 75,
              structure: 80,
              length: 78
            },
            recommendations: [],
            keywordMatch: {
              found: [],
              missing: [],
              matchPercentage: 0,
              suggestions: []
            },
            grammarIssues: [],
            modelUsed: 'gpt-3.5-turbo',
            fallbacksUsed: []
          },
          timestamp: new Date('2024-01-02T11:00:00')
        }
      ];

      const csvData = ReportService.generateCSVExport(historyData);

      expect(csvData).toContain('File Name,Date,Score,Formatting,Keywords,Structure,Length');
      expect(csvData).toContain('john.pdf');
      expect(csvData).toContain('jane.pdf');
      expect(csvData).toContain('85');
      expect(csvData).toContain('78');
    });

    it('should handle empty history for CSV export', async () => {
      const { ReportService } = await import('@/lib/storage/report-service');
      
      const csvData = ReportService.generateCSVExport([]);

      expect(csvData).toBe('File Name,Date,Score,Formatting,Keywords,Structure,Length\n');
    });

    it('should generate report with custom template', async () => {
      const { ReportService } = await import('@/lib/storage/report-service');
      
      const analysisData = {
        id: 'template-analysis',
        resumeData: {
          id: 'template-resume',
          content: 'Template test',
          metadata: {
            fileName: 'template.pdf',
            fileType: 'pdf' as const,
            uploadDate: new Date(),
            wordCount: 2
          },
          sections: {
            contact: { name: 'Template User' },
            summary: '',
            experience: [],
            education: [],
            skills: [],
            certifications: []
          }
        },
        analysis: {
          score: 80,
          breakdown: {
            formatting: 80,
            keywords: 80,
            structure: 80,
            length: 80
          },
          recommendations: [],
          keywordMatch: {
            found: [],
            missing: [],
            matchPercentage: 0,
            suggestions: []
          },
          grammarIssues: [],
          modelUsed: 'gpt-3.5-turbo',
          fallbacksUsed: []
        },
        timestamp: new Date()
      };

      const customTemplate = {
        title: 'Custom Report Template',
        sections: ['overview', 'score', 'recommendations'],
        styling: {
          primaryColor: '#0066cc',
          fontSize: '12px',
          fontFamily: 'Arial'
        }
      };

      const reportData = ReportService.generatePDFReportData(analysisData, customTemplate);

      expect(reportData.title).toBe('Custom Report Template');
      expect(reportData.styling).toEqual(customTemplate.styling);
    });
  });

  describe('Data Validation', () => {
    it('should validate resume data structure', async () => {
      const { validateResumeData } = await import('@/lib/utils/dataValidation');
      
      const validResumeData = {
        id: 'valid-resume',
        content: 'John Doe Software Engineer',
        metadata: {
          fileName: 'resume.pdf',
          fileType: 'pdf' as const,
          uploadDate: new Date(),
          wordCount: 4
        },
        sections: {
          contact: { name: 'John Doe', email: 'john@example.com' },
          summary: 'Software Engineer',
          experience: [],
          education: [],
          skills: ['JavaScript'],
          certifications: []
        }
      };

      expect(validateResumeData(validResumeData)).toBe(true);

      const invalidResumeData = {
        id: '',
        content: '',
        metadata: {
          fileName: '',
          fileType: 'invalid' as any,
          uploadDate: 'invalid-date' as any,
          wordCount: -1
        },
        sections: {
          contact: {},
          summary: '',
          experience: [],
          education: [],
          skills: [],
          certifications: []
        }
      };

      expect(validateResumeData(invalidResumeData)).toBe(false);
    });

    it('should validate analysis data structure', async () => {
      const { validateAnalysisData } = await import('@/lib/utils/dataValidation');
      
      const validAnalysisData = {
        score: 85,
        breakdown: {
          formatting: 90,
          keywords: 80,
          structure: 85,
          length: 85
        },
        recommendations: [
          {
            category: 'keywords',
            priority: 'high' as const,
            title: 'Add keywords',
            description: 'Add more keywords',
            impact: 'High impact'
          }
        ],
        keywordMatch: {
          found: ['JavaScript'],
          missing: ['React'],
          matchPercentage: 50,
          suggestions: ['Add React']
        },
        grammarIssues: [],
        modelUsed: 'gpt-3.5-turbo',
        fallbacksUsed: []
      };

      expect(validateAnalysisData(validAnalysisData)).toBe(true);

      const invalidAnalysisData = {
        score: 150, // Invalid score > 100
        breakdown: {
          formatting: -10, // Invalid negative score
          keywords: 'invalid' as any,
          structure: 85,
          length: 85
        },
        recommendations: 'invalid' as any,
        keywordMatch: {
          found: 'invalid' as any,
          missing: [],
          matchPercentage: 150, // Invalid percentage > 100
          suggestions: []
        },
        grammarIssues: [],
        modelUsed: '',
        fallbacksUsed: []
      };

      expect(validateAnalysisData(invalidAnalysisData)).toBe(false);
    });

    it('should sanitize user input data', async () => {
      const { sanitizeUserInput } = await import('@/lib/utils/dataValidation');
      
      const maliciousInput = '<script>alert("xss")</script>Hello World';
      const sanitized = sanitizeUserInput(maliciousInput);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('Hello World');
    });

    it('should validate file upload data', async () => {
      const { validateFileUpload } = await import('@/lib/utils/dataValidation');
      
      const validFile = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
      expect(validateFileUpload(validFile, ['pdf', 'docx'], 5 * 1024 * 1024)).toBe(true);
      
      const invalidTypeFile = new File(['content'], 'resume.txt', { type: 'text/plain' });
      expect(validateFileUpload(invalidTypeFile, ['pdf', 'docx'], 5 * 1024 * 1024)).toBe(false);
      
      const tooLargeFile = new File(['x'.repeat(10 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
      expect(validateFileUpload(tooLargeFile, ['pdf', 'docx'], 5 * 1024 * 1024)).toBe(false);
    });
  });

  describe('Data Migration', () => {
    it('should migrate old localStorage format to new format', async () => {
      const { DataMigration } = await import('@/lib/utils/dataMigration');
      
      // Set old format data
      const oldFormatData = {
        analyses: [
          {
            id: 'old-1',
            score: 85,
            date: '2024-01-01',
            fileName: 'old-resume.pdf'
          }
        ],
        usage: {
          count: 3,
          date: '2024-01-01'
        }
      };
      
      localStorage.setItem('resume-analyzer-data', JSON.stringify(oldFormatData));
      
      const migrated = DataMigration.migrateToCurrentVersion();
      
      expect(migrated).toBe(true);
      
      // Check that new format exists
      const newData = localStorage.getItem('usage-tracker');
      expect(newData).toBeTruthy();
      
      const historyData = localStorage.getItem('analysis-history');
      expect(historyData).toBeTruthy();
    });

    it('should handle migration of corrupted data', async () => {
      const { DataMigration } = await import('@/lib/utils/dataMigration');
      
      // Set corrupted data
      localStorage.setItem('resume-analyzer-data', 'corrupted-json-data');
      
      const migrated = DataMigration.migrateToCurrentVersion();
      
      // Should not throw error and should return false
      expect(migrated).toBe(false);
    });

    it('should skip migration if already on current version', async () => {
      const { DataMigration } = await import('@/lib/utils/dataMigration');
      
      // Set current version marker
      localStorage.setItem('data-version', '1.0.0');
      
      const migrated = DataMigration.migrateToCurrentVersion();
      
      expect(migrated).toBe(false); // No migration needed
    });
  });
});