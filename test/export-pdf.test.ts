import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PDFExporter, exportToPDF, exportResumeDataToPDF } from '@/lib/utils/exportUtils';
import { ResumeBlock } from '@/types/editor';
import { ResumeData } from '@/types/resume';

// Mock html2pdf.js
const mockHtml2pdf = {
  set: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  toPdf: vi.fn().mockReturnThis(),
  get: vi.fn().mockReturnValue({
    output: vi.fn().mockReturnValue(new Blob(['mock pdf'], { type: 'application/pdf' }))
  })
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

describe('PDF Export System', () => {
  const mockBlocks: ResumeBlock[] = [
    {
      id: 'contact',
      type: 'contact',
      title: 'Contact Information',
      content: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1 (555) 123-4567',
        location: 'New York, NY',
        linkedin: 'linkedin.com/in/johndoe',
        website: 'johndoe.com'
      },
      order: 0,
      isVisible: true,
      isEditing: false
    },
    {
      id: 'summary',
      type: 'summary',
      title: 'Professional Summary',
      content: 'Experienced software developer with 5+ years of experience in web development.',
      order: 1,
      isVisible: true,
      isEditing: false
    },
    {
      id: 'experience',
      type: 'experience',
      title: 'Work Experience',
      content: [
        {
          id: 'exp1',
          company: 'Tech Corp',
          position: 'Senior Developer',
          startDate: '2020-01',
          endDate: '2023-12',
          description: 'Led development of web applications',
          achievements: ['Improved performance by 40%', 'Mentored 3 junior developers']
        }
      ],
      order: 2,
      isVisible: true,
      isEditing: false
    },
    {
      id: 'skills',
      type: 'skills',
      title: 'Skills',
      content: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
      order: 3,
      isVisible: true,
      isEditing: false
    }
  ];

  const mockResumeData: ResumeData = {
    id: 'resume-1',
    content: 'Resume content',
    metadata: {
      fileName: 'resume.pdf',
      fileType: 'pdf',
      uploadDate: new Date(),
      wordCount: 250
    },
    sections: {
      contact: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1 (555) 123-4567',
        location: 'New York, NY',
        linkedin: 'linkedin.com/in/johndoe',
        website: 'johndoe.com'
      },
      summary: 'Experienced software developer with 5+ years of experience.',
      experience: [
        {
          id: 'exp1',
          company: 'Tech Corp',
          position: 'Senior Developer',
          startDate: '2020-01',
          endDate: '2023-12',
          description: 'Led development of web applications',
          achievements: ['Improved performance by 40%']
        }
      ],
      education: [],
      skills: ['JavaScript', 'TypeScript', 'React'],
      certifications: []
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock factory
    mockHtml2pdfFactory.mockReturnValue(mockHtml2pdf);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('PDFExporter.exportToPDF', () => {
    it('should export resume blocks to PDF successfully', async () => {
      const result = await PDFExporter.exportToPDF(mockBlocks);

      expect(result.success).toBe(true);
      expect(result.filename).toContain('John_Doe_Resume.pdf');
      expect(result.blob).toBeInstanceOf(Blob);
      expect(mockHtml2pdf.set).toHaveBeenCalled();
      expect(mockHtml2pdf.from).toHaveBeenCalled();
      expect(mockHtml2pdf.toPdf).toHaveBeenCalled();
    });

    it('should handle custom filename', async () => {
      const customOptions = {
        filename: 'Custom_Resume_Name.pdf'
      };

      const result = await PDFExporter.exportToPDF(mockBlocks, customOptions);

      expect(result.success).toBe(true);
      expect(result.filename).toBe('Custom_Resume_Name.pdf');
    });

    it('should handle different paper sizes', async () => {
      const options = {
        paperSize: 'letter' as const,
        orientation: 'landscape' as const
      };

      const result = await PDFExporter.exportToPDF(mockBlocks, options);

      expect(result.success).toBe(true);
      expect(mockHtml2pdf.set).toHaveBeenCalledWith(
        expect.objectContaining({
          jsPDF: expect.objectContaining({
            format: 'letter',
            orientation: 'landscape'
          })
        })
      );
    });

    it('should handle custom margins', async () => {
      const options = {
        margins: {
          top: 20,
          right: 25,
          bottom: 20,
          left: 25
        }
      };

      const result = await PDFExporter.exportToPDF(mockBlocks, options);

      expect(result.success).toBe(true);
      expect(mockHtml2pdf.set).toHaveBeenCalledWith(
        expect.objectContaining({
          margin: [20, 25, 20, 25]
        })
      );
    });

    it('should handle different quality settings', async () => {
      const highQualityOptions = {
        quality: 'high' as const,
        imageQuality: 0.95,
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true
        }
      };

      const result = await PDFExporter.exportToPDF(mockBlocks, highQualityOptions);

      expect(result.success).toBe(true);
      expect(mockHtml2pdf.set).toHaveBeenCalledWith(
        expect.objectContaining({
          image: expect.objectContaining({
            quality: 0.95
          }),
          html2canvas: expect.objectContaining({
            scale: 2,
            useCORS: true,
            letterRendering: true
          })
        })
      );
    });

    it('should filter out invisible blocks', async () => {
      const blocksWithInvisible = [
        ...mockBlocks,
        {
          id: 'hidden',
          type: 'summary' as const,
          title: 'Hidden Section',
          content: 'This should not appear',
          order: 4,
          isVisible: false,
          isEditing: false
        }
      ];

      const result = await PDFExporter.exportToPDF(blocksWithInvisible);

      expect(result.success).toBe(true);
      // The HTML content should not contain the hidden section
      expect(mockHtml2pdf.from).toHaveBeenCalledWith(
        expect.not.stringContaining('This should not appear')
      );
    });

    it('should handle export errors gracefully', async () => {
      // Mock html2pdf to throw an error
      mockHtml2pdf.toPdf.mockImplementationOnce(() => {
        throw new Error('PDF generation failed');
      });

      const result = await PDFExporter.exportToPDF(mockBlocks);

      expect(result.success).toBe(false);
      expect(result.error).toBe('PDF generation failed');
      expect(result.filename).toBe('');
      expect(result.blob).toBeUndefined();
    });

    it('should generate fallback filename when no contact name is available', async () => {
      const blocksWithoutName = mockBlocks.map(block => 
        block.type === 'contact' 
          ? { ...block, content: { ...block.content, name: '' } }
          : block
      );

      const result = await PDFExporter.exportToPDF(blocksWithoutName);

      expect(result.success).toBe(true);
      expect(result.filename).toMatch(/Resume_\d{4}-\d{2}-\d{2}\.pdf/);
    });
  });

  describe('PDFExporter.exportResumeDataToPDF', () => {
    it('should convert ResumeData to blocks and export', async () => {
      const result = await PDFExporter.exportResumeDataToPDF(mockResumeData);

      expect(result.success).toBe(true);
      expect(result.filename).toContain('John_Doe_Resume.pdf');
      expect(mockHtml2pdf.from).toHaveBeenCalled();
    });

    it('should handle ResumeData with empty sections', async () => {
      const emptyResumeData = {
        ...mockResumeData,
        sections: {
          ...mockResumeData.sections,
          experience: [],
          skills: [],
          certifications: []
        }
      };

      const result = await PDFExporter.exportResumeDataToPDF(emptyResumeData);

      expect(result.success).toBe(true);
    });
  });

  describe('HTML Content Generation', () => {
    it('should generate valid HTML structure', async () => {
      await PDFExporter.exportToPDF(mockBlocks);

      const htmlContent = mockHtml2pdf.from.mock.calls[0][0];
      
      expect(htmlContent).toContain('<!DOCTYPE html>');
      expect(htmlContent).toContain('<html lang="en">');
      expect(htmlContent).toContain('<head>');
      expect(htmlContent).toContain('<body>');
      expect(htmlContent).toContain('resume-container');
    });

    it('should include contact information in HTML', async () => {
      await PDFExporter.exportToPDF(mockBlocks);

      const htmlContent = mockHtml2pdf.from.mock.calls[0][0];
      
      expect(htmlContent).toContain('John Doe');
      expect(htmlContent).toContain('john.doe@example.com');
      expect(htmlContent).toContain('+1 (555) 123-4567');
    });

    it('should include experience information in HTML', async () => {
      await PDFExporter.exportToPDF(mockBlocks);

      const htmlContent = mockHtml2pdf.from.mock.calls[0][0];
      
      expect(htmlContent).toContain('Tech Corp');
      expect(htmlContent).toContain('Senior Developer');
      expect(htmlContent).toContain('Led development of web applications');
      expect(htmlContent).toContain('Improved performance by 40%');
    });

    it('should include skills in HTML', async () => {
      await PDFExporter.exportToPDF(mockBlocks);

      const htmlContent = mockHtml2pdf.from.mock.calls[0][0];
      
      expect(htmlContent).toContain('JavaScript');
      expect(htmlContent).toContain('TypeScript');
      expect(htmlContent).toContain('React');
      expect(htmlContent).toContain('Node.js');
    });

    it('should escape HTML characters in content', async () => {
      const blocksWithSpecialChars = [
        {
          id: 'summary',
          type: 'summary' as const,
          title: 'Summary',
          content: 'Experience with <script>alert("xss")</script> & HTML entities',
          order: 0,
          isVisible: true,
          isEditing: false
        }
      ];

      await PDFExporter.exportToPDF(blocksWithSpecialChars);

      const htmlContent = mockHtml2pdf.from.mock.calls[0][0];
      
      // Should not contain raw script tags
      expect(htmlContent).not.toContain('<script>');
      expect(htmlContent).not.toContain('alert("xss")');
    });
  });

  describe('Convenience Functions', () => {
    it('should export using convenience function exportToPDF', async () => {
      const result = await exportToPDF(mockBlocks);

      expect(result.success).toBe(true);
      expect(mockHtml2pdf.from).toHaveBeenCalled();
    });

    it('should export using convenience function exportResumeDataToPDF', async () => {
      const result = await exportResumeDataToPDF(mockResumeData);

      expect(result.success).toBe(true);
      expect(mockHtml2pdf.from).toHaveBeenCalled();
    });
  });

  describe('File Download', () => {
    it('should trigger file download', async () => {
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
        style: { display: '' }
      };

      (document.createElement as any).mockImplementation((tag: string) => {
        if (tag === 'a') return mockLink;
        if (tag === 'div') return { textContent: '', innerHTML: '' };
        return {};
      });

      await PDFExporter.exportToPDF(mockBlocks);

      expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
      expect(mockLink.click).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });
  });
});