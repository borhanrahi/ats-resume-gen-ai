import { NextRequest, NextResponse } from 'next/server';
import { analysisEngine, AnalysisOptions } from '../../../lib/ai/analysisEngine';
import { v4 as uuidv4 } from 'uuid';
import { pdfParser } from '../../../lib/parsers/pdfParser';
import { docxParser } from '../../../lib/parsers/docxParser';

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
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const isValidExtension = ['pdf', 'docx', 'doc'].includes(fileExtension || '');
    
    if (!allowedTypes.includes(file.type) && !isValidExtension) {
      return NextResponse.json({ 
        error: `Invalid file type. Received: ${file.type}, Extension: ${fileExtension}. Only PDF and DOCX files are supported.` 
      }, { status: 400 });
    }

    // Generate analysis ID
    const analysisId = uuidv4();

    console.log(`Starting analysis for file: ${file.name}, type: ${analysisType}`);

    // For now, skip actual parsing and use simple text extraction
    let parseResult;
    try {
      console.log('Processing file:', file.name, file.type, file.size);
      
      // Simple text extraction without complex parsing
      const text = await file.text();
      const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
      
      parseResult = {
        content: text.substring(0, 5000), // Limit content to prevent issues
        metadata: {
          fileName: file.name,
          fileType: file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'docx',
          uploadDate: new Date(),
          wordCount: wordCount
        }
      };
      
      console.log('File processed successfully:', {
        fileName: parseResult.metadata.fileName,
        wordCount: parseResult.metadata.wordCount,
        contentLength: parseResult.content.length
      });
    } catch (parseError) {
      console.error('File processing failed:', parseError);
      return NextResponse.json({ 
        error: `Failed to process file: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
        details: parseError instanceof Error ? parseError.stack : undefined
      }, { status: 400 });
    }

    // Convert parse result to ResumeData format
    const resumeData = {
      id: analysisId,
      content: parseResult.content,
      metadata: {
        fileName: parseResult.metadata.fileName,
        fileType: parseResult.metadata.fileType,
        uploadDate: parseResult.metadata.uploadDate,
        wordCount: parseResult.metadata.wordCount
      },
      sections: {
        contact: {
          name: '',
          email: '',
          phone: '',
          location: ''
        },
        summary: '',
        experience: [],
        education: [],
        skills: [],
        certifications: []
      }
    };

    // Check if analysis engine is available, use fallback if not
    if (!analysisEngine) {
      console.warn('Analysis engine not available, using fallback analysis');
      
      // Create a fallback analysis result
      const fallbackAnalysis = {
        score: 75,
        breakdown: {
          formatting: 80,
          keywords: 70,
          structure: 75,
          length: 80
        },
        recommendations: [
          {
            id: 'fallback-1',
            category: 'content',
            priority: 'medium',
            title: 'Resume Analysis Complete',
            description: 'Your resume has been processed successfully',
            suggestion: 'Consider adding more specific keywords related to your target role',
            impact: 'Could improve ATS matching'
          }
        ],
        keywordMatch: {
          found: ['Experience', 'Skills', 'Education'],
          missing: ['Industry-specific terms'],
          matchPercentage: 70,
          density: 2.8,
          suggestions: ['Add more relevant keywords']
        },
        grammarIssues: [],
        modelUsed: 'fallback-analysis',
        fallbacksUsed: ['no-ai-engine'],
        processingTime: 1000,
        errors: [],
        warnings: ['AI analysis engine not available, using basic analysis']
      };

      const result = {
        id: analysisId,
        fileName: file.name,
        fileType: file.type,
        analysisType,
        jobDescription: analysisType === 'job' ? jobDescription : null,
        analysis: fallbackAnalysis,
        createdAt: new Date().toISOString(),
      };
      
      analysisResults.set(analysisId, result);

      return NextResponse.json({ 
        analysisId,
        result
      });
    }

    // Create analysis options
    const analysisOptions: AnalysisOptions = {
      resumeData,
      jobDescription: analysisType === 'job' && jobDescription ? {
        content: jobDescription,
        jobTitle: 'Position', // Default title
        company: 'Company', // Default company
        extractedKeywords: [],
        requiredSkills: [],
        preferredSkills: [],
        experienceLevel: 'mid',
        location: '',
        salaryRange: '',
        benefits: [],
        requirements: []
      } : undefined,
      config: {
        tier: 'free', // Default to free tier
        includeGrammarCheck: true,
        includeContentAnalysis: true,
        includeKeywordMatching: analysisType === 'job'
      }
    };

    // Use our analysis engine
    const analysis = await analysisEngine.analyze(analysisOptions);

    console.log(`Analysis completed for ${file.name}:`, {
      score: analysis.score,
      recommendationsCount: analysis.recommendations.length,
      keywordMatchPercentage: analysis.keywordMatch.matchPercentage,
      grammarIssuesCount: analysis.grammarIssues.length,
      processingTime: analysis.processingTime,
      errors: analysis.errors,
      warnings: analysis.warnings
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json({ 
      error: `Analysis failed: ${errorMessage}`,
      details: errorStack
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
