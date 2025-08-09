import { NextRequest, NextResponse } from 'next/server';
import { pdfParser } from '../../../lib/parsers/pdfParser';
import { docxParser } from '../../../lib/parsers/docxParser';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    console.log('Test analysis - file received:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Parse the file
    let parseResult;
    const fileExtension = file.name.toLowerCase().split('.').pop();
    
    if (file.type === 'application/pdf' || fileExtension === 'pdf') {
      parseResult = await pdfParser.parse(file);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
               fileExtension === 'docx') {
      parseResult = await docxParser.parse(file);
    } else {
      throw new Error(`Unsupported file type: ${file.type}`);
    }

    console.log('File parsed successfully:', {
      wordCount: parseResult.metadata.wordCount,
      contentLength: parseResult.content.length
    });

    // Create a mock analysis result
    const mockAnalysis = {
      score: 75,
      breakdown: {
        formatting: 80,
        keywords: 70,
        structure: 75,
        length: 80
      },
      recommendations: [
        {
          id: 'test-1',
          category: 'keywords',
          priority: 'medium',
          title: 'Add More Keywords',
          description: 'Your resume could benefit from more relevant keywords',
          suggestion: 'Include industry-specific terms and skills',
          impact: 'Could improve ATS matching by 15%'
        }
      ],
      keywordMatch: {
        found: ['JavaScript', 'React', 'Node.js'],
        missing: ['TypeScript', 'AWS', 'Docker'],
        matchPercentage: 60,
        density: 2.5,
        suggestions: ['Add TypeScript experience', 'Include cloud technologies']
      },
      grammarIssues: [],
      modelUsed: 'mock-model',
      fallbacksUsed: [],
      processingTime: 1000,
      errors: [],
      warnings: []
    };

    const result = {
      id: 'test-' + Date.now(),
      fileName: file.name,
      fileType: file.type,
      analysisType: 'normal',
      analysis: mockAnalysis,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ 
      success: true,
      analysisId: result.id,
      result
    });

  } catch (error) {
    console.error('Test analysis failed:', error);
    return NextResponse.json({ 
      error: `Test analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}