// Dynamic imports for browser-only libraries
let html2pdf: any;
let docx: any;
import { ResumeBlock } from '@/types/editor';
import { ResumeData } from '@/types/resume';

export interface ExportOptions {
  format: 'pdf' | 'docx';
  quality: 'low' | 'medium' | 'high';
  paperSize: 'a4' | 'letter';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  filename?: string;
}

export interface PDFExportOptions extends Omit<ExportOptions, 'format'> {
  format: 'pdf';
  enableLinks: boolean;
  imageQuality: number; // 0.1 to 1.0
  jsPDF: {
    unit: 'mm' | 'pt' | 'in';
    format: string | number[];
    orientation: 'portrait' | 'landscape';
  };
  html2canvas: {
    scale: number;
    useCORS: boolean;
    letterRendering: boolean;
  };
}

export interface DOCXExportOptions extends Omit<ExportOptions, 'format'> {
  format: 'docx';
  includePageNumbers: boolean;
  headerText?: string;
  footerText?: string;
  fontFamily: string;
  fontSize: number;
  lineSpacing: number;
  styles: {
    heading1: {
      size: number;
      bold: boolean;
      color: string;
    };
    heading2: {
      size: number;
      bold: boolean;
      color: string;
    };
    body: {
      size: number;
      color: string;
    };
  };
}

export interface ExportResult {
  success: boolean;
  filename: string;
  blob?: Blob;
  error?: string;
}

/**
 * PDF Export System
 * Implements PDF generation from resume editor using html2pdf.js
 */
