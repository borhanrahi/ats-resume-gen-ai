import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { modelId } = await request.json();
    
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'OpenRouter API key not configured' 
      });
    }

    // Get model configuration
    const modelsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/models`);
    const { models } = await modelsResponse.json();
    const model = models.find((m: { id: string }) => m.id === modelId);

    if (!model) {
      return NextResponse.json({ 
        success: false, 
        error: 'Model not found' 
      });
    }

    // Test the model with a simple prompt
    const testResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'ATS Resume Checker - Model Test',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      },
      body: JSON.stringify({
        model: model.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant. Respond concisely.'
          },
          {
            role: 'user',
            content: 'Please respond with exactly: "Model test successful - [model name]" where [model name] is your model name.'
          }
        ],
        max_tokens: 20,
        temperature: 0.1,
      }),
    });

    if (!testResponse.ok) {
      const errorData = await testResponse.json().catch(() => ({}));
      return NextResponse.json({ 
        success: false, 
        error: `API Error: ${testResponse.status} - ${errorData.error?.message || 'Unknown error'}` 
      });
    }

    const data = await testResponse.json();
    const response = data.choices[0]?.message?.content;

    return NextResponse.json({ 
      success: true, 
      response,
      model: model.name,
      latency: Date.now() // Simple latency measurement
    });

  } catch (error) {
    console.error('Model test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Test failed: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
}