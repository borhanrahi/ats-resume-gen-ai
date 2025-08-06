import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResumeBlock } from '@/types/editor';

// Mock html2pdf.js completely
const mockPdf = {
  output: vi.fn().mockReturnValue(new Blob(['mock pdf'], { type: 'application/pdf' }))
};

const mockHtml2pdf = {
  set: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  toPdf: vi.fn().mockReturnThis(),
  get: vi.fn().mockReturnValue(mockPdf)
};

const mockHtml2pdfFactory = vi.fn(() => mockHtml2pdf);

vi.mock('html2pdf.js', () => ({
  default: mockHtml2pdfFactory
}));

// Mock DOM methods
Object.defineProperty(global, 'document', {
  value: {
    createElement: vi.fn((tag: string) => {
      if (tag === 'div') {
        return {
          textContent: '',
          innerHTML: ''
        };
      }
      if (tag === 'a') {
        return {
          href: '',
          download: '',
          click: vi.fn(),
          style: { display: '' }
        };
      }
      return {};
    }),
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn()
    }
  },
  writable: true
});

Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn()
  },
  writable: true
});

describe('PDF Export Simple Test', () => {
  const mockBlocks: ResumeBlock[] = [
    {
      id: 'contact',
      type: 'contact',
      title: 'Contact Information',
      content: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1 (555) 123-4567',
        location: 'New York, NY'
      },
      order: 0,
      isVisible: true,
      isEditing: false
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should import and test basic functionality', async () => {
    // Dynamic import to test the module loading
    const { PDFExporter } = await import('@/lib/utils/exportUtils');
    
    const result = await PDFExporter.exportToPDF(mockBlocks);

    expect(result.success).toBe(true);
    expect(result.filename).toContain('John_Doe_Resume.pdf');
    expect(mockHtml2pdfFactory).toHaveBeenCalled();
    expect(mockHtml2pdf.set).toHaveBeenCalled();
    expect(mockHtml2pdf.from).toHaveBeenCalled();
    expect(mockHtml2pdf.toPdf).toHaveBeenCalled();
  });

  it('should handle filename generation', async () => {
    const { PDFExporter } = await import('@/lib/utils/exportUtils');
    
    const result = await PDFExporter.exportToPDF(mockBlocks, {
      filename: 'Custom_Resume.pdf'
    });

    expect(result.success).toBe(true);
    expect(result.filename).toBe('Custom_Resume.pdf');
  });
});