export class PDFExporter {
  private static readonly DEFAULT_OPTIONS: PDFExportOptions = {
    format: 'pdf',
    quality: 'high',
    paperSize: 'a4',
    orientation: 'portrait',
    margins: {
      top: 15,
      right: 15,
      bottom: 15,
      left: 15
    },
    enableLinks: true,
    imageQuality: 0.95,
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true
    }
  };

  /**
   * Export resume blocks to PDF
   */
  static async exportToPDF(
    blocks: ResumeBlock[],
    options: Partial<PDFExportOptions> = {}
  ): Promise<ExportResult> {
    try {
      // Dynamic import for browser-only library
      if (!html2pdf) {
        html2pdf = (await import('html2pdf.js')).default;
      }

      const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
      const htmlContent = this.generateHTMLContent(blocks, mergedOptions);
      const filename = this.generateFilename(blocks, 'pdf', mergedOptions.filename);

      // Configure html2pdf options
      const pdfOptions = {
        margin: [
          mergedOptions.margins.top,
          mergedOptions.margins.right,
          mergedOptions.margins.bottom,
          mergedOptions.margins.left
        ],
        filename,
        image: { 
          type: 'jpeg', 
          quality: mergedOptions.imageQuality 
        },
        html2canvas: {
          scale: mergedOptions.html2canvas.scale,
          useCORS: mergedOptions.html2canvas.useCORS,
          letterRendering: mergedOptions.html2canvas.letterRendering,
          width: mergedOptions.paperSize === 'a4' ? 794 : 816, // A4: 794px, Letter: 816px
          height: mergedOptions.paperSize === 'a4' ? 1123 : 1056 // A4: 1123px, Letter: 1056px
        },
        jsPDF: {
          unit: mergedOptions.jsPDF.unit,
          format: mergedOptions.paperSize,
          orientation: mergedOptions.jsPDF.orientation
        },
        pagebreak: { 
          mode: ['avoid-all', 'css', 'legacy'],
          before: '.page-break-before',
          after: '.page-break-after',
          avoid: '.page-break-avoid'
        }
      };

      // Generate PDF
      const pdf = await html2pdf()
        .set(pdfOptions)
        .from(htmlContent)
        .toPdf()
        .get('pdf');

      // Create blob and trigger download
      const blob = pdf.output('blob');
      this.downloadBlob(blob, filename);

      return {
        success: true,
        filename,
        blob
      };

    } catch (error) {
      console.error('PDF export failed:', error);
      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Export resume data to PDF (alternative method)
   */
  static async exportResumeDataToPDF(
    resumeData: ResumeData,
    options: Partial<PDFExportOptions> = {}
  ): Promise<ExportResult> {
    const blocks = this.convertResumeDataToBlocks(resumeData);
    return this.exportToPDF(blocks, options);
  }

  /**
   * Generate HTML content from resume blocks
   */
  private static generateHTMLContent(
    blocks: ResumeBlock[],
    options: PDFExportOptions
  ): string {
    const visibleBlocks = blocks.filter(block => block.isVisible);
    const sortedBlocks = visibleBlocks.sort((a, b) => a.order - b.order);

    const styles = this.generatePDFStyles(options);
    const content = sortedBlocks.map(block => this.renderBlockToHTML(block)).join('');

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Resume</title>
        <style>${styles}</style>
      </head>
      <body>
        <div class="resume-container">
          ${content}
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate CSS styles for PDF export
   */
  private static generatePDFStyles(options: PDFExportOptions): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Arial', 'Helvetica', sans-serif;
        font-size: 11pt;
        line-height: 1.4;
        color: #333;
        background: white;
      }

      .resume-container {
        max-width: 100%;
        margin: 0 auto;
        padding: 0;
      }

      .resume-block {
        margin-bottom: 20px;
        page-break-inside: avoid;
      }

      .resume-block:last-child {
        margin-bottom: 0;
      }

      .block-title {
        font-size: 14pt;
        font-weight: bold;
        color: #2563eb;
        margin-bottom: 8px;
        padding-bottom: 4px;
        border-bottom: 1px solid #e5e7eb;
      }

      .contact-info {
        text-align: center;
        margin-bottom: 20px;
      }

      .contact-name {
        font-size: 18pt;
        font-weight: bold;
        color: #1f2937;
        margin-bottom: 8px;
      }

      .contact-details {
        font-size: 10pt;
        color: #6b7280;
        line-height: 1.3;
      }

      .contact-details div {
        margin-bottom: 2px;
      }

      .summary-content {
        text-align: justify;
        line-height: 1.5;
      }

      .experience-item,
      .education-item,
      .certification-item {
        margin-bottom: 15px;
        page-break-inside: avoid;
      }

      .experience-item:last-child,
      .education-item:last-child,
      .certification-item:last-child {
        margin-bottom: 0;
      }

      .item-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 4px;
      }

      .item-title {
        font-weight: bold;
        color: #1f2937;
      }

      .item-company,
      .item-institution {
        color: #4b5563;
        font-style: italic;
      }

      .item-date {
        color: #6b7280;
        font-size: 10pt;
        white-space: nowrap;
      }

      .item-description {
        margin-top: 6px;
        line-height: 1.4;
      }

      .achievements {
        margin-top: 6px;
      }

      .achievements ul {
        margin-left: 15px;
      }

      .achievements li {
        margin-bottom: 3px;
        line-height: 1.3;
      }

      .skills-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .skill-item {
        background: #f3f4f6;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 10pt;
        color: #374151;
      }

      .page-break-before {
        page-break-before: always;
      }

      .page-break-after {
        page-break-after: always;
      }

      .page-break-avoid {
        page-break-inside: avoid;
      }

      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .resume-container {
          margin: 0;
          padding: 0;
        }
      }
    `;
  }

  /**
   * Render individual block to HTML
   */
  private static renderBlockToHTML(block: ResumeBlock): string {
    switch (block.type) {
      case 'contact':
        return this.renderContactBlock(block);
      case 'summary':
        return this.renderSummaryBlock(block);
      case 'experience':
        return this.renderExperienceBlock(block);
      case 'education':
        return this.renderEducationBlock(block);
      case 'skills':
        return this.renderSkillsBlock(block);
      case 'certifications':
        return this.renderCertificationsBlock(block);
      default:
        return this.renderCustomBlock(block);
    }
  }

  private static renderContactBlock(block: ResumeBlock): string {
    const contact = block.content;
    return `
      <div class="resume-block contact-info">
        <div class="contact-name">${this.escapeHtml(contact.name || '')}</div>
        <div class="contact-details">
          ${contact.email ? `<div>${this.escapeHtml(contact.email)}</div>` : ''}
          ${contact.phone ? `<div>${this.escapeHtml(contact.phone)}</div>` : ''}
          ${contact.location ? `<div>${this.escapeHtml(contact.location)}</div>` : ''}
          ${contact.linkedin ? `<div>${this.escapeHtml(contact.linkedin)}</div>` : ''}
          ${contact.website ? `<div>${this.escapeHtml(contact.website)}</div>` : ''}
        </div>
      </div>
    `;
  }

  private static renderSummaryBlock(block: ResumeBlock): string {
    return `
      <div class="resume-block">
        <h2 class="block-title">${this.escapeHtml(block.title)}</h2>
        <div class="summary-content">
          ${this.escapeHtml(block.content || '').replace(/\n/g, '<br>')}
        </div>
      </div>
    `;
  }

  private static renderExperienceBlock(block: ResumeBlock): string {
    const experiences = Array.isArray(block.content) ? block.content : [];
    const experienceItems = experiences.map(exp => `
      <div class="experience-item">
        <div class="item-header">
          <div>
            <div class="item-title">${this.escapeHtml(exp.position || '')}</div>
            <div class="item-company">${this.escapeHtml(exp.company || '')}</div>
          </div>
          <div class="item-date">
            ${this.escapeHtml(exp.startDate || '')} - ${this.escapeHtml(exp.endDate || '')}
          </div>
        </div>
        ${exp.description ? `
          <div class="item-description">
            ${this.escapeHtml(exp.description).replace(/\n/g, '<br>')}
          </div>
        ` : ''}
        ${exp.achievements && exp.achievements.length > 0 ? `
          <div class="achievements">
            <ul>
              ${exp.achievements.map(achievement => 
                `<li>${this.escapeHtml(achievement)}</li>`
              ).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `).join('');

    return `
      <div class="resume-block">
        <h2 class="block-title">${this.escapeHtml(block.title)}</h2>
        ${experienceItems}
      </div>
    `;
  }

  private static renderEducationBlock(block: ResumeBlock): string {
    const educations = Array.isArray(block.content) ? block.content : [];
    const educationItems = educations.map(edu => `
      <div class="education-item">
        <div class="item-header">
          <div>
            <div class="item-title">${this.escapeHtml(edu.degree || '')} in ${this.escapeHtml(edu.field || '')}</div>
            <div class="item-institution">${this.escapeHtml(edu.institution || '')}</div>
          </div>
          <div class="item-date">
            ${this.escapeHtml(edu.startDate || '')} - ${this.escapeHtml(edu.endDate || '')}
          </div>
        </div>
        ${edu.gpa ? `<div class="item-description">GPA: ${this.escapeHtml(edu.gpa)}</div>` : ''}
      </div>
    `).join('');

    return `
      <div class="resume-block">
        <h2 class="block-title">${this.escapeHtml(block.title)}</h2>
        ${educationItems}
      </div>
    `;
  }

  private static renderSkillsBlock(block: ResumeBlock): string {
    const skills = Array.isArray(block.content) ? block.content : [];
    const skillItems = skills.map(skill => 
      `<span class="skill-item">${this.escapeHtml(skill)}</span>`
    ).join('');

    return `
      <div class="resume-block">
        <h2 class="block-title">${this.escapeHtml(block.title)}</h2>
        <div class="skills-list">
          ${skillItems}
        </div>
      </div>
    `;
  }

  private static renderCertificationsBlock(block: ResumeBlock): string {
    const certifications = Array.isArray(block.content) ? block.content : [];
    const certificationItems = certifications.map(cert => `
      <div class="certification-item">
        <div class="item-header">
          <div>
            <div class="item-title">${this.escapeHtml(cert.name || '')}</div>
            <div class="item-company">${this.escapeHtml(cert.issuer || '')}</div>
          </div>
          <div class="item-date">
            ${this.escapeHtml(cert.date || '')}${cert.expiryDate ? ` - ${this.escapeHtml(cert.expiryDate)}` : ''}
          </div>
        </div>
        ${cert.credentialId ? `
          <div class="item-description">
            Credential ID: ${this.escapeHtml(cert.credentialId)}
          </div>
        ` : ''}
      </div>
    `).join('');

    return `
      <div class="resume-block">
        <h2 class="block-title">${this.escapeHtml(block.title)}</h2>
        ${certificationItems}
      </div>
    `;
  }

  private static renderCustomBlock(block: ResumeBlock): string {
    return `
      <div class="resume-block">
        <h2 class="block-title">${this.escapeHtml(block.title)}</h2>
        <div class="summary-content">
          ${this.escapeHtml(block.content || '').replace(/\n/g, '<br>')}
        </div>
      </div>
    `;
  }

  /**
   * Generate filename for export
   */
  private static generateFilename(
    blocks: ResumeBlock[],
    format: string,
    customFilename?: string
  ): string {
    if (customFilename) {
      return customFilename.endsWith(`.${format}`) 
        ? customFilename 
        : `${customFilename}.${format}`;
    }

    // Try to get name from contact block
    const contactBlock = blocks.find(block => block.type === 'contact');
    const name = contactBlock?.content?.name;
    
    if (name) {
      const sanitizedName = name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
      return `${sanitizedName}_Resume.${format}`;
    }

    // Fallback to timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    return `Resume_${timestamp}.${format}`;
  }

  /**
   * Convert ResumeData to ResumeBlocks for export
   */
  private static convertResumeDataToBlocks(data: ResumeData): ResumeBlock[] {
    const blocks: ResumeBlock[] = [];
    let order = 0;

    // Contact block
    blocks.push({
      id: 'contact',
      type: 'contact',
      title: 'Contact Information',
      content: data.sections.contact,
      order: order++,
      isVisible: true,
      isEditing: false
    });

    // Summary block
    if (data.sections.summary) {
      blocks.push({
        id: 'summary',
        type: 'summary',
        title: 'Professional Summary',
        content: data.sections.summary,
        order: order++,
        isVisible: true,
        isEditing: false
      });
    }

    // Experience block
    if (data.sections.experience.length > 0) {
      blocks.push({
        id: 'experience',
        type: 'experience',
        title: 'Work Experience',
        content: data.sections.experience,
        order: order++,
        isVisible: true,
        isEditing: false
      });
    }

    // Education block
    if (data.sections.education.length > 0) {
      blocks.push({
        id: 'education',
        type: 'education',
        title: 'Education',
        content: data.sections.education,
        order: order++,
        isVisible: true,
        isEditing: false
      });
    }

    // Skills block
    if (data.sections.skills.length > 0) {
      blocks.push({
        id: 'skills',
        type: 'skills',
        title: 'Skills',
        content: data.sections.skills,
        order: order++,
        isVisible: true,
        isEditing: false
      });
    }

    // Certifications block
    if (data.sections.certifications.length > 0) {
      blocks.push({
        id: 'certifications',
        type: 'certifications',
        title: 'Certifications',
        content: data.sections.certifications,
        order: order++,
        isVisible: true,
        isEditing: false
      });
    }

    return blocks;
  }

  /**
   * Download blob as file
   */
  private static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Escape HTML characters
   */
  private static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

