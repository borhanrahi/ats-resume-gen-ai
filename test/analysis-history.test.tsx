import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AnalysisHistory from '@/components/dashboard/AnalysisHistory';
import { historyService } from '@/lib/storage/history-service';
import { reportService } from '@/lib/storage/report-service';
import { useAuth } from '@/lib/hooks/useAuth';
import { AnalysisHistoryItem } from '@/types/history';

// Mock the dependencies
vi.mock('@/lib/storage/history-service');
vi.mock('@/lib/storage/report-service');
vi.mock('@/lib/hooks/useAuth');

const mockUser = {
  $id: 'user123',
  email: 'test@example.com',
  name: 'Test User',
};

const mockAnalysis: AnalysisHistoryItem = {
  $id: 'analysis123',
  userId: 'user123',
  resumeName: 'John_Doe_Resume.pdf',
  resumeData: {
    id: 'resume123',
    content: 'Resume content...',
    metadata: {
      fileName: 'John_Doe_Resume.pdf',
      fileType: 'pdf',
      uploadDate: new Date('2024-01-15'),
      wordCount: 500,
    },
    sections: {
      contact: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-0123',
        location: 'New York, NY',
      },
      summary: 'Experienced software developer...',
      experience: [],
      education: [],
      skills: ['JavaScript', 'React', 'Node.js'],
      certifications: [],
    },
  },
  jobTitle: 'Software Engineer',
  analysis: {
    score: 85,
    breakdown: {
      formatting: 90,
      keywords: 80,
      structure: 85,
      length: 85,
    },
    recommendations: [
      {
        id: 'rec1',
        category: 'keywords',
        priority: 'high',
        title: 'Add more technical keywords',
        description: 'Include more relevant technical terms',
        suggestion: 'Add keywords like "API", "database", "cloud"',
        impact: 'Could improve ATS score by 10-15 points',
      },
    ],
    keywordMatch: {
      found: ['JavaScript', 'React', 'Node.js'],
      missing: ['API', 'database', 'cloud'],
      matchPercentage: 60,
      density: 2.5,
      suggestions: ['Add more technical keywords'],
    },
    grammarIssues: [],
    modelUsed: 'gpt-4',
    fallbacksUsed: [],
  },
  score: 85,
  tags: ['software', 'frontend'],
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
};

describe('AnalysisHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock useAuth
    (useAuth as any).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    });

    // Mock historyService
    (historyService.getHistory as any).mockResolvedValue([mockAnalysis]);
    (historyService.deleteAnalysis as any).mockResolvedValue(undefined);
    (historyService.compareAnalyses as any).mockResolvedValue({
      id: 'comparison123',
      baseAnalysis: mockAnalysis,
      compareAnalysis: { ...mockAnalysis, score: 90 },
      scoreDifference: 5,
      improvements: ['Better keyword usage'],
      regressions: [],
      keywordChanges: { added: ['API'], removed: [] },
      recommendationChanges: { resolved: [], new: [] },
    });

    // Mock reportService
    (reportService.generateAnalysisReport as any).mockResolvedValue(new Blob(['PDF content'], { type: 'application/pdf' }));
    (reportService.getReportFilename as any).mockReturnValue('analysis_report.pdf');
  });

  it('renders analysis history correctly', async () => {
    render(<AnalysisHistory />);

    // Check if the component renders
    expect(screen.getByText('Analysis History')).toBeInTheDocument();
    expect(screen.getByText('View and manage your resume analysis history')).toBeInTheDocument();

    // Wait for analyses to load
    await waitFor(() => {
      expect(screen.getByText('John_Doe_Resume.pdf')).toBeInTheDocument();
    });

    // Check if analysis details are displayed
    expect(screen.getByText('85/100')).toBeInTheDocument();
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
  });

  it('handles search functionality', async () => {
    render(<AnalysisHistory />);

    await waitFor(() => {
      expect(screen.getByText('John_Doe_Resume.pdf')).toBeInTheDocument();
    });

    // Test search
    const searchInput = screen.getByPlaceholderText(/search by resume name/i);
    fireEvent.change(searchInput, { target: { value: 'John' } });

    // The analysis should still be visible since it matches the search
    expect(screen.getByText('John_Doe_Resume.pdf')).toBeInTheDocument();
  });

  it('handles analysis selection', async () => {
    render(<AnalysisHistory />);

    await waitFor(() => {
      expect(screen.getByText('John_Doe_Resume.pdf')).toBeInTheDocument();
    });

    // Find and click the checkbox for the analysis
    const checkboxes = screen.getAllByRole('checkbox');
    const analysisCheckbox = checkboxes.find(checkbox => 
      checkbox.getAttribute('aria-describedby') !== 'select-all'
    );
    
    if (analysisCheckbox) {
      fireEvent.click(analysisCheckbox);
      // The compare button should appear when one analysis is selected
      // (though it needs 2 for actual comparison)
    }
  });

  it('handles report download', async () => {
    // Mock URL.createObjectURL and related functions
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
    
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    };
    document.createElement = vi.fn().mockReturnValue(mockLink);
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();

    render(<AnalysisHistory />);

    await waitFor(() => {
      expect(screen.getByText('John_Doe_Resume.pdf')).toBeInTheDocument();
    });

    // Find and click the dropdown menu
    const dropdownTriggers = screen.getAllByRole('button');
    const menuTrigger = dropdownTriggers.find(button => 
      button.querySelector('svg') // Looking for the MoreVertical icon
    );
    
    if (menuTrigger) {
      fireEvent.click(menuTrigger);
      
      // Wait for dropdown to appear and click download PDF
      await waitFor(() => {
        const downloadButton = screen.getByText('Download PDF');
        fireEvent.click(downloadButton);
      });

      // Verify that the report service was called
      expect(reportService.generateAnalysisReport).toHaveBeenCalledWith(
        mockAnalysis,
        { format: 'pdf' }
      );
    }
  });

  it('handles analysis deletion', async () => {
    render(<AnalysisHistory />);

    await waitFor(() => {
      expect(screen.getByText('John_Doe_Resume.pdf')).toBeInTheDocument();
    });

    // Find and click the dropdown menu
    const dropdownTriggers = screen.getAllByRole('button');
    const menuTrigger = dropdownTriggers.find(button => 
      button.querySelector('svg') // Looking for the MoreVertical icon
    );
    
    if (menuTrigger) {
      fireEvent.click(menuTrigger);
      
      // Wait for dropdown to appear and click delete
      await waitFor(() => {
        const deleteButton = screen.getByText('Delete');
        fireEvent.click(deleteButton);
      });

      // Verify that the history service was called
      expect(historyService.deleteAnalysis).toHaveBeenCalledWith(
        'analysis123',
        'user123'
      );
    }
  });

  it('shows empty state when no analyses exist', async () => {
    // Mock empty history
    (historyService.getHistory as any).mockResolvedValue([]);

    render(<AnalysisHistory />);

    await waitFor(() => {
      expect(screen.getByText('No analyses found')).toBeInTheDocument();
      expect(screen.getByText(/You haven't run any analyses yet/)).toBeInTheDocument();
    });
  });

  it('handles filters correctly', async () => {
    render(<AnalysisHistory />);

    await waitFor(() => {
      expect(screen.getByText('John_Doe_Resume.pdf')).toBeInTheDocument();
    });

    // Click filters button
    const filtersButton = screen.getByText('Filters');
    fireEvent.click(filtersButton);

    // Check if filters panel appears
    await waitFor(() => {
      expect(screen.getByText('Date Range')).toBeInTheDocument();
      expect(screen.getByText('Score Range')).toBeInTheDocument();
    });
  });
});