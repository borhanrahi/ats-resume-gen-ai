// Simple ATS test without external dependencies
export interface SimpleATSResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  breakdown: {
    textExtraction: number;
    structure: number;
    formatting: number;
    keywords: number;
    content: number;
    language: number;
  };
  feedback: string;
}

export class SimpleATSScorer {
  private actionVerbs = [
    'achieved', 'accomplished', 'delivered', 'exceeded', 'generated', 'increased', 'improved', 'optimized',
    'managed', 'led', 'supervised', 'coordinated', 'directed', 'mentored', 'trained', 'guided',
    'developed', 'created', 'designed', 'built', 'implemented', 'launched', 'established', 'founded',
    'analyzed', 'researched', 'evaluated', 'assessed', 'investigated', 'identified', 'solved', 'resolved',
    'collaborated', 'communicated', 'presented', 'negotiated', 'facilitated', 'supported', 'assisted'
  ];

  private commonSkills = [
    'javascript', 'python', 'java', 'react', 'node', 'angular', 'vue', 'html', 'css', 'sql',
    'mongodb', 'postgresql', 'mysql', 'aws', 'azure', 'docker', 'kubernetes', 'git', 'typescript',
    'project management', 'agile', 'scrum', 'leadership', 'communication', 'teamwork', 'problem solving'
  ];

  scoreResume(resumeText: string, jobDescription?: string): SimpleATSResult {
    const text = resumeText.toLowerCase();
    
    // Text Extraction (20 points) - assume good extraction for text input
    const textExtraction = 18;
    
    // Structure (15 points) - check for key sections
    let structure = 0;
    if (text.includes('experience') || text.includes('work')) structure += 4;
    if (text.includes('education') || text.includes('degree')) structure += 3;
    if (text.includes('skills') || text.includes('technical')) structure += 3;
    if (text.includes('summary') || text.includes('objective')) structure += 3;
    if (text.includes('@') || text.includes('phone')) structure += 2;
    
    // Formatting (20 points) - check for bullet points and structure
    let formatting = 12; // Base score
    const bulletCount = (resumeText.match(/^[\s]*[•\-\*]/gm) || []).length;
    if (bulletCount > 5) formatting += 4;
    else if (bulletCount > 0) formatting += 2;
    
    const lines = resumeText.split('\n');
    const emptyLines = lines.filter(line => line.trim() === '').length;
    if (emptyLines > lines.length * 0.1) formatting += 2;
    
    const shortLines = lines.filter(line => line.trim().length > 0 && line.trim().length < 20).length;
    if (shortLines < lines.length * 0.3) formatting += 2;
    
    // Keywords (20 points) - check for relevant skills
    let keywords = 5; // Base score
    const foundSkills = this.commonSkills.filter(skill => text.includes(skill.toLowerCase()));
    keywords += Math.min(10, foundSkills.length * 2);
    
    // If job description provided, check for matches
    if (jobDescription) {
      const jobLower = jobDescription.toLowerCase();
      const jobSkills = this.commonSkills.filter(skill => jobLower.includes(skill.toLowerCase()));
      const matchedSkills = jobSkills.filter(skill => text.includes(skill.toLowerCase()));
      
      if (jobSkills.length > 0) {
        const matchPercentage = (matchedSkills.length / jobSkills.length) * 100;
        keywords += Math.round(matchPercentage * 0.05); // Up to 5 bonus points
      }
    }
    
    // Content (15 points) - check for action verbs and quantified achievements
    let content = 5; // Base score
    const actionVerbCount = this.actionVerbs.filter(verb => text.includes(verb.toLowerCase())).length;
    content += Math.min(5, actionVerbCount);
    
    const numberMatches = resumeText.match(/\d+[%$]|\d+\s*(percent|years?|months?)|\$\d+/gi) || [];
    content += Math.min(3, numberMatches.length);
    
    const bullets = resumeText.match(/^[\s]*[•\-\*]\s*(.+)$/gm) || [];
    const goodBullets = bullets.filter(bullet => bullet.length > 50 && bullet.length < 200);
    content += Math.min(2, goodBullets.length);
    
    // Language (10 points) - check for professional tone
    let language = 8; // Base score (assume good language)
    const repeatedWords = resumeText.match(/\b(\w+)\s+\1\b/gi) || [];
    language -= Math.min(2, repeatedWords.length);
    
    const firstPersonCount = (resumeText.match(/\b(I|me|my)\b/gi) || []).length;
    if (firstPersonCount > 10) language -= 1;
    if (firstPersonCount > 20) language -= 1;
    
    if (text.includes('responsible for') || text.includes('managed') || text.includes('developed')) {
      language += 1;
    }
    
    // Ensure scores don't exceed maximums
    structure = Math.min(15, structure);
    formatting = Math.min(20, formatting);
    keywords = Math.min(20, keywords);
    content = Math.min(15, content);
    language = Math.max(0, Math.min(10, language));
    
    const totalScore = textExtraction + structure + formatting + keywords + content + language;
    const maxScore = 100;
    const percentage = Math.round((totalScore / maxScore) * 100);
    
    let feedback = `Your resume scored ${totalScore}/100 (${percentage}%). `;
    if (percentage >= 80) {
      feedback += "Excellent! Your resume is well-optimized for ATS systems.";
    } else if (percentage >= 60) {
      feedback += "Good foundation, but there's room for improvement.";
    } else {
      feedback += "Significant improvements needed for better ATS compatibility.";
    }
    
    return {
      totalScore,
      maxScore,
      percentage,
      breakdown: {
        textExtraction,
        structure,
        formatting,
        keywords,
        content,
        language
      },
      feedback
    };
  }
}