/**
 * DOCX Export System
 * Implements DOCX generation from resume editor using docx library
 */
export class DOCXExporter {
  private static readonly DEFAULT_OPTIONS: DOCXExportOptions = {
    format: 'docx',
    quality: 'high',
    paperSize: 'a4',
    orientation: 'portrait',
    margins: {
      top: 25,
      right: 25,
      bottom: 25,
      left: 25
    },
    includePageNumbers: true,
    fontFamily: 'Calibri',
    fontSize: 11,
    lineSpacing: 1.15,
    styles: {
      heading1: {
        size: 16,
        bold: true,
        color: '2563eb'
      },
      heading2: {
        size: 14,
        bold: true,
        color: '1f2937'
      },
      body: {
        size: 11,
        color: '374151'
      }
    }
  };

  /**
   * Export resume blocks to DOCX
   */
  static async exportToDOCX(
    blocks: ResumeBlock[],
    options: Partial<DOCXExportOptions> = {}
  ): Promise<ExportResult> {
    try {
      // Dynamic import for docx library
      if (!docx) {
        docx = await import('docx');
      }

      const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
      const filename = this.generateFilename(blocks, 'docx', mergedOptions.filename);

      // Create document
      const doc = this.createDocument(blocks, mergedOptions);

      // Generate DOCX buffer
      const buffer = await docx.Packer.toBuffer(doc);
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });

