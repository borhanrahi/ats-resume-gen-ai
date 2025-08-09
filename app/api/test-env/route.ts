import { NextResponse } from 'next/server';
import { analysisEngine } from '../../../lib/ai/analysisEngine';

export async function GET() {
  return NextResponse.json({
    analysisEngineAvailable: !!analysisEngine,
    openRouterKey: !!process.env.OPENROUTER_API_KEY,
    geminiKey: !!process.env.GEMINI_API_KEY,
    openRouterKeyLength: process.env.OPENROUTER_API_KEY?.length || 0,
    geminiKeyLength: process.env.GEMINI_API_KEY?.length || 0,
    nodeEnv: process.env.NODE_ENV,
  });
}