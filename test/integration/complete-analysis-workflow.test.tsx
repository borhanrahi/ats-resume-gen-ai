import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnalyzePage } from '../../app/analyze/page';
import { parsePDF } from '../../lib/parsers/pdf-parser';
import { parseDOCX } from '../../lib/parsers/docx-parser';
import { AnalysisEngine } from '../../lib/analysis/analysis-engine';

// Mock external dependencies
vi.mock('../../lib/parsers/pdf-parser');
vi.mock('../../lib/parsers/docx-parser');
vi.mock('../../lib/analysis/analysis-engine');

describe('Complete Analysis Workflow Integration Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Free Tier Analysis Workflow', () => {
    it('should complete full analysis workflow for PDF resume', async () => {
      // Mock successful PDF parsing
      (parsePDF as any).mockResolvedValue({
        text: 'John Doe\nSoftware Engineer\nExperience with JavaScript, React, and Node.js',
        metadata: { pageCount: 1 }
      });

      // Mock successful analysis
      const mockAnalysisResult = {
        ats_analysis: {
          ats_score: 85,
          breakdown: {
            formatting: 90,
            keywords: 80,
            structure: 85,
            experience: 88,
            skills: 82
          },
          recommendations: ['Add more relevant keywords', 'Improve formatting'],
          missing_keywords: ['TypeScript', 'AWS'],
          keyword_matches: ['JavaScript', 'React', 'Node.js']
        },
        grammar_analysis: {
          grammar_score: 95,
          issues: [],
          suggestions: []
        },
        overall_score: 90
      };

      const mockAnalysisEngine = {
        analyzeResume: vi.fn().mockResolvedValue(mockAnalysisResult)
      };
      (AnalysisEngine as any).mockImplementation(() => mockAnalysisEngine);

      render(<AnalyzePage />);

      // Upload resume file
      const fileInput = screen.getByLabelText(/upload resume/i);
      const file = new File(['mock pdf content'], 'resume.pdf', { type: 'application/pdf' });
      
      await user.upload(fileInput, file);

      // Add job description
      const jobDescriptionInput = screen.getByLabelText(/job description/i);
      await user.type(jobDescriptionInput, 'Looking for a JavaScript developer with React experience');

      // Start analysis
      const analyzeButton = screen.getByRole('button', { name: /analyze resume/i });
      await user.click(analyzeButton);

      // Wait for analysis to complete
      await waitFor(() => {
        expect(screen.getByText(/analysis complete/i)).toBeInTheDocument();
      });

      // Verify results are displayed
      expect(screen.getByText('85')).toBeInTheDocument(); // ATS score
      expect(screen.getByText('95')).toBeInTheDocument(); // Grammar score
      expect(screen.getByText(/add more relevant keywords/i)).toBeInTheDocument();
      expect(screen.getByText(/typescript/i)).toBeInTheDocument(); // Missing keyword

      // Verify usage tracking
      expect(localStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('usage'),
        expect.any(String)
      );
    });

    it('should handle DOCX resume upload and analysis', async () => {
      (parseDOCX as any).mockResolvedValue({
        text: 'Jane Smith\nProduct Manager\nExperience in product strategy and user research',
        metadata: { hasFormatting: true }
      });

      const mockAnalysisResult = {
        ats_analysis: {
          ats_score: 78,
          breakdown: {
            formatting: 85,
            keywords: 70,
            structure: 80,
            experience: 85,
            skills: 75
          },
          recommendations: ['Add more technical keywords'],
          missing_keywords: ['Agile', 'Scrum'],
          keyword_matches: ['Product Manager', 'Strategy']
        },
        grammar_analysis: {
          grammar_score: 92,
          issues: [
            {
              type: 'grammar',
              text: 'user research',
              suggestion: 'user research methodologies',
              position: { start: 50, end: 63 }
            }
          ],
          suggestions: ['Be more specific about methodologies']
        },
        overall_score: 85
      };

      const mockAnalysisEngine = {
        analyzeResume: vi.fn().mockResolvedValue(mockAnalysisResult)
      };
      (AnalysisEngine as any).mockImplementation(() => mockAnalysisEngine);

      render(<AnalyzePage />);

      const fileInput = screen.getByLabelText(/upload resume/i);
      const file = new File(['mock docx content'], 'resume.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      await user.upload(fileInput, file);

      const jobDescriptionInput = screen.getByLabelText(/job description/i);
      await user.type(jobDescriptionInput, 'Product Manager role requiring Agile and Scrum experience');

      const analyzeButton = screen.getByRole('button', { name: /analyze resume/i });
      await user.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText(/analysis complete/i)).toBeInTheDocument();
      });

      expect(screen.getByText('78')).toBeInTheDocument();
      expect(screen.getByText('92')).toBeInTheDocument();
      expect(screen.getByText(/agile/i)).toBeInTheDocument();
      expect(screen.getByText(/scrum/i)).toBeInTheDocument();
    });

    it('should enforce usage limits for free tier', async () => {
      // Mock localStorage to show user has reached daily limit
      (localStorage.getItem as any).mockReturnValue(JSON.stringify({
        date: new Date().toDateString(),
        count: 5 // Daily limit reached
      }));

      render(<AnalyzePage />);

      const fileInput = screen.getByLabelText(/upload resume/i);
      const file = new File(['mock content'], 'resume.pdf', { type: 'application/pdf' });
      
      await user.upload(fileInput, file);

      const analyzeButton = screen.getByRole('button', { name: /analyze resume/i });
      await user.click(analyzeButton);

      // Should show upgrade prompt instead of analyzing
      await waitFor(() => {
        expect(screen.getByText(/daily limit reached/i)).toBeInTheDocument();
        expect(screen.getByText(/upgrade to premium/i)).toBeInTheDocument();
      });

      // Analysis should not be called
      expect(AnalysisEngine).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling in Workflow', () => {
    it('should handle file parsing errors gracefully', async () => {
      (parsePDF as any).mockRejectedValue(new Error('Corrupted PDF file'));

      render(<AnalyzePage />);

      const fileInput = screen.getByLabelText(/upload resume/i);
      const file = new File(['corrupted content'], 'resume.pdf', { type: 'application/pdf' });
      
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/error parsing file/i)).toBeInTheDocument();
        expect(screen.getByText(/corrupted pdf file/i)).toBeInTheDocument();
      });
    });

    it('should handle analysis API errors gracefully', async () => {
      (parsePDF as any).mockResolvedValue({
        text: 'Sample resume text',
        metadata: { pageCount: 1 }
      });

      const mockAnalysisEngine = {
        analyzeResume: vi.fn().mockRejectedValue(new Error('API rate limit exceeded'))
      };
      (AnalysisEngine as any).mockImplementation(() => mockAnalysisEngine);

      render(<AnalyzePage />);

      const fileInput = screen.getByLabelText(/upload resume/i);
      const file = new File(['mock content'], 'resume.pdf', { type: 'application/pdf' });
      
      await user.upload(fileInput, file);

      const jobDescriptionInput = screen.getByLabelText(/job description/i);
      await user.type(jobDescriptionInput, 'Sample job description');

      const analyzeButton = screen.getByRole('button', { name: /analyze resume/i });
      await user.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText(/analysis failed/i)).toBeInTheDocument();
        expect(screen.getByText(/api rate limit exceeded/i)).toBeInTheDocument();
      });
    });

    it('should handle network connectivity issues', async () => {
      (parsePDF as any).mockResolvedValue({
        text: 'Sample resume text',
        metadata: { pageCount: 1 }
      });

      const mockAnalysisEngine = {
        analyzeResume: vi.fn().mockRejectedValue(new Error('Network error'))
      };
      (AnalysisEngine as any).mockImplementation(() => mockAnalysisEngine);

      render(<AnalyzePage />);

      const fileInput = screen.getByLabelText(/upload resume/i);
      const file = new File(['mock content'], 'resume.pdf', { type: 'application/pdf' });
      
      await user.upload(fileInput, file);

      const jobDescriptionInput = screen.getByLabelText(/job description/i);
      await user.type(jobDescriptionInput, 'Sample job description');

      const analyzeButton = screen.getByRole('button', { name: /analyze resume/i });
      await user.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });
  });

  describe('Results Display and Interaction', () => {
    it('should display detailed analysis results with interactive elements', async () => {
      (parsePDF as any).mockResolvedValue({
        text: 'Comprehensive resume text with multiple sections',
        metadata: { pageCount: 2 }
      });

      const mockAnalysisResult = {
        ats_analysis: {
          ats_score: 82,
          breakdown: {
            formatting: 88,
            keywords: 75,
            structure: 85,
            experience: 90,
            skills: 78
          },
          recommendations: [
            'Add more industry-specific keywords',
            'Improve section formatting',
            'Include quantifiable achievements'
          ],
          missing_keywords: ['Python', 'Docker', 'Kubernetes'],
          keyword_matches: ['JavaScript', 'React', 'Node.js', 'Git']
        },
        grammar_analysis: {
          grammar_score: 88,
          issues: [
            {
              type: 'grammar',
              text: 'I have worked',
              suggestion: 'I worked',
              position: { start: 10, end: 23 }
            }
          ],
          suggestions: ['Use active voice', 'Be more concise']
        },
        overall_score: 85
      };

      const mockAnalysisEngine = {
        analyzeResume: vi.fn().mockResolvedValue(mockAnalysisResult)
      };
      (AnalysisEngine as any).mockImplementation(() => mockAnalysisEngine);

      render(<AnalyzePage />);

      // Complete the analysis workflow
      const fileInput = screen.getByLabelText(/upload resume/i);
      const file = new File(['mock content'], 'resume.pdf', { type: 'application/pdf' });
      await user.upload(fileInput, file);

      const jobDescriptionInput = screen.getByLabelText(/job description/i);
      await user.type(jobDescriptionInput, 'Python developer with Docker and Kubernetes experience');

      const analyzeButton = screen.getByRole('button', { name: /analyze resume/i });
      await user.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText(/analysis complete/i)).toBeInTheDocument();
      });

      // Test interactive score breakdown
      const formattingScore = screen.getByText('88');
      await user.hover(formattingScore);
      
      await waitFor(() => {
        expect(screen.getByText(/formatting quality/i)).toBeInTheDocument();
      });

      // Test expandable recommendations
      const recommendationsSection = screen.getByText(/recommendations/i);
      await user.click(recommendationsSection);

      expect(screen.getByText(/add more industry-specific keywords/i)).toBeInTheDocument();
      expect(screen.getByText(/improve section formatting/i)).toBeInTheDocument();

      // Test missing keywords display
      expect(screen.getByText(/python/i)).toBeInTheDocument();
      expect(screen.getByText(/docker/i)).toBeInTheDocument();
      expect(screen.getByText(/kubernetes/i)).toBeInTheDocument();

      // Test matched keywords display
      expect(screen.getByText(/javascript/i)).toBeInTheDocument();
      expect(screen.getByText(/react/i)).toBeInTheDocument();
    });

    it('should allow sharing results on social media', async () => {
      // Mock successful analysis
      (parsePDF as any).mockResolvedValue({
        text: 'Sample resume',
        metadata: { pageCount: 1 }
      });

      const mockAnalysisResult = {
        ats_analysis: { ats_score: 90, breakdown: {}, recommendations: [], missing_keywords: [], keyword_matches: [] },
        grammar_analysis: { grammar_score: 95, issues: [], suggestions: [] },
        overall_score: 92
      };

      const mockAnalysisEngine = {
        analyzeResume: vi.fn().mockResolvedValue(mockAnalysisResult)
      };
      (AnalysisEngine as any).mockImplementation(() => mockAnalysisEngine);

      // Mock window.open
      const mockOpen = vi.fn();
      Object.defineProperty(window, 'open', { value: mockOpen });

      render(<AnalyzePage />);

      // Complete analysis
      const fileInput = screen.getByLabelText(/upload resume/i);
      const file = new File(['mock content'], 'resume.pdf', { type: 'application/pdf' });
      await user.upload(fileInput, file);

      const analyzeButton = screen.getByRole('button', { name: /analyze resume/i });
      await user.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText(/analysis complete/i)).toBeInTheDocument();
      });

      // Test social sharing
      const shareButton = screen.getByRole('button', { name: /share results/i });
      await user.click(shareButton);

      const twitterShare = screen.getByRole('button', { name: /share on twitter/i });
      await user.click(twitterShare);

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('twitter.com'),
        '_blank'
      );
    });
  });

  describe('Performance and Loading States', () => {
    it('should show appropriate loading states during analysis', async () => {
      (parsePDF as any).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          text: 'Sample text',
          metadata: { pageCount: 1 }
        }), 1000))
      );

      const mockAnalysisEngine = {
        analyzeResume: vi.fn().mockImplementation(() =>
          new Promise(resolve => setTimeout(() => resolve({
            ats_analysis: { ats_score: 80, breakdown: {}, recommendations: [], missing_keywords: [], keyword_matches: [] },
            grammar_analysis: { grammar_score: 90, issues: [], suggestions: [] },
            overall_score: 85
          }), 2000))
        )
      };
      (AnalysisEngine as any).mockImplementation(() => mockAnalysisEngine);

      render(<AnalyzePage />);

      const fileInput = screen.getByLabelText(/upload resume/i);
      const file = new File(['mock content'], 'resume.pdf', { type: 'application/pdf' });
      await user.upload(fileInput, file);

      // Should show file parsing loading state
      expect(screen.getByText(/parsing document/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText(/parsing document/i)).not.toBeInTheDocument();
      });

      const analyzeButton = screen.getByRole('button', { name: /analyze resume/i });
      await user.click(analyzeButton);

      // Should show analysis loading state
      expect(screen.getByText(/analyzing resume/i)).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText(/analysis complete/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });
});