import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock mammoth for integration tests
vi.mock('mammoth', () => ({
  extractRawText: vi.fn(),
  convertToHtml: vi.fn()
}));

import { DOCXParser, DOCXParseException } from '../docxParser';
import * as mammoth from 'mammoth';

describe('DOCXParser Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Full parsing workflow', () => {
    it('should handle complete resume parsing workflow', async () => {
      // Mock a realistic resume content
      const mockResumeText = `John Doe
Software Engineer

Contact Information:
Email: john.doe@email.com
Phone: (555) 123-4567
Location: San Francisco, CA

Professional Summary:
Experienced software engineer with 5+ years of experience in full-stack web development. 
Proficient in JavaScript, React, Node.js, and cloud technologies.

Work Experience:

Senior Software Engineer - Tech Corp (2020-Present)
• Led development of microservices architecture serving 1M+ users
• Implemented CI/CD pipelines reducing deployment time by 60%
• Mentored junior developers and conducted code reviews

Software Engineer - StartupXYZ (2018-2020)
• Built responsive web applications using React and Redux
• Developed RESTful APIs with Node.js and Express
• Collaborated with cross-functional teams in Agile environment

Education:
Bachelor of Science in Computer Science
University of California, Berkeley (2014-2018)

Skills:
• Programming Languages: JavaScript, TypeScript, Python, Java
• Frontend: React, Vue.js, HTML5, CSS3, Sass
• Backend: Node.js, Express, Django, Spring Boot
• Databases: PostgreSQL, MongoDB, Redis
• Cloud: AWS, Docker, Kubernetes
• Tools: Git, Jenkins, JIRA, Slack`;

      const mockHtmlContent = `<p><strong>John Doe</strong></p>
<p><strong>Software Engineer</strong></p>
<p><strong>Contact Information:</strong></p>
<p>Email: john.doe@email.com</p>
<p>Phone: (555) 123-4567</p>
<p>Location: San Francisco, CA</p>
<p><strong>Professional Summary:</strong></p>
<p>Experienced software engineer with 5+ years of experience in full-stack web development. Proficient in JavaScript, React, Node.js, and cloud technologies.</p>
<p><strong>Work Experience:</strong></p>
<p><strong>Senior Software Engineer - Tech Corp (2020-Present)</strong></p>
<ul>
<li>Led development of microservices architecture serving 1M+ users</li>
<li>Implemented CI/CD pipelines reducing deployment time by 60%</li>
<li>Mentored junior developers and conducted code reviews</li>
</ul>
<p><strong>Software Engineer - StartupXYZ (2018-2020)</strong></p>
<ul>
<li>Built responsive web applications using React and Redux</li>
<li>Developed RESTful APIs with Node.js and Express</li>
<li>Collaborated with cross-functional teams in Agile environment</li>
</ul>
<p><strong>Education:</strong></p>
<p>Bachelor of Science in Computer Science</p>
<p>University of California, Berkeley (2014-2018)</p>
<p><strong>Skills:</strong></p>
<ul>
<li>Programming Languages: JavaScript, TypeScript, Python, Java</li>
<li>Frontend: React, Vue.js, HTML5, CSS3, Sass</li>
<li>Backend: Node.js, Express, Django, Spring Boot</li>
<li>Databases: PostgreSQL, MongoDB, Redis</li>
<li>Cloud: AWS, Docker, Kubernetes</li>
<li>Tools: Git, Jenkins, JIRA, Slack</li>
</ul>`;

      vi.mocked(mammoth.extractRawText).mockResolvedValue({
        value: mockResumeText,
        messages: []
      });

      vi.mocked(mammoth.convertToHtml).mockResolvedValue({
        value: mockHtmlContent,
        messages: []
      });

      const mockFile = new File(['mock docx content'], 'john-doe-resume.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      const result = await DOCXParser.parse(mockFile);

      // Verify basic parsing
      expect(result.content).toBe(mockResumeText);
      expect(result.metadata.fileName).toBe('john-doe-resume.docx');
      expect(result.metadata.fileType).toBe('docx');
      
      // Verify content analysis
      expect(result.metadata.wordCount).toBeGreaterThan(100);
      expect(result.metadata.characterCount).toBeGreaterThan(1000);
      expect(result.metadata.paragraphCount).toBeGreaterThan(5);
      
      // Verify formatted content
      expect(result.formattedContent.html).toBe(mockHtmlContent);
      expect(result.formattedContent.plainText).toBe(mockResumeText);
      
      // Verify no warnings for clean document
      expect(result.warnings).toEqual([]);
      
      // Verify metadata
      expect(result.metadata.uploadDate).toBeInstanceOf(Date);
    });

    it('should handle document with complex formatting and warnings', async () => {
      const mockComplexText = `Executive Summary
This document contains complex formatting that may not be fully preserved.

Key Achievements:
→ Increased revenue by 150%
→ Managed team of 25+ professionals
→ Implemented enterprise solutions

Technical Skills:
• Advanced: JavaScript, Python, React
• Intermediate: Java, C++, Angular
• Beginner: Rust, Go, Kotlin`;

      const mockComplexHtml = `<h1>Executive Summary</h1>
<p>This document contains complex formatting that may not be fully preserved.</p>
<h2>Key Achievements:</h2>
<ul>
<li>Increased revenue by 150%</li>
<li>Managed team of 25+ professionals</li>
<li>Implemented enterprise solutions</li>
</ul>
<h2>Technical Skills:</h2>
<ul>
<li>Advanced: JavaScript, Python, React</li>
<li>Intermediate: Java, C++, Angular</li>
<li>Beginner: Rust, Go, Kotlin</li>
</ul>`;

      vi.mocked(mammoth.extractRawText).mockResolvedValue({
        value: mockComplexText,
        messages: [
          { type: 'warning', message: 'Custom bullet points converted to standard bullets' },
          { type: 'warning', message: 'Complex table formatting simplified' }
        ]
      });

      vi.mocked(mammoth.convertToHtml).mockResolvedValue({
        value: mockComplexHtml,
        messages: [
          { type: 'warning', message: 'Some styling information was lost' }
        ]
      });

      const mockFile = new File(['complex docx'], 'complex-resume.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      const result = await DOCXParser.parse(mockFile);

      expect(result.content).toBe(mockComplexText);
      expect(result.formattedContent.html).toBe(mockComplexHtml);
      expect(result.warnings).toHaveLength(3);
      expect(result.warnings).toContain('Custom bullet points converted to standard bullets');
      expect(result.warnings).toContain('Complex table formatting simplified');
      expect(result.warnings).toContain('Some styling information was lost');
    });

    it('should handle large document parsing', async () => {
      // Simulate a large document
      const largeParagraph = 'This is a very long paragraph that contains many words and represents a typical large resume or CV document. '.repeat(50);
      const largeDocument = `${largeParagraph}\n\n${largeParagraph}\n\n${largeParagraph}`;

      vi.mocked(mammoth.extractRawText).mockResolvedValue({
        value: largeDocument,
        messages: []
      });

      vi.mocked(mammoth.convertToHtml).mockResolvedValue({
        value: `<p>${largeParagraph}</p><p>${largeParagraph}</p><p>${largeParagraph}</p>`,
        messages: []
      });

      const mockFile = new File(['large docx'], 'large-resume.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      const result = await DOCXParser.parse(mockFile);

      expect(result.content).toContain('This is a very long paragraph');
      expect(result.metadata.wordCount).toBeGreaterThan(1000);
      expect(result.metadata.characterCount).toBeGreaterThan(10000);
      expect(result.metadata.paragraphCount).toBe(3);
    });

    it('should handle document with minimal content', async () => {
      const minimalText = 'John Doe';
      const minimalHtml = '<p>John Doe</p>';

      vi.mocked(mammoth.extractRawText).mockResolvedValue({
        value: minimalText,
        messages: []
      });

      vi.mocked(mammoth.convertToHtml).mockResolvedValue({
        value: minimalHtml,
        messages: []
      });

      const mockFile = new File(['minimal docx'], 'minimal.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      const result = await DOCXParser.parse(mockFile);

      expect(result.content).toBe(minimalText);
      expect(result.metadata.wordCount).toBe(2);
      expect(result.metadata.characterCount).toBe(8);
      expect(result.metadata.paragraphCount).toBe(1);
    });
  });

  describe('Error handling integration', () => {
    it('should handle mammoth parsing errors gracefully', async () => {
      vi.mocked(mammoth.extractRawText).mockRejectedValue(new Error('Corrupted ZIP structure'));

      const mockFile = new File(['corrupted docx'], 'corrupted.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      await expect(DOCXParser.parse(mockFile)).rejects.toThrow(DOCXParseException);
      
      try {
        await DOCXParser.parse(mockFile);
      } catch (error) {
        expect(error).toBeInstanceOf(DOCXParseException);
        expect((error as DOCXParseException).error.code).toBe('INVALID_DOCX');
        expect((error as DOCXParseException).error.message).toBe('Invalid or corrupted DOCX file');
        expect((error as DOCXParseException).error.details).toBe('Corrupted ZIP structure');
      }
    });

    it('should handle partial parsing failures', async () => {
      // Text extraction succeeds but HTML conversion fails
      vi.mocked(mammoth.extractRawText).mockResolvedValue({
        value: 'Successfully extracted text',
        messages: []
      });

      vi.mocked(mammoth.convertToHtml).mockRejectedValue(new Error('HTML conversion failed'));

      const mockFile = new File(['partial fail docx'], 'partial-fail.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      await expect(DOCXParser.parse(mockFile)).rejects.toThrow(DOCXParseException);
      await expect(DOCXParser.parse(mockFile)).rejects.toThrow('Invalid or corrupted DOCX file');
    });

    it('should handle unexpected errors during parsing', async () => {
      // Simulate an unexpected error
      vi.mocked(mammoth.extractRawText).mockImplementation(() => {
        throw new TypeError('Unexpected error type');
      });

      const mockFile = new File(['error docx'], 'error.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      await expect(DOCXParser.parse(mockFile)).rejects.toThrow(DOCXParseException);
      
      try {
        await DOCXParser.parse(mockFile);
      } catch (error) {
        expect(error).toBeInstanceOf(DOCXParseException);
        expect((error as DOCXParseException).error.code).toBe('INVALID_DOCX');
        expect((error as DOCXParseException).error.message).toBe('Invalid or corrupted DOCX file');
      }
    });
  });

  describe('parseWithStructure integration', () => {
    it('should handle structured parsing with complex document', async () => {
      const structuredText = `Resume
John Doe

Summary
Experienced developer

Experience
Senior Engineer at TechCorp
Junior Engineer at StartupXYZ

Education
BS Computer Science`;

      const structuredHtml = `<h1>Resume</h1>
<p>John Doe</p>
<h2>Summary</h2>
<p>Experienced developer</p>
<h2>Experience</h2>
<p>Senior Engineer at TechCorp</p>
<p>Junior Engineer at StartupXYZ</p>
<h2>Education</h2>
<p>BS Computer Science</p>`;

      vi.mocked(mammoth.extractRawText).mockResolvedValue({
        value: structuredText,
        messages: []
      });

      vi.mocked(mammoth.convertToHtml).mockResolvedValue({
        value: structuredHtml,
        messages: []
      });

      const mockFile = new File(['structured docx'], 'structured.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      const result = await DOCXParser.parseWithStructure(mockFile, {
        preserveFormatting: true,
        extractImages: true
      });

      expect(result.content).toBe(structuredText);
      expect(result.formattedContent.html).toBe(structuredHtml);
      expect(result.structuredContent).toBeDefined();
      expect(result.structuredContent.headings).toEqual([]);
      expect(result.structuredContent.lists).toEqual([]);
      expect(result.structuredContent.tables).toEqual([]);
      expect(result.structuredContent.images).toEqual([]);
    });
  });

  describe('File validation integration', () => {
    it('should properly validate different file types', () => {
      const validDocx = new File(['content'], 'resume.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      const docxWithGenericType = new File(['content'], 'resume.docx', {
        type: 'application/octet-stream'
      });

      const pdfFile = new File(['content'], 'resume.pdf', {
        type: 'application/pdf'
      });

      const textFile = new File(['content'], 'resume.txt', {
        type: 'text/plain'
      });

      expect(DOCXParser.isValidDOCXFile(validDocx)).toBe(true);
      expect(DOCXParser.isValidDOCXFile(docxWithGenericType)).toBe(true);
      expect(DOCXParser.isValidDOCXFile(pdfFile)).toBe(false);
      expect(DOCXParser.isValidDOCXFile(textFile)).toBe(false);
    });
  });
});