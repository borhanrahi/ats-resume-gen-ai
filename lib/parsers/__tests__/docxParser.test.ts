import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock mammoth
vi.mock('mammoth', () => ({
  extractRawText: vi.fn(),
  convertToHtml: vi.fn()
}));

// Import after mocking
import { DOCXParser, DOCXParseException } from '../docxParser';
import * as mammoth from 'mammoth';

describe('DOCXParser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parse', () => {
    it('should successfully parse a valid DOCX file', async () => {
      // Mock mammoth responses
      const mockTextResult = {
        value: 'John Doe\nSoftware Engineer\nExperienced developer with 5 years in web development.',
        messages: []
      };

      const mockHtmlResult = {
        value: '<p>John Doe</p><p>Software Engineer</p><p>Experienced developer with 5 years in web development.</p>',
        messages: []
      };

      vi.mocked(mammoth.extractRawText).mockResolvedValue(mockTextResult);
      vi.mocked(mammoth.convertToHtml).mockResolvedValue(mockHtmlResult);

      // Create mock file
      const mockFile = new File(['mock docx content'], 'resume.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      // Parse the file
      const result = await DOCXParser.parse(mockFile);

      // Assertions
      expect(result).toBeDefined();
      expect(result.content).toBe('John Doe\nSoftware Engineer\nExperienced developer with 5 years in web development.');
      expect(result.metadata.fileName).toBe('resume.docx');
      expect(result.metadata.fileType).toBe('docx');
      expect(result.metadata.wordCount).toBe(12);
      expect(result.metadata.characterCount).toBe(81);
      expect(result.metadata.paragraphCount).toBe(1);
      expect(result.formattedContent.html).toBe('<p>John Doe</p><p>Software Engineer</p><p>Experienced developer with 5 years in web development.</p>');
      expect(result.formattedContent.plainText).toBe('John Doe\nSoftware Engineer\nExperienced developer with 5 years in web development.');
      expect(result.warnings).toEqual([]);
    });

    it('should handle DOCX with warnings', async () => {
      const mockTextResult = {
        value: 'Document content with some formatting issues.',
        messages: [
          { type: 'warning' as const, message: 'Unsupported style detected' },
          { type: 'warning' as const, message: 'Image could not be processed' }
        ]
      };

      const mockHtmlResult = {
        value: '<p>Document content with some formatting issues.</p>',
        messages: [
          { type: 'warning' as const, message: 'Complex table structure simplified' }
        ]
      };

      vi.mocked(mammoth.extractRawText).mockResolvedValue(mockTextResult);
      vi.mocked(mammoth.convertToHtml).mockResolvedValue(mockHtmlResult);

      const mockFile = new File(['mock docx content'], 'resume.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      const result = await DOCXParser.parse(mockFile);

      expect(result.warnings).toHaveLength(3);
      expect(result.warnings).toContain('Unsupported style detected');
      expect(result.warnings).toContain('Image could not be processed');
      expect(result.warnings).toContain('Complex table structure simplified');
    });

    it('should throw DOCXParseException for empty file', async () => {
      const emptyFile = new File([], 'empty.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      await expect(DOCXParser.parse(emptyFile)).rejects.toThrow(DOCXParseException);
      await expect(DOCXParser.parse(emptyFile)).rejects.toThrow('The uploaded file is empty');
    });

    it('should throw DOCXParseException for non-DOCX file', async () => {
      const textFile = new File(['some text'], 'document.txt', {
        type: 'text/plain'
      });

      await expect(DOCXParser.parse(textFile)).rejects.toThrow(DOCXParseException);
      await expect(DOCXParser.parse(textFile)).rejects.toThrow('File must be a DOCX document');
    });

    it('should throw DOCXParseException for corrupted DOCX', async () => {
      vi.mocked(mammoth.extractRawText).mockRejectedValue(new Error('Invalid DOCX structure'));

      const mockFile = new File(['corrupted docx'], 'corrupted.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      await expect(DOCXParser.parse(mockFile)).rejects.toThrow(DOCXParseException);
      await expect(DOCXParser.parse(mockFile)).rejects.toThrow('Invalid or corrupted DOCX file');
    });

    it('should throw DOCXParseException for DOCX with no readable text', async () => {
      const mockTextResult = {
        value: '   \n\n   ', // Only whitespace
        messages: []
      };

      const mockHtmlResult = {
        value: '<p></p>',
        messages: []
      };

      vi.mocked(mammoth.extractRawText).mockResolvedValue(mockTextResult);
      vi.mocked(mammoth.convertToHtml).mockResolvedValue(mockHtmlResult);

      const mockFile = new File(['docx with no text'], 'no-text.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      await expect(DOCXParser.parse(mockFile)).rejects.toThrow(DOCXParseException);
      await expect(DOCXParser.parse(mockFile)).rejects.toThrow('DOCX document contains no readable text content');
    });

    it('should handle ArrayBuffer input', async () => {
      const mockTextResult = {
        value: 'Test content from ArrayBuffer',
        messages: []
      };

      const mockHtmlResult = {
        value: '<p>Test content from ArrayBuffer</p>',
        messages: []
      };

      vi.mocked(mammoth.extractRawText).mockResolvedValue(mockTextResult);
      vi.mocked(mammoth.convertToHtml).mockResolvedValue(mockHtmlResult);

      const arrayBuffer = new ArrayBuffer(1024);
      const result = await DOCXParser.parse(arrayBuffer, 'test.docx');

      expect(result.metadata.fileName).toBe('test.docx');
      expect(result.content).toBe('Test content from ArrayBuffer');
      expect(result.metadata.wordCount).toBe(4);
    });

    it('should handle null/undefined input', async () => {
      await expect(DOCXParser.parse(null as unknown as File)).rejects.toThrow(DOCXParseException);
      await expect(DOCXParser.parse(null as unknown as File)).rejects.toThrow('No file provided for parsing');
    });

    it('should calculate word count correctly', async () => {
      const mockTextResult = {
        value: 'This is a test document with exactly ten words here.',
        messages: []
      };

      const mockHtmlResult = {
        value: '<p>This is a test document with exactly ten words here.</p>',
        messages: []
      };

      vi.mocked(mammoth.extractRawText).mockResolvedValue(mockTextResult);
      vi.mocked(mammoth.convertToHtml).mockResolvedValue(mockHtmlResult);

      const mockFile = new File(['docx content'], 'word-count.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      const result = await DOCXParser.parse(mockFile);

      expect(result.metadata.wordCount).toBe(10);
    });

    it('should calculate paragraph count correctly', async () => {
      const mockTextResult = {
        value: 'First paragraph.\n\nSecond paragraph with more content.\n\nThird paragraph here.',
        messages: []
      };

      const mockHtmlResult = {
        value: '<p>First paragraph.</p><p>Second paragraph with more content.</p><p>Third paragraph here.</p>',
        messages: []
      };

      vi.mocked(mammoth.extractRawText).mockResolvedValue(mockTextResult);
      vi.mocked(mammoth.convertToHtml).mockResolvedValue(mockHtmlResult);

      const mockFile = new File(['docx content'], 'paragraphs.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      const result = await DOCXParser.parse(mockFile);

      expect(result.metadata.paragraphCount).toBe(3);
    });

    it('should handle mammoth HTML conversion failure gracefully', async () => {
      const mockTextResult = {
        value: 'Text extraction successful',
        messages: []
      };

      vi.mocked(mammoth.extractRawText).mockResolvedValue(mockTextResult);
      vi.mocked(mammoth.convertToHtml).mockRejectedValue(new Error('HTML conversion failed'));

      const mockFile = new File(['docx content'], 'html-fail.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      await expect(DOCXParser.parse(mockFile)).rejects.toThrow(DOCXParseException);
      await expect(DOCXParser.parse(mockFile)).rejects.toThrow('Invalid or corrupted DOCX file');
    });
  });

  describe('isValidDOCXFile', () => {
    it('should return true for valid DOCX file with correct MIME type', () => {
      const docxFile = new File(['content'], 'document.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      expect(DOCXParser.isValidDOCXFile(docxFile)).toBe(true);
    });

    it('should return true for file with .docx extension', () => {
      const docxFile = new File(['content'], 'document.docx', {
        type: 'application/octet-stream' // Sometimes browsers don't set correct MIME type
      });

      expect(DOCXParser.isValidDOCXFile(docxFile)).toBe(true);
    });

    it('should return false for non-DOCX file', () => {
      const textFile = new File(['content'], 'document.txt', {
        type: 'text/plain'
      });

      expect(DOCXParser.isValidDOCXFile(textFile)).toBe(false);
    });

    it('should return false for PDF file', () => {
      const pdfFile = new File(['content'], 'document.pdf', {
        type: 'application/pdf'
      });

      expect(DOCXParser.isValidDOCXFile(pdfFile)).toBe(false);
    });

    it('should return false for null/undefined file', () => {
      expect(DOCXParser.isValidDOCXFile(null as unknown as File)).toBe(false);
      expect(DOCXParser.isValidDOCXFile(undefined as unknown as File)).toBe(false);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(DOCXParser.formatFileSize(0)).toBe('0 Bytes');
      expect(DOCXParser.formatFileSize(1024)).toBe('1 KB');
      expect(DOCXParser.formatFileSize(1048576)).toBe('1 MB');
      expect(DOCXParser.formatFileSize(1073741824)).toBe('1 GB');
      expect(DOCXParser.formatFileSize(1536)).toBe('1.5 KB');
    });
  });

  describe('parseWithStructure', () => {
    it('should parse with structure and return base result plus structured content', async () => {
      const mockTextResult = {
        value: 'Document with structure',
        messages: []
      };

      const mockHtmlResult = {
        value: '<p>Document with structure</p>',
        messages: []
      };

      vi.mocked(mammoth.extractRawText).mockResolvedValue(mockTextResult);
      vi.mocked(mammoth.convertToHtml).mockResolvedValue(mockHtmlResult);

      const mockFile = new File(['docx content'], 'structured.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      const result = await DOCXParser.parseWithStructure(mockFile);

      expect(result.content).toBe('Document with structure');
      expect(result.structuredContent).toBeDefined();
      expect(result.structuredContent).toEqual({
        headings: [],
        lists: [],
        tables: [],
        images: undefined
      });
    });

    it('should include images in structured content when requested', async () => {
      const mockTextResult = {
        value: 'Document with images',
        messages: []
      };

      const mockHtmlResult = {
        value: '<p>Document with images</p>',
        messages: []
      };

      vi.mocked(mammoth.extractRawText).mockResolvedValue(mockTextResult);
      vi.mocked(mammoth.convertToHtml).mockResolvedValue(mockHtmlResult);

      const mockFile = new File(['docx content'], 'with-images.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      const result = await DOCXParser.parseWithStructure(mockFile, { extractImages: true });

      expect(result.structuredContent.images).toEqual([]);
    });
  });

  describe('private methods', () => {
    describe('countWords', () => {
      it('should count words correctly', () => {
        // Access private method through class for testing
        const countWords = (DOCXParser as unknown as { countWords: (text: string) => number }).countWords;
        
        expect(countWords('Hello world')).toBe(2);
        expect(countWords('  Multiple   spaces   between   words  ')).toBe(4);
        expect(countWords('')).toBe(0);
        expect(countWords('   ')).toBe(0);
        expect(countWords('Single')).toBe(1);
      });

      it('should handle non-string input', () => {
        const countWords = (DOCXParser as unknown as { countWords: (text: unknown) => number }).countWords;
        
        expect(countWords(null)).toBe(0);
        expect(countWords(undefined)).toBe(0);
        expect(countWords(123)).toBe(0);
      });
    });

    describe('countParagraphs', () => {
      it('should count paragraphs correctly', () => {
        const countParagraphs = (DOCXParser as unknown as { countParagraphs: (text: string) => number }).countParagraphs;
        
        expect(countParagraphs('Single paragraph')).toBe(1);
        expect(countParagraphs('First paragraph\n\nSecond paragraph')).toBe(2);
        expect(countParagraphs('Para 1\n\nPara 2\n\nPara 3')).toBe(3);
        expect(countParagraphs('')).toBe(0);
        expect(countParagraphs('   \n\n   ')).toBe(0);
      });

      it('should handle non-string input', () => {
        const countParagraphs = (DOCXParser as unknown as { countParagraphs: (text: unknown) => number }).countParagraphs;
        
        expect(countParagraphs(null)).toBe(0);
        expect(countParagraphs(undefined)).toBe(0);
        expect(countParagraphs(123)).toBe(0);
      });
    });
  });
});