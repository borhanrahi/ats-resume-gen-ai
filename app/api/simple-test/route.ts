import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Simple test endpoint called');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    console.log('File received:', file.name, file.type, file.size);

    // Create a simple mock result without parsing
    const mockResult = {
      id: 'test-' + Date.now(),
      fileName: file.name,
      fileType: file.type,
      analysisType: 'normal',
      analysis: {
        score: 85,
        breakdown: {
          formatting: 90,
          keywords: 80,
          structure: 85,
          length: 85
        },
        recommendations: [
          {
            id: 'mock-1',
            category: 'keywords',
            priority: 'medium',
            title: 'Great Resume!',
            description: 'Your resume looks good overall',
            suggestion: 'Keep up the good work',
            impact: 'Maintain current quality'
          }
        ],
        keywordMatch: {
          found: ['Experience', 'Skills', 'Education'],
          missing: [],
          matchPercentage: 85,
          density: 3.2,
          suggestions: []
        },
        grammarIssues: [],
        modelUsed: 'mock-test',
        fallbacksUsed: [],
        processingTime: 500,
        errors: [],
        warnings: []
      },
      createdAt: new Date().toISOString(),
    };

    console.log('Returning mock result');
    
    return NextResponse.json({ 
      success: true,
      analysisId: mockResult.id,
      result: mockResult
    });

  } catch (error) {
    console.error('Simple test failed:', error);
    return NextResponse.json({ 
      error: `Simple test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}