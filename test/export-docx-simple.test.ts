import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResumeBlock } from '@/types/editor';

// Mock docx library
const mockPacker = {
  toBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(1024))
};

vi.mock('docx', () => ({
  Document: vi.fn().mockImplementation((config) => ({ config })),
  Packer: mockPacker,
  Paragraph: vi.fn().mockImplementation((config) => ({ type: 'paragraph', config })),
  TextRun: vi.fn().mockImplementation((config) => ({ type: 'textrun', config })),
  AlignmentType: {
    CENTER: 'CENTER',
    JUSTIFIED: 'JUSTIFIED'
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

describe('DOCX Export Simple Test', () => {
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

  it('should import and test basic DOCX functionality', async () => {
    // Dynamic import to test the module loading
    const { DOCXExporter } = await import('@/lib/utils/exportUtils');
    
    const result = await DOCXExporter.exportToDOCX(mockBlocks);

    expect(result.success).toBe(true);
    expect(result.filename).toContain('John_Doe_Resume.docx');
    expect(mockPacker.toBuffer).toHaveBeenCalled();
  });

  it('should handle filename generation for DOCX', async () => {
    const { DOCXExporter } = await import('@/lib/utils/exportUtils');
    
    const result = await DOCXExporter.exportToDOCX(mockBlocks, {
      filename: 'Custom_Resume.docx'
    });

    expect(result.success).toBe(true);
    expect(result.filename).toBe('Custom_Resume.docx');
  });
});