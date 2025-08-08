import { NextRequest, NextResponse } from 'next/server';
import { FeatureRequest } from '@/types/admin';

// Mock data storage - In production, this would be replaced with database operations
let mockFeatures: FeatureRequest[] = [
  {
    id: '1',
    title: 'Advanced Resume Templates',
    description: 'Add industry-specific resume templates with modern designs and ATS optimization',
    priority: 'high',
    status: 'planned',
    complexity: 'medium',
    businessValue: 85,
    requestedBy: 'Product Team',
    createdAt: new Date('2024-01-15'),
    estimatedHours: 40
  },
  {
    id: '2',
    title: 'Multi-language Support',
    description: 'Support for resume analysis in multiple languages including Spanish, French, and German',
    priority: 'medium',
    status: 'idea',
    complexity: 'complex',
    businessValue: 70,
    requestedBy: 'Customer Support',
    createdAt: new Date('2024-01-10'),
    estimatedHours: 80
  },
  {
    id: '3',
    title: 'LinkedIn Integration',
    description: 'Allow users to import their LinkedIn profile data directly into the resume builder',
    priority: 'high',
    status: 'in_progress',
    complexity: 'medium',
    businessValue: 90,
    requestedBy: 'Marketing Team',
    createdAt: new Date('2024-01-20'),
    estimatedHours: 32
  },
  {
    id: '4',
    title: 'Bulk Resume Analysis',
    description: 'Enterprise feature to analyze multiple resumes at once for HR departments',
    priority: 'low',
    status: 'idea',
    complexity: 'complex',
    businessValue: 60,
    requestedBy: 'Sales Team',
    createdAt: new Date('2024-01-05'),
    estimatedHours: 120
  },
  {
    id: '5',
    title: 'Mobile App',
    description: 'Native mobile application for iOS and Android with core resume analysis features',
    priority: 'critical',
    status: 'planned',
    complexity: 'complex',
    businessValue: 95,
    requestedBy: 'CEO',
    createdAt: new Date('2024-01-25'),
    estimatedHours: 200
  }
];

// GET /api/admin/features - Get all features
export async function GET(request: NextRequest) {
  try {
    // In production, add admin authentication check here
    // const adminUser = await verifyAdminAuth(request);
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');
    
    let filteredFeatures = [...mockFeatures];
    
    // Apply filters
    if (status && status !== 'all') {
      filteredFeatures = filteredFeatures.filter(f => f.status === status);
    }
    
    if (priority && priority !== 'all') {
      filteredFeatures = filteredFeatures.filter(f => f.priority === priority);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredFeatures = filteredFeatures.filter(f => 
        f.title.toLowerCase().includes(searchLower) ||
        f.description.toLowerCase().includes(searchLower) ||
        f.requestedBy.toLowerCase().includes(searchLower)
      );
    }
    
    return NextResponse.json({
      success: true,
      data: filteredFeatures
    });
  } catch (error) {
    console.error('Failed to fetch features:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch features' 
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/features - Create new feature
export async function POST(request: NextRequest) {
  try {
    // In production, add admin authentication check here
    // const adminUser = await verifyAdminAuth(request);
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'priority', 'complexity', 'businessValue', 'estimatedHours', 'requestedBy'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Missing required field: ${field}` 
          },
          { status: 400 }
        );
      }
    }
    
    // Create new feature
    const newFeature: FeatureRequest = {
      id: Date.now().toString(), // In production, use proper UUID
      title: body.title,
      description: body.description,
      priority: body.priority,
      status: body.status || 'idea',
      complexity: body.complexity,
      businessValue: Number(body.businessValue),
      requestedBy: body.requestedBy,
      createdAt: new Date(),
      estimatedHours: Number(body.estimatedHours)
    };
    
    mockFeatures.push(newFeature);
    
    return NextResponse.json({
      success: true,
      data: newFeature
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create feature:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create feature' 
      },
      { status: 500 }
    );
  }
}