import { analysisEngine } from '@/lib/ai/analysisEngine';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage for demo (replace with database later)
const analysisResults = new Map();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract form data
    const resumeFile = formData.get('resume') as File;
    const jobDescription = formData.get('jobDescription') as string;
    const targetKeywords = formData.get('targetKeywords') as string;
    const userTier = (formData.get('userTier') as string) || 'free';

    if (!resumeFile) {
      return NextResponse.json({ error: 'No resume file uploaded' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(resumeFile.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload PDF or Word document.' 
      }, { status: 400 });
    }

    // Parse target keywords if provided
    let parsedKeywords: string[] | undefined;
    if (targetKeywords) {
      try {
        parsedKeywords = JSON.parse(targetKeywords);
      } catch {
        parsedKeywords = targetKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
      }
    }

    // Create analysis request
    const analysisRequest = {
      resumeFile,
      jobDescription: jobDescription || undefined,
      targetKeywords: parsedKeywords,
      userTier: userTier as 'free' | 'premium'
    };

    console.log('Starting ATS analysis...');
    
    // Perform comprehensive ATS analysis
    const analysisResult = await analysisEngine.analyzeResume(analysisRequest);

    // Generate analysis ID and store result
    const analysisId = uuidv4();
    const result = {
      id: analysisId,
      fileName: resumeFile.name,
      fileType: resumeFile.type,
      userTier,
      hasJobDescription: !!jobDescription,
      keywordCount: parsedKeywords?.length || 0,
      result: analysisResult,
      createdAt: new Date().toISOString(),
    };
    
    analysisResults.set(analysisId, result);

    console.log(`Analysis completed in ${analysisResult.processingTime}ms`);

    return NextResponse.json({ 
      success: true,
      analysisId,
      result: {
        ...result,
        // Include full result for immediate use
        analysis: analysisResult
      }
    });

  } catch (error) {
    console.error('ATS Analysis error:', error);
    
    // Return user-friendly error message
    const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
    
    return NextResponse.json({ 
      error: 'Resume analysis failed',
      details: errorMessage,
      suggestion: 'Please try again with a different file format or contact support if the issue persists.'
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

  return NextResponse.json({
    success: true,
    result
  });
}

// Endpoint to get analysis statistics (for admin/analytics)
export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'stats') {
    const stats = {
      totalAnalyses: analysisResults.size,
      freeAnalyses: Array.from(analysisResults.values()).filter(r => r.userTier === 'free').length,
      premiumAnalyses: Array.from(analysisResults.values()).filter(r => r.userTier === 'premium').length,
      withJobDescription: Array.from(analysisResults.values()).filter(r => r.hasJobDescription).length,
      averageScore: Array.from(analysisResults.values())
        .reduce((sum, r) => sum + (r.result?.atsScore?.totalScore || 0), 0) / analysisResults.size || 0
    };

    return NextResponse.json({ success: true, stats });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
