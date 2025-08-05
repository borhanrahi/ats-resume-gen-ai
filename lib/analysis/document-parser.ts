import { ParsedDocument, DocumentStructure, ContactInfo, DocumentFormatting, DetectedSection } from './ats-scoring-engine';

export class DocumentParser {
  
  async parseDocument(file: File): Promise<ParsedDocument> {
    const fileType = this.getFileType(file);
    let text = '';
    let extractionRate = 0;
    
    try {
      if (fileType === 'pdf') {
        text = await this.parsePDF(file);
      } else if (fileType === 'docx') {
        text = await this.parseDOCX(file);
      } else {
        throw new Error('Unsupported file type');
      }
      
      // Calculate extraction rate (simplified - in production, compare with file size/complexity)
      extractionRate = text.length > 100 ? 0.95 : 0.5;
      
    } catch (error) {
      console.error('Document parsing failed:', error);
      extractionRate = 0.1;
    }

    const structure = this.analyzeStructure(text);
    const formatting = this.analyzeFormatting(text, fileType);
    const hasHiddenText = this.detectHiddenText(text);
    const encoding = this.analyzeEncoding(text);

    return {
      text,
      fileType,
      extractionRate,
      hasHiddenText,
      encoding,
      structure,
      formatting
    };
  }

  private getFileType(file: File): string {
    const extension = file.name.toLowerCase().split('.').pop();
    if (extension === 'pdf') return 'pdf';
    if (extension === 'docx') return 'docx';
    if (extension === 'doc') return 'doc';
    return 'unknown';
  }

