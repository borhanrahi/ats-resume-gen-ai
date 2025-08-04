import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage for demo (replace with database later)
const analysisResults = new Map();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const analysisType = formData.get('analysisType') as string;
    const jobDescription = formData.get('jobDescription') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Generate analysis ID
    const analysisId = uuidv4();

    // Parse file content (simplified for demo)
    const buffer = await file.arrayBuffer();
    const fileContent = await parseDocument(buffer, file.type);

    // Get AI analysis
    const analysis = await analyzeWithAI(fileContent, analysisType, jobDescription);

    // Store results (both in memory and return for localStorage)
    const result = {
      id: analysisId,
      fileName: file.name,
      fileType: file.type,
      analysisType,
      jobDescription: analysisType === 'job' ? jobDescription : null,
      analysis,
      createdAt: new Date().toISOString(),
    };
    
    analysisResults.set(analysisId, result);

    return NextResponse.json({ 
      analysisId,
      result // Return result for localStorage storage
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const analysisId = searchParams.get('id');

  if (!analysisId) {
    return NextResponse.json({ error: 'Analysis ID required' }, { status: 400 });
  }

  const result = analysisResults.get(analysisId);
  if (!result) {
    return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
  }

  return NextResponse.json(result);
}

async function parseDocument(buffer: ArrayBuffer, fileType: string): Promise<string> {
  // Simplified document parsing (implement proper parsing later)
  if (fileType === 'application/pdf') {
    // TODO: Implement PDF parsing with pdfjs-dist
    return 'Sample resume content from PDF...';
  } else if (fileType.includes('word')) {
    // TODO: Implement DOCX parsing with mammoth
    return 'Sample resume content from Word document...';
  }
  return 'Sample resume content...';
}

async function analyzeWithAI(content: string, analysisType: string, jobDescription?: string) {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  
  if (!openRouterKey && !geminiKey) {
    throw new Error('No AI API keys configured');
  }

  // Get current model configuration
  const modelConfig = await getCurrentModelConfig();
  
  const prompt = analysisType === 'job' 
    ? `Analyze this resume against the job description and provide detailed feedback:

Resume Content:
${content}

Job Description:
${jobDescription}

Please provide:
1. Overall match percentage (0-100)
2. ATS compatibility score (0-100)
3. Found keywords that match the job
4. Missing keywords from the job description
5. Specific recommendations for improvement
6. Grammar and formatting issues

Format the response as JSON.`
    : `Analyze this resume for ATS compatibility and provide detailed feedback:

Resume Content:
${content}

Please provide:
1. ATS compatibility score (0-100)
2. Format and structure analysis
3. Grammar and content review
4. Keyword density analysis
5. Specific recommendations for improvement
6. Overall assessment

Format the response as JSON.`;

  // Try models with fallback chain
  const modelsToTry = [modelConfig.models[0], ...modelConfig.fallbacks];
  
  for (let i = 0; i < modelsToTry.length; i++) {
    const currentModel = modelsToTry[i];
    
    try {
      console.log(`Trying model ${i + 1}/${modelsToTry.length}: ${currentModel}`);
      
      // Check if it's a Gemini model
      if (currentModel.includes('gemini') && geminiKey) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are an expert ATS (Applicant Tracking System) resume analyzer. Provide detailed, actionable feedback to help job seekers improve their resumes.\n\n${prompt}`
              }]
            }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 2000,
            }
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const aiResponse = data.candidates[0]?.content?.parts[0]?.text;
          console.log(`Successfully used Gemini model: ${currentModel}`);
          return parseAIResponse(aiResponse, analysisType);
        }
      } else if (openRouterKey) {
        // Use OpenRouter for other models
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'X-Title': 'ATS Resume Checker',
          },
          body: JSON.stringify({
            model: currentModel,
            messages: [
              {
                role: 'system',
                content: 'You are an expert ATS (Applicant Tracking System) resume analyzer. Provide detailed, actionable feedback to help job seekers improve their resumes.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.3,
            max_tokens: 2000,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const aiResponse = data.choices[0]?.message?.content;
          console.log(`Successfully used model: ${currentModel}`);
          return parseAIResponse(aiResponse, analysisType);
        }
      }
      
      console.log(`Model ${currentModel} failed`);
      if (i === modelsToTry.length - 1) {
        throw new Error(`All models failed`);
      }
      continue; // Try next model
    } catch (error) {
      console.log(`Model ${currentModel} error:`, error);
      if (i === modelsToTry.length - 1) {
        console.error('All AI models failed, returning mock data');
        return getMockAnalysis(analysisType);
      }
      continue; // Try next model
    }
  }
  
  // Fallback to mock data if all models fail
  return getMockAnalysis(analysisType);
}



async function getCurrentModelConfig() {
  try {
    // Get model configuration from admin settings
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/models`);
    const { models } = await response.json();
    
    // Get active free tier models sorted by priority
    const freeModels = models
      .filter((m: { tier: string; isActive: boolean }) => m.tier === 'free' && m.isActive)
      .sort((a: { priority: number }, b: { priority: number }) => a.priority - b.priority);
    
    return {
      models: freeModels.map((m: { model: string }) => m.model),
      fallbacks: freeModels.slice(1).map((m: { model: string }) => m.model),
    };
  } catch (error) {
    console.error('Failed to get model config:', error);
    return {
      models: ['moonshotai/kimi-k2:free', 'z-ai/glm-4.5-air:free', 'openai/gpt-3.5-turbo'],
      fallbacks: ['z-ai/glm-4.5-air:free', 'openai/gpt-3.5-turbo', 'anthropic/claude-3-haiku'],
    };
  }
}

function parseAIResponse(response: string, analysisType: string) {
  try {
    return JSON.parse(response);
  } catch {
    // If JSON parsing fails, return structured mock data
    return getMockAnalysis(analysisType);
  }
}

function getMockAnalysis(analysisType: string) {
  const baseAnalysis = {
    atsScore: 78,
    breakdown: {
      formatting: 85,
      keywords: 72,
      structure: 80,
      length: 75,
    },
    recommendations: [
      {
        id: '1',
        category: 'formatting',
        priority: 'high',
        title: 'Use Standard Section Headers',
        description: 'Your resume uses non-standard section headers that ATS systems might not recognize.',
        suggestion: 'Use standard headers like "Work Experience", "Education", "Skills" instead of creative alternatives.',
        impact: 'This could improve your ATS score by 10-15 points.',
      },
      {
        id: '2',
        category: 'keywords',
        priority: 'medium',
        title: 'Add More Industry Keywords',
        description: 'Your resume lacks important industry-specific keywords.',
        suggestion: 'Include more relevant technical skills and industry buzzwords naturally in your content.',
        impact: 'Adding 5-7 relevant keywords could boost your match rate significantly.',
      },
    ],
    grammarIssues: [
      {
        id: '1',
        type: 'grammar',
        text: 'Managed team of developers',
        suggestion: 'Managed a team of developers',
        position: { start: 150, end: 175 },
        severity: 'low',
      },
    ],
  };

  if (analysisType === 'job') {
    return {
      ...baseAnalysis,
      matchPercentage: 82,
      keywordMatch: {
        found: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Git'],
        missing: ['TypeScript', 'Docker', 'AWS', 'GraphQL'],
        matchPercentage: 65,
        density: 12,
        suggestions: ['Add TypeScript experience', 'Mention cloud platforms like AWS', 'Include containerization tools'],
      },
    };
  }

  return baseAnalysis;
}