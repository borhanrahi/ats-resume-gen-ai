import * as mammoth from 'mammoth';

export interface DOCXParseResult {
  content: string;
  metadata: {
    fileName: string;
    fileType: 'docx';
    uploadDate: Date;
    wordCount: number;
    characterCount: number;
    paragraphCount: number;
  };
  formattedContent: {
    html: string;
    plainText: string;
  };
  warnings: string[];
}

export interface DOCXParseError {
  code: 'INVALID_DOCX' | 'CORRUPTED_FILE' | 'EMPTY_FILE' | 'PARSE_ERROR' | 'UNSUPPORTED_FORMAT';
  message: string;
  details?: unknown;
}

export class DOCXParseException extends Error {
  constructor(public error: DOCXParseError) {
    super(error.message);
    this.name = 'DOCXParseException';
  }
}

/**
 * DOCX Parser class for extracting text content and metadata from DOCX files
 * Implements client-side parsing for privacy and security with formatting preservation
 */
export class DOCXParser {
  /**
   * Parse a DOCX file and extract text content with metadata and formatting
   * @param file - File object or ArrayBuffer containing DOCX data
   * @param fileName - Optional filename for metadata
   * @returns Promise<DOCXParseResult> - Parsed content and metadata
   * @throws DOCXParseException - When parsing fails
   */
  static async parse(
    file: File | ArrayBuffer,
    fileName?: string
  ): Promise<DOCXParseResult> {
    try {
      // Validate input
      if (!file) {
        throw new DOCXParseException({
          code: 'EMPTY_FILE',
          message: 'No file provided for parsing'
        });
      }

      // Convert File to ArrayBuffer if needed
      let arrayBuffer: ArrayBuffer;
      let actualFileName: string;

      if (file instanceof File) {
        if (file.size === 0) {
          throw new DOCXParseException({
            code: 'EMPTY_FILE',
            message: 'The uploaded file is empty'
          });
        }

        if (!this.isValidDOCXFile(file)) {
          throw new DOCXParseException({
            code: 'UNSUPPORTED_FORMAT',
            message: 'File must be a DOCX document'
          });
        }

        arrayBuffer = await file.arrayBuffer();
        actualFileName = file.name;
      } else {
        arrayBuffer = file;
        actualFileName = fileName || 'document.docx';
      }

      // Parse DOCX using mammoth
      let result: mammoth.Result<string>;
      let htmlResult: mammoth.Result<string>;

      try {
        // Extract plain text
        result = await mammoth.extractRawText({ arrayBuffer });
        
        // Extract HTML with formatting
        htmlResult = await mammoth.convertToHtml({ arrayBuffer });
      } catch (error: unknown) {
        throw new DOCXParseException({
          code: 'INVALID_DOCX',
          message: 'Invalid or corrupted DOCX file',
          details: error instanceof Error ? error.message : String(error)
        });
      }

      // Get the extracted content
      const plainText = result.value.trim();
      const htmlContent = htmlResult.value;
      const warnings = [...result.messages, ...htmlResult.messages].map(msg => msg.message);

      if (!plainText || plainText.length === 0) {
        throw new DOCXParseException({
          code: 'EMPTY_FILE',
          message: 'DOCX document contains no readable text content'
        });
      }

      // Calculate metrics
      const wordCount = this.countWords(plainText);
      const characterCount = plainText.length;
      const paragraphCount = this.countParagraphs(plainText);

      // Build result
      const parseResult: DOCXParseResult = {
        content: plainText,
        metadata: {
          fileName: actualFileName,
          fileType: 'docx',
          uploadDate: new Date(),
          wordCount,
          characterCount,
          paragraphCount
        },
        formattedContent: {
          html: htmlContent,
          plainText
        },
        warnings
      };

      return parseResult;

    } catch (error) {
      if (error instanceof DOCXParseException) {
        throw error;
      }

      // Handle unexpected errors
      throw new DOCXParseException({
        code: 'PARSE_ERROR',
        message: 'An unexpected error occurred while parsing the DOCX file',
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
   * Count paragraphs in a text string
   * @param text - Text to count paragraphs in
   * @returns number of paragraphs
   */
  private static countParagraphs(text: string): number {
    if (!text || typeof text !== 'string') {
      return 0;
    }

    return text
      .trim()
      .split(/\n\s*\n/)
      .filter(paragraph => paragraph.trim().length > 0).length;
  }

  /**
   * Validate if a file is a valid DOCX
   * @param file - File to validate
   * @returns boolean indicating if file is a valid DOCX
   */
  static isValidDOCXFile(file: File): boolean {
    if (!file) return false;
    
    // Check file type
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return true;
    }
    
    // Check file extension as fallback
    if (file.name.toLowerCase().endsWith('.docx')) {
      return true;
    }
    
    return false;
  }

  /**
   * Get file size in a human-readable format
   * @param bytes - File size in bytes
   * @returns Formatted file size string
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0 || bytes < 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const sizeIndex = Math.min(i, sizes.length - 1);
    
    return parseFloat((bytes / Math.pow(k, sizeIndex)).toFixed(2)) + ' ' + sizes[sizeIndex];
  }

  /**
   * Extract structured content from DOCX with formatting preservation
   * @param file - File object or ArrayBuffer containing DOCX data
   * @param options - Parsing options for formatting preservation
   * @returns Promise with structured content including headings, lists, etc.
   */
  static async parseWithStructure(
    file: File | ArrayBuffer,
    options: {
      preserveFormatting?: boolean;
      extractImages?: boolean;
    } = {}
  ): Promise<DOCXParseResult & { structuredContent: unknown }> {
    const baseResult = await this.parse(file);
    
    // For now, return the base result with empty structured content
    // This can be extended in the future to extract headings, lists, tables, etc.
    return {
      ...baseResult,
      structuredContent: {
        headings: [],
        lists: [],
        tables: [],
        images: options.extractImages ? [] : undefined
      }
    };
  }
}

// Export default instance for convenience
export const docxParser = DOCXParser;