  private async parsePDF(file: File): Promise<string> {
    try {
      // Import pdfjs-dist dynamically to avoid SSR issues
      const pdfjs = await import('pdfjs-dist');
      
      // Set worker source for PDF.js
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      
      // Extract text from all pages
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }
      
      const extractedText = fullText.trim();
      console.log('PDF Parsing Debug:', {
        fileName: file.name,
        textLength: extractedText.length,
        firstChars: extractedText.substring(0, 200),
        hasEmail: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(extractedText),
        hasPhone: /(\+?1[-.\ s]?)?\(?[0-9]{3}\)?[-.\ s]?[0-9]{3}[-.\ s]?[0-9]{4}/.test(extractedText)
      });
      return extractedText;
    } catch (error) {
      console.error('PDF parsing failed:', error);
      // Fallback: try to extract some basic info from filename
      const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      return `Resume document: ${fileName}\nUnable to extract text content from PDF. Please ensure the PDF contains selectable text.`;
    }
  }

  private async parseDOCX(file: File): Promise<string> {
    try {
      // Import mammoth dynamically
      const mammoth = await import('mammoth');
      
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      if (result.value && result.value.trim().length > 0) {
        const extractedText = result.value.trim();
        console.log('DOCX Parsing Debug:', {
          fileName: file.name,
          textLength: extractedText.length,
          firstChars: extractedText.substring(0, 200),
          hasEmail: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(extractedText),
          hasPhone: /(\+?1[-.\ s]?)?\(?[0-9]{3}\)?[-.\ s]?[0-9]{3}[-.\ s]?[0-9]{4}/.test(extractedText)
        });
        return extractedText;
      } else {
        throw new Error('No text content found in DOCX file');
      }
    } catch (error) {
      console.error('DOCX parsing failed:', error);
      // Fallback: try to extract some basic info from filename
      const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      return `Resume document: ${fileName}\nUnable to extract text content from DOCX. Please ensure the document contains readable text.`;
    }
  }

  private analyzeStructure(text: string): DocumentStructure {
    const sections = this.detectSections(text);
    const contactInfo = this.extractContactInfo(text);
    const hasProperHeadings = sections.length >= 3;

    return {
      sections,
      contactInfo,
      hasProperHeadings
    };
  }

  private detectSections(text: string): DetectedSection[] {
    const sections: DetectedSection[] = [];
    
    // Common section headers (case-insensitive)
    const sectionPatterns = [
      { name: 'Summary', patterns: ['summary', 'profile', 'objective', 'about'] },
      { name: 'Experience', patterns: ['experience', 'employment', 'work history', 'professional experience'] },
      { name: 'Education', patterns: ['education', 'academic', 'qualifications'] },
      { name: 'Skills', patterns: ['skills', 'technical skills', 'competencies', 'expertise'] },
      { name: 'Projects', patterns: ['projects', 'portfolio'] },
      { name: 'Certifications', patterns: ['certifications', 'certificates', 'licenses'] }
    ];

    const lines = text.split('\n');
    
    sectionPatterns.forEach(section => {
      section.patterns.forEach(pattern => {
        const regex = new RegExp(`^\\s*${pattern}\\s*:?\\s*$`, 'i');
        lines.forEach((line, index) => {
          if (regex.test(line.trim())) {
            // Find content until next section or end
            let endIndex = lines.length;
            for (let i = index + 1; i < lines.length; i++) {
              const nextLine = lines[i].trim();
              if (sectionPatterns.some(s => 
                s.patterns.some(p => new RegExp(`^\\s*${p}\\s*:?\\s*$`, 'i').test(nextLine))
              )) {
                endIndex = i;
                break;
              }
            }
            
            const content = lines.slice(index + 1, endIndex).join('\n').trim();
            if (content.length > 10) { // Only add if has substantial content
              sections.push({
                name: section.name,
                content,
                startIndex: index,
                endIndex
              });
            }
          }
        });
      });
    });

    return sections;
  }

  private extractContactInfo(text: string): ContactInfo {
    const lines = text.split('\n').slice(0, 10); // Check first 10 lines
    const topText = lines.join(' ');
    
    // Extract email
    const emailMatch = topText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0] : undefined;
    
    // Extract phone
    const phoneMatch = topText.match(/(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
    const phone = phoneMatch ? phoneMatch[0] : undefined;
    
    // Extract name (assume first non-empty line is name)
    const name = lines.find(line => line.trim().length > 2)?.trim();
    
    // Determine position
    let position: 'top' | 'middle' | 'bottom' | 'missing' = 'missing';
    if (email || phone || name) {
      position = 'top'; // Since we're checking first 10 lines
    }

    return { name, email, phone, position };
  }

  private analyzeFormatting(text: string, fileType: string): DocumentFormatting {
    // Simplified formatting analysis
    // In production, this would analyze actual document formatting
    
    const layout = this.detectLayout(text);
    const hasGraphics = this.detectGraphics(text);
    const hasTables = this.detectTables(text);
    const fontConsistency = this.analyzeFontConsistency(text);
    const spacing = this.analyzeSpacing(text);

    return {
      layout,
      hasGraphics,
      hasTables,
      fontConsistency,
      spacing
    };
  }

  private detectLayout(text: string): 'single-column' | 'multi-column' | 'mixed' {
    // Simplified layout detection
    // Look for indicators of multi-column layout
    const lines = text.split('\n');
    const shortLines = lines.filter(line => line.trim().length > 0 && line.trim().length < 40).length;
    const totalLines = lines.filter(line => line.trim().length > 0).length;
    
    if (shortLines / totalLines > 0.6) {
      return 'multi-column';
    }
    
    return 'single-column';
  }

  private detectGraphics(text: string): boolean {
    // Look for indicators of graphics in text
    const graphicsIndicators = ['[image]', '[graphic]', '[logo]', '[photo]'];
    return graphicsIndicators.some(indicator => 
      text.toLowerCase().includes(indicator)
    );
  }

  private detectTables(text: string): boolean {
    // Look for table-like structures
    const lines = text.split('\n');
    const tableLines = lines.filter(line => {
      const tabCount = (line.match(/\t/g) || []).length;
      const pipeCount = (line.match(/\|/g) || []).length;
      return tabCount > 2 || pipeCount > 2;
    });
    
    return tableLines.length > 2;
  }

  private analyzeFontConsistency(text: string): 'good' | 'minor-issues' | 'major-issues' {
    // Simplified font analysis
    // In production, would analyze actual font metadata
    return 'good';
  }

  private analyzeSpacing(text: string): 'good' | 'acceptable' | 'poor' {
    // Analyze line spacing and paragraph breaks
    const lines = text.split('\n');
    const emptyLines = lines.filter(line => line.trim() === '').length;
    const totalLines = lines.length;
    
    const emptyLineRatio = emptyLines / totalLines;
    
    if (emptyLineRatio > 0.1 && emptyLineRatio < 0.3) {
      return 'good';
    } else if (emptyLineRatio >= 0.05) {
      return 'acceptable';
    }
    
    return 'poor';
  }

  private detectHiddenText(text: string): boolean {
    // Look for indicators of hidden text
    // This is simplified - in production would analyze document structure
    const hiddenIndicators = ['header:', 'footer:', 'watermark:'];
    return hiddenIndicators.some(indicator => 
      text.toLowerCase().includes(indicator)
    );
  }

  private analyzeEncoding(text: string): string {
    // Check for special characters that might cause encoding issues
    const specialChars = text.match(/[^\x00-\x7F]/g);
    
    if (!specialChars || specialChars.length === 0) {
      return 'standard';
    } else if (specialChars.length < 10) {
      return 'minor-issues';
    }
    
    return 'complex';
  }

  // Method to parse job description
  async parseJobDescription(text: string): Promise<{
    keywords: string[];
    requirements: string[];
    skills: string[];
    title: string;
  }> {
    // Extract key information from job description
    const keywords = this.extractJobKeywords(text);
    const requirements = this.extractRequirements(text);
    const skills = this.extractSkills(text);
    const title = this.extractJobTitle(text);

    return { keywords, requirements, skills, title };
  }

  private extractJobKeywords(text: string): string[] {
    // Simplified keyword extraction
    // In production, use NLP libraries for better extraction
    const commonKeywords = [
      'javascript', 'python', 'java', 'react', 'node.js', 'sql', 'aws',
      'project management', 'agile', 'scrum', 'leadership', 'communication',
      'problem solving', 'teamwork', 'analytical', 'strategic'
    ];

    return commonKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private extractRequirements(text: string): string[] {
    // Extract requirements from job description
    const requirementSections = text.match(/requirements?:?\s*([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i);
    if (requirementSections) {
      return requirementSections[1]
        .split(/[•\-\*\n]/)
        .map(req => req.trim())
        .filter(req => req.length > 10);
    }
    return [];
  }

  private extractSkills(text: string): string[] {
    // Extract skills from job description
    const skillSections = text.match(/skills?:?\s*([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i);
    if (skillSections) {
      return skillSections[1]
        .split(/[,•\-\*\n]/)
        .map(skill => skill.trim())
        .filter(skill => skill.length > 2 && skill.length < 30);
    }
    return [];
  }

  private extractJobTitle(text: string): string {
    // Extract job title (usually in first few lines)
    const lines = text.split('\n').slice(0, 5);
    const titleLine = lines.find(line => 
      line.trim().length > 5 && 
      line.trim().length < 100 &&
      !line.includes('@') &&
      !line.includes('http')
    );
    
    return titleLine?.trim() || 'Job Title Not Found';
  }
}
