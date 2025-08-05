import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export interface PDFParseResult {
  content: string;
  metadata: {
    fileName: string;
    fileType: 'pdf';
    uploadDate: Date;
    wordCount: number;
    pageCount: number;
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };
  pages: {
    pageNumber: number;
    content: string;
    wordCount: number;
  }[];
}

export interface PDFParseError {
  code: 'INVALID_PDF' | 'CORRUPTED_FILE' | 'EMPTY_FILE' | 'PARSE_ERROR' | 'UNSUPPORTED_FORMAT';
  message: string;
  details?: any;
}

export class PDFParseException extends Error {
  constructor(public error: PDFParseError) {
    super(error.message);
    this.name = 'PDFParseException';
  }
}

/**
 * PDF Parser class for extracting text content and metadata from PDF files
 * Implements client-side parsing for privacy and security
 */
export class PDFParser {
  /**
   * Parse a PDF file and extract text content with metadata
   * @param file - File object or ArrayBuffer containing PDF data
   * @param fileName - Optional filename for metadata
   * @returns Promise<PDFParseResult> - Parsed content and metadata
   * @throws PDFParseException - When parsing fails
   */
  static async parse(
    file: File | ArrayBuffer, 
    fileName?: string
  ): Promise<PDFParseResult> {
    try {
      // Validate input
      if (!file) {
        throw new PDFParseException({
          code: 'EMPTY_FILE',
          message: 'No file provided for parsing'
        });
      }

      // Convert File to ArrayBuffer if needed
      let arrayBuffer: ArrayBuffer;
      let actualFileName: string;

      if (file instanceof File) {
        if (file.size === 0) {
          throw new PDFParseException({
            code: 'EMPTY_FILE',
            message: 'The uploaded file is empty'
          });
        }

        if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
          throw new PDFParseException({
            code: 'UNSUPPORTED_FORMAT',
            message: 'File must be a PDF document'
          });
        }

        arrayBuffer = await file.arrayBuffer();
        actualFileName = file.name;
      } else {
        arrayBuffer = file;
        actualFileName = fileName || 'document.pdf';
      }

      // Load PDF document
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        verbosity: 0 // Suppress console warnings
      });

      let pdfDocument: PDFDocumentProxy;
      
      try {
        pdfDocument = await loadingTask.promise;
      } catch (error: any) {
        throw new PDFParseException({
          code: 'INVALID_PDF',
          message: 'Invalid or corrupted PDF file',
          details: error.message
        });
      }

      // Extract metadata
      const metadata = await pdfDocument.getMetadata();
      const pageCount = pdfDocument.numPages;

      if (pageCount === 0) {
        throw new PDFParseException({
          code: 'EMPTY_FILE',
          message: 'PDF document contains no pages'
        });
      }

      // Extract text from all pages
      const pages: PDFParseResult['pages'] = [];
      let fullContent = '';

      for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        try {
          const page: PDFPageProxy = await pdfDocument.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Combine text items with proper spacing
          const pageText = textContent.items
            .map((item: any) => {
              if ('str' in item) {
                return item.str;
              }
              return '';
            })
            .join(' ')
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();

          const pageWordCount = this.countWords(pageText);

          pages.push({
            pageNumber: pageNum,
            content: pageText,
            wordCount: pageWordCount
          });

          fullContent += pageText + '\n';
        } catch (error: any) {
          console.warn(`Failed to extract text from page ${pageNum}:`, error);
          // Continue with other pages even if one fails
          pages.push({
            pageNumber: pageNum,
            content: '',
            wordCount: 0
          });
        }
      }

      // Clean up full content
      fullContent = fullContent.trim();
      const totalWordCount = this.countWords(fullContent);

      if (totalWordCount === 0) {
        throw new PDFParseException({
          code: 'EMPTY_FILE',
          message: 'PDF document contains no readable text content'
        });
      }

      // Build result with proper type handling for metadata
      const info = metadata.info as unknown; // PDF.js metadata info can have various properties
      const result: PDFParseResult = {
        content: fullContent,
        metadata: {
          fileName: actualFileName,
          fileType: 'pdf',
          uploadDate: new Date(),
          wordCount: totalWordCount,
          pageCount,
          title: info?.Title || undefined,
          author: info?.Author || undefined,
          subject: info?.Subject || undefined,
          creator: info?.Creator || undefined,
          producer: info?.Producer || undefined,
          creationDate: info?.CreationDate ? new Date(info.CreationDate) : undefined,
          modificationDate: info?.ModDate ? new Date(info.ModDate) : undefined,
        },
        pages
      };

      return result;

    } catch (error) {
      if (error instanceof PDFParseException) {
        throw error;
      }

      // Handle unexpected errors
      throw new PDFParseException({
        code: 'PARSE_ERROR',
        message: 'An unexpected error occurred while parsing the PDF',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Count words in a text string
   * @param text - Text to count words in
   * @returns number of words
   */
  private static countWords(text: string): number {
    if (!text || typeof text !== 'string') {
      return 0;
    }

    return text
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length;
  }

  /**
   * Validate if a file is a valid PDF
   * @param file - File to validate
   * @returns boolean indicating if file is a valid PDF
   */
  static isValidPDFFile(file: File): boolean {
    if (!file) return false;
    
    // Check file type
    if (file.type === 'application/pdf') return true;
    
    // Check file extension as fallback
    if (file.name.toLowerCase().endsWith('.pdf')) return true;
    
    return false;
  }

  /**
   * Get file size in a human-readable format
   * @param bytes - File size in bytes
   * @returns Formatted file size string
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Export default instance for convenience
export const pdfParser = PDFParser;