import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parsePDF } from '../../lib/parsers/pdfParser';
import { parseDOCX } from '../../lib/parsers/docxParser';

// Mock the external libraries
vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn(),
  GlobalWorkerOptions: {
    workerSrc: ''
  }
}));

vi.mock('mammoth', () => ({
  extractRawText: vi.fn()
}));

describe('Document Parsers Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PDF Parser', () => {
    it('should extract text from PDF buffer', async () => {
      const mockPDFDocument = {
        numPages: 2,
        getPage: vi.fn()
      };

      const mockPage = {
        getTextContent: vi.fn().mockResolvedValue({
          items: [
            { str: 'John Doe' },
            { str: 'Software Engineer' },
            { str: 'Experience with JavaScript and React' }
          ]
        })
      };

      mockPDFDocument.getPage.mockResolvedValue(mockPage);

      const { getDocument } = await import('pdfjs-dist');
      (getDocument as any).mockResolvedValue({
        promise: Promise.resolve(mockPDFDocument)
      });

      const mockBuffer = new ArrayBuffer(1024);
      const result = await parsePDF(mockBuffer);

      expect(result.text).toContain('John Doe');
      expect(result.text).toContain('Software Engineer');
      expect(result.text).toContain('JavaScript and React');
      expect(result.metadata.pageCount).toBe(2);
    });

    it('should handle PDF parsing errors', async () => {
      const { getDocument } = await import('pdfjs-dist');
      (getDocument as any).mockRejectedValue(new Error('Invalid PDF'));

      const mockBuffer = new ArrayBuffer(1024);

      await expect(parsePDF(mockBuffer)).rejects.toThrow('Invalid PDF');
    });

    it('should handle empty PDF', async () => {
      const mockPDFDocument = {
        numPages: 1,
        getPage: vi.fn()
      };

      const mockPage = {
        getTextContent: vi.fn().mockResolvedValue({
          items: []
        })
      };

      mockPDFDocument.getPage.mockResolvedValue(mockPage);

      const { getDocument } = await import('pdfjs-dist');
      (getDocument as any).mockResolvedValue({
        promise: Promise.resolve(mockPDFDocument)
      });

      const mockBuffer = new ArrayBuffer(1024);
      const result = await parsePDF(mockBuffer);

      expect(result.text).toBe('');
      expect(result.metadata.pageCount).toBe(1);
    });

    it('should extract metadata from PDF', async () => {
      const mockPDFDocument = {
        numPages: 3,
        getPage: vi.fn(),
        getMetadata: vi.fn().mockResolvedValue({
          info: {
            Title: 'Resume - John Doe',
            Author: 'John Doe',
            CreationDate: new Date('2024-01-01')
          }
        })
      };

      const mockPage = {
        getTextContent: vi.fn().mockResolvedValue({
          items: [{ str: 'Sample text' }]
        })
      };

      mockPDFDocument.getPage.mockResolvedValue(mockPage);

      const { getDocument } = await import('pdfjs-dist');
      (getDocument as any).mockResolvedValue({
        promise: Promise.resolve(mockPDFDocument)
      });

      const mockBuffer = new ArrayBuffer(1024);
      const result = await parsePDF(mockBuffer);

      expect(result.metadata.title).toBe('Resume - John Doe');
      expect(result.metadata.author).toBe('John Doe');
      expect(result.metadata.pageCount).toBe(3);
    });
  });

  describe('DOCX Parser', () => {
    it('should extract text from DOCX buffer', async () => {
      const mammoth = await import('mammoth');
      (mammoth.extractRawText as any).mockResolvedValue({
        value: 'John Doe\nSoftware Engineer\nExperience with JavaScript and React',
        messages: []
      });

      const mockBuffer = new ArrayBuffer(1024);
      const result = await parseDOCX(mockBuffer);

      expect(result.text).toContain('John Doe');
      expect(result.text).toContain('Software Engineer');
      expect(result.text).toContain('JavaScript and React');
      expect(result.metadata.hasFormatting).toBe(true);
    });

    it('should handle DOCX parsing errors', async () => {
      const mammoth = await import('mammoth');
      (mammoth.extractRawText as any).mockRejectedValue(new Error('Invalid DOCX'));

      const mockBuffer = new ArrayBuffer(1024);

      await expect(parseDOCX(mockBuffer)).rejects.toThrow('Invalid DOCX');
    });

    it('should handle empty DOCX', async () => {
      const mammoth = await import('mammoth');
      (mammoth.extractRawText as any).mockResolvedValue({
        value: '',
        messages: []
      });

      const mockBuffer = new ArrayBuffer(1024);
      const result = await parseDOCX(mockBuffer);

      expect(result.text).toBe('');
      expect(result.metadata.hasFormatting).toBe(true);
    });

    it('should preserve formatting information', async () => {
      const mammoth = await import('mammoth');
      (mammoth.extractRawText as any).mockResolvedValue({
        value: 'John Doe\n\nSoftware Engineer\n\nSkills:\n• JavaScript\n• React\n• Node.js',
        messages: []
      });

      const mockBuffer = new ArrayBuffer(1024);
      const result = await parseDOCX(mockBuffer);

      expect(result.text).toContain('John Doe');
      expect(result.text).toContain('Skills:');
      expect(result.text).toContain('• JavaScript');
      expect(result.metadata.hasFormatting).toBe(true);
    });

    it('should handle DOCX with warnings', async () => {
      const mammoth = await import('mammoth');
      (mammoth.extractRawText as any).mockResolvedValue({
        value: 'Sample text',
        messages: [
          { type: 'warning', message: 'Unsupported style' }
        ]
      });

      const mockBuffer = new ArrayBuffer(1024);
      const result = await parseDOCX(mockBuffer);

      expect(result.text).toBe('Sample text');
      expect(result.metadata.warnings).toHaveLength(1);
      expect(result.metadata.warnings[0]).toBe('Unsupported style');
    });
  });

  describe('File Type Detection', () => {
    it('should detect PDF file type from buffer', () => {
      // PDF magic number: %PDF
      const pdfBuffer = new ArrayBuffer(8);
      const view = new Uint8Array(pdfBuffer);
      view[0] = 0x25; // %
      view[1] = 0x50; // P
      view[2] = 0x44; // D
      view[3] = 0x46; // F

      const fileType = detectFileType(pdfBuffer);
      expect(fileType).toBe('pdf');
    });

    it('should detect DOCX file type from buffer', () => {
      // DOCX magic number: PK (ZIP signature)
      const docxBuffer = new ArrayBuffer(8);
      const view = new Uint8Array(docxBuffer);
      view[0] = 0x50; // P
      view[1] = 0x4B; // K

      const fileType = detectFileType(docxBuffer);
      expect(fileType).toBe('docx');
    });

    it('should return unknown for unrecognized file type', () => {
      const unknownBuffer = new ArrayBuffer(8);
      const view = new Uint8Array(unknownBuffer);
      view[0] = 0x00;
      view[1] = 0x00;

      const fileType = detectFileType(unknownBuffer);
      expect(fileType).toBe('unknown');
    });
  });

  describe('Text Processing', () => {
    it('should clean extracted text', () => {
      const rawText = '  John   Doe  \n\n\n  Software Engineer  \n\n  ';
      const cleanedText = cleanExtractedText(rawText);

      expect(cleanedText).toBe('John Doe\nSoftware Engineer');
    });

    it('should preserve meaningful line breaks', () => {
      const rawText = 'John Doe\n\nSoftware Engineer\n\nSkills:\nJavaScript\nReact';
      const cleanedText = cleanExtractedText(rawText);

      expect(cleanedText).toContain('John Doe\n\nSoftware Engineer');
      expect(cleanedText).toContain('Skills:\nJavaScript\nReact');
    });

    it('should remove excessive whitespace', () => {
      const rawText = 'John     Doe\n\n\n\n\nSoftware     Engineer';
      const cleanedText = cleanExtractedText(rawText);

      expect(cleanedText).toBe('John Doe\n\nSoftware Engineer');
    });
  });

  describe('Error Recovery', () => {
    it('should handle corrupted PDF gracefully', async () => {
      const { getDocument } = await import('pdfjs-dist');
      (getDocument as any).mockRejectedValue(new Error('PDF is corrupted'));

      const mockBuffer = new ArrayBuffer(1024);

      await expect(parsePDF(mockBuffer)).rejects.toThrow('PDF is corrupted');
    });

    it('should handle corrupted DOCX gracefully', async () => {
      const mammoth = await import('mammoth');
      (mammoth.extractRawText as any).mockRejectedValue(new Error('DOCX is corrupted'));

      const mockBuffer = new ArrayBuffer(1024);

      await expect(parseDOCX(mockBuffer)).rejects.toThrow('DOCX is corrupted');
    });

    it('should provide meaningful error messages', async () => {
      const { getDocument } = await import('pdfjs-dist');
      (getDocument as any).mockRejectedValue(new Error('Invalid PDF structure'));

      const mockBuffer = new ArrayBuffer(1024);

      try {
        await parsePDF(mockBuffer);
      } catch (error) {
        expect(error.message).toContain('Invalid PDF structure');
      }
    });
  });
});

// Helper functions for testing
function detectFileType(buffer: ArrayBuffer): string {
  const view = new Uint8Array(buffer);
  
  // Check for PDF magic number
  if (view[0] === 0x25 && view[1] === 0x50 && view[2] === 0x44 && view[3] === 0x46) {
    return 'pdf';
  }
  
  // Check for ZIP/DOCX magic number
  if (view[0] === 0x50 && view[1] === 0x4B) {
    return 'docx';
  }
  
  return 'unknown';
}

function cleanExtractedText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n\s+/g, '\n') // Remove spaces after line breaks
    .replace(/\n{3,}/g, '\n\n') // Replace multiple line breaks with double
    .trim();
}