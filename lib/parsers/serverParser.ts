import type { ResumeData } from '@/types/resume';

export interface ServerParseResult {
  content: string;
  metadata: {
    fileName: string;
    fileType: 'pdf' | 'docx' | 'txt';
    uploadDate: Date;
    wordCount: number;
  };
}

export class ServerParser {
  /**
   * Parse uploaded file on server-side
   * For now, this is a basic implementation that extracts text content
   * In production, you'd want to use proper server-side PDF/DOCX parsers
   */
  static async parseFile(file: File): Promise<ResumeData> {
    const fileName = file.name;
    const fileType = this.getFileType(file);
    const uploadDate = new Date();
    
    let content = '';
    
    try {
      if (fileType === 'txt' || file.type === 'text/plain') {
        // Handle plain text files
        content = await file.text();
      } else if (fileType === 'pdf') {
        // For PDF files, we'll need a server-side PDF parser
        // For now, return a placeholder message
        content = `[PDF Content from ${fileName}]\n\nThis is a placeholder for PDF content extraction. In production, this would use a server-side PDF parser like pdf-parse or pdf2pic.`;
      } else if (fileType === 'docx') {
        // For DOCX files, we'll need a server-side DOCX parser
        // For now, return a placeholder message
        content = `[DOCX Content from ${fileName}]\n\nThis is a placeholder for DOCX content extraction. In production, this would use a server-side DOCX parser like mammoth or docx-parser.`;
      } else {
        throw new Error(`Unsupported file type: ${file.type}`);
      }
    } catch (error) {
      throw new Error(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    
    // Generate a unique ID
    const id = `resume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id,
      content,
      metadata: {
        fileName,
        fileType,
        uploadDate,
        wordCount
      },
      sections: {
        contact: {
          name: this.extractName(content),
          email: this.extractEmail(content),
          phone: this.extractPhone(content),
          location: this.extractLocation(content)
        },
        summary: this.extractSummary(content),
        experience: this.extractExperience(content),
        education: this.extractEducation(content),
        skills: this.extractSkills(content),
        certifications: this.extractCertifications(content)
      }
    };
  }

  private static getFileType(file: File): 'pdf' | 'docx' | 'txt' {
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      return 'pdf';
    }
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        file.type === 'application/msword' ||
        file.name.toLowerCase().endsWith('.docx') ||
        file.name.toLowerCase().endsWith('.doc')) {
      return 'docx';
    }
    return 'txt';
  }

  private static extractName(content: string): string {
    // Simple name extraction - look for capitalized words at the beginning
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const firstLine = lines[0]?.trim();
    
    if (firstLine && /^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(firstLine)) {
      return firstLine.split(/\s+/).slice(0, 2).join(' ');
    }
    
    return 'Name not found';
  }

  private static extractEmail(content: string): string {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const match = content.match(emailRegex);
    return match ? match[0] : '';
  }

  private static extractPhone(content: string): string {
    const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/;
    const match = content.match(phoneRegex);
    return match ? match[0] : '';
  }

  private static extractLocation(content: string): string {
    // Look for common location patterns
    const locationRegex = /([A-Z][a-z]+,\s*[A-Z]{2})|([A-Z][a-z]+\s*[A-Z][a-z]+,\s*[A-Z]{2})/;
    const match = content.match(locationRegex);
    return match ? match[0] : '';
  }

  private static extractSummary(content: string): string {
    // Look for summary/objective sections
    const summaryRegex = /(?:summary|objective|profile)[\s\S]*?(?=\n\s*[A-Z]|\n\s*$)/i;
    const match = content.match(summaryRegex);
    if (match) {
      return match[0].replace(/^(summary|objective|profile)\s*/i, '').trim();
    }
    
    // If no explicit summary, take first paragraph
    const paragraphs = content.split('\n\n');
    return paragraphs.length > 1 ? paragraphs[1].trim() : '';
  }

  private static extractExperience(content: string): any[] {
    // Basic experience extraction - this would be more sophisticated in production
    const experienceSection = this.extractSection(content, 'experience');
    if (!experienceSection) return [];
    
    // Split by common patterns that indicate new job entries
    const jobEntries = experienceSection.split(/\n(?=[A-Z][a-z].*(?:at|@|\|))/);
    
    return jobEntries.map((entry, index) => ({
      id: `exp_${index}`,
      position: 'Position',
      company: 'Company',
      startDate: '2020',
      endDate: '2023',
      description: entry.trim(),
      achievements: []
    })).slice(0, 5); // Limit to 5 entries
  }

  private static extractEducation(content: string): any[] {
    const educationSection = this.extractSection(content, 'education');
    if (!educationSection) return [];
    
    return [{
      id: 'edu_1',
      degree: 'Degree',
      field: 'Field of Study',
      institution: 'Institution',
      startDate: '2016',
      endDate: '2020',
      gpa: '',
      honors: []
    }];
  }

  private static extractSkills(content: string): string[] {
    const skillsSection = this.extractSection(content, 'skills');
    if (!skillsSection) {
      // Extract common technical terms from the entire content
      const techSkills = [
        'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'HTML', 'CSS',
        'Git', 'AWS', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL'
      ];
      
      return techSkills.filter(skill => 
        content.toLowerCase().includes(skill.toLowerCase())
      );
    }
    
    // Split skills by common delimiters
    return skillsSection
      .split(/[,•\n]/)
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0)
      .slice(0, 20); // Limit to 20 skills
  }

  private static extractCertifications(content: string): any[] {
    const certSection = this.extractSection(content, 'certifications');
    if (!certSection) return [];
    
    return [{
      id: 'cert_1',
      name: 'Certification',
      issuer: 'Issuing Organization',
      date: '2023',
      expiryDate: '',
      credentialId: ''
    }];
  }

  private static extractSection(content: string, sectionName: string): string | null {
    const regex = new RegExp(`${sectionName}[\\s\\S]*?(?=\\n\\s*[A-Z][A-Z\\s]+\\n|$)`, 'i');
    const match = content.match(regex);
    return match ? match[0] : null;
  }
}

export const serverParser = ServerParser;