import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DOCXExporter, exportToDOCX, exportResumeDataToDOCX } from '@/lib/utils/exportUtils';
import { ResumeBlock } from '@/types/editor';
import { ResumeData } from '@/types/resume';

// Mock docx library
const mockPacker = {
  toBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(1024))
};

vi.mock('docx', () => ({
  Document: vi.fn().mockImplementation((config) => ({ config })),
  Packer: mockPacker,
  Paragraph: vi.fn().mockImplementation((config) => ({ type: 'paragraph', config })),
  TextRun: vi.fn().mockImplementation((config) => ({ type: 'textrun', config })),
  HeadingLevel: {
    HEADING_1: 'HEADING_1',
    HEADING_2: 'HEADING_2'
  },
  AlignmentType: {
    CENTER: 'CENTER',
    JUSTIFIED: 'JUSTIFIED'
  },
  UnderlineType: {
    SINGLE: 'SINGLE'
  },
  BorderStyle: {
    SINGLE: 'SINGLE'
  },
  WidthType: {
    PERCENTAGE: 'PERCENTAGE'
  },
  Table: vi.fn().mockImplementation((config) => ({ type: 'table', config })),
  TableRow: vi.fn().mockImplementation((config) => ({ type: 'tablerow', config })),
  TableCell: vi.fn().mockImplementation((config) => ({ type: 'tablecell', config })),
  ShadingType: {
    SOLID: 'SOLID'
  }
}));

