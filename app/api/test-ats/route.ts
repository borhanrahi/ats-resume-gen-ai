import { NextRequest, NextResponse } from 'next/server';
import { ATSScoringEngine } from '../../../lib/analysis/ats-scoring-engine';

export async function POST(request: NextRequest) {
  try {
    console.log('=== ATS TEST ENDPOINT CALLED ===');
    
    // Create a sample resume document for testing
    const sampleResumeText = `
John Doe
john.doe@email.com
(555) 123-4567

PROFESSIONAL SUMMARY
Experienced software engineer with 5+ years developing web applications using JavaScript, React, and Node.js.

WORK EXPERIENCE

Senior Software Engineer | Tech Company | 2020-2023
• Developed 15+ responsive web applications using React and TypeScript
• Increased system performance by 40% through code optimization
• Led a team of 5 developers on critical projects
• Implemented automated testing reducing bugs by 60%
• Collaborated with product managers to deliver features on time

Software Developer | StartupCorp | 2018-2020
• Built REST APIs serving 10,000+ daily users
• Reduced database query time by 50% through optimization
• Mentored 3 junior developers on best practices
• Deployed applications using Docker and AWS

EDUCATION
Bachelor of Science in Computer Science
University of Technology | 2018

SKILLS
• Programming: JavaScript, TypeScript, Python, Java
• Frameworks: React, Node.js, Express, Django
• Databases: PostgreSQL, MongoDB, Redis
• Cloud: AWS, Docker, Kubernetes
• Tools: Git, Jenkins, JIRA
`;

    const sampleJobDescription = `
We are looking for a Senior Software Engineer with experience in:
- JavaScript and TypeScript development
- React and Node.js frameworks
- AWS cloud services
- Team leadership and mentoring
- Database optimization
- Agile development practices
- REST API development
- Docker containerization
`;

    // Mock parsed document structure
    const mockParsedDocument = {
      text: sampleResumeText,
      fileType: 'pdf' as const,
      extractionRate: 0.95,
      hasHiddenText: false,
      encoding: 'standard' as const,
      structure: {
        sections: [
          { name: 'Professional Summary', content: 'Experienced software engineer...', startIndex: 0, endIndex: 100 },
          { name: 'Work Experience', content: 'Senior Software Engineer...', startIndex: 101, endIndex: 500 },
          { name: 'Education', content: 'Bachelor of Science...', startIndex: 501, endIndex: 600 },
          { name: 'Skills', content: 'Programming: JavaScript...', startIndex: 601, endIndex: 700 }
        ],
        contactInfo: {
          name: 'John Doe',
          email: 'john.doe@email.com',
          phone: '(555) 123-4567',
          position: 'top' as const
        },
        hasProperHeadings: true
      },
      formatting: {
        layout: 'single-column' as const,
        hasGraphics: false,
        hasTables: false,
        fontConsistency: 'good' as const,
        spacing: 'good' as const
      }
    };

    console.log('Testing ATS scoring with sample data...');
    
    // Create ATS scoring engine and test
    const scoringEngine = new ATSScoringEngine();
    const atsScore = await scoringEngine.analyzeResume(
      mockParsedDocument,
      sampleJobDescription
    );

    console.log('ATS Test completed successfully');

    return NextResponse.json({
      success: true,
      message: 'ATS scoring test completed',
      atsScore,
      sampleData: {
        resumeTextLength: sampleResumeText.length,
        jobDescriptionLength: sampleJobDescription.length,
        sectionsCount: mockParsedDocument.structure.sections.length
      }
    });

  } catch (error) {
    console.error('ATS Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'ATS Test endpoint - use POST to run test',
    usage: 'POST to this endpoint to test ATS scoring with sample data'
  });
}
