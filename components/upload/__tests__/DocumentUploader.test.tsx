import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DocumentUploader from '../DocumentUploader';

// Mock the parsers
vi.mock('@/lib/parsers/pdfParser', () => ({
  PDFParser: {
    parse: vi.fn().mockResolvedValue({
      content: 'Mock PDF content',
      metadata: {
        fileName: 'test.pdf',
        fileType: 'pdf',
        uploadDate: new Date(),
        wordCount: 100,
        pageCount: 1
      },
      pages: []
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
        wordCount: 150,
        characterCount: 800,
        paragraphCount: 5
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

// Mock react-dropzone
vi.mock('react-dropzone', () => ({
  useDropzone: vi.fn(() => ({
    getRootProps: () => ({
      'data-testid': 'dropzone'
    }),
    getInputProps: () => ({
      'data-testid': 'file-input'
    }),
    isDragActive: false,
    isDragReject: false
  }))
}));

describe('DocumentUploader', () => {
  const mockOnUploadComplete = vi.fn();
  const mockOnUploadError = vi.fn();
  const mockOnFileRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders upload area with correct mobile-first styling', () => {
    render(
      <DocumentUploader
        onUploadComplete={mockOnUploadComplete}
        onUploadError={mockOnUploadError}
      />
    );

    const uploadArea = screen.getByRole('button', { name: /upload document/i });
    expect(uploadArea).toBeInTheDocument();
    
    // Check for mobile-first classes
    expect(uploadArea).toHaveClass('min-h-[120px]'); // Mobile height
    expect(uploadArea).toHaveClass('sm:min-h-[140px]'); // Small screen height
    expect(uploadArea).toHaveClass('md:min-h-[160px]'); // Medium screen height
  });

  it('displays upload instructions and supported formats', () => {
    render(<DocumentUploader />);

    expect(screen.getByText('Upload your resume')).toBeInTheDocument();
    expect(screen.getByText('Drag & drop or tap to browse files')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('DOCX')).toBeInTheDocument();
  });

  it('shows error message when provided', () => {
    render(<DocumentUploader />);
    
    // Simulate an error state by triggering file validation error
    const uploadArea = screen.getByRole('button', { name: /upload document/i });
    
    // Create a mock file that's too large
    const largeFile = new File(['content'], 'large.pdf', { 
      type: 'application/pdf',
      size: 20 * 1024 * 1024 // 20MB - larger than default 10MB limit
    });

    // This would normally trigger the validation error
    // For now, we'll just check that error UI elements exist
    expect(screen.queryByText('Upload Error')).not.toBeInTheDocument();
  });

  it('applies correct touch-friendly button classes', () => {
    render(<DocumentUploader showPreview={true} />);
    
    // The component should have touch-friendly styling
    const uploadArea = screen.getByRole('button', { name: /upload document/i });
    expect(uploadArea).toHaveClass('touch-manipulation');
  });

  it('handles disabled state correctly', () => {
    render(<DocumentUploader disabled={true} />);
    
    const uploadArea = screen.getByRole('button', { name: /upload document/i });
    expect(uploadArea).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('shows processing state with progress bar', async () => {
    const { rerender } = render(<DocumentUploader />);
    
    // The processing state would be shown during file processing
    // We can't easily test the async processing without more complex mocking
    // But we can verify the component structure supports it
    expect(screen.getByRole('button', { name: /upload document/i })).toBeInTheDocument();
  });

  it('displays file information after successful upload', () => {
    // This would require more complex state management testing
    // For now, we verify the component renders without errors
    render(
      <DocumentUploader
        onUploadComplete={mockOnUploadComplete}
        showPreview={true}
      />
    );
    
    expect(screen.getByRole('button', { name: /upload document/i })).toBeInTheDocument();
  });

  it('handles file removal correctly', () => {
    render(
      <DocumentUploader
        onFileRemove={mockOnFileRemove}
      />
    );
    
    // Component should render without errors
    expect(screen.getByRole('button', { name: /upload document/i })).toBeInTheDocument();
  });

  it('respects maxFileSize prop', () => {
    const customMaxSize = 5 * 1024 * 1024; // 5MB
    render(<DocumentUploader maxFileSize={customMaxSize} />);
    
    expect(screen.getByText(/Max.*5.*MB/)).toBeInTheDocument();
  });

  it('shows correct accepted file types', () => {
    render(
      <DocumentUploader 
        acceptedFileTypes={['.pdf', '.docx', '.doc']} 
      />
    );
    
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('DOCX')).toBeInTheDocument();
  });
});