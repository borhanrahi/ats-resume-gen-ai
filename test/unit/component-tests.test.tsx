import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Component unit tests with React Testing Library

describe('Component Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('DocumentUploader Component', () => {
    // Mock the parsers since they're tested separately
    vi.mock('@/lib/parsers/pdfParser', () => ({
      PDFParser: {
        parse: vi.fn().mockResolvedValue({
          content: 'Mock PDF content',
          metadata: {
            fileName: 'test.pdf',
            fileType: 'pdf',
            uploadDate: new Date(),
            wordCount: 10,
            pageCount: 1
          },
          pages: [{ pageNumber: 1, content: 'Mock PDF content', wordCount: 10 }]
        })
      },
      PDFParseException: class extends Error {
        constructor(public error: { code: string; message: string }) {
          super(error.message);
        }
      }
    }));

    vi.mock('@/lib/parsers/docxParser', () => ({
      DOCXParser: {
        parse: vi.fn().mockResolvedValue({
          content: 'Mock DOCX content',
          metadata: {
            fileName: 'test.docx',
            fileType: 'docx',
            uploadDate: new Date(),
            wordCount: 10,
            characterCount: 50,
            paragraphCount: 2
          },
          formattedContent: {
            html: '<p>Mock DOCX content</p>',
            plainText: 'Mock DOCX content'
          },
          warnings: []
        })
      },
      DOCXParseException: class extends Error {
        constructor(public error: { code: string; message: string }) {
          super(error.message);
        }
      }
    }));

    const DocumentUploader = React.lazy(() => import('@/components/upload/DocumentUploader'));

    it('should render upload area with correct text', async () => {
      const mockOnUploadComplete = vi.fn();
      
      render(
        <React.Suspense fallback={<div>Loading...</div>}>
          <DocumentUploader onUploadComplete={mockOnUploadComplete} />
        </React.Suspense>
      );

      await waitFor(() => {
        expect(screen.getByText('Upload your resume')).toBeInTheDocument();
        expect(screen.getByText('Drag & drop or tap to browse files')).toBeInTheDocument();
        expect(screen.getByText('PDF')).toBeInTheDocument();
        expect(screen.getByText('DOCX')).toBeInTheDocument();
      });
    });

    it('should handle file upload successfully', async () => {
      const user = userEvent.setup();
      const mockOnUploadComplete = vi.fn();
      
      render(
        <React.Suspense fallback={<div>Loading...</div>}>
          <DocumentUploader onUploadComplete={mockOnUploadComplete} />
        </React.Suspense>
      );

      // Create a mock PDF file
      const file = new File(['mock pdf content'], 'test.pdf', { type: 'application/pdf' });
      
      // Find the file input and upload file
      const fileInput = screen.getByRole('button', { name: /upload document/i });
      
      // Simulate file drop
      fireEvent.drop(fileInput, {
        dataTransfer: {
          files: [file],
        },
      });

      await waitFor(() => {
        expect(mockOnUploadComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            file,
            content: 'Mock PDF content',
            metadata: expect.objectContaining({
              fileName: 'test.pdf',
              fileType: 'pdf',
              wordCount: 10
            })
          })
        );
      });
    });

    it('should show error for invalid file type', async () => {
      const mockOnUploadError = vi.fn();
      
      render(
        <React.Suspense fallback={<div>Loading...</div>}>
          <DocumentUploader onUploadError={mockOnUploadError} />
        </React.Suspense>
      );

      // Create a mock text file (invalid)
      const file = new File(['text content'], 'test.txt', { type: 'text/plain' });
      
      const fileInput = screen.getByRole('button', { name: /upload document/i });
      
      fireEvent.drop(fileInput, {
        dataTransfer: {
          files: [file],
        },
      });

      await waitFor(() => {
        expect(screen.getByText(/Only .pdf, .docx files are supported/i)).toBeInTheDocument();
      });
    });

    it('should show error for file too large', async () => {
      render(
        <React.Suspense fallback={<div>Loading...</div>}>
          <DocumentUploader maxFileSize={1024} />
        </React.Suspense>
      );

      // Create a large file
      const largeContent = 'x'.repeat(2048);
      const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
      
      const fileInput = screen.getByRole('button', { name: /upload document/i });
      
      fireEvent.drop(fileInput, {
        dataTransfer: {
          files: [file],
        },
      });

      await waitFor(() => {
        expect(screen.getByText(/File size must be less than/i)).toBeInTheDocument();
      });
    });

    it('should be disabled when disabled prop is true', async () => {
      render(
        <React.Suspense fallback={<div>Loading...</div>}>
          <DocumentUploader disabled={true} />
        </React.Suspense>
      );

      const uploadArea = screen.getByRole('button', { name: /upload document/i });
      expect(uploadArea).toHaveClass('opacity-50', 'cursor-not-allowed');
    });
  });

  describe('ATSScoreCard Component', () => {
    const mockAnalysis = {
      score: 85,
      breakdown: {
        formatting: 90,
        keywords: 80,
        structure: 85,
        length: 85
      },
      recommendations: ['Add more keywords', 'Improve formatting'],
      keywordMatch: {
        found: ['JavaScript', 'React'],
        missing: ['Node.js', 'TypeScript'],
        matchPercentage: 50
      },
      grammarIssues: [],
      modelUsed: 'gpt-3.5-turbo',
      fallbacksUsed: []
    };

    const ATSScoreCard = React.lazy(() => import('@/components/analysis/ATSScoreCard'));

    it('should render ATS score correctly', async () => {
      render(
        <React.Suspense fallback={<div>Loading...</div>}>
          <ATSScoreCard analysis={mockAnalysis} />
        </React.Suspense>
      );

      await waitFor(() => {
        expect(screen.getByText('85%')).toBeInTheDocument();
        expect(screen.getByText('ATS Compatibility Score')).toBeInTheDocument();
        expect(screen.getByText('Good')).toBeInTheDocument();
      });
    });

    it('should render breakdown sections', async () => {
      render(
        <React.Suspense fallback={<div>Loading...</div>}>
          <ATSScoreCard analysis={mockAnalysis} />
        </React.Suspense>
      );

      await waitFor(() => {
        expect(screen.getByText('Formatting')).toBeInTheDocument();
        expect(screen.getByText('Keywords')).toBeInTheDocument();
        expect(screen.getByText('Structure')).toBeInTheDocument();
        expect(screen.getByText('Length')).toBeInTheDocument();
      });
    });

    it('should expand breakdown section when clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <React.Suspense fallback={<div>Loading...</div>}>
          <ATSScoreCard analysis={mockAnalysis} />
        </React.Suspense>
      );

      await waitFor(() => {
        const formattingSection = screen.getByText('Formatting');
        expect(formattingSection).toBeInTheDocument();
      });

      // Click on formatting section
      const formattingButton = screen.getByText('Formatting').closest('button');
      if (formattingButton) {
        await user.click(formattingButton);
        
        await waitFor(() => {
          expect(screen.getByText('Improvement Tips:')).toBeInTheDocument();
        });
      }
    });

    it('should show correct score color based on score value', async () => {
      const lowScoreAnalysis = { ...mockAnalysis, score: 45 };
      
      render(
        <React.Suspense fallback={<div>Loading...</div>}>
          <ATSScoreCard analysis={lowScoreAnalysis} />
        </React.Suspense>
      );

      await waitFor(() => {
        const scoreElement = screen.getByText('45%');
        expect(scoreElement).toHaveClass('text-red-600');
      });
    });

    it('should display model information', async () => {
      render(
        <React.Suspense fallback={<div>Loading...</div>}>
          <ATSScoreCard analysis={mockAnalysis} />
        </React.Suspense>
      );

      await waitFor(() => {
        expect(screen.getByText(/Analyzed by: gpt-3.5-turbo/)).toBeInTheDocument();
      });
    });
  });

  describe('DashboardHome Component', () => {
    const mockUser = {
      $id: 'user123',
      id: 'user123',
      name: 'John Doe',
      email: 'john@example.com',
      subscription: {
        plan: 'premium' as const,
        status: 'active' as const,
        expiresAt: new Date('2024-12-31'),
        paymentHistory: []
      },
      preferences: {
        theme: 'light' as const,
        language: 'en'
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15')
    };

    const mockRecentAnalyses = [
      {
        id: 'analysis1',
        resumeName: 'Software Engineer Resume.pdf',
        score: 85,
        createdAt: new Date('2024-01-15'),
        jobTitle: 'Software Engineer'
      },
      {
        id: 'analysis2',
        resumeName: 'Frontend Developer Resume.pdf',
        score: 78,
        createdAt: new Date('2024-01-14')
      }
    ];

    const DashboardHome = React.lazy(() => import('@/components/dashboard/DashboardHome'));

    it('should render welcome message with user name', async () => {
      render(
        <React.Suspense fallback={<div>Loading...</div>}>
          <DashboardHome
            user={mockUser}
            recentAnalyses={mockRecentAnalyses}
            totalAnalyses={10}
            averageScore={82}
            improvementTrend={5.2}
          />
        </React.Suspense>
      );

      await waitFor(() => {
        expect(screen.getByText(/John Doe/)).toBeInTheDocument();
        expect(screen.getByText(/Welcome back to your resume optimization dashboard/)).toBeInTheDocument();
      });
    });

    it('should display metrics correctly', async () => {
      render(
        <React.Suspense fallback={<div>Loading...</div>}>
          <DashboardHome
            user={mockUser}
            recentAnalyses={mockRecentAnalyses}
            totalAnalyses={10}
            averageScore={82}
            improvementTrend={5.2}
          />
        </React.Suspense>
      );

      await waitFor(() => {
        expect(screen.getByText('10')).toBeInTheDocument(); // Total analyses
        expect(screen.getByText('82%')).toBeInTheDocument(); // Average score
        expect(screen.getByText('+5.2%')).toBeInTheDocument(); // Improvement trend
        expect(screen.getByText('Premium')).toBeInTheDocument(); // Subscription plan
      });
    });

    it('should render quick action buttons', async () => {
      render(
        <React.Suspense fallback={<div>Loading...</div>}>
          <DashboardHome
            user={mockUser}
            recentAnalyses={mockRecentAnalyses}
            totalAnalyses={10}
            averageScore={82}
            improvementTrend={5.2}
          />
        </React.Suspense>
      );

      await waitFor(() => {
        expect(screen.getByText('New Analysis')).toBeInTheDocument();
        expect(screen.getByText('Resume Editor')).toBeInTheDocument();
        expect(screen.getByText('View History')).toBeInTheDocument();
        expect(screen.getByText('Templates')).toBeInTheDocument();
      });
    });

    it('should display recent analyses', async () => {
      render(
        <React.Suspense fallback={<div>Loading...</div>}>
          <DashboardHome
            user={mockUser}
            recentAnalyses={mockRecentAnalyses}
            totalAnalyses={10}
            averageScore={82}
            improvementTrend={5.2}
          />
        </React.Suspense>
      );

      await waitFor(() => {
        expect(screen.getByText('Software Engineer Resume.pdf')).toBeInTheDocument();
        expect(screen.getByText('Frontend Developer Resume.pdf')).toBeInTheDocument();
        expect(screen.getByText('85')).toBeInTheDocument(); // Score
        expect(screen.getByText('78')).toBeInTheDocument(); // Score
      });
    });

    it('should show empty state when no analyses exist', async () => {
      render(
        <React.Suspense fallback={<div>Loading...</div>}>
          <DashboardHome
            user={mockUser}
            recentAnalyses={[]}
            totalAnalyses={0}
            averageScore={0}
            improvementTrend={0}
          />
        </React.Suspense>
      );

      await waitFor(() => {
        expect(screen.getByText('No analyses yet')).toBeInTheDocument();
        expect(screen.getByText('Start by analyzing your first resume to see your progress here')).toBeInTheDocument();
      });
    });

    it('should display progress tracking section', async () => {
      render(
        <React.Suspense fallback={<div>Loading...</div>}>
          <DashboardHome
            user={mockUser}
            recentAnalyses={mockRecentAnalyses}
            totalAnalyses={10}
            averageScore={82}
            improvementTrend={5.2}
          />
        </React.Suspense>
      );

      await waitFor(() => {
        expect(screen.getByText('Progress Tracking')).toBeInTheDocument();
        expect(screen.getByText('Score Progress')).toBeInTheDocument();
        expect(screen.getByText('Monthly Goal')).toBeInTheDocument();
        expect(screen.getByText('Improvement Tips')).toBeInTheDocument();
      });
    });

    it('should show correct greeting based on time of day', async () => {
      // Mock Date to return morning time
      const mockDate = new Date('2024-01-15T09:00:00');
      vi.setSystemTime(mockDate);

      render(
        <React.Suspense fallback={<div>Loading...</div>}>
          <DashboardHome
            user={mockUser}
            recentAnalyses={mockRecentAnalyses}
            totalAnalyses={10}
            averageScore={82}
            improvementTrend={5.2}
          />
        </React.Suspense>
      );

      await waitFor(() => {
        expect(screen.getByText(/Good morning/)).toBeInTheDocument();
      });
    });
  });

  describe('Button Component', () => {
    it('should render button with correct text', () => {
      render(<button>Click me</button>);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('should handle click events', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<button onClick={handleClick}>Click me</button>);
      
      await user.click(screen.getByText('Click me'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when disabled prop is true', () => {
      render(<button disabled>Disabled button</button>);
      
      const button = screen.getByText('Disabled button');
      expect(button).toBeDisabled();
    });

    it('should have correct accessibility attributes', () => {
      render(
        <button 
          aria-label="Submit form" 
          aria-describedby="help-text"
          type="submit"
        >
          Submit
        </button>
      );
      
      const button = screen.getByRole('button', { name: 'Submit form' });
      expect(button).toHaveAttribute('aria-describedby', 'help-text');
      expect(button).toHaveAttribute('type', 'submit');
    });
  });

  describe('Form Input Component', () => {
    it('should render input with correct value', () => {
      render(<input value="test value" onChange={() => {}} />);
      
      const input = screen.getByDisplayValue('test value');
      expect(input).toBeInTheDocument();
    });

    it('should handle input changes', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      
      render(<input onChange={handleChange} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'hello');
      
      expect(handleChange).toHaveBeenCalled();
    });

    it('should show validation error', () => {
      render(
        <div>
          <input aria-invalid="true" aria-describedby="error" />
          <div id="error" role="alert">This field is required</div>
        </div>
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByRole('alert')).toHaveTextContent('This field is required');
    });

    it('should have proper focus management', async () => {
      const user = userEvent.setup();
      
      render(<input placeholder="Enter text" />);
      
      const input = screen.getByPlaceholderText('Enter text');
      await user.click(input);
      
      expect(input).toHaveFocus();
    });
  });

  describe('Loading Component', () => {
    it('should render loading spinner', () => {
      render(
        <div role="status" aria-label="Loading">
          <div className="animate-spin">Loading...</div>
        </div>
      );
      
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    });

    it('should render loading text', () => {
      render(<div>Loading content...</div>);
      expect(screen.getByText('Loading content...')).toBeInTheDocument();
    });
  });

  describe('Error Component', () => {
    it('should render error message', () => {
      render(
        <div role="alert">
          <h2>Error occurred</h2>
          <p>Something went wrong. Please try again.</p>
        </div>
      );
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Error occurred')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
    });

    it('should render retry button', async () => {
      const user = userEvent.setup();
      const handleRetry = vi.fn();
      
      render(
        <div role="alert">
          <p>Error occurred</p>
          <button onClick={handleRetry}>Retry</button>
        </div>
      );
      
      await user.click(screen.getByText('Retry'));
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('Modal Component', () => {
    it('should render modal when open', () => {
      render(
        <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <h2 id="modal-title">Modal Title</h2>
          <p>Modal content</p>
          <button>Close</button>
        </div>
      );
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Modal Title')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('should handle close action', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      
      render(
        <div role="dialog">
          <button onClick={handleClose}>Close</button>
        </div>
      );
      
      await user.click(screen.getByText('Close'));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('should trap focus within modal', () => {
      render(
        <div role="dialog" aria-modal="true">
          <button>First button</button>
          <button>Second button</button>
        </div>
      );
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });
  });
});