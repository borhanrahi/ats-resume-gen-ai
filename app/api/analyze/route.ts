import { NextRequest, NextResponse } from 'next/server';
import { analysisEngine, AnalysisRequest } from '../../../lib/analysis/analysis-engine';
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

    console.log(`Starting analysis for file: ${file.name}, type: ${analysisType}`);

    // Create analysis request
    const analysisRequest: AnalysisRequest = {
      resumeFile: file,
      jobDescription: analysisType === 'job' ? jobDescription : undefined,
      targetKeywords: [],
      userTier: 'free' // Default to free tier, can be upgraded later
    };

    // Use our new analysis engine
    const analysis = await analysisEngine.analyzeResume(analysisRequest);

    console.log(`Analysis completed for ${file.name}:`, {
      isValidResume: analysis.isValidResume,
      hasAtsScore: !!analysis.atsScore,
      suggestionsCount: analysis.aiSuggestions.length,
      processingTime: analysis.processingTime
    });

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
    console.error('Analysis failed:', error);
    return NextResponse.json({ 
      error: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
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
