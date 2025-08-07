import { NextRequest, NextResponse } from 'next/server';
import { getAIModelManager } from '@/lib/ai/aiModelManager';

// Mock admin authentication - replace with real auth
function isAdminAuthenticated(request: NextRequest): boolean {
  // TODO: Implement real admin authentication
  const authHeader = request.headers.get('authorization');
  return authHeader === 'Bearer admin-token';
}

/**
 * POST /api/admin/ai-config/test
 * Test a specific AI model
 */
export async function POST(request: NextRequest) {
  try {
    if (!isAdminAuthenticated(request)) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { modelId } = body;

    if (!modelId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Missing required field: modelId'
          }
        },
        { status: 400 }
      );
    }

    const manager = getAIModelManager();
    const testResult = await manager.testModel(modelId);

    return NextResponse.json({
      success: true,
      data: testResult
    });

  } catch (error) {
    console.error('Error testing AI model:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to test AI model',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}