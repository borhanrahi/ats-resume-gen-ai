import { describe, it, expect } from 'vitest';
import { DOCXParser } from '../docxParser';

describe('DOCXParser Utility Functions', () => {
  describe('formatFileSize', () => {
    it('should format zero bytes', () => {
      expect(DOCXParser.formatFileSize(0)).toBe('0 Bytes');
    });

    it('should format bytes correctly', () => {
      expect(DOCXParser.formatFileSize(500)).toBe('500 Bytes');
      expect(DOCXParser.formatFileSize(1023)).toBe('1023 Bytes');
    });

    it('should format kilobytes correctly', () => {
      expect(DOCXParser.formatFileSize(1024)).toBe('1 KB');
      expect(DOCXParser.formatFileSize(1536)).toBe('1.5 KB');
      expect(DOCXParser.formatFileSize(2048)).toBe('2 KB');
      expect(DOCXParser.formatFileSize(1048575)).toBe('1024 KB');
    });

    it('should format megabytes correctly', () => {
      expect(DOCXParser.formatFileSize(1048576)).toBe('1 MB');
      expect(DOCXParser.formatFileSize(1572864)).toBe('1.5 MB');
      expect(DOCXParser.formatFileSize(5242880)).toBe('5 MB');
      expect(DOCXParser.formatFileSize(1073741823)).toBe('1024 MB');
    });

    it('should format gigabytes correctly', () => {
      expect(DOCXParser.formatFileSize(1073741824)).toBe('1 GB');
      expect(DOCXParser.formatFileSize(1610612736)).toBe('1.5 GB');
      expect(DOCXParser.formatFileSize(5368709120)).toBe('5 GB');
    });

    it('should handle large numbers', () => {
      expect(DOCXParser.formatFileSize(1099511627776)).toBe('1 TB');
    });

    it('should handle decimal precision correctly', () => {
      expect(DOCXParser.formatFileSize(1234567)).toBe('1.18 MB');
      expect(DOCXParser.formatFileSize(9876543210)).toBe('9.2 GB');
    });
  });

  describe('isValidDOCXFile', () => {
    it('should validate DOCX files with correct MIME type', () => {
      const validFile = new File(['content'], 'document.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      expect(DOCXParser.isValidDOCXFile(validFile)).toBe(true);
    });

    it('should validate DOCX files with .docx extension regardless of MIME type', () => {
      const fileWithGenericType = new File(['content'], 'document.docx', {
        type: 'application/octet-stream'
      });
      expect(DOCXParser.isValidDOCXFile(fileWithGenericType)).toBe(true);

      const fileWithNoType = new File(['content'], 'document.docx', {
        type: ''
      });
      expect(DOCXParser.isValidDOCXFile(fileWithNoType)).toBe(true);
    });

    it('should handle case-insensitive file extensions', () => {
      const upperCaseFile = new File(['content'], 'DOCUMENT.DOCX', {
        type: 'application/octet-stream'
      });
      expect(DOCXParser.isValidDOCXFile(upperCaseFile)).toBe(true);

      const mixedCaseFile = new File(['content'], 'Document.DocX', {
        type: 'application/octet-stream'
      });
      expect(DOCXParser.isValidDOCXFile(mixedCaseFile)).toBe(true);
    });

    it('should reject non-DOCX files', () => {
      const pdfFile = new File(['content'], 'document.pdf', {
        type: 'application/pdf'
      });
      expect(DOCXParser.isValidDOCXFile(pdfFile)).toBe(false);

      const textFile = new File(['content'], 'document.txt', {
        type: 'text/plain'
      });
      expect(DOCXParser.isValidDOCXFile(textFile)).toBe(false);

      const docFile = new File(['content'], 'document.doc', {
        type: 'application/msword'
      });
      expect(DOCXParser.isValidDOCXFile(docFile)).toBe(false);

      const xlsxFile = new File(['content'], 'spreadsheet.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      expect(DOCXParser.isValidDOCXFile(xlsxFile)).toBe(false);
    });

    it('should handle null and undefined inputs', () => {
      expect(DOCXParser.isValidDOCXFile(null as unknown as File)).toBe(false);
      expect(DOCXParser.isValidDOCXFile(undefined as unknown as File)).toBe(false);
    });

    it('should handle files without extensions', () => {
      const noExtensionFile = new File(['content'], 'document', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      expect(DOCXParser.isValidDOCXFile(noExtensionFile)).toBe(true);

      const noExtensionGenericFile = new File(['content'], 'document', {
        type: 'application/octet-stream'
      });
      expect(DOCXParser.isValidDOCXFile(noExtensionGenericFile)).toBe(false);
    });

    it('should handle files with multiple extensions', () => {
      const multipleExtFile = new File(['content'], 'document.backup.docx', {
        type: 'application/octet-stream'
      });
      expect(DOCXParser.isValidDOCXFile(multipleExtFile)).toBe(true);

      const wrongLastExtFile = new File(['content'], 'document.docx.txt', {
        type: 'application/octet-stream'
      });
      expect(DOCXParser.isValidDOCXFile(wrongLastExtFile)).toBe(false);
    });
  });

  describe('Word counting functionality', () => {
    // Note: These tests access private methods through type assertion for testing purposes
    const countWords = (DOCXParser as unknown as { countWords: (text: string) => number }).countWords;

    it('should count words in simple text', () => {
      expect(countWords('Hello world')).toBe(2);
      expect(countWords('Single')).toBe(1);
      expect(countWords('One two three four five')).toBe(5);
    });

    it('should handle multiple spaces between words', () => {
      expect(countWords('Word1    Word2     Word3')).toBe(3);
      expect(countWords('  Leading   and   trailing  ')).toBe(3);
    });

    it('should handle different types of whitespace', () => {
      expect(countWords('Word1\tWord2\nWord3\rWord4')).toBe(4);
      expect(countWords('Mixed\t\n  \r whitespace   \t\n')).toBe(2);
    });

    it('should handle empty and whitespace-only strings', () => {
      expect(countWords('')).toBe(0);
      expect(countWords('   ')).toBe(0);
      expect(countWords('\t\n\r')).toBe(0);
      expect(countWords('   \t\n\r   ')).toBe(0);
    });

    it('should handle special characters and punctuation', () => {
      expect(countWords('Hello, world!')).toBe(2);
      expect(countWords('user@email.com')).toBe(1);
      expect(countWords('$100 USD')).toBe(2);
      expect(countWords('C++ JavaScript Python')).toBe(3);
    });

    it('should handle non-string inputs gracefully', () => {
      expect(countWords(null as unknown as string)).toBe(0);
      expect(countWords(undefined as unknown as string)).toBe(0);
      expect(countWords(123 as unknown as string)).toBe(0);
      expect(countWords({} as unknown as string)).toBe(0);
      expect(countWords([] as unknown as string)).toBe(0);
    });
  });

  describe('Paragraph counting functionality', () => {
    const countParagraphs = (DOCXParser as unknown as { countParagraphs: (text: string) => number }).countParagraphs;

    it('should count paragraphs in simple text', () => {
      expect(countParagraphs('Single paragraph')).toBe(1);
      expect(countParagraphs('First paragraph\n\nSecond paragraph')).toBe(2);
      expect(countParagraphs('Para 1\n\nPara 2\n\nPara 3')).toBe(3);
    });

    it('should handle different paragraph separators', () => {
      expect(countParagraphs('Para 1\n\n\nPara 2')).toBe(2);
      expect(countParagraphs('Para 1\n  \n  \nPara 2')).toBe(2);
      expect(countParagraphs('Para 1\r\n\r\nPara 2')).toBe(2);
    });

    it('should ignore single line breaks', () => {
      expect(countParagraphs('Line 1\nLine 2\nLine 3')).toBe(1);
      expect(countParagraphs('Sentence 1.\nSentence 2.')).toBe(1);
    });

    it('should handle empty and whitespace-only strings', () => {
      expect(countParagraphs('')).toBe(0);
      expect(countParagraphs('   ')).toBe(0);
      expect(countParagraphs('\n\n\n')).toBe(0);
      expect(countParagraphs('  \n\n  \n\n  ')).toBe(0);
    });

    it('should handle paragraphs with leading/trailing whitespace', () => {
      expect(countParagraphs('  Para 1  \n\n  Para 2  ')).toBe(2);
      expect(countParagraphs('\n\nPara 1\n\nPara 2\n\n')).toBe(2);
    });

    it('should handle complex paragraph structures', () => {
      const complexText = `Introduction paragraph.

Main content paragraph with multiple sentences. This is still the same paragraph.

Another paragraph here.


Final paragraph after multiple line breaks.`;
      
      expect(countParagraphs(complexText)).toBe(4);
    });

    it('should handle non-string inputs gracefully', () => {
      expect(countParagraphs(null as unknown as string)).toBe(0);
      expect(countParagraphs(undefined as unknown as string)).toBe(0);
      expect(countParagraphs(123 as unknown as string)).toBe(0);
      expect(countParagraphs({} as unknown as string)).toBe(0);
      expect(countParagraphs([] as unknown as string)).toBe(0);
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle very long file names', () => {
      const longFileName = 'a'.repeat(255) + '.docx';
      const file = new File(['content'], longFileName, {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      expect(DOCXParser.isValidDOCXFile(file)).toBe(true);
    });

    it('should handle files with unicode characters in names', () => {
      const unicodeFile = new File(['content'], 'résumé-文档.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      expect(DOCXParser.isValidDOCXFile(unicodeFile)).toBe(true);
    });

    it('should handle very large file sizes in formatting', () => {
      const terabyte = 1024 * 1024 * 1024 * 1024;
      expect(DOCXParser.formatFileSize(terabyte)).toBe('1 TB');
      
      const petabyte = terabyte * 1024;
      expect(DOCXParser.formatFileSize(petabyte)).toBe('1024 TB');
    });

    it('should handle negative file sizes gracefully', () => {
      expect(DOCXParser.formatFileSize(-1)).toBe('0 Bytes');
      expect(DOCXParser.formatFileSize(-1024)).toBe('0 Bytes');
    });
  });
});