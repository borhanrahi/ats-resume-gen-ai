import { OpenRouterClient } from './openRouterClient';
import { GeminiClient } from './geminiClient';
import type { 
  AIResumePrompt, 
  AIGeneratedContent, 
  KeywordOptimization,
  ReanalysisResult,
  AIGeneratedExperience 
} from '@/types/ai-builder';
import type { ResumeData } from '@/types/resume';
import type { ATSAnalysis } from '@/types/analysis';

export interface AIBuilderConfig {
  tier: 'premium';
  openRouterConfig: {
    apiKey: string;
    model?: string;
  };
  geminiConfig?: {
    apiKey: string;
    model?: string;
  };
}

export class AIResumeBuilder {
  private openRouterClient: OpenRouterClient;
  private geminiClient?: GeminiClient;

  constructor(config: AIBuilderConfig) {
    this.openRouterClient = new OpenRouterClient({
      apiKey: config.openRouterConfig.apiKey,
      model: config.openRouterConfig.model || 'anthropic/claude-3.5-sonnet',
    });

    if (config.geminiConfig) {
      this.geminiClient = new GeminiClient(config.geminiConfig);
    }
  }

  /**
   * Generate resume content based on user prompt
   */
  async generateResumeContent(prompt: AIResumePrompt): Promise<AIGeneratedContent> {
    try {
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(prompt);

      const response = await this.openRouterClient.makeRequest({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 3000,
        temperature: 0.7,
      });

      return this.parseGeneratedContent(response);
    } catch (error) {
      throw new Error(`AI resume generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Optimize existing resume content with keywords
   */
  async optimizeWithKeywords(
    resumeContent: string,
    targetKeywords: string[],
    jobDescription?: string
  ): Promise<KeywordOptimization> {
    try {
      const optimizationPrompt = this.buildKeywordOptimizationPrompt(
        resumeContent,
        targetKeywords,
        jobDescription
      );

      const response = await this.openRouterClient.makeRequest({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'system',
            content: 'You are an expert resume optimizer specializing in keyword integration and ATS optimization. Provide detailed keyword optimization suggestions.'
          },
          { role: 'user', content: optimizationPrompt }
        ],
        max_tokens: 2500,
        temperature: 0.3,
      });

      return this.parseKeywordOptimization(response);
    } catch (error) {
      throw new Error(`Keyword optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Re-analyze resume after optimization
   */
  async reanalyzeOptimizedResume(
    originalResume: string,
    optimizedResume: string,
    jobDescription?: string
  ): Promise<ReanalysisResult> {
    try {
      // This would typically use the existing analysis engine
      // For now, we'll create a simplified version
      const analysisPrompt = this.buildReanalysisPrompt(
        originalResume,
        optimizedResume,
        jobDescription
      );

      const response = await this.openRouterClient.makeRequest({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'system',
            content: 'You are an ATS analysis expert. Compare resume versions and provide detailed improvement metrics.'
          },
          { role: 'user', content: analysisPrompt }
        ],
        max_tokens: 1500,
        temperature: 0.2,
      });

      return this.parseReanalysisResult(response);
    } catch (error) {
      throw new Error(`Re-analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build system prompt for resume generation
   */
  private buildSystemPrompt(): string {
    return `You are an expert resume writer and career coach with extensive experience in creating ATS-optimized resumes across various industries. Your expertise includes:

1. Understanding ATS systems and keyword optimization
2. Crafting compelling professional summaries
3. Writing achievement-focused experience descriptions
4. Optimizing content for specific job roles and industries
5. Balancing keyword density with natural language

Guidelines for resume generation:
- Use action verbs and quantifiable achievements
- Incorporate industry-specific keywords naturally
- Maintain professional tone while showing personality
- Focus on results and impact, not just responsibilities
- Ensure ATS compatibility with proper formatting
- Tailor content to the specific job and industry
- Keep descriptions concise but impactful

Always respond with valid JSON in the specified format.`;
  }

  /**
   * Build user prompt for resume generation
   */
  private buildUserPrompt(prompt: AIResumePrompt): string {
    return `Generate professional resume content based on the following information:

**Target Position:** ${prompt.jobTitle}
**Industry:** ${prompt.industry}
**Experience Level:** ${prompt.experienceLevel}
**Target Company:** ${prompt.targetCompany || 'Not specified'}

**Job Description/Requirements:**
${prompt.jobDescription || 'Not provided'}

**Key Skills to Highlight:**
${prompt.keySkills.join(', ')}

**Work History:**
${prompt.workHistory.map(work => `
- ${work.position} at ${work.company} (${work.duration})
  Responsibilities: ${work.keyResponsibilities.join(', ')}
  ${work.achievements ? `Achievements: ${work.achievements.join(', ')}` : ''}
`).join('\n')}

**Education:**
${prompt.education.map(edu => `
- ${edu.degree} in ${edu.field} from ${edu.institution} (${edu.year})
  ${edu.gpa ? `GPA: ${edu.gpa}` : ''}
  ${edu.honors ? `Honors: ${edu.honors.join(', ')}` : ''}
`).join('\n')}

**Content Preferences:**
- Tone: ${prompt.preferences.tone}
- Length: ${prompt.preferences.length}
- Focus: ${prompt.preferences.focus}

Please generate resume content in the following JSON format:
{
  "summary": "Professional summary paragraph",
  "experience": [
    {
      "company": "Company Name",
      "position": "Job Title",
      "duration": "Start - End",
      "description": "Brief role description",
      "bulletPoints": ["Achievement 1", "Achievement 2", "Achievement 3"],
      "keyAchievements": ["Major achievement 1", "Major achievement 2"]
    }
  ],
  "skills": {
    "technical": ["Technical skill 1", "Technical skill 2"],
    "soft": ["Soft skill 1", "Soft skill 2"],
    "industry": ["Industry skill 1", "Industry skill 2"]
  },
  "achievements": ["Notable achievement 1", "Notable achievement 2"],
  "keywords": ["Important keyword 1", "Important keyword 2"],
  "suggestions": ["Improvement suggestion 1", "Improvement suggestion 2"]
}

Focus on creating compelling, ATS-optimized content that highlights the candidate's value proposition for the target role.`;
  }

  /**
   * Build keyword optimization prompt
   */
  private buildKeywordOptimizationPrompt(
    resumeContent: string,
    targetKeywords: string[],
    jobDescription?: string
  ): string {
    return `Optimize the following resume content by naturally integrating the target keywords while maintaining readability and professional tone.

**Current Resume Content:**
${resumeContent}

**Target Keywords to Integrate:**
${targetKeywords.join(', ')}

${jobDescription ? `**Job Description for Context:**\n${jobDescription}\n` : ''}

**Optimization Requirements:**
1. Integrate keywords naturally without keyword stuffing
2. Maintain the original meaning and achievements
3. Improve ATS compatibility
4. Enhance overall impact and readability
5. Provide specific improvements with explanations

Please provide optimization results in the following JSON format:
{
  "currentKeywords": ["existing keyword 1", "existing keyword 2"],
  "suggestedKeywords": ["suggested keyword 1", "suggested keyword 2"],
  "missingKeywords": ["missing keyword 1", "missing keyword 2"],
  "keywordDensity": 2.5,
  "optimizedContent": {
    "summary": "Optimized professional summary",
    "experience": ["Optimized experience bullet 1", "Optimized experience bullet 2"],
    "skills": ["Optimized skill 1", "Optimized skill 2"]
  },
  "improvements": [
    {
      "section": "summary",
      "original": "Original text",
      "optimized": "Optimized text",
      "addedKeywords": ["keyword1", "keyword2"],
      "impact": "high"
    }
  ]
}`;
  }

  /**
   * Build re-analysis prompt
   */
  private buildReanalysisPrompt(
    originalResume: string,
    optimizedResume: string,
    jobDescription?: string
  ): string {
    return `Compare these two resume versions and provide detailed improvement analysis:

**Original Resume:**
${originalResume}

**Optimized Resume:**
${optimizedResume}

${jobDescription ? `**Job Description for Reference:**\n${jobDescription}\n` : ''}

Analyze the improvements and provide metrics in the following JSON format:
{
  "originalScore": 75,
  "optimizedScore": 88,
  "improvement": 13,
  "keywordMatch": {
    "before": 65,
    "after": 85
  },
  "recommendations": [
    "Specific recommendation 1",
    "Specific recommendation 2"
  ]
}

Focus on quantifiable improvements in ATS compatibility, keyword matching, and overall effectiveness.`;
  }

  /**
   * Parse generated content response
   */
  private parseGeneratedContent(response: any): AIGeneratedContent {
    try {
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in AI response');
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        summary: parsed.summary || '',
        experience: this.validateExperience(parsed.experience || []),
        skills: {
          technical: Array.isArray(parsed.skills?.technical) ? parsed.skills.technical : [],
          soft: Array.isArray(parsed.skills?.soft) ? parsed.skills.soft : [],
          industry: Array.isArray(parsed.skills?.industry) ? parsed.skills.industry : [],
        },
        achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      };
    } catch (error) {
      throw new Error(`Failed to parse AI generated content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse keyword optimization response
   */
  private parseKeywordOptimization(response: any): KeywordOptimization {
    try {
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in optimization response');
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in optimization response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        currentKeywords: Array.isArray(parsed.currentKeywords) ? parsed.currentKeywords : [],
        suggestedKeywords: Array.isArray(parsed.suggestedKeywords) ? parsed.suggestedKeywords : [],
        missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : [],
        keywordDensity: typeof parsed.keywordDensity === 'number' ? parsed.keywordDensity : 0,
        optimizedContent: {
          summary: parsed.optimizedContent?.summary || '',
          experience: Array.isArray(parsed.optimizedContent?.experience) ? parsed.optimizedContent.experience : [],
          skills: Array.isArray(parsed.optimizedContent?.skills) ? parsed.optimizedContent.skills : [],
        },
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements.map(imp => ({
          section: ['summary', 'experience', 'skills'].includes(imp.section) ? imp.section : 'summary',
          original: imp.original || '',
          optimized: imp.optimized || '',
          addedKeywords: Array.isArray(imp.addedKeywords) ? imp.addedKeywords : [],
          impact: ['low', 'medium', 'high'].includes(imp.impact) ? imp.impact : 'medium',
        })) : [],
      };
    } catch (error) {
      throw new Error(`Failed to parse keyword optimization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse re-analysis result
   */
  private parseReanalysisResult(response: any): ReanalysisResult {
    try {
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in re-analysis response');
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in re-analysis response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        originalScore: typeof parsed.originalScore === 'number' ? parsed.originalScore : 0,
        optimizedScore: typeof parsed.optimizedScore === 'number' ? parsed.optimizedScore : 0,
        improvement: typeof parsed.improvement === 'number' ? parsed.improvement : 0,
        keywordMatch: {
          before: typeof parsed.keywordMatch?.before === 'number' ? parsed.keywordMatch.before : 0,
          after: typeof parsed.keywordMatch?.after === 'number' ? parsed.keywordMatch.after : 0,
        },
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      };
    } catch (error) {
      throw new Error(`Failed to parse re-analysis result: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate experience data
   */
  private validateExperience(experience: any[]): AIGeneratedExperience[] {
    return experience
      .filter(exp => exp && typeof exp === 'object')
      .map(exp => ({
        company: exp.company || '',
        position: exp.position || '',
        duration: exp.duration || '',
        description: exp.description || '',
        bulletPoints: Array.isArray(exp.bulletPoints) ? exp.bulletPoints : [],
        keyAchievements: Array.isArray(exp.keyAchievements) ? exp.keyAchievements : [],
      }));
  }

  /**
   * Convert AI generated content to ResumeData format
   */
  convertToResumeData(
    generatedContent: AIGeneratedContent,
    contactInfo: any
  ): ResumeData {
    return {
      id: `ai-generated-${Date.now()}`,
      content: this.buildResumeText(generatedContent, contactInfo),
      metadata: {
        fileName: 'ai-generated-resume.pdf',
        fileType: 'pdf',
        uploadDate: new Date(),
        wordCount: this.calculateWordCount(generatedContent),
      },
      sections: {
        contact: contactInfo,
        summary: generatedContent.summary,
        experience: generatedContent.experience.map((exp, index) => ({
          id: `exp-${index}`,
          company: exp.company,
          position: exp.position,
          startDate: exp.duration.split(' - ')[0] || '',
          endDate: exp.duration.split(' - ')[1] || '',
          description: exp.description,
          achievements: [...exp.bulletPoints, ...exp.keyAchievements],
        })),
        education: [], // Would be populated from prompt data
        skills: [
          ...generatedContent.skills.technical,
          ...generatedContent.skills.soft,
          ...generatedContent.skills.industry,
        ],
        certifications: [],
      },
    };
  }

  /**
   * Build resume text from generated content
   */
  private buildResumeText(content: AIGeneratedContent, contactInfo: any): string {
    let text = '';
    
    // Contact info
    if (contactInfo) {
      text += `${contactInfo.name}\n${contactInfo.email} | ${contactInfo.phone}\n`;
      if (contactInfo.location) text += `${contactInfo.location}\n`;
      text += '\n';
    }

    // Summary
    text += `PROFESSIONAL SUMMARY\n${content.summary}\n\n`;

    // Experience
    if (content.experience.length > 0) {
      text += 'PROFESSIONAL EXPERIENCE\n';
      content.experience.forEach(exp => {
        text += `${exp.position} | ${exp.company}\n${exp.duration}\n`;
        text += `${exp.description}\n`;
        exp.bulletPoints.forEach(bullet => {
          text += `• ${bullet}\n`;
        });
        text += '\n';
      });
    }

    // Skills
    const allSkills = [
      ...content.skills.technical,
      ...content.skills.soft,
      ...content.skills.industry,
    ];
    if (allSkills.length > 0) {
      text += `SKILLS\n${allSkills.join(', ')}\n\n`;
    }

    return text;
  }

  /**
   * Calculate word count for generated content
   */
  private calculateWordCount(content: AIGeneratedContent): number {
    let wordCount = 0;
    
    wordCount += content.summary.split(/\s+/).length;
    
    content.experience.forEach(exp => {
      wordCount += exp.description.split(/\s+/).length;
      exp.bulletPoints.forEach(bullet => {
        wordCount += bullet.split(/\s+/).length;
      });
    });

    return wordCount;
  }
}