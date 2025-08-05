import { NextResponse } from 'next/server';
import { SimpleATSScorer } from '@/lib/analysis/simple-ats-test';

export async function POST() {
  try {
    // Sample resume data for testing
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

    // Sample job description
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

    // Initialize the simple ATS scorer
    const scorer = new SimpleATSScorer();
    
    // Run the analysis
    const atsScore = scorer.scoreResume(sampleResumeText, sampleJobDescription);

    return NextResponse.json({
      success: true,
      atsScore,
      sampleData: {
        resumeTextLength: sampleResumeText.length,
        jobDescriptionLength: sampleJobDescription.length,
        testType: 'simple'
      }
    });

  } catch (error) {
    console.error('Simple ATS scoring test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Simple ATS Scoring Test endpoint - use POST to run test',
    usage: 'POST to this endpoint to test simple ATS scoring with sample data'
  });
}