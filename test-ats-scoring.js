// Test ATS Scoring with Sample Resume Data
console.log('=== ATS SCORING TEST ===');

// Sample resume text that should score well
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

// Mock parsed document structure
const mockParsedDocument = {
  text: sampleResumeText,
  fileType: 'pdf',
  extractionRate: 0.95,
  hasHiddenText: false,
  encoding: 'standard',
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
      position: 'top'
    },
    hasProperHeadings: true
  },
  formatting: {
    layout: 'single-column',
    hasGraphics: false,
    hasTables: false,
    fontConsistency: 'good',
    spacing: 'good'
  }
};

console.log('Sample Resume Text Length:', sampleResumeText.length);
console.log('Sample Job Description Length:', sampleJobDescription.length);
console.log('Mock Document Structure:', JSON.stringify(mockParsedDocument.structure, null, 2));
console.log('Mock Document Formatting:', JSON.stringify(mockParsedDocument.formatting, null, 2));

// Test bullet point extraction
const bulletRegex = /^[\s]*[•\-\*]\s*(.+)$/gm;
const bullets = sampleResumeText.match(bulletRegex) || [];
console.log('Extracted Bullets:', bullets.length);
bullets.forEach((bullet, index) => {
  console.log(`  ${index + 1}. ${bullet.trim()}`);
});

// Test action verb detection
const actionVerbs = [
  'achieved', 'accomplished', 'attained', 'completed', 'delivered', 'exceeded', 'generated', 'increased', 'maximized', 'produced', 'reduced', 'saved',
  'administered', 'coordinated', 'delegated', 'directed', 'guided', 'led', 'managed', 'mentored', 'oversaw', 'supervised', 'trained',
  'analyzed', 'assessed', 'calculated', 'diagnosed', 'evaluated', 'examined', 'identified', 'investigated', 'researched', 'solved', 'tested',
  'built', 'created', 'designed', 'developed', 'engineered', 'established', 'founded', 'implemented', 'initiated', 'launched', 'pioneered',
  'collaborated', 'communicated', 'consulted', 'facilitated', 'negotiated', 'presented', 'promoted', 'recommended', 'reported', 'supported'
];

const actionVerbCount = bullets.filter(bullet =>
  actionVerbs.some(verb => 
    bullet.toLowerCase().trim().startsWith(verb.toLowerCase())
  )
).length;

console.log('Action Verbs Found:', actionVerbCount);

// Test quantified achievements
const quantifiedBullets = bullets.filter(bullet => 
  /\d+[%$#]|\d+\s*(percent|dollars?|times?|years?|months?)|\$\d+|[0-9,]+\+?/i.test(bullet)
).length;

console.log('Quantified Achievements Found:', quantifiedBullets);

// Test keyword extraction from job description
const keywords = [];
const techSkills = ['javascript', 'typescript', 'react', 'node', 'aws', 'docker', 'rest', 'api'];
const businessSkills = ['leadership', 'mentoring', 'agile', 'team'];

const lowerJobDesc = sampleJobDescription.toLowerCase();
for (const skill of [...techSkills, ...businessSkills]) {
  if (lowerJobDesc.includes(skill)) {
    keywords.push(skill.charAt(0).toUpperCase() + skill.slice(1));
  }
}

console.log('Keywords Extracted from Job Description:', keywords);

// Test keyword matching in resume
const resumeText = sampleResumeText.toLowerCase();
const matchedKeywords = keywords.filter(keyword => 
  resumeText.includes(keyword.toLowerCase())
);

console.log('Keywords Found in Resume:', matchedKeywords);
console.log('Keyword Match Percentage:', Math.round((matchedKeywords.length / keywords.length) * 100) + '%');

console.log('\n=== EXPECTED ATS SCORING ===');
console.log('Text Extraction: Should score 18-20/20 (good extraction rate, standard encoding)');
console.log('Structure: Should score 12-15/15 (all sections present, contact info at top)');
console.log('Formatting: Should score 18-20/20 (single column, no graphics, good spacing)');
console.log('Keywords: Should score 15-20/20 (good keyword matching with job description)');
console.log('Content: Should score 12-15/15 (action verbs, quantified achievements)');
console.log('Language: Should score 8-10/10 (professional tone, good grammar)');
console.log('Expected Total: 83-100/100 (83-100%)');