      // Trigger download
      this.downloadBlob(blob, filename);

      return {
        success: true,
        filename,
        blob
      };

    } catch (error) {
      console.error('DOCX export failed:', error);
      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Export resume data to DOCX (alternative method)
   */
  static async exportResumeDataToDOCX(
    resumeData: ResumeData,
    options: Partial<DOCXExportOptions> = {}
  ): Promise<ExportResult> {
    const blocks = this.convertResumeDataToBlocks(resumeData);
    return this.exportToDOCX(blocks, options);
  }

  /**
   * Create DOCX document from resume blocks
   */
  private static createDocument(
    blocks: ResumeBlock[],
    options: DOCXExportOptions
  ): any {
    const visibleBlocks = blocks.filter(block => block.isVisible);
    const sortedBlocks = visibleBlocks.sort((a, b) => a.order - b.order);

    const children: any[] = [];

    sortedBlocks.forEach(block => {
      const blockElements = this.renderBlockToDOCX(block, options);
      children.push(...blockElements);
      
      // Add spacing between blocks
      children.push(new docx.Paragraph({ text: '' }));
    });

    return new docx.Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: this.convertToTwips(options.margins.top),
              right: this.convertToTwips(options.margins.right),
              bottom: this.convertToTwips(options.margins.bottom),
              left: this.convertToTwips(options.margins.left)
            }
          }
        },
        headers: options.headerText ? {
          default: {
            options: {
              children: [
                new docx.Paragraph({
                  text: options.headerText,
                  alignment: docx.AlignmentType.CENTER
                })
              ]
            }
          }
        } : undefined,
        footers: options.footerText || options.includePageNumbers ? {
          default: {
            options: {
              children: [
                new docx.Paragraph({
                  children: [
                    ...(options.footerText ? [new docx.TextRun(options.footerText)] : []),
                    ...(options.includePageNumbers ? [
                      new docx.TextRun({
                        text: options.footerText ? ' - Page ' : 'Page ',
                        size: options.styles.body.size * 2
                      })
                    ] : [])
                  ],
                  alignment: docx.AlignmentType.CENTER
                })
              ]
            }
          }
        } : undefined,
        children
      }]
    });
  }

  /**
   * Render individual block to DOCX elements
   */
  private static renderBlockToDOCX(
    block: ResumeBlock,
    options: DOCXExportOptions
  ): any[] {
    switch (block.type) {
      case 'contact':
        return this.renderContactBlockDOCX(block, options);
      case 'summary':
        return this.renderSummaryBlockDOCX(block, options);
      case 'experience':
        return this.renderExperienceBlockDOCX(block, options);
      case 'education':
        return this.renderEducationBlockDOCX(block, options);
      case 'skills':
        return this.renderSkillsBlockDOCX(block, options);
      case 'certifications':
        return this.renderCertificationsBlockDOCX(block, options);
      default:
        return this.renderCustomBlockDOCX(block, options);
    }
  }

  private static renderContactBlockDOCX(
    block: ResumeBlock,
    options: DOCXExportOptions
  ): any[] {
    const contact = block.content;
    const elements: any[] = [];

    // Name
    if (contact.name) {
      elements.push(new docx.Paragraph({
        children: [
          new docx.TextRun({
            text: contact.name,
            bold: true,
            size: options.styles.heading1.size * 2,
            color: options.styles.heading1.color
          })
        ],
        alignment: docx.AlignmentType.CENTER,
        spacing: { after: 200 }
      }));
    }

    // Contact details
    const contactDetails: string[] = [];
    if (contact.email) contactDetails.push(contact.email);
    if (contact.phone) contactDetails.push(contact.phone);
    if (contact.location) contactDetails.push(contact.location);
    if (contact.linkedin) contactDetails.push(contact.linkedin);
    if (contact.website) contactDetails.push(contact.website);

    if (contactDetails.length > 0) {
      elements.push(new docx.Paragraph({
        children: [
          new docx.TextRun({
            text: contactDetails.join(' | '),
            size: options.styles.body.size * 2,
            color: options.styles.body.color
          })
        ],
        alignment: docx.AlignmentType.CENTER,
        spacing: { after: 400 }
      }));
    }

    return elements;
  }

  private static renderSummaryBlockDOCX(
    block: ResumeBlock,
    options: DOCXExportOptions
  ): any[] {
    return [
      new docx.Paragraph({
        children: [
          new docx.TextRun({
            text: block.title,
            bold: options.styles.heading2.bold,
            size: options.styles.heading2.size * 2,
            color: options.styles.heading2.color
          })
        ],
        spacing: { before: 200, after: 100 }
      }),
      new docx.Paragraph({
        children: [
          new docx.TextRun({
            text: block.content || '',
            size: options.styles.body.size * 2,
            color: options.styles.body.color
          })
        ],
        alignment: docx.AlignmentType.JUSTIFIED,
        spacing: { after: 200 }
      })
    ];
  }

  private static renderExperienceBlockDOCX(
    block: ResumeBlock,
    options: DOCXExportOptions
  ): any[] {
    const elements: any[] = [];
    const experiences = Array.isArray(block.content) ? block.content : [];

    // Section title
    elements.push(new docx.Paragraph({
      children: [
        new docx.TextRun({
          text: block.title,
          bold: options.styles.heading2.bold,
          size: options.styles.heading2.size * 2,
          color: options.styles.heading2.color
        })
      ],
      spacing: { before: 200, after: 100 }
    }));

    experiences.forEach((exp: any) => {
      // Position and company
      elements.push(new docx.Paragraph({
        children: [
          new docx.TextRun({
            text: `${exp.position || ''} at ${exp.company || ''}`,
            bold: true,
            size: options.styles.body.size * 2,
            color: options.styles.body.color
          })
        ],
        spacing: { after: 50 }
      }));

      // Description
      if (exp.description) {
        elements.push(new docx.Paragraph({
          children: [
            new docx.TextRun({
              text: exp.description,
              size: options.styles.body.size * 2,
              color: options.styles.body.color
            })
          ],
          spacing: { after: 100 }
        }));
      }
    });

    return elements;
  }

  private static renderEducationBlockDOCX(
    block: ResumeBlock,
    options: DOCXExportOptions
  ): any[] {
    const elements: any[] = [];
    const educations = Array.isArray(block.content) ? block.content : [];

    // Section title
    elements.push(new docx.Paragraph({
      children: [
        new docx.TextRun({
          text: block.title,
          bold: options.styles.heading2.bold,
          size: options.styles.heading2.size * 2,
          color: options.styles.heading2.color
        })
      ],
      spacing: { before: 200, after: 100 }
    }));

    educations.forEach((edu: any) => {
      elements.push(new docx.Paragraph({
        children: [
          new docx.TextRun({
            text: `${edu.degree || ''} in ${edu.field || ''} - ${edu.institution || ''}`,
            bold: true,
            size: options.styles.body.size * 2,
            color: options.styles.body.color
          })
        ],
        spacing: { after: 100 }
      }));
    });

    return elements;
  }

  private static renderSkillsBlockDOCX(
    block: ResumeBlock,
    options: DOCXExportOptions
  ): any[] {
    const skills = Array.isArray(block.content) ? block.content : [];

    return [
      new docx.Paragraph({
        children: [
          new docx.TextRun({
            text: block.title,
            bold: options.styles.heading2.bold,
            size: options.styles.heading2.size * 2,
            color: options.styles.heading2.color
          })
        ],
        spacing: { before: 200, after: 100 }
      }),
      new docx.Paragraph({
        children: [
          new docx.TextRun({
            text: skills.join(' • '),
            size: options.styles.body.size * 2,
            color: options.styles.body.color
          })
        ],
        spacing: { after: 200 }
      })
    ];
  }

  private static renderCertificationsBlockDOCX(
    block: ResumeBlock,
    options: DOCXExportOptions
  ): any[] {
    const elements: any[] = [];
    const certifications = Array.isArray(block.content) ? block.content : [];

    // Section title
    elements.push(new docx.Paragraph({
      children: [
        new docx.TextRun({
          text: block.title,
          bold: options.styles.heading2.bold,
          size: options.styles.heading2.size * 2,
          color: options.styles.heading2.color
        })
      ],
      spacing: { before: 200, after: 100 }
    }));

    certifications.forEach((cert: any) => {
      elements.push(new docx.Paragraph({
        children: [
          new docx.TextRun({
            text: `${cert.name || ''} - ${cert.issuer || ''}`,
            bold: true,
            size: options.styles.body.size * 2,
            color: options.styles.body.color
          })
        ],
        spacing: { after: 100 }
      }));
    });

    return elements;
  }

  private static renderCustomBlockDOCX(
    block: ResumeBlock,
    options: DOCXExportOptions
  ): unknown[] {
    return [
      new docx.Paragraph({
        children: [
          new docx.TextRun({
            text: block.title,
            bold: options.styles.heading2.bold,
            size: options.styles.heading2.size * 2,
            color: options.styles.heading2.color
          })
        ],
        spacing: { before: 200, after: 100 }
      }),
      new docx.Paragraph({
        children: [
          new docx.TextRun({
            text: block.content || '',
            size: options.styles.body.size * 2,
            color: options.styles.body.color
          })
        ],
        spacing: { after: 200 }
      })
    ];
  }

  /**
   * Convert millimeters to twips (1/20th of a point)
   */
  private static convertToTwips(mm: number): number {
    return Math.round(mm * 56.7);
  }

  /**
   * Generate filename for export
   */
  private static generateFilename(
    blocks: ResumeBlock[],
    format: string,
    customFilename?: string
  ): string {
    if (customFilename) {
      return customFilename.endsWith(`.${format}`) 
        ? customFilename 
        : `${customFilename}.${format}`;
    }

    // Try to get name from contact block
    const contactBlock = blocks.find(block => block.type === 'contact');
    const name = contactBlock?.content?.name;
    
    if (name) {
      const sanitizedName = name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
      return `${sanitizedName}_Resume.${format}`;
    }

    // Fallback to timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    return `Resume_${timestamp}.${format}`;
  }

  /**
   * Convert ResumeData to ResumeBlocks for export
   */
  private static convertResumeDataToBlocks(data: ResumeData): ResumeBlock[] {
    const blocks: ResumeBlock[] = [];
    let order = 0;

    // Contact block
    blocks.push({
      id: 'contact',
      type: 'contact',
      title: 'Contact Information',
      content: data.sections.contact,
      order: order++,
      isVisible: true,
      isEditing: false
    });

    // Summary block
    if (data.sections.summary) {
      blocks.push({
        id: 'summary',
        type: 'summary',
        title: 'Professional Summary',
        content: data.sections.summary,
        order: order++,
        isVisible: true,
        isEditing: false
      });
    }

    // Experience block
    if (data.sections.experience.length > 0) {
      blocks.push({
        id: 'experience',
        type: 'experience',
        title: 'Work Experience',
        content: data.sections.experience,
        order: order++,
        isVisible: true,
        isEditing: false
      });
    }

    // Education block
    if (data.sections.education.length > 0) {
      blocks.push({
        id: 'education',
        type: 'education',
        title: 'Education',
        content: data.sections.education,
        order: order++,
        isVisible: true,
        isEditing: false
      });
    }

    // Skills block
    if (data.sections.skills.length > 0) {
      blocks.push({
        id: 'skills',
        type: 'skills',
        title: 'Skills',
        content: data.sections.skills,
        order: order++,
        isVisible: true,
        isEditing: false
      });
    }

    // Certifications block
    if (data.sections.certifications.length > 0) {
      blocks.push({
        id: 'certifications',
        type: 'certifications',
        title: 'Certifications',
        content: data.sections.certifications,
        order: order++,
        isVisible: true,
        isEditing: false
      });
    }

    return blocks;
  }

  /**
   * Download blob as file
   */
  private static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Convenience function for PDF export
 */
export async function exportToPDF(
  blocks: ResumeBlock[],
  options?: Partial<PDFExportOptions>
): Promise<ExportResult> {
  return PDFExporter.exportToPDF(blocks, options);
}

/**
 * Convenience function for ResumeData PDF export
 */
export async function exportResumeDataToPDF(
  resumeData: ResumeData,
  options?: Partial<PDFExportOptions>
): Promise<ExportResult> {
  return PDFExporter.exportResumeDataToPDF(resumeData, options);
}

/**
 * Convenience function for DOCX export
 */
export async function exportToDOCX(
  blocks: ResumeBlock[],
  options?: Partial<DOCXExportOptions>
): Promise<ExportResult> {
  return DOCXExporter.exportToDOCX(blocks, options);
}

/**
 * Convenience function for ResumeData DOCX export
 */
export async function exportResumeDataToDOCX(
  resumeData: ResumeData,
  options?: Partial<DOCXExportOptions>
): Promise<ExportResult> {
  return DOCXExporter.exportResumeDataToDOCX(resumeData, options);
}