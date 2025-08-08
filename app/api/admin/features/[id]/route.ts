import { NextRequest, NextResponse } from 'next/server';
import { FeatureRequest } from '@/types/admin';

// Mock data storage - In production, this would be replaced with database operations
// This should be shared with the main route, but for simplicity we'll duplicate
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

// GET /api/admin/features/[id] - Get specific feature
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // In production, add admin authentication check here
    // const adminUser = await verifyAdminAuth(request);
    
    const feature = mockFeatures.find(f => f.id === params.id);
    
    if (!feature) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Feature not found' 
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: feature
    });
  } catch (error) {
    console.error('Failed to fetch feature:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch feature' 
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/features/[id] - Update feature
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // In production, add admin authentication check here
    // const adminUser = await verifyAdminAuth(request);
    
    const body = await request.json();
    const featureIndex = mockFeatures.findIndex(f => f.id === params.id);
    
    if (featureIndex === -1) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Feature not found' 
        },
        { status: 404 }
      );
    }
    
    // Update feature with provided fields
    const updatedFeature: FeatureRequest = {
      ...mockFeatures[featureIndex],
      ...body,
      id: params.id, // Ensure ID doesn't change
      createdAt: mockFeatures[featureIndex].createdAt, // Preserve creation date
    };
    
    // Validate numeric fields
    if (body.businessValue !== undefined) {
      updatedFeature.businessValue = Number(body.businessValue);
    }
    if (body.estimatedHours !== undefined) {
      updatedFeature.estimatedHours = Number(body.estimatedHours);
    }
    
    mockFeatures[featureIndex] = updatedFeature;
    
    return NextResponse.json({
      success: true,
      data: updatedFeature
    });
  } catch (error) {
    console.error('Failed to update feature:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update feature' 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/features/[id] - Delete feature
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // In production, add admin authentication check here
    // const adminUser = await verifyAdminAuth(request);
    
    const featureIndex = mockFeatures.findIndex(f => f.id === params.id);
    
    if (featureIndex === -1) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Feature not found' 
        },
        { status: 404 }
      );
    }
    
    const deletedFeature = mockFeatures.splice(featureIndex, 1)[0];
    
    return NextResponse.json({
      success: true,
      data: deletedFeature
    });
  } catch (error) {
    console.error('Failed to delete feature:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete feature' 
      },
      { status: 500 }
    );
  }
}