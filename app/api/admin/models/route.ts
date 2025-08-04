import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for demo (replace with database later)
export const modelConfigs = [
  {
    id: 'openrouter-gpt4',
    name: 'GPT-4 Turbo (OpenRouter)',
    provider: 'OpenRouter',
    model: 'openai/gpt-4-turbo',
    tier: 'premium' as const,
    isActive: true,
    priority: 1,
  },
  {
    id: 'gemini-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'Google',
    model: 'gemini-1.5-flash',
    tier: 'free' as const,
    isActive: true,
    priority: 2,
    apiKey: 'AIzaSyCLJWOfkLrCqQLopTVmgOx1I8XO_mmqGa4',
  },
  {
    id: 'openrouter-claude',
    name: 'Claude 3.5 Sonnet (OpenRouter)',
    provider: 'OpenRouter',
    model: 'anthropic/claude-3.5-sonnet',
    tier: 'free' as const,
    isActive: true,
    priority: 3,
  },
  {
    id: 'moonshot-kimi',
    name: 'Moonshot Kimi K2',
    provider: 'Moonshot',
    model: 'moonshotai/kimi-k2:free',
    tier: 'free' as const,
    isActive: true,
    priority: 4,
  },
  {
    id: 'glm-4-air',
    name: 'GLM-4.5 Air',
    provider: 'Z-AI',
    model: 'z-ai/glm-4.5-air:free',
    tier: 'free' as const,
    isActive: true,
    priority: 5,
  },
  {
    id: 'openai-gpt35',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    model: 'openai/gpt-3.5-turbo',
    tier: 'free' as const,
    isActive: true,
    priority: 6,
  },
  {
    id: 'claude-haiku',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    model: 'anthropic/claude-3-haiku',
    tier: 'free' as const,
    isActive: true,
    priority: 7,
  },
  {
    id: 'gemini-pro-premium',
    name: 'Gemini 1.5 Pro (Premium)',
    provider: 'Google',
    model: 'gemini-1.5-pro',
    tier: 'premium' as const,
    isActive: true,
    priority: 8,
    apiKey: 'AIzaSyCLJWOfkLrCqQLopTVmgOx1I8XO_mmqGa4',
  },
  {
    id: 'openai-gpt4',
    name: 'GPT-4',
    provider: 'OpenAI',
    model: 'openai/gpt-4',
    tier: 'premium' as const,
    isActive: true,
    priority: 9,
  },
  {
    id: 'claude-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    model: 'anthropic/claude-3.5-sonnet',
    tier: 'premium' as const,
    isActive: false,
    priority: 10,
  },
];

export async function GET() {
  return NextResponse.json({ models: modelConfigs });
}

export async function PUT(request: NextRequest) {
  try {
    const { modelId, updates } = await request.json();

    const modelIndex = modelConfigs.findIndex(m => m.id === modelId);
    if (modelIndex === -1) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    modelConfigs[modelIndex] = { ...modelConfigs[modelIndex], ...updates };

    return NextResponse.json({ success: true, model: modelConfigs[modelIndex] });
  } catch {
    return NextResponse.json({ error: 'Failed to update model' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const newModel = await request.json();
    const model = {
      id: `custom-${Date.now()}`,
      name: newModel.name,
      provider: newModel.provider,
      model: newModel.model,
      tier: newModel.tier,
      isActive: true,
      priority: newModel.priority,
    };
    
    modelConfigs.push(model);
    
    return NextResponse.json({ success: true, model });
  } catch {
    return NextResponse.json({ error: 'Failed to create model' }, { status: 500 });
  }
}