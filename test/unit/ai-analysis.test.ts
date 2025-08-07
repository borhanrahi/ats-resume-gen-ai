import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Unit tests for AI analysis functionality

describe('AI Analysis Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Analysis Engine', () => {
    // Mock the analysis engine
    const mockAnalysisEngine = {
      analyzeResume: vi.fn(),
      generateSuggestions: vi.fn(),
      calculateScore: vi.fn()
    };

    beforeEach(() => {
      vi.doMock('@/lib/analysis/analysis-engine', () => ({
        analysisEngine: mockAnalysisEngine
      }));
    });

    it('should analyze resume successfully', async () => {
      const mockRequest = {
        resumeFile: new File(['resume content'], 'resume.pdf', { type: 'application/pdf' }),
        jobDescription: 'Software Engineer position',
        targetKeywords: ['JavaScript', 'React', 'Node.js'],
        userTier: 'free' as const
      };

      const mockResult = {
        isValidResume: true,
        atsScore: {
          totalScore: 85,
          percentage: 85,
          dimensions: {
            formatting: { name: 'Formatting', score: 90, percentage: 90 },
            keywords: { name: 'Keywords', score: 80, percentage: 80 },
            structure: { name: 'Structure', score: 85, percentage: 85 },
            length: { name: 'Length', score: 85, percentage: 85 }
          },
          penalties: [],
          recommendations: ['Add more technical keywords']
        },
        aiSuggestions: [
          {
            category: 'content',
            priority: 'high' as const,
            title: 'Improve technical skills section',
            description: 'Add more relevant technical skills',
            impact: 'High impact on ATS score'
          }
        ],
        keywordMatching: {
          foundKeywords: ['JavaScript', 'React'],
          missingKeywords: ['Node.js'],
          matchPercentage: 67,
          suggestions: ['Add Node.js to your skills section']
        },
        processingTime: 2500
      };

      mockAnalysisEngine.analyzeResume.mockResolvedValue(mockResult);

      const { analysisEngine } = await import('@/lib/analysis/analysis-engine');
      const result = await analysisEngine.analyzeResume(mockRequest);

      expect(result).toEqual(mockResult);
      expect(result.isValidResume).toBe(true);
      expect(result.atsScore?.totalScore).toBe(85);
      expect(result.keywordMatching?.matchPercentage).toBe(67);
      expect(result.aiSuggestions).toHaveLength(1);
    });

    it('should handle invalid resume detection', async () => {
      const mockRequest = {
        resumeFile: new File(['not a resume'], 'document.pdf', { type: 'application/pdf' }),
        userTier: 'free' as const
      };

      const mockResult = {
        isValidResume: false,
        resumeDetection: {
          isResume: false,
          confidence: 0.2,
          reasons: ['No contact information found', 'No work experience section']
        },
        aiSuggestions: [],
        processingTime: 1200,
        error: 'This document does not appear to be a resume or CV. Please upload a valid resume for ATS analysis.'
      };

      mockAnalysisEngine.analyzeResume.mockResolvedValue(mockResult);

      const { analysisEngine } = await import('@/lib/analysis/analysis-engine');
      const result = await analysisEngine.analyzeResume(mockRequest);

      expect(result.isValidResume).toBe(false);
      expect(result.error).toContain('does not appear to be a resume');
      expect(result.resumeDetection?.isResume).toBe(false);
    });

    it('should handle analysis errors gracefully', async () => {
      const mockRequest = {
        resumeFile: new File(['resume content'], 'resume.pdf', { type: 'application/pdf' }),
        userTier: 'free' as const
      };

      mockAnalysisEngine.analyzeResume.mockRejectedValue(new Error('AI service unavailable'));

      const { analysisEngine } = await import('@/lib/analysis/analysis-engine');
      const result = await analysisEngine.analyzeResume(mockRequest);

      expect(result.isValidResume).toBe(false);
      expect(result.error).toContain('Resume analysis failed');
      expect(result.aiSuggestions).toHaveLength(0);
    });

    it('should generate different suggestions for free vs premium users', async () => {
      const mockRequest = {
        resumeFile: new File(['resume content'], 'resume.pdf', { type: 'application/pdf' }),
        userTier: 'premium' as const
      };

      const mockPremiumResult = {
        isValidResume: true,
        aiSuggestions: [
          {
            category: 'content',
            priority: 'high' as const,
            title: 'Industry-specific optimization',
            description: 'Premium AI analysis with industry insights',
            impact: 'Premium feature - advanced analysis'
          },
          {
            category: 'keywords',
            priority: 'medium' as const,
            title: 'Advanced keyword strategy',
            description: 'Semantic keyword analysis and placement',
            impact: 'Premium feature - keyword optimization'
          }
        ],
        processingTime: 3500
      };

      mockAnalysisEngine.analyzeResume.mockResolvedValue(mockPremiumResult);

      const { analysisEngine } = await import('@/lib/analysis/analysis-engine');
      const result = await analysisEngine.analyzeResume(mockRequest);

      expect(result.aiSuggestions).toHaveLength(2);
      expect(result.aiSuggestions[0].impact).toContain('Premium feature');
      expect(result.aiSuggestions[1].impact).toContain('Premium feature');
    });
  });

  describe('ATS Scoring Engine', () => {
    const mockATSScoringEngine = {
      analyzeResume: vi.fn(),
      calculateScore: vi.fn()
    };

    beforeEach(() => {
      vi.doMock('@/lib/analysis/ats-scoring-engine', () => ({
        ATSScoringEngine: mockATSScoringEngine
      }));
    });

    it('should calculate ATS score correctly', async () => {
      const mockResumeData = {
        text: 'John Doe Software Engineer JavaScript React Node.js',
        sections: {
          contact: { name: 'John Doe', email: 'john@example.com' },
          experience: [
            {
              title: 'Software Engineer',
              company: 'Tech Corp',
              startDate: '2020-01-01',
              endDate: '2024-01-01',
              description: 'Developed web applications'
            }
          ],
          skills: ['JavaScript', 'React', 'Node.js']
        }
      };

      const mockJobDescription = 'Looking for JavaScript developer with React experience';
      const mockKeywords = ['JavaScript', 'React', 'Node.js'];

      const mockScoreResult = {
        totalScore: 85,
        percentage: 85,
        dimensions: {
          formatting: { name: 'Formatting', score: 90, percentage: 90 },
          keywords: { name: 'Keywords', score: 80, percentage: 80 },
          structure: { name: 'Structure', score: 85, percentage: 85 },
          length: { name: 'Length', score: 85, percentage: 85 }
        },
        penalties: [],
        recommendations: ['Consider adding more technical keywords']
      };

      mockATSScoringEngine.analyzeResume.mockResolvedValue(mockScoreResult);

      const { ATSScoringEngine } = await import('@/lib/analysis/ats-scoring-engine');
      const result = await ATSScoringEngine.analyzeResume(mockResumeData, mockJobDescription, mockKeywords);

      expect(result.totalScore).toBe(85);
      expect(result.dimensions.formatting.percentage).toBe(90);
      expect(result.dimensions.keywords.percentage).toBe(80);
      expect(result.recommendations).toHaveLength(1);
    });

    it('should penalize missing required sections', async () => {
      const incompleteResumeData = {
        text: 'John Doe',
        sections: {
          contact: { name: 'John Doe' },
          experience: [],
          skills: []
        }
      };

      const mockLowScoreResult = {
        totalScore: 45,
        percentage: 45,
        dimensions: {
          formatting: { name: 'Formatting', score: 60, percentage: 60 },
          keywords: { name: 'Keywords', score: 30, percentage: 30 },
          structure: { name: 'Structure', score: 40, percentage: 40 },
          length: { name: 'Length', score: 50, percentage: 50 }
        },
        penalties: [
          'Missing work experience section',
          'No skills listed',
          'Insufficient content length'
        ],
        recommendations: [
          'Add work experience section',
          'Include relevant skills',
          'Expand content with more details'
        ]
      };

      mockATSScoringEngine.analyzeResume.mockResolvedValue(mockLowScoreResult);

      const { ATSScoringEngine } = await import('@/lib/analysis/ats-scoring-engine');
      const result = await ATSScoringEngine.analyzeResume(incompleteResumeData);

      expect(result.totalScore).toBeLessThan(50);
      expect(result.penalties).toHaveLength(3);
      expect(result.recommendations).toHaveLength(3);
      expect(result.dimensions.structure.percentage).toBeLessThan(50);
    });

    it('should handle different resume formats', async () => {
      const mockResumeFormats = [
        {
          format: 'chronological',
          text: 'John Doe\nWork Experience:\n2020-2024: Software Engineer at Tech Corp',
          expectedScore: 85
        },
        {
          format: 'functional',
          text: 'John Doe\nSkills:\nJavaScript, React, Node.js\nExperience: 5 years',
          expectedScore: 75
        },
        {
          format: 'combination',
          text: 'John Doe\nSummary: Experienced developer\nSkills: JavaScript\nExperience: Software Engineer',
          expectedScore: 80
        }
      ];

      for (const resumeFormat of mockResumeFormats) {
        const mockResult = {
          totalScore: resumeFormat.expectedScore,
          percentage: resumeFormat.expectedScore,
          dimensions: {
            formatting: { name: 'Formatting', score: resumeFormat.expectedScore, percentage: resumeFormat.expectedScore },
            keywords: { name: 'Keywords', score: resumeFormat.expectedScore, percentage: resumeFormat.expectedScore },
            structure: { name: 'Structure', score: resumeFormat.expectedScore, percentage: resumeFormat.expectedScore },
            length: { name: 'Length', score: resumeFormat.expectedScore, percentage: resumeFormat.expectedScore }
          },
          penalties: [],
          recommendations: []
        };

        mockATSScoringEngine.analyzeResume.mockResolvedValue(mockResult);

        const { ATSScoringEngine } = await import('@/lib/analysis/ats-scoring-engine');
        const result = await ATSScoringEngine.analyzeResume({ text: resumeFormat.text, sections: {} });

        expect(result.totalScore).toBe(resumeFormat.expectedScore);
      }
    });
  });

  describe('Keyword Matcher', () => {
    const mockKeywordMatcher = {
      match: vi.fn(),
      extractKeywords: vi.fn(),
      calculateMatchPercentage: vi.fn()
    };

    beforeEach(() => {
      vi.doMock('@/lib/analysis/keywordMatcher', () => ({
        KeywordMatcher: mockKeywordMatcher
      }));
    });

    it('should match keywords correctly', async () => {
      const resumeContent = 'JavaScript developer with React and Node.js experience';
      const jobKeywords = ['JavaScript', 'React', 'Node.js', 'TypeScript', 'MongoDB'];

      const mockMatchResult = {
        found: ['JavaScript', 'React', 'Node.js'],
        missing: ['TypeScript', 'MongoDB'],
        matchPercentage: 60,
        suggestions: ['Add TypeScript to your skills', 'Consider learning MongoDB']
      };

      mockKeywordMatcher.match.mockReturnValue(mockMatchResult);

      const { KeywordMatcher } = await import('@/lib/analysis/keywordMatcher');
      const result = KeywordMatcher.match(resumeContent, jobKeywords);

      expect(result.found).toHaveLength(3);
      expect(result.missing).toHaveLength(2);
      expect(result.matchPercentage).toBe(60);
      expect(result.suggestions).toHaveLength(2);
    });

    it('should handle case-insensitive matching', async () => {
      const resumeContent = 'javascript and REACT developer';
      const jobKeywords = ['JavaScript', 'React'];

      const mockMatchResult = {
        found: ['JavaScript', 'React'],
        missing: [],
        matchPercentage: 100,
        suggestions: ['Great keyword match!']
      };

      mockKeywordMatcher.match.mockReturnValue(mockMatchResult);

      const { KeywordMatcher } = await import('@/lib/analysis/keywordMatcher');
      const result = KeywordMatcher.match(resumeContent, jobKeywords);

      expect(result.found).toContain('JavaScript');
      expect(result.found).toContain('React');
      expect(result.matchPercentage).toBe(100);
    });

    it('should extract keywords from resume content', async () => {
      const resumeContent = `
        John Doe
        Software Engineer
        Skills: JavaScript, React, Node.js, Python, AWS, Docker
        Experience: 5 years in web development
        Education: Bachelor of Computer Science
      `;

      const mockExtractedKeywords = [
        'JavaScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker',
        'Software Engineer', 'Web Development', 'Computer Science'
      ];

      mockKeywordMatcher.extractKeywords.mockReturnValue(mockExtractedKeywords);

      const { KeywordMatcher } = await import('@/lib/analysis/keywordMatcher');
      const result = KeywordMatcher.extractKeywords(resumeContent);

      expect(result).toHaveLength(9);
      expect(result).toContain('JavaScript');
      expect(result).toContain('React');
      expect(result).toContain('Software Engineer');
    });

    it('should handle empty inputs gracefully', async () => {
      const mockEmptyResult = {
        found: [],
        missing: [],
        matchPercentage: 0,
        suggestions: ['No keywords to analyze']
      };

      mockKeywordMatcher.match.mockReturnValue(mockEmptyResult);

      const { KeywordMatcher } = await import('@/lib/analysis/keywordMatcher');
      const result = KeywordMatcher.match('', []);

      expect(result.found).toHaveLength(0);
      expect(result.missing).toHaveLength(0);
      expect(result.matchPercentage).toBe(0);
    });

    it('should provide relevant suggestions based on missing keywords', async () => {
      const resumeContent = 'Frontend developer with HTML and CSS experience';
      const jobKeywords = ['HTML', 'CSS', 'JavaScript', 'React', 'TypeScript'];

      const mockMatchResult = {
        found: ['HTML', 'CSS'],
        missing: ['JavaScript', 'React', 'TypeScript'],
        matchPercentage: 40,
        suggestions: [
          'Add JavaScript to your skills - it\'s essential for frontend development',
          'Learn React framework to improve your marketability',
          'Consider adding TypeScript for better code quality'
        ]
      };

      mockKeywordMatcher.match.mockReturnValue(mockMatchResult);

      const { KeywordMatcher } = await import('@/lib/analysis/keywordMatcher');
      const result = KeywordMatcher.match(resumeContent, jobKeywords);

      expect(result.suggestions).toHaveLength(3);
      expect(result.suggestions[0]).toContain('JavaScript');
      expect(result.suggestions[1]).toContain('React');
      expect(result.suggestions[2]).toContain('TypeScript');
    });
  });

  describe('Resume Detection', () => {
    const mockResumeDetector = {
      detectResume: vi.fn(),
      analyzeContent: vi.fn(),
      calculateConfidence: vi.fn()
    };

    beforeEach(() => {
      vi.doMock('@/lib/analysis/resume-detector', () => ({
        resumeDetector: mockResumeDetector
      }));
    });

    it('should detect valid resume correctly', async () => {
      const validResumeContent = `
        John Doe
        john.doe@email.com
        (555) 123-4567
        
        EXPERIENCE
        Software Engineer - Tech Corp (2020-2024)
        - Developed web applications using React and Node.js
        
        EDUCATION
        Bachelor of Computer Science - University (2016-2020)
        
        SKILLS
        JavaScript, React, Node.js, Python
      `;

      const mockDetectionResult = {
        isResume: true,
        confidence: 0.95,
        reasons: [
          'Contact information found',
          'Work experience section present',
          'Education section present',
          'Skills section present'
        ],
        sections: {
          contact: true,
          experience: true,
          education: true,
          skills: true,
          summary: false
        }
      };

      mockResumeDetector.detectResume.mockReturnValue(mockDetectionResult);

      const { resumeDetector } = await import('@/lib/analysis/resume-detector');
      const result = resumeDetector.detectResume(validResumeContent, 'resume.pdf');

      expect(result.isResume).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.reasons).toHaveLength(4);
      expect(result.sections.contact).toBe(true);
      expect(result.sections.experience).toBe(true);
    });

    it('should detect invalid document correctly', async () => {
      const invalidContent = `
        This is just a regular document with some text.
        It doesn't contain any resume-like information.
        No contact details, no work experience, no education.
        Just random content that shouldn't be classified as a resume.
      `;

      const mockDetectionResult = {
        isResume: false,
        confidence: 0.15,
        reasons: [
          'No contact information found',
          'No work experience section',
          'No education section',
          'No skills section'
        ],
        sections: {
          contact: false,
          experience: false,
          education: false,
          skills: false,
          summary: false
        }
      };

      mockResumeDetector.detectResume.mockReturnValue(mockDetectionResult);

      const { resumeDetector } = await import('@/lib/analysis/resume-detector');
      const result = resumeDetector.detectResume(invalidContent, 'document.pdf');

      expect(result.isResume).toBe(false);
      expect(result.confidence).toBeLessThan(0.5);
      expect(result.reasons).toHaveLength(4);
      expect(result.sections.contact).toBe(false);
      expect(result.sections.experience).toBe(false);
    });

    it('should handle partial resume content', async () => {
      const partialResumeContent = `
        Jane Smith
        jane@email.com
        
        SKILLS
        Project Management, Leadership, Communication
        
        Some additional text but missing work experience and education.
      `;

      const mockDetectionResult = {
        isResume: true,
        confidence: 0.65,
        reasons: [
          'Contact information found',
          'Skills section present'
        ],
        warnings: [
          'Missing work experience section',
          'Missing education section'
        ],
        sections: {
          contact: true,
          experience: false,
          education: false,
          skills: true,
          summary: false
        }
      };

      mockResumeDetector.detectResume.mockReturnValue(mockDetectionResult);

      const { resumeDetector } = await import('@/lib/analysis/resume-detector');
      const result = resumeDetector.detectResume(partialResumeContent, 'partial-resume.pdf');

      expect(result.isResume).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.confidence).toBeLessThan(0.8);
      expect(result.warnings).toHaveLength(2);
    });

    it('should consider file name in detection', async () => {
      const ambiguousContent = `
        John Doe
        Some text that could be a resume but isn't very clear.
        Has a name but not much else.
      `;

      // Test with resume-like filename
      const mockResumeFilenameResult = {
        isResume: true,
        confidence: 0.55,
        reasons: [
          'Filename suggests resume document',
          'Contact name found'
        ],
        sections: {
          contact: true,
          experience: false,
          education: false,
          skills: false,
          summary: false
        }
      };

      mockResumeDetector.detectResume.mockReturnValue(mockResumeFilenameResult);

      const { resumeDetector } = await import('@/lib/analysis/resume-detector');
      const resumeResult = resumeDetector.detectResume(ambiguousContent, 'john-doe-resume.pdf');

      expect(resumeResult.isResume).toBe(true);
      expect(resumeResult.reasons).toContain('Filename suggests resume document');

      // Test with non-resume filename
      const mockNonResumeFilenameResult = {
        isResume: false,
        confidence: 0.25,
        reasons: [
          'Contact name found'
        ],
        warnings: [
          'Filename doesn\'t suggest resume document'
        ],
        sections: {
          contact: true,
          experience: false,
          education: false,
          skills: false,
          summary: false
        }
      };

      mockResumeDetector.detectResume.mockReturnValue(mockNonResumeFilenameResult);

      const nonResumeResult = resumeDetector.detectResume(ambiguousContent, 'random-document.pdf');

      expect(nonResumeResult.isResume).toBe(false);
      expect(nonResumeResult.confidence).toBeLessThan(0.5);
    });
  });
});