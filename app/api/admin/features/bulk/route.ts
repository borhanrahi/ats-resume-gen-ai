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

// POST /api/admin/features/bulk - Bulk operations on features
export async function POST(request: NextRequest) {
  try {
    // In production, add admin authentication check here
    // const adminUser = await verifyAdminAuth(request);
    
    const body = await request.json();
    const { action, featureIds, data } = body;
    
    if (!action || !featureIds || !Array.isArray(featureIds)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: action, featureIds' 
        },
        { status: 400 }
      );
    }
    
    let updatedFeatures: FeatureRequest[] = [];
    
    switch (action) {
      case 'updateStatus':
        if (!data?.status) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Status is required for updateStatus action' 
            },
            { status: 400 }
          );
        }
        
        mockFeatures = mockFeatures.map(feature => {
          if (featureIds.includes(feature.id)) {
            const updated = { ...feature, status: data.status };
            updatedFeatures.push(updated);
            return updated;
          }
          return feature;
        });
        break;
        
      case 'updatePriority':
        if (!data?.priority) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Priority is required for updatePriority action' 
            },
            { status: 400 }
          );
        }
        
        mockFeatures = mockFeatures.map(feature => {
          if (featureIds.includes(feature.id)) {
            const updated = { ...feature, priority: data.priority };
            updatedFeatures.push(updated);
            return updated;
          }
          return feature;
        });
        break;
        
      case 'delete':
        const deletedFeatures = mockFeatures.filter(feature => 
          featureIds.includes(feature.id)
        );
        mockFeatures = mockFeatures.filter(feature => 
          !featureIds.includes(feature.id)
        );
        updatedFeatures = deletedFeatures;
        break;
        
      default:
        return NextResponse.json(
          { 
            success: false, 
            error: `Unknown action: ${action}` 
          },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        action,
        affectedCount: updatedFeatures.length,
        updatedFeatures
      }
    });
  } catch (error) {
    console.error('Failed to perform bulk operation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to perform bulk operation' 
      },
      { status: 500 }
    );
  }
}