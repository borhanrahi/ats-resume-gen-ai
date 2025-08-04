import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = 'AIzaSyCLJWOfkLrCqQLopTVmgOx1I8XO_mmqGa4';

export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string = GEMINI_API_KEY) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateContent(prompt: string, modelName: string = 'gemini-1.5-flash') {
    try {
      if (!prompt || prompt.trim().length === 0) {
        throw new Error('Prompt cannot be empty');
      }

      const model = this.genAI.getGenerativeModel({ model: modelName });
      
      // Add safety settings to avoid content policy issues
      const generationConfig = {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      };

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });

      const response = result.response;
      const text = response.text();
      
      if (!text || text.trim().length === 0) {
        throw new Error('Empty response from Gemini API');
      }
      
      return text;
    } catch (error) {
      console.error('Gemini API error:', error);
      
      // Handle specific Gemini API errors
      if (error instanceof Error) {
        if (error.message.includes('API_KEY_INVALID')) {
          throw new Error('Invalid Gemini API key');
        }
        if (error.message.includes('QUOTA_EXCEEDED')) {
          throw new Error('Gemini API quota exceeded');
        }
        if (error.message.includes('SAFETY')) {
          throw new Error('Content blocked by Gemini safety filters');
        }
        throw new Error(`Gemini API error: ${error.message}`);
      }
      
      throw new Error('Unknown error occurred with Gemini API');
    }
  }

  async analyzeResume(resumeText: string, jobDescription?: string) {
    const prompt = jobDescription 
      ? `Analyze this resume against the job description and provide ATS optimization suggestions:

Resume:
${resumeText}

Job Description:
${jobDescription}

Please provide:
1. ATS compatibility score (0-100)
2. Keyword match analysis
3. Skills gap identification
4. Specific improvement recommendations
5. Format and structure feedback

Format your response as JSON with these fields: score, keywordMatches, skillsGaps, recommendations, formatFeedback.`
      : `Analyze this resume for ATS compatibility and provide optimization suggestions:

Resume:
${resumeText}

Please provide:
1. ATS compatibility score (0-100)
2. Format and structure analysis
3. Content quality assessment
4. Grammar and readability check
5. Specific improvement recommendations

Format your response as JSON with these fields: score, formatAnalysis, contentQuality, grammarCheck, recommendations.`;

    return this.generateContent(prompt);
  }

  async testConnection() {
    try {
      const result = await this.generateContent('Say "Connection successful" to confirm the API is working.');
      return { success: true, response: result };
    } catch (error) {
      console.error('Gemini test connection error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error connecting to Gemini API' 
      };
    }
  }
}

export const geminiService = new GeminiService();