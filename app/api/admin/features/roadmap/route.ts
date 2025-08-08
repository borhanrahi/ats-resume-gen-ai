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

interface RoadmapFeature extends FeatureRequest {
  plannedQuarter: string;
  dependencies: string[];
  assignedTeam: string;
  progress: number;
  milestones: {
    name: string;
    dueDate: Date;
    completed: boolean;
  }[];
}

// Helper functions for roadmap data
const getPlannedQuarter = (feature: FeatureRequest): string => {
  if (feature.status === 'completed') return 'Q1 2024';
  if (feature.status === 'in_progress') return 'Q2 2024';
  if (feature.status === 'planned') {
    return feature.priority === 'critical' ? 'Q2 2024' : 
           feature.priority === 'high' ? 'Q3 2024' : 'Q4 2024';
  }
  return 'Q1 2025'; // Ideas go to future quarters
};

const getDependencies = (featureId: string): string[] => {
  const deps: Record<string, string[]> = {
    '2': ['1'], // Multi-language depends on templates
    '3': ['1'], // LinkedIn integration depends on templates
    '4': ['3'], // Bulk analysis depends on LinkedIn integration
  };
  return deps[featureId] || [];
};

const getAssignedTeam = (priority: FeatureRequest['priority']): string => {
  switch (priority) {
    case 'critical': return 'Core Team';
    case 'high': return 'Product Team';
    case 'medium': return 'Development Team';
    case 'low': return 'Innovation Team';
    default: return 'Unassigned';
  }
};

const getProgress = (status: FeatureRequest['status']): number => {
  switch (status) {
    case 'completed': return 100;
    case 'in_progress': return 65;
    case 'planned': return 15;
    case 'idea': return 5;
    case 'cancelled': return 0;
    default: return 0;
  }
};

const getMilestones = (feature: FeatureRequest) => {
  const baseMilestones = [
    { name: 'Requirements Analysis', dueDate: new Date('2024-03-01'), completed: feature.status !== 'idea' },
    { name: 'Design Phase', dueDate: new Date('2024-03-15'), completed: feature.status === 'in_progress' || feature.status === 'completed' },
    { name: 'Development', dueDate: new Date('2024-04-30'), completed: feature.status === 'completed' },
    { name: 'Testing & QA', dueDate: new Date('2024-05-15'), completed: feature.status === 'completed' },
    { name: 'Deployment', dueDate: new Date('2024-05-30'), completed: feature.status === 'completed' }
  ];
  
  return baseMilestones;
};

// GET /api/admin/features/roadmap - Get roadmap data
export async function GET(request: NextRequest) {
  try {
    // In production, add admin authentication check here
    // const adminUser = await verifyAdminAuth(request);
    
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const quarter = searchParams.get('quarter');
    
    // Convert features to roadmap format
    const roadmapFeatures: RoadmapFeature[] = mockFeatures.map(feature => ({
      ...feature,
      plannedQuarter: getPlannedQuarter(feature),
      dependencies: getDependencies(feature.id),
      assignedTeam: getAssignedTeam(feature.priority),
      progress: getProgress(feature.status),
      milestones: getMilestones(feature)
    }));
    
    // Filter by year and quarter if specified
    let filteredFeatures = roadmapFeatures;
    
    if (quarter) {
      filteredFeatures = filteredFeatures.filter(f => 
        f.plannedQuarter === `${quarter} ${year}`
      );
    } else {
      filteredFeatures = filteredFeatures.filter(f => 
        f.plannedQuarter.includes(year.toString())
      );
    }
    
    // Generate quarterly summary
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'].map(q => {
      const quarterFeatures = roadmapFeatures.filter(f => f.plannedQuarter === `${q} ${year}`);
      return {
        quarter: q,
        year,
        features: quarterFeatures,
        totalFeatures: quarterFeatures.length,
        completedFeatures: quarterFeatures.filter(f => f.status === 'completed').length,
        inProgressFeatures: quarterFeatures.filter(f => f.status === 'in_progress').length,
        plannedFeatures: quarterFeatures.filter(f => f.status === 'planned').length,
        totalHours: quarterFeatures.reduce((sum, f) => sum + f.estimatedHours, 0),
        averageScore: quarterFeatures.length > 0 
          ? Math.round(quarterFeatures.reduce((sum, f) => sum + f.businessValue, 0) / quarterFeatures.length)
          : 0
      };
    });
    
    return NextResponse.json({
      success: true,
      data: {
        features: filteredFeatures,
        quarters,
        summary: {
          totalFeatures: roadmapFeatures.length,
          completedFeatures: roadmapFeatures.filter(f => f.status === 'completed').length,
          inProgressFeatures: roadmapFeatures.filter(f => f.status === 'in_progress').length,
          plannedFeatures: roadmapFeatures.filter(f => f.status === 'planned').length,
          ideasCount: roadmapFeatures.filter(f => f.status === 'idea').length,
          totalEstimatedHours: roadmapFeatures.reduce((sum, f) => sum + f.estimatedHours, 0),
          averageBusinessValue: Math.round(
            roadmapFeatures.reduce((sum, f) => sum + f.businessValue, 0) / roadmapFeatures.length
          )
        }
      }
    });
  } catch (error) {
    console.error('Failed to fetch roadmap data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch roadmap data' 
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/features/roadmap - Update roadmap assignments
export async function POST(request: NextRequest) {
  try {
    // In production, add admin authentication check here
    // const adminUser = await verifyAdminAuth(request);
    
    const body = await request.json();
    const { featureId, updates } = body;
    
    if (!featureId || !updates) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: featureId, updates' 
        },
        { status: 400 }
      );
    }
    
    const featureIndex = mockFeatures.findIndex(f => f.id === featureId);
    
    if (featureIndex === -1) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Feature not found' 
        },
        { status: 404 }
      );
    }
    
    // Update the feature with roadmap-specific data
    // In production, this would update the database with roadmap fields
    const updatedFeature = {
      ...mockFeatures[featureIndex],
      ...updates
    };
    
    mockFeatures[featureIndex] = updatedFeature;
    
    // Convert to roadmap format for response
    const roadmapFeature: RoadmapFeature = {
      ...updatedFeature,
      plannedQuarter: updates.plannedQuarter || getPlannedQuarter(updatedFeature),
      dependencies: updates.dependencies || getDependencies(updatedFeature.id),
      assignedTeam: updates.assignedTeam || getAssignedTeam(updatedFeature.priority),
      progress: updates.progress || getProgress(updatedFeature.status),
      milestones: updates.milestones || getMilestones(updatedFeature)
    };
    
    return NextResponse.json({
      success: true,
      data: roadmapFeature
    });
  } catch (error) {
    console.error('Failed to update roadmap:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update roadmap' 
      },
      { status: 500 }
    );
  }
}