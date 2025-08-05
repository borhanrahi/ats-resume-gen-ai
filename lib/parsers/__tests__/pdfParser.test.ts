import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock PDF.js with proper factory function
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {
    workerSrc: ''
  },
  getDocument: vi.fn(),
  version: '3.11.174'
}));

// Import after mocking
import { PDFParser, PDFParseException } from '../pdfParser';
import * as pdfjsLib from 'pdfjs-dist';

describe('PDFParser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parse', () => {
    it('should successfully parse a valid PDF file', async () => {
      // Mock PDF.js objects
      const mockTextContent = {
        items: [
          { str: 'John' },
          { str: 'Doe' },
          { str: 'Software' },
          { str: 'Engineer' }
        ]
      };

      const mockPage = {
        getTextContent: vi.fn().mockResolvedValue(mockTextContent)
      };

      const mockDocument = {
        numPages: 1,
        getPage: vi.fn().mockResolvedValue(mockPage),
        getMetadata: vi.fn().mockResolvedValue({
          info: {
            Title: 'Resume',
            Author: 'John Doe',
            Creator: 'Microsoft Word'
          }
        })
      };

      const mockLoadingTask = {
        promise: Promise.resolve(mockDocument)
      };

      vi.mocked(pdfjsLib.getDocument).mockReturnValue(mockLoadingTask as any);

      // Create mock file
      const mockFile = new File(['mock pdf content'], 'resume.pdf', {
        type: 'application/pdf'
      });

      // Parse the file
      const result = await PDFParser.parse(mockFile);

      // Assertions
      expect(result).toBeDefined();
      expect(result.content).toBe('John Doe Software Engineer');
      expect(result.metadata.fileName).toBe('resume.pdf');
      expect(result.metadata.fileType).toBe('pdf');
      expect(result.metadata.wordCount).toBe(4);
      expect(result.metadata.pageCount).toBe(1);
      expect(result.metadata.title).toBe('Resume');
      expect(result.metadata.author).toBe('John Doe');
      expect(result.pages).toHaveLength(1);
      expect(result.pages[0].pageNumber).toBe(1);
      expect(result.pages[0].content).toBe('John Doe Software Engineer');
      expect(result.pages[0].wordCount).toBe(4);
    });

    it('should handle multi-page PDF documents', async () => {
      const mockTextContent1 = {
        items: [{ str: 'Page' }, { str: '1' }, { str: 'content' }]
      };

      const mockTextContent2 = {
        items: [{ str: 'Page' }, { str: '2' }, { str: 'content' }]
      };

      const mockPage1 = {
        getTextContent: vi.fn().mockResolvedValue(mockTextContent1)
      };

      const mockPage2 = {
        getTextContent: vi.fn().mockResolvedValue(mockTextContent2)
      };

      const mockDocument = {
        numPages: 2,
        getPage: vi.fn()
          .mockResolvedValueOnce(mockPage1)
          .mockResolvedValueOnce(mockPage2),
        getMetadata: vi.fn().mockResolvedValue({ info: {} })
      };

      const mockLoadingTask = {
        promise: Promise.resolve(mockDocument)
      };

      vi.mocked(pdfjsLib.getDocument).mockReturnValue(mockLoadingTask as any);

      const mockFile = new File(['mock pdf content'], 'multi-page.pdf', {
        type: 'application/pdf'
      });

      const result = await PDFParser.parse(mockFile);

      expect(result.metadata.pageCount).toBe(2);
      expect(result.pages).toHaveLength(2);
      expect(result.pages[0].content).toBe('Page 1 content');
      expect(result.pages[1].content).toBe('Page 2 content');
      expect(result.content).toBe('Page 1 content\nPage 2 content');
      expect(result.metadata.wordCount).toBe(6);
    });

    it('should throw PDFParseException for empty file', async () => {
      const emptyFile = new File([], 'empty.pdf', {
        type: 'application/pdf'
      });

      await expect(PDFParser.parse(emptyFile)).rejects.toThrow(PDFParseException);
      await expect(PDFParser.parse(emptyFile)).rejects.toThrow('The uploaded file is empty');
    });

    it('should throw PDFParseException for non-PDF file', async () => {
      const textFile = new File(['some text'], 'document.txt', {
        type: 'text/plain'
      });

      await expect(PDFParser.parse(textFile)).rejects.toThrow(PDFParseException);
      await expect(PDFParser.parse(textFile)).rejects.toThrow('File must be a PDF document');
    });

    it('should throw PDFParseException for corrupted PDF', async () => {
      const mockLoadingTask = {
        promise: Promise.reject(new Error('Invalid PDF structure'))
      };

      vi.mocked(pdfjsLib.getDocument).mockReturnValue(mockLoadingTask as any);

      const mockFile = new File(['corrupted pdf'], 'corrupted.pdf', {
        type: 'application/pdf'
      });

      await expect(PDFParser.parse(mockFile)).rejects.toThrow(PDFParseException);
      await expect(PDFParser.parse(mockFile)).rejects.toThrow('Invalid or corrupted PDF file');
    });

    it('should throw PDFParseException for PDF with no readable text', async () => {
      const mockTextContent = {
        items: [] // No text items
      };

      const mockPage = {
        getTextContent: vi.fn().mockResolvedValue(mockTextContent)
      };

      const mockDocument = {
        numPages: 1,
        getPage: vi.fn().mockResolvedValue(mockPage),
        getMetadata: vi.fn().mockResolvedValue({ info: {} })
      };

      const mockLoadingTask = {
        promise: Promise.resolve(mockDocument)
      };

      vi.mocked(pdfjsLib.getDocument).mockReturnValue(mockLoadingTask as any);

      const mockFile = new File(['pdf with no text'], 'no-text.pdf', {
        type: 'application/pdf'
      });

      await expect(PDFParser.parse(mockFile)).rejects.toThrow(PDFParseException);
      await expect(PDFParser.parse(mockFile)).rejects.toThrow('PDF document contains no readable text content');
    });

    it('should handle ArrayBuffer input', async () => {
      const mockTextContent = {
        items: [{ str: 'Test' }, { str: 'content' }]
      };

      const mockPage = {
        getTextContent: vi.fn().mockResolvedValue(mockTextContent)
      };

      const mockDocument = {
        numPages: 1,
        getPage: vi.fn().mockResolvedValue(mockPage),
        getMetadata: vi.fn().mockResolvedValue({ info: {} })
      };

      const mockLoadingTask = {
        promise: Promise.resolve(mockDocument)
      };

      vi.mocked(pdfjsLib.getDocument).mockReturnValue(mockLoadingTask as any);

      const arrayBuffer = new ArrayBuffer(1024);
      const result = await PDFParser.parse(arrayBuffer, 'test.pdf');

      expect(result.metadata.fileName).toBe('test.pdf');
      expect(result.content).toBe('Test content');
    });

    it('should handle page extraction errors gracefully', async () => {
      const mockTextContent = {
        items: [{ str: 'Good' }, { str: 'page' }]
      };

      const mockGoodPage = {
        getTextContent: vi.fn().mockResolvedValue(mockTextContent)
      };

      const mockDocument = {
        numPages: 2,
        getPage: vi.fn()
          .mockResolvedValueOnce(mockGoodPage)
          .mockRejectedValueOnce(new Error('Page extraction failed')),
        getMetadata: vi.fn().mockResolvedValue({ info: {} })
      };

      const mockLoadingTask = {
        promise: Promise.resolve(mockDocument)
      };

      vi.mocked(pdfjsLib.getDocument).mockReturnValue(mockLoadingTask as any);

      const mockFile = new File(['pdf content'], 'partial-error.pdf', {
        type: 'application/pdf'
      });

      const result = await PDFParser.parse(mockFile);

      expect(result.pages).toHaveLength(2);
      expect(result.pages[0].content).toBe('Good page');
      expect(result.pages[1].content).toBe(''); // Failed page should have empty content
      expect(result.pages[1].wordCount).toBe(0);
    });

    it('should normalize whitespace in extracted text', async () => {
      const mockTextContent = {
        items: [
          { str: 'Text' },
          { str: '   with   ' },
          { str: 'extra    ' },
          { str: 'spaces' }
        ]
      };

      const mockPage = {
        getTextContent: vi.fn().mockResolvedValue(mockTextContent)
      };

      const mockDocument = {
        numPages: 1,
        getPage: vi.fn().mockResolvedValue(mockPage),
        getMetadata: vi.fn().mockResolvedValue({ info: {} })
      };

      const mockLoadingTask = {
        promise: Promise.resolve(mockDocument)
      };

      vi.mocked(pdfjsLib.getDocument).mockReturnValue(mockLoadingTask as any);

      const mockFile = new File(['pdf content'], 'whitespace.pdf', {
        type: 'application/pdf'
      });

      const result = await PDFParser.parse(mockFile);

      expect(result.content).toBe('Text with extra spaces');
      expect(result.metadata.wordCount).toBe(4);
    });

    it('should handle PDF with zero pages', async () => {
      const mockDocument = {
        numPages: 0,
        getMetadata: vi.fn().mockResolvedValue({ info: {} })
      };

      const mockLoadingTask = {
        promise: Promise.resolve(mockDocument)
      };

      vi.mocked(pdfjsLib.getDocument).mockReturnValue(mockLoadingTask as any);

      const mockFile = new File(['pdf content'], 'zero-pages.pdf', {
        type: 'application/pdf'
      });

      await expect(PDFParser.parse(mockFile)).rejects.toThrow(PDFParseException);
      await expect(PDFParser.parse(mockFile)).rejects.toThrow('PDF document contains no pages');
    });
  });

  describe('isValidPDFFile', () => {
    it('should return true for valid PDF file with correct MIME type', () => {
      const pdfFile = new File(['content'], 'document.pdf', {
        type: 'application/pdf'
      });

      expect(PDFParser.isValidPDFFile(pdfFile)).toBe(true);
    });

    it('should return true for file with .pdf extension', () => {
      const pdfFile = new File(['content'], 'document.pdf', {
        type: 'application/octet-stream' // Sometimes browsers don't set correct MIME type
      });

      expect(PDFParser.isValidPDFFile(pdfFile)).toBe(true);
    });

    it('should return false for non-PDF file', () => {
      const textFile = new File(['content'], 'document.txt', {
        type: 'text/plain'
      });

      expect(PDFParser.isValidPDFFile(textFile)).toBe(false);
    });

    it('should return false for null/undefined file', () => {
      expect(PDFParser.isValidPDFFile(null as any)).toBe(false);
      expect(PDFParser.isValidPDFFile(undefined as any)).toBe(false);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(PDFParser.formatFileSize(0)).toBe('0 Bytes');
      expect(PDFParser.formatFileSize(1024)).toBe('1 KB');
      expect(PDFParser.formatFileSize(1048576)).toBe('1 MB');
      expect(PDFParser.formatFileSize(1073741824)).toBe('1 GB');
      expect(PDFParser.formatFileSize(1536)).toBe('1.5 KB');
    });
  });

  describe('countWords (private method)', () => {
    it('should count words correctly', () => {
      // Access private method through any cast for testing
      const countWords = (PDFParser as any).countWords;
      
      expect(countWords('Hello world')).toBe(2);
      expect(countWords('  Multiple   spaces   between   words  ')).toBe(4);
      expect(countWords('')).toBe(0);
      expect(countWords('   ')).toBe(0);
      expect(countWords('Single')).toBe(1);
    });

    it('should handle non-string input', () => {
      const countWords = (PDFParser as unknown).countWords;
      
      expect(countWords(null)).toBe(0);
      expect(countWords(undefined)).toBe(0);
      expect(countWords(123)).toBe(0);
    });
  });
});