// Mock DOM methods
Object.defineProperty(global, 'document', {
  value: {
    createElement: vi.fn((tag: string) => {
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

describe('DOCX Export System', () => {
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
      fileName: 'resume.docx',
      fileType: 'docx',
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
  });

  describe('DOCXExporter.exportToDOCX', () => {
    it('should export resume blocks to DOCX successfully', async () => {
      const result = await DOCXExporter.exportToDOCX(mockBlocks);

      expect(result.success).toBe(true);
      expect(result.filename).toContain('John_Doe_Resume.docx');
      expect(result.blob).toBeInstanceOf(Blob);
      expect(mockPacker.toBuffer).toHaveBeenCalled();
    });

    it('should handle custom filename', async () => {
      const customOptions = {
        filename: 'Custom_Resume_Name.docx'
      };

      const result = await DOCXExporter.exportToDOCX(mockBlocks, customOptions);

      expect(result.success).toBe(true);
      expect(result.filename).toBe('Custom_Resume_Name.docx');
    });

    it('should handle different paper sizes and orientations', async () => {
      const options = {
        paperSize: 'letter' as const,
        orientation: 'landscape' as const
      };

      const result = await DOCXExporter.exportToDOCX(mockBlocks, options);

      expect(result.success).toBe(true);
      expect(mockPacker.toBuffer).toHaveBeenCalled();
    });

    it('should handle custom margins', async () => {
      const options = {
        margins: {
          top: 30,
          right: 35,
          bottom: 30,
          left: 35
        }
      };

      const result = await DOCXExporter.exportToDOCX(mockBlocks, options);

      expect(result.success).toBe(true);
      expect(mockPacker.toBuffer).toHaveBeenCalled();
    });

    it('should handle font and styling options', async () => {
      const options = {
        fontFamily: 'Arial',
        fontSize: 12,
        lineSpacing: 1.2,
        styles: {
          heading1: {
            size: 18,
            bold: true,
            color: '000000'
          },
          heading2: {
            size: 16,
            bold: true,
            color: '333333'
          },
          body: {
            size: 12,
            color: '000000'
          }
        }
      };

      const result = await DOCXExporter.exportToDOCX(mockBlocks, options);

      expect(result.success).toBe(true);
      expect(mockPacker.toBuffer).toHaveBeenCalled();
    });

    it('should handle page numbers and headers/footers', async () => {
      const options = {
        includePageNumbers: true,
        headerText: 'Resume - John Doe',
        footerText: 'Confidential'
      };

      const result = await DOCXExporter.exportToDOCX(mockBlocks, options);

      expect(result.success).toBe(true);
      expect(mockPacker.toBuffer).toHaveBeenCalled();
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

      const result = await DOCXExporter.exportToDOCX(blocksWithInvisible);

      expect(result.success).toBe(true);
      expect(mockPacker.toBuffer).toHaveBeenCalled();
    });

    it('should handle export errors gracefully', async () => {
      // Mock Packer to throw an error
      mockPacker.toBuffer.mockRejectedValueOnce(new Error('DOCX generation failed'));

      const result = await DOCXExporter.exportToDOCX(mockBlocks);

      expect(result.success).toBe(false);
      expect(result.error).toBe('DOCX generation failed');
      expect(result.filename).toBe('');
      expect(result.blob).toBeUndefined();
    });

    it('should generate fallback filename when no contact name is available', async () => {
      const blocksWithoutName = mockBlocks.map(block => 
        block.type === 'contact' 
          ? { ...block, content: { ...block.content, name: '' } }
          : block
      );

      const result = await DOCXExporter.exportToDOCX(blocksWithoutName);

      expect(result.success).toBe(true);
      expect(result.filename).toMatch(/Resume_\d{4}-\d{2}-\d{2}\.docx/);
    });
  });

  describe('DOCXExporter.exportResumeDataToDOCX', () => {
    it('should convert ResumeData to blocks and export', async () => {
      const result = await DOCXExporter.exportResumeDataToDOCX(mockResumeData);

      expect(result.success).toBe(true);
      expect(result.filename).toContain('John_Doe_Resume.docx');
      expect(mockPacker.toBuffer).toHaveBeenCalled();
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

      const result = await DOCXExporter.exportResumeDataToDOCX(emptyResumeData);

      expect(result.success).toBe(true);
    });
  });

  describe('Document Structure', () => {
    it('should create document with proper structure', async () => {
      const { Document } = await import('docx');
      
      await DOCXExporter.exportToDOCX(mockBlocks);

      expect(Document).toHaveBeenCalledWith(
        expect.objectContaining({
          sections: expect.arrayContaining([
            expect.objectContaining({
              properties: expect.any(Object),
              children: expect.any(Array)
            })
          ])
        })
      );
    });

    it('should handle different block types correctly', async () => {
      const allBlockTypes: ResumeBlock[] = [
        {
          id: 'contact',
          type: 'contact',
          title: 'Contact',
          content: { name: 'John Doe', email: 'john@example.com' },
          order: 0,
          isVisible: true,
          isEditing: false
        },
        {
          id: 'summary',
          type: 'summary',
          title: 'Summary',
          content: 'Professional summary',
          order: 1,
          isVisible: true,
          isEditing: false
        },
        {
          id: 'experience',
          type: 'experience',
          title: 'Experience',
          content: [{ id: '1', company: 'Company', position: 'Position', startDate: '2020', endDate: '2023', description: 'Description', achievements: [] }],
          order: 2,
          isVisible: true,
          isEditing: false
        },
        {
          id: 'education',
          type: 'education',
          title: 'Education',
          content: [{ id: '1', institution: 'University', degree: 'Bachelor', field: 'Computer Science', startDate: '2016', endDate: '2020' }],
          order: 3,
          isVisible: true,
          isEditing: false
        },
        {
          id: 'skills',
          type: 'skills',
          title: 'Skills',
          content: ['JavaScript', 'Python'],
          order: 4,
          isVisible: true,
          isEditing: false
        },
        {
          id: 'certifications',
          type: 'certifications',
          title: 'Certifications',
          content: [{ id: '1', name: 'AWS Certified', issuer: 'Amazon', date: '2023', credentialId: '123456' }],
          order: 5,
          isVisible: true,
          isEditing: false
        }
      ];

      const result = await DOCXExporter.exportToDOCX(allBlockTypes);

      expect(result.success).toBe(true);
      expect(mockPacker.toBuffer).toHaveBeenCalled();
    });
  });

  describe('Convenience Functions', () => {
    it('should export using convenience function exportToDOCX', async () => {
      const result = await exportToDOCX(mockBlocks);

      expect(result.success).toBe(true);
      expect(mockPacker.toBuffer).toHaveBeenCalled();
    });

    it('should export using convenience function exportResumeDataToDOCX', async () => {
      const result = await exportResumeDataToDOCX(mockResumeData);

      expect(result.success).toBe(true);
      expect(mockPacker.toBuffer).toHaveBeenCalled();
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
        return {};
      });

      await DOCXExporter.exportToDOCX(mockBlocks);

      expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
      expect(mockLink.click).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });
  });
});