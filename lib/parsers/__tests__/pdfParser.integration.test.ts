import { describe, it, expect } from 'vitest';
import { PDFParser, PDFParseException } from '../pdfParser';

describe('PDFParser Integration Tests', () => {
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
      const countWords = (PDFParser as any).countWords;
      
      expect(countWords(null)).toBe(0);
      expect(countWords(undefined)).toBe(0);
      expect(countWords(123)).toBe(0);
    });
  });

  describe('parse error handling', () => {
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

    it('should throw PDFParseException for null input', async () => {
      await expect(PDFParser.parse(null as any)).rejects.toThrow(PDFParseException);
      await expect(PDFParser.parse(null as any)).rejects.toThrow('No file provided for parsing');
    });
  });

  describe('PDFParseException', () => {
    it('should create exception with proper error details', () => {
      const error = {
        code: 'INVALID_PDF' as const,
        message: 'Test error',
        details: 'Additional details'
      };

      const exception = new PDFParseException(error);

      expect(exception.name).toBe('PDFParseException');
      expect(exception.message).toBe('Test error');
      expect(exception.error.code).toBe('INVALID_PDF');
      expect(exception.error.details).toBe('Additional details');
    });
  });
});