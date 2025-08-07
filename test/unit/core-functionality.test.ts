import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Core functionality unit tests for document parsing, AI analysis, and data processing

describe('Core Functionality Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Document Parsing', () => {
    describe('PDF Parser', () => {
      it('should extract text from valid PDF buffer', async () => {
        // Mock pdfjs-dist
        const mockPdfDocument = {
          numPages: 2,
          getPage: vi.fn().mockImplementation((pageNum) => ({
            getTextContent: vi.fn().mockResolvedValue({
              items: [
                { str: 'John Doe', transform: [1, 0, 0, 1, 100, 700] },
                { str: 'Software Engineer', transform: [1, 0, 0, 1, 100, 680] },
                { str: 'Experience: 5 years', transform: [1, 0, 0, 1, 100, 660] }
              ]
            })
          }))
        };

        vi.doMock('pdfjs-dist', () => ({
          getDocument: vi.fn().mockResolvedValue(mockPdfDocument)
        }));

        const { PDFParser } = await import('@/lib/parsers/pdfParser');
        
        const mockFile = new File(['mock pdf content'], 'resume.pdf', { type: 'application/pdf' });
        const result = await PDFParser.parse(mockFile);

        expect(result).toHaveProperty('content');
        expect(result).toHaveProperty('metadata');
        expect(result.content).toContain('John Doe');
        expect(result.content).toContain('Software Engineer');
        expect(result.metadata.fileName).toBe('resume.pdf');
        expect(result.metadata.fileType).toBe('pdf');
        expect(result.metadata.wordCount).toBeGreaterThan(0);
      });

      it('should handle PDF parsing errors gracefully', async () => {
        vi.doMock('pdfjs-dist', () => ({
          getDocument: vi.fn().mockRejectedValue(new Error('Invalid PDF'))
        }));

        const { PDFParser, PDFParseException } = await import('@/lib/parsers/pdfParser');
        
        const invalidFile = new File(['invalid content'], 'invalid.pdf', { type: 'application/pdf' });
        
        await expect(PDFParser.parse(invalidFile)).rejects.toThrow(PDFParseException);
      });

      it('should validate file type before parsing', async () => {
        const { PDFParser, PDFParseException } = await import('@/lib/parsers/pdfParser');
        
        const textFile = new File(['text content'], 'document.txt', { type: 'text/plain' });
        
        await expect(PDFParser.parse(textFile)).rejects.toThrow(PDFParseException);
      });

      it('should handle empty files', async () => {
        const { PDFParser, PDFParseException } = await import('@/lib/parsers/pdfParser');
        
        const emptyFile = new File([], 'empty.pdf', { type: 'application/pdf' });
        
        await expect(PDFParser.parse(emptyFile)).rejects.toThrow(PDFParseException);
      });
    });

    describe('DOCX Parser', () => {
      it('should extract text from valid DOCX buffer', async () => {
        const mockMammoth = {
          extractRawText: vi.fn().mockResolvedValue({
            value: 'John Doe\nSoftware Engineer\nExperience: 5 years in web development',
            messages: []
          })
        };

        vi.doMock('mammoth', () => mockMammoth);

        const { DOCXParser } = await import('@/lib/parsers/docxParser');
        
        const mockFile = new File(['mock docx content'], 'resume.docx', { 
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        });
        
        const result = await DOCXParser.parse(mockFile);

        expect(result).toHaveProperty('content');
        expect(result).toHaveProperty('metadata');
        expect(result.content).toContain('John Doe');
        expect(result.content).toContain('Software Engineer');
        expect(result.metadata.fileName).toBe('resume.docx');
        expect(result.metadata.fileType).toBe('docx');
        expect(mockMammoth.extractRawText).toHaveBeenCalled();
      });

      it('should handle DOCX parsing errors', async () => {
        const mockMammoth = {
          extractRawText: vi.fn().mockRejectedValue(new Error('Invalid DOCX'))
        };

        vi.doMock('mammoth', () => mockMammoth);

        const { DOCXParser, DOCXParseException } = await import('@/lib/parsers/docxParser');
        
        const invalidFile = new File(['invalid content'], 'invalid.docx', { 
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        });
        
        await expect(DOCXParser.parse(invalidFile)).rejects.toThrow(DOCXParseException);
      });

      it('should validate DOCX file type', async () => {
        const { DOCXParser, DOCXParseException } = await import('@/lib/parsers/docxParser');
        
        const textFile = new File(['text content'], 'document.txt', { type: 'text/plain' });
        
        await expect(DOCXParser.parse(textFile)).rejects.toThrow(DOCXParseException);
      });
    });

    describe('Job Description Parser', () => {
      it('should extract keywords from job description text', async () => {
        const { JobDescriptionParser } = await import('@/lib/parsers/jobDescriptionParser');
        
        const jobDescription = `
          We are looking for a Senior Software Engineer with experience in:
          - JavaScript, TypeScript, React
          - Node.js, Express, MongoDB
          - AWS, Docker, Kubernetes
          - 5+ years of experience
          - Bachelor's degree in Computer Science
        `;

        const result = JobDescriptionParser.parse(jobDescription);

        expect(result).toHaveProperty('content');
        expect(result).toHaveProperty('extractedKeywords');
        expect(result).toHaveProperty('requiredSkills');
        expect(result).toHaveProperty('experienceLevel');
        expect(result).toHaveProperty('jobTitle');

        expect(result.extractedKeywords).toContain('JavaScript');
        expect(result.extractedKeywords).toContain('TypeScript');
        expect(result.extractedKeywords).toContain('React');
        expect(result.requiredSkills).toContain('Node.js');
        expect(result.experienceLevel).toContain('5+ years');
        expect(result.jobTitle).toContain('Senior Software Engineer');
      });

      it('should handle empty job descriptions', () => {
        const { JobDescriptionParser } = await import('@/lib/parsers/jobDescriptionParser');
        
        const result = JobDescriptionParser.parse('');

        expect(result.content).toBe('');
        expect(result.extractedKeywords).toHaveLength(0);
        expect(result.requiredSkills).toHaveLength(0);
      });

      it('should extract experience requirements', () => {
        const { JobDescriptionParser } = await import('@/lib/parsers/jobDescriptionParser');
        
        const jobDescription = 'Looking for a candidate with 3-5 years of experience in software development.';
        const result = JobDescriptionParser.parse(jobDescription);

        expect(result.experienceLevel).toMatch(/3-5 years/);
      });
    });
  });

  describe('AI Analysis Engine', () => {
    describe('Analysis Engine Core', () => {
      it('should orchestrate complete analysis pipeline', async () => {
        // Mock AI clients
        const mockOpenRouterResponse = {
          score: 85,
          breakdown: {
            formatting: 90,
            keywords: 80,
            structure: 85,
            length: 85
          },
          recommendations: ['Add more technical keywords', 'Improve formatting']
        };

        const mockGeminiResponse = {
          grammarIssues: [
            { text: 'experiance', suggestion: 'experience', position: 45 }
          ],
          suggestions: ['Use stronger action verbs']
        };

        vi.doMock('@/lib/ai/openRouterClient', () => ({
          OpenRouterClient: {
            analyzeResume: vi.fn().mockResolvedValue(mockOpenRouterResponse)
          }
        }));

        vi.doMock('@/lib/ai/geminiClient', () => ({
          GeminiClient: {
            checkGrammar: vi.fn().mockResolvedValue(mockGeminiResponse)
          }
        }));

        const { AnalysisEngine } = await import('@/lib/analysis/analysis-engine');
        
        const mockResumeData = {
          id: 'test-resume',
          content: 'John Doe Software Engineer with experiance in JavaScript',
          metadata: {
            fileName: 'resume.pdf',
            fileType: 'pdf' as const,
            uploadDate: new Date(),
            wordCount: 10
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

        const mockJobDescription = {
          content: 'Looking for JavaScript developer',
          extractedKeywords: ['JavaScript', 'developer'],
          requiredSkills: ['JavaScript'],
          experienceLevel: '2+ years',
          jobTitle: 'JavaScript Developer'
        };

        const result = await AnalysisEngine.analyze(mockResumeData, mockJobDescription);

        expect(result).toHaveProperty('score');
        expect(result).toHaveProperty('breakdown');
        expect(result).toHaveProperty('recommendations');
        expect(result).toHaveProperty('keywordMatch');
        expect(result).toHaveProperty('grammarIssues');
        expect(result.score).toBe(85);
        expect(result.grammarIssues).toHaveLength(1);
        expect(result.grammarIssues[0].text).toBe('experiance');
      });

      it('should handle AI API failures gracefully', async () => {
        vi.doMock('@/lib/ai/openRouterClient', () => ({
          OpenRouterClient: {
            analyzeResume: vi.fn().mockRejectedValue(new Error('API Error'))
          }
        }));

        const { AnalysisEngine } = await import('@/lib/analysis/analysis-engine');
        
        const mockResumeData = {
          id: 'test-resume',
          content: 'Test content',
          metadata: {
            fileName: 'resume.pdf',
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
        };

        await expect(AnalysisEngine.analyze(mockResumeData)).rejects.toThrow('API Error');
      });
    });

    describe('ATS Scoring Engine', () => {
      it('should calculate ATS score based on multiple factors', async () => {
        const { ATSScoringEngine } = await import('@/lib/analysis/ats-scoring-engine');
        
        const mockResumeData = {
          content: 'John Doe\nSoftware Engineer\nJavaScript, React, Node.js\n5 years experience',
          sections: {
            contact: { name: 'John Doe', email: 'john@example.com' },
            summary: 'Experienced Software Engineer',
            experience: [
              {
                title: 'Software Engineer',
                company: 'Tech Corp',
                startDate: '2019-01-01',
                endDate: '2024-01-01',
                description: 'Developed web applications using JavaScript and React'
              }
            ],
            education: [
              {
                degree: 'Bachelor of Science',
                field: 'Computer Science',
                school: 'University',
                graduationDate: '2018-12-01'
              }
            ],
            skills: ['JavaScript', 'React', 'Node.js'],
            certifications: []
          }
        };

        const mockJobDescription = {
          extractedKeywords: ['JavaScript', 'React', 'Node.js', 'Software Engineer'],
          requiredSkills: ['JavaScript', 'React'],
          experienceLevel: '3+ years'
        };

        const result = ATSScoringEngine.calculateScore(mockResumeData, mockJobDescription);

        expect(result).toHaveProperty('score');
        expect(result).toHaveProperty('breakdown');
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
        expect(result.breakdown).toHaveProperty('formatting');
        expect(result.breakdown).toHaveProperty('keywords');
        expect(result.breakdown).toHaveProperty('structure');
        expect(result.breakdown).toHaveProperty('length');
      });

      it('should penalize missing required sections', async () => {
        const { ATSScoringEngine } = await import('@/lib/analysis/ats-scoring-engine');
        
        const incompleteResumeData = {
          content: 'John Doe',
          sections: {
            contact: { name: 'John Doe' },
            summary: '',
            experience: [],
            education: [],
            skills: [],
            certifications: []
          }
        };

        const result = ATSScoringEngine.calculateScore(incompleteResumeData);

        expect(result.score).toBeLessThan(50); // Should be low due to missing sections
        expect(result.breakdown.structure).toBeLessThan(70);
      });
    });

    describe('Keyword Matcher', () => {
      it('should match keywords between resume and job description', async () => {
        const { KeywordMatcher } = await import('@/lib/analysis/keywordMatcher');
        
        const resumeContent = 'JavaScript developer with React and Node.js experience';
        const jobKeywords = ['JavaScript', 'React', 'Node.js', 'TypeScript', 'MongoDB'];

        const result = KeywordMatcher.match(resumeContent, jobKeywords);

        expect(result).toHaveProperty('found');
        expect(result).toHaveProperty('missing');
        expect(result).toHaveProperty('matchPercentage');

        expect(result.found).toContain('JavaScript');
        expect(result.found).toContain('React');
        expect(result.found).toContain('Node.js');
        expect(result.missing).toContain('TypeScript');
        expect(result.missing).toContain('MongoDB');
        expect(result.matchPercentage).toBe(60); // 3 out of 5 keywords found
      });

      it('should handle case-insensitive matching', async () => {
        const { KeywordMatcher } = await import('@/lib/analysis/keywordMatcher');
        
        const resumeContent = 'javascript and REACT developer';
        const jobKeywords = ['JavaScript', 'React'];

        const result = KeywordMatcher.match(resumeContent, jobKeywords);

        expect(result.found).toContain('JavaScript');
        expect(result.found).toContain('React');
        expect(result.matchPercentage).toBe(100);
      });

      it('should handle empty inputs', async () => {
        const { KeywordMatcher } = await import('@/lib/analysis/keywordMatcher');
        
        const result = KeywordMatcher.match('', []);

        expect(result.found).toHaveLength(0);
        expect(result.missing).toHaveLength(0);
        expect(result.matchPercentage).toBe(0);
      });
    });
  });

  describe('Data Processing', () => {
    describe('Usage Tracker', () => {
      it('should track daily usage correctly', async () => {
        const { UsageTracker } = await import('@/lib/storage/usageTracker');
        
        // Clear localStorage
        localStorage.clear();

        const tracker = new UsageTracker();
        
        expect(tracker.getDailyUsage()).toBe(0);
        expect(tracker.canAnalyze()).toBe(true);

        // Increment usage
        tracker.incrementUsage();
        expect(tracker.getDailyUsage()).toBe(1);

        // Test limit
        for (let i = 0; i < 4; i++) {
          tracker.incrementUsage();
        }
        
        expect(tracker.getDailyUsage()).toBe(5);
        expect(tracker.canAnalyze()).toBe(false);
      });

      it('should reset usage daily', async () => {
        const { UsageTracker } = await import('@/lib/storage/usageTracker');
        
        localStorage.clear();
        const tracker = new UsageTracker();

        // Set usage to max
        for (let i = 0; i < 5; i++) {
          tracker.incrementUsage();
        }
        
        expect(tracker.canAnalyze()).toBe(false);

        // Mock date to next day
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        vi.setSystemTime(tomorrow);

        expect(tracker.canAnalyze()).toBe(true);
        expect(tracker.getDailyUsage()).toBe(0);
      });

      it('should persist usage in localStorage', async () => {
        const { UsageTracker } = await import('@/lib/storage/usageTracker');
        
        localStorage.clear();
        
        const tracker1 = new UsageTracker();
        tracker1.incrementUsage();
        tracker1.incrementUsage();

        // Create new instance to test persistence
        const tracker2 = new UsageTracker();
        expect(tracker2.getDailyUsage()).toBe(2);
      });
    });

    describe('Error Handler', () => {
      it('should categorize errors correctly', async () => {
        const { ErrorHandler } = await import('@/lib/utils/errorHandler');
        
        const parseError = ErrorHandler.handle('PARSE_ERROR', { fileName: 'test.pdf' });
        expect(parseError.message).toContain('Unable to parse document');
        expect(parseError.recoverable).toBe(true);

        const usageLimitError = ErrorHandler.handle('USAGE_LIMIT_EXCEEDED');
        expect(usageLimitError.message).toContain('Daily analysis limit reached');
        expect(usageLimitError.recoverable).toBe(false);

        const authError = ErrorHandler.handle('AUTH_ERROR');
        expect(authError.message).toContain('Authentication failed');
      });

      it('should provide appropriate recovery actions', async () => {
        const { ErrorHandler } = await import('@/lib/utils/errorHandler');
        
        const networkError = ErrorHandler.handle('NETWORK_ERROR');
        expect(networkError.action).toContain('Check your internet connection');

        const exportError = ErrorHandler.handle('EXPORT_ERROR');
        expect(exportError.action).toContain('Try exporting again');
      });

      it('should log errors with context', async () => {
        const { ErrorHandler } = await import('@/lib/utils/errorHandler');
        
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        const context = { userId: 'user123', fileName: 'resume.pdf' };
        ErrorHandler.handle('AI_API_ERROR', context);

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('AI_API_ERROR'),
          expect.objectContaining(context)
        );

        consoleSpy.mockRestore();
      });
    });

    describe('Export Utils', () => {
      it('should generate PDF export options', async () => {
        const { PDFExporter } = await import('@/lib/utils/exportUtils');
        
        const mockBlocks = [
          {
            id: 'contact',
            type: 'contact' as const,
            title: 'Contact Information',
            content: {
              name: 'John Doe',
              email: 'john@example.com',
              phone: '555-0123'
            },
            order: 0,
            isVisible: true,
            isEditing: false
          }
        ];

        const options = PDFExporter.getExportOptions(mockBlocks);

        expect(options).toHaveProperty('filename');
        expect(options).toHaveProperty('format');
        expect(options).toHaveProperty('quality');
        expect(options.filename).toContain('John_Doe_Resume.pdf');
      });

      it('should generate DOCX export options', async () => {
        const { DOCXExporter } = await import('@/lib/utils/exportUtils');
        
        const mockBlocks = [
          {
            id: 'experience',
            type: 'experience' as const,
            title: 'Work Experience',
            content: [
              {
                title: 'Software Engineer',
                company: 'Tech Corp',
                startDate: '2020-01-01',
                endDate: '2024-01-01',
                description: 'Developed web applications'
              }
            ],
            order: 1,
            isVisible: true,
            isEditing: false
          }
        ];

        const options = DOCXExporter.getExportOptions(mockBlocks);

        expect(options).toHaveProperty('filename');
        expect(options).toHaveProperty('template');
        expect(options.filename).toContain('.docx');
      });
    });

    describe('Template Utils', () => {
      it('should validate template structure', async () => {
        const { validateTemplate } = await import('@/lib/templateUtils');
        
        const validTemplate = {
          id: 'test-template',
          name: 'Test Template',
          category: 'modern' as const,
          preview: '/preview.png',
          isActive: true,
          structure: {
            layout: 'single-column' as const,
            sections: {
              contact: { order: 0, column: 0, required: true },
              summary: { order: 1, column: 0, required: false }
            }
          },
          styling: {
            colors: {
              primary: '#000000',
              secondary: '#666666',
              text: '#333333',
              background: '#ffffff',
              accent: '#0066cc'
            },
            fonts: {
              heading: 'Arial',
              body: 'Arial',
              size: {
                heading: '1.5rem',
                subheading: '1.25rem',
                body: '1rem',
                small: '0.875rem'
              }
            },
            spacing: {
              section: '2rem',
              paragraph: '1rem',
              line: '1.5'
            },
            borders: {
              width: '1px',
              style: 'solid',
              color: '#e0e0e0'
            }
          }
        };

        expect(validateTemplate(validTemplate)).toBe(true);

        const invalidTemplate = { ...validTemplate, id: '' };
        expect(validateTemplate(invalidTemplate)).toBe(false);
      });

      it('should generate CSS variables from template styling', async () => {
        const { generateCSSVariables } = await import('@/lib/templateUtils');
        
        const styling = {
          colors: {
            primary: '#000000',
            secondary: '#666666',
            text: '#333333',
            background: '#ffffff',
            accent: '#0066cc'
          },
          fonts: {
            heading: 'Arial',
            body: 'Georgia',
            size: {
              heading: '1.5rem',
              subheading: '1.25rem',
              body: '1rem',
              small: '0.875rem'
            }
          },
          spacing: {
            section: '2rem',
            paragraph: '1rem',
            line: '1.5'
          },
          borders: {
            width: '1px',
            style: 'solid',
            color: '#e0e0e0'
          }
        };

        const variables = generateCSSVariables(styling);

        expect(variables).toHaveProperty('--template-color-primary', '#000000');
        expect(variables).toHaveProperty('--template-color-secondary', '#666666');
        expect(variables).toHaveProperty('--template-font-heading', 'Arial');
        expect(variables).toHaveProperty('--template-font-body', 'Georgia');
        expect(variables).toHaveProperty('--template-spacing-section', '2rem');
      });

      it('should customize template with user preferences', async () => {
        const { customizeTemplate } = await import('@/lib/templateUtils');
        
        const baseTemplate = {
          id: 'test-template',
          name: 'Test Template',
          category: 'modern' as const,
          preview: '/preview.png',
          isActive: true,
          structure: {
            layout: 'single-column' as const,
            sections: {
              contact: { order: 0, column: 0, required: true }
            }
          },
          styling: {
            colors: {
              primary: '#000000',
              secondary: '#666666',
              text: '#333333',
              background: '#ffffff',
              accent: '#0066cc'
            },
            fonts: {
              heading: 'Arial',
              body: 'Arial',
              size: {
                heading: '1.5rem',
                subheading: '1.25rem',
                body: '1rem',
                small: '0.875rem'
              }
            },
            spacing: {
              section: '2rem',
              paragraph: '1rem',
              line: '1.5'
            },
            borders: {
              width: '1px',
              style: 'solid',
              color: '#e0e0e0'
            }
          }
        };

        const customizations = {
          colors: {
            primary: '#ff0000',
            accent: '#00ff00'
          },
          fonts: {
            heading: 'Georgia'
          }
        };

        const customized = customizeTemplate(baseTemplate, customizations);

        expect(customized.styling.colors.primary).toBe('#ff0000');
        expect(customized.styling.colors.accent).toBe('#00ff00');
        expect(customized.styling.colors.secondary).toBe('#666666'); // unchanged
        expect(customized.styling.fonts.heading).toBe('Georgia');
        expect(customized.styling.fonts.body).toBe('Arial'); // unchanged
      });
    });
  });
});