import { ModelConfig } from '../models-storage';
import { ATSScoreResult, ParsedDocument } from './ats-scoring-engine';
import { geminiService } from '../gemini';

export interface AISuggestion {
  category: 'content' | 'formatting' | 'keywords' | 'structure';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  example?: string;
  impact: string;
}

export class AIIntegration {
  
  async generateSuggestions(
    model: ModelConfig,
    parsedDocument: ParsedDocument,
    atsScore: ATSScoreResult,
    jobDescription?: string,
    userTier: 'free' | 'premium' = 'free'
  ): Promise<AISuggestion[]> {
    try {
      // Build comprehensive prompt for AI
      const prompt = this.buildPrompt(parsedDocument, atsScore, jobDescription);
      
      let aiResponse: string;
      
      // Use the appropriate AI service based on model type
      if (model.provider === 'gemini') {
        aiResponse = await geminiService.generateContent(prompt, model.name);
      } else if (model.provider === 'openrouter') {
        aiResponse = await this.callOpenRouter(model, prompt);
      } else {
        throw new Error(`Unsupported AI provider: ${model.provider}`);
      }
      
      // Parse AI response to structured suggestions
      const suggestions = this.parseAIResponse(aiResponse);
      
      // Limit suggestions based on user tier
      const maxSuggestions = userTier === 'free' ? 5 : 15;
      return suggestions.slice(0, maxSuggestions);
      
    } catch (error) {
      console.error('AI suggestion generation failed:', error);
      // Return fallback suggestions based on ATS analysis
      return this.generateFallbackSuggestions(atsScore, userTier);
    }
  }
  
  private buildPrompt(
    parsedDocument: ParsedDocument,
    atsScore: ATSScoreResult,
    jobDescription?: string
  ): string {
    const resumeText = parsedDocument.text.substring(0, 2000); // Limit text length
    
    let prompt = `You are an expert ATS resume optimization consultant. Analyze this resume and provide specific, actionable suggestions to improve its ATS compatibility and overall effectiveness.

RESUME CONTENT:
${resumeText}

CURRENT ATS ANALYSIS:
- Overall Score: ${atsScore.percentage}% (${atsScore.totalScore}/${atsScore.maxScore})
- Text Extraction: ${atsScore.dimensions.textExtraction.percentage}%
- Structure & Sections: ${atsScore.dimensions.structure.percentage}%
- Formatting: ${atsScore.dimensions.formatting.percentage}%
- Keywords: ${atsScore.dimensions.keywords.percentage}%
- Content Impact: ${atsScore.dimensions.content.percentage}%
- Language & Grammar: ${atsScore.dimensions.language.percentage}%

IDENTIFIED ISSUES:
${atsScore.penalties.map(p => `- ${p.description} (-${p.points} points)`).join('\n')}
`;

    if (jobDescription) {
      prompt += `\nTARGET JOB DESCRIPTION:
${jobDescription.substring(0, 1000)}
`;
    }

    prompt += `\nPlease provide 8-12 specific, actionable suggestions in the following JSON format:
[
  {
    "category": "content|formatting|keywords|structure",
    "priority": "high|medium|low",
    "title": "Brief title of the suggestion",
    "description": "Detailed explanation of what to improve and why",
    "example": "Specific example of how to implement this suggestion",
    "impact": "Expected improvement in ATS score or job application success"
  }
]

Focus on the lowest-scoring dimensions first. Provide concrete, specific examples rather than generic advice.`;

    return prompt;
  }
  
  private async callOpenRouter(model: ModelConfig, prompt: string): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenRouter API key not found in environment variables');
    }
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'ATS Resume Analyzer'
      },
      body: JSON.stringify({
        model: model.name,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenRouter API');
    }
    
    return data.choices[0].message.content;
  }
  
  private parseAIResponse(aiResponse: string): AISuggestion[] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in AI response');
      }
      
      const suggestions = JSON.parse(jsonMatch[0]);
      
      // Validate and normalize suggestions
      return suggestions.map((suggestion: any) => ({
        category: suggestion.category || 'content',
        priority: suggestion.priority || 'medium',
        title: suggestion.title || 'Improvement Suggestion',
        description: suggestion.description || 'No description provided',
        example: suggestion.example,
        impact: suggestion.impact || 'May improve your ATS score'
      })).filter((s: AISuggestion) => 
        s.title && s.description && 
        ['content', 'formatting', 'keywords', 'structure'].includes(s.category) &&
        ['high', 'medium', 'low'].includes(s.priority)
      );
      
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Failed to parse AI suggestions');
    }
  }
  
  private generateFallbackSuggestions(
    atsScore: ATSScoreResult,
    userTier: 'free' | 'premium'
  ): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    
    // Generate suggestions based on lowest-scoring dimensions
    const dimensions = [
      { name: 'textExtraction', score: atsScore.dimensions.textExtraction },
      { name: 'structure', score: atsScore.dimensions.structure },
      { name: 'formatting', score: atsScore.dimensions.formatting },
      { name: 'keywords', score: atsScore.dimensions.keywords },
      { name: 'content', score: atsScore.dimensions.content },
      { name: 'language', score: atsScore.dimensions.language }
    ].sort((a, b) => a.score.percentage - b.score.percentage);
    
    // Focus on the 3 lowest-scoring dimensions
    for (const dim of dimensions.slice(0, 3)) {
      const suggestion = this.getDimensionSuggestion(dim.name, dim.score.percentage);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }
    
    // Add penalty-specific suggestions
    for (const penalty of atsScore.penalties.slice(0, 3)) {
      const suggestion = this.getPenaltySuggestion(penalty);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }
    
    const maxSuggestions = userTier === 'free' ? 5 : 15;
    return suggestions.slice(0, maxSuggestions);
  }
  
  private getDimensionSuggestion(dimension: string, percentage: number): AISuggestion | null {
    const suggestionMap: Record<string, AISuggestion> = {
      textExtraction: {
        category: 'formatting',
        priority: 'high',
        title: 'Improve Text Extraction',
        description: 'Your resume may have formatting issues that prevent ATS systems from reading it properly. Use standard fonts, avoid complex layouts, and ensure text is selectable.',
        example: 'Convert your resume to a simple, single-column format with standard fonts like Arial or Calibri',
        impact: 'Could improve your score by 15-20 points'
      },
      structure: {
        category: 'structure',
        priority: 'high',
        title: 'Enhance Resume Structure',
        description: 'Add clear section headings and organize your content in a logical order. Include standard sections like Contact Info, Summary, Experience, Education, and Skills.',
        example: 'Use headings like "Professional Experience", "Education", "Skills" instead of creative alternatives',
        impact: 'Could improve your score by 10-15 points'
      },
      formatting: {
        category: 'formatting',
        priority: 'medium',
        title: 'Optimize Formatting',
        description: 'Ensure consistent formatting throughout your resume. Use bullet points, maintain consistent spacing, and avoid graphics or tables that ATS cannot read.',
        example: 'Use simple bullet points (•) instead of custom symbols or graphics',
        impact: 'Could improve your score by 8-12 points'
      },
      keywords: {
        category: 'keywords',
        priority: 'high',
        title: 'Optimize Keywords',
        description: 'Include more relevant industry keywords and skills throughout your resume, especially in your experience descriptions.',
        example: 'If applying for a software role, include specific technologies, programming languages, and methodologies',
        impact: 'Could improve your score by 15-25 points'
      },
      content: {
        category: 'content',
        priority: 'medium',
        title: 'Strengthen Content Impact',
        description: 'Add quantified achievements and use strong action verbs. Focus on results and impact rather than just responsibilities.',
        example: 'Instead of "Managed projects" write "Led 5 cross-functional projects, delivering 20% faster than deadline"',
        impact: 'Could improve your score by 10-18 points'
      },
      language: {
        category: 'content',
        priority: 'low',
        title: 'Improve Language Quality',
        description: 'Review your resume for grammar, spelling, and professional tone. Use active voice and industry-appropriate terminology.',
        example: 'Use tools like Grammarly or have someone proofread your resume',
        impact: 'Could improve your score by 5-10 points'
      }
    };
    
    return suggestionMap[dimension] || null;
  }
  
  private getPenaltySuggestion(penalty: any): AISuggestion | null {
    // Generate suggestions based on specific penalties
    if (penalty.description.toLowerCase().includes('contact')) {
      return {
        category: 'structure',
        priority: 'high',
        title: 'Fix Contact Information',
        description: 'Ensure your contact information is complete and properly placed at the top of your resume.',
        example: 'Include your full name, phone number, email, and location at the very top',
        impact: 'Essential for recruiters to contact you'
      };
    }
    
    if (penalty.description.toLowerCase().includes('keyword')) {
      return {
        category: 'keywords',
        priority: 'high',
        title: 'Address Keyword Issues',
        description: penalty.description,
        example: 'Review the job description and naturally incorporate relevant terms',
        impact: `Could recover ${penalty.points} points`
      };
    }
    
    return null;
  }
}

// Export singleton instance
export const aiIntegration = new AIIntegration();
