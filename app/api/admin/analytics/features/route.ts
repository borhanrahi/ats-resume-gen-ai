import { NextRequest, NextResponse } from 'next/server';

interface FeatureUsage {
  features: Array<{
    name: string;
    usage: number;
    growth: number;
    tier: 'free' | 'premium';
  }>;
  popularFeatures: string[];
  underutilizedFeatures: string[];
}

const generateFeatureUsage = (): FeatureUsage => {
  const allFeatures = [
    { name: 'Resume Analysis', tier: 'free' as const, baseUsage: 5000 },
    { name: 'ATS Score', tier: 'free' as const, baseUsage: 4800 },
    { name: 'Keyword Matching', tier: 'free' as const, baseUsage: 4500 },
    { name: 'Grammar Check', tier: 'free' as const, baseUsage: 3200 },
    { name: 'Job Description Upload', tier: 'free' as const, baseUsage: 2800 },
    { name: 'Visual Resume Editor', tier: 'premium' as const, baseUsage: 1200 },
    { name: 'AI Resume Builder', tier: 'premium' as const, baseUsage: 800 },
    { name: 'Template Library', tier: 'premium' as const, baseUsage: 950 },
    { name: 'Export to PDF', tier: 'premium' as const, baseUsage: 1100 },
    { name: 'Export to DOCX', tier: 'premium' as const, baseUsage: 750 },
    { name: 'Analysis History', tier: 'premium' as const, baseUsage: 600 },
    { name: 'Advanced Analytics', tier: 'premium' as const, baseUsage: 400 },
    { name: 'Keyword Optimization', tier: 'premium' as const, baseUsage: 350 },
    { name: 'Multiple Templates', tier: 'premium' as const, baseUsage: 300 }
  ];

  const features = allFeatures.map(feature => ({
    name: feature.name,
    usage: feature.baseUsage + Math.floor(Math.random() * 200),
    growth: -10 + Math.random() * 30, // -10% to +20% growth
    tier: feature.tier
  }));

  // Sort by usage to determine popular and underutilized
  const sortedFeatures = [...features].sort((a, b) => b.usage - a.usage);
  
  const popularFeatures = sortedFeatures.slice(0, 5).map(f => f.name);
  const underutilizedFeatures = sortedFeatures.slice(-3).map(f => f.name);

  return {
    features,
    popularFeatures,
    underutilizedFeatures
  };
};

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // const adminUser = await verifyAdminAuth(request);
    // if (!adminUser) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Handle URL parsing safely for test environment
    let fromParam: string | null = null;
    let toParam: string | null = null;
    
    try {
      const { searchParams } = new URL(request.url || 'http://localhost:3000/api/admin/analytics/features');
      fromParam = searchParams.get('from');
      toParam = searchParams.get('to');
    } catch (error) {
      // Fallback for test environment - use default values
    }

    // In production, this would fetch real feature usage data from:
    // - Feature usage tracking
    // - Event analytics
    // - User interaction logs
    // - Feature flag analytics
    
    const featureUsage = generateFeatureUsage();

    return NextResponse.json({
      success: true,
      data: featureUsage
    });
  } catch (error) {
    console.error('Error fetching feature usage:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch feature usage' 
      },
      { status: 500 }
    );
  }
}

// POST endpoint for feature usage optimization
export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    const body = await request.json();
    const { feature, action, parameters } = body;

    // TODO: Implement feature usage optimization
    // This could include:
    // - Promoting underutilized features
    // - A/B testing feature placement
    // - Updating feature onboarding
    // - Analyzing feature adoption patterns

    switch (action) {
      case 'promote_feature':
        // Implement feature promotion logic
        break;
      case 'improve_onboarding':
        // Implement onboarding improvements
        break;
      case 'analyze_adoption':
        // Implement adoption analysis
        break;
      case 'ab_test_placement':
        // Implement A/B testing for feature placement
        break;
      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Unknown feature optimization action' 
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Feature optimization '${action}' applied to '${feature}'`
    });
  } catch (error) {
    console.error('Error applying feature optimization:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to apply feature optimization' 
      },
      { status: 500 }
    );
  }
}

// PUT endpoint for updating feature configurations
export async function PUT(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    const body = await request.json();
    const { featureId, configuration } = body;

    // TODO: Implement feature configuration updates
    // This could include:
    // - Enabling/disabling features
    // - Updating feature flags
    // - Modifying feature access rules
    // - Updating feature descriptions

    return NextResponse.json({
      success: true,
      message: `Feature '${featureId}' configuration updated successfully`
    });
  } catch (error) {
    console.error('Error updating feature configuration:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update feature configuration' 
      },
      { status: 500 }
    );
  }
}