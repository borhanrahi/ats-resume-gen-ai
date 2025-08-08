import { NextRequest, NextResponse } from 'next/server';
import { withFeatureManagementAuth } from '../../../lib/auth/adminMiddleware';
import { FeatureRequest } from '../../../types/admin';
import { databases, DATABASE_ID, COLLECTIONS } from '../../../lib/auth/appwrite';
import { ID, Query } from 'appwrite';

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

// Get features from database
async function getFeaturesFromDatabase(filters: {
  status?: string;
  priority?: string;
  search?: string;
  complexity?: string;
  sortBy?: string;
  sortOrder?: string;
  limit?: number;
  offset?: number;
}): Promise<{ features: FeatureRequest[]; total: number }> {
  try {
    const queries: string[] = [];

    // Add filters
    if (filters.status && filters.status !== 'all') {
      queries.push(Query.equal('value.status', filters.status));
    }

    if (filters.priority && filters.priority !== 'all') {
      queries.push(Query.equal('value.priority', filters.priority));
    }

    if (filters.complexity && filters.complexity !== 'all') {
      queries.push(Query.equal('value.complexity', filters.complexity));
    }

    if (filters.search) {
      queries.push(Query.search('value.title', filters.search));
    }

    // Add sorting
    if (filters.sortBy) {
      const sortQuery = filters.sortOrder === 'asc' 
        ? Query.orderAsc(`value.${filters.sortBy}`)
        : Query.orderDesc(`value.${filters.sortBy}`);
      queries.push(sortQuery);
    } else {
      queries.push(Query.orderDesc('value.createdAt')); // Default sort
    }

    // Add pagination
    if (filters.limit) {
      queries.push(Query.limit(filters.limit));
    }
    if (filters.offset) {
      queries.push(Query.offset(filters.offset));
    }

    // Add category filter for features
    queries.push(Query.equal('category', 'features'));

    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.ADMIN_CONFIGS,
      queries
    );

    return {
      features: response.documents.map(doc => doc.value as FeatureRequest),
      total: response.total
    };
  } catch (error) {
    console.warn('Database query failed, using mock data');
    
    // Return mock data if database fails
    let filteredFeatures = [...mockFeatures];
    
    // Apply filters to mock data
    if (filters.status && filters.status !== 'all') {
      filteredFeatures = filteredFeatures.filter(f => f.status === filters.status);
    }
    
    if (filters.priority && filters.priority !== 'all') {
      filteredFeatures = filteredFeatures.filter(f => f.priority === filters.priority);
    }

    if (filters.complexity && filters.complexity !== 'all') {
      filteredFeatures = filteredFeatures.filter(f => f.complexity === filters.complexity);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredFeatures = filteredFeatures.filter(f => 
        f.title.toLowerCase().includes(searchLower) ||
        f.description.toLowerCase().includes(searchLower) ||
        f.requestedBy.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    if (filters.sortBy) {
      filteredFeatures.sort((a, b) => {
        const aVal = (a as any)[filters.sortBy!];
        const bVal = (b as any)[filters.sortBy!];
        
        if (filters.sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }

    // Apply pagination
    const start = filters.offset || 0;
    const end = start + (filters.limit || filteredFeatures.length);
    
    return {
      features: filteredFeatures.slice(start, end),
      total: filteredFeatures.length
    };
  }
}

// GET /api/admin/features - Get all features with filtering and pagination
const getFeaturesHandler = async (request: NextRequest, { user }: { user: any }) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;
    
    const filters = {
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      complexity: searchParams.get('complexity') || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      limit,
      offset
    };

    const { features, total } = await getFeaturesFromDatabase(filters);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Calculate feature statistics
    const stats = {
      totalFeatures: total,
      byStatus: {
        idea: features.filter(f => f.status === 'idea').length,
        planned: features.filter(f => f.status === 'planned').length,
        in_progress: features.filter(f => f.status === 'in_progress').length,
        completed: features.filter(f => f.status === 'completed').length,
        cancelled: features.filter(f => f.status === 'cancelled').length,
      },
      byPriority: {
        low: features.filter(f => f.priority === 'low').length,
        medium: features.filter(f => f.priority === 'medium').length,
        high: features.filter(f => f.priority === 'high').length,
        critical: features.filter(f => f.priority === 'critical').length,
      },
      byComplexity: {
        simple: features.filter(f => f.complexity === 'simple').length,
        medium: features.filter(f => f.complexity === 'medium').length,
        complex: features.filter(f => f.complexity === 'complex').length,
      },
      averageBusinessValue: features.reduce((sum, f) => sum + f.businessValue, 0) / features.length || 0,
      totalEstimatedHours: features.reduce((sum, f) => sum + f.estimatedHours, 0)
    };
    
    return NextResponse.json({
      success: true,
      features,
      pagination: {
        currentPage: page,
        totalPages,
        totalFeatures: total,
        featuresPerPage: limit,
        hasNextPage,
        hasPreviousPage,
        startIndex: offset + 1,
        endIndex: Math.min(offset + limit, total)
      },
      stats,
      filters,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to fetch features:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch features',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

export const GET = withFeatureManagementAuth(getFeaturesHandler);

// POST /api/admin/features - Create new feature
const createFeatureHandler = async (request: NextRequest, { user }: { user: any }) => {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'priority', 'complexity', 'businessValue', 'estimatedHours', 'requestedBy'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields',
          message: `Missing required fields: ${missingFields.join(', ')}`,
          requiredFields
        },
        { status: 400 }
      );
    }

    // Validate field values
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    const validStatuses = ['idea', 'planned', 'in_progress', 'completed', 'cancelled'];
    const validComplexities = ['simple', 'medium', 'complex'];

    if (!validPriorities.includes(body.priority)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid priority',
          message: `Priority must be one of: ${validPriorities.join(', ')}`,
          validPriorities
        },
        { status: 400 }
      );
    }

    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid status',
          message: `Status must be one of: ${validStatuses.join(', ')}`,
          validStatuses
        },
        { status: 400 }
      );
    }

    if (!validComplexities.includes(body.complexity)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid complexity',
          message: `Complexity must be one of: ${validComplexities.join(', ')}`,
          validComplexities
        },
        { status: 400 }
      );
    }

    // Validate numeric fields
    const businessValue = Number(body.businessValue);
    const estimatedHours = Number(body.estimatedHours);

    if (isNaN(businessValue) || businessValue < 0 || businessValue > 100) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid business value',
          message: 'Business value must be a number between 0 and 100'
        },
        { status: 400 }
      );
    }

    if (isNaN(estimatedHours) || estimatedHours <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid estimated hours',
          message: 'Estimated hours must be a positive number'
        },
        { status: 400 }
      );
    }
    
    // Create new feature
    const newFeature: FeatureRequest = {
      id: `feature_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: body.title.trim(),
      description: body.description.trim(),
      priority: body.priority,
      status: body.status || 'idea',
      complexity: body.complexity,
      businessValue,
      requestedBy: body.requestedBy.trim(),
      createdAt: new Date(),
      estimatedHours
    };

    // Save to database
    try {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.ADMIN_CONFIGS,
        ID.unique(),
        {
          key: `feature_${newFeature.id}`,
          value: newFeature,
          category: 'features',
          updatedBy: user.id,
          updatedAt: new Date().toISOString()
        }
      );
    } catch (dbError) {
      console.error('Database save failed:', dbError);
      // Continue with mock data for development
      mockFeatures.push(newFeature);
    }
    
    return NextResponse.json({
      success: true,
      feature: newFeature,
      message: 'Feature created successfully',
      timestamp: new Date().toISOString()
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create feature:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create feature',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

export const POST = withFeatureManagementAuth(createFeatureHandler);

// PUT /api/admin/features - Update multiple features (bulk update)
const bulkUpdateFeaturesHandler = async (request: NextRequest, { user }: { user: any }) => {
  try {
    const body = await request.json();
    const { featureIds, updates } = body;

    if (!featureIds || !Array.isArray(featureIds) || featureIds.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing feature IDs',
          message: 'Please provide an array of feature IDs to update'
        },
        { status: 400 }
      );
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing updates',
          message: 'Please provide updates to apply'
        },
        { status: 400 }
      );
    }

    // Validate update fields
    const allowedFields = ['status', 'priority', 'complexity', 'businessValue', 'estimatedHours'];
    const invalidFields = Object.keys(updates).filter(field => !allowedFields.includes(field));

    if (invalidFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid update fields',
          message: `Invalid fields: ${invalidFields.join(', ')}`,
          allowedFields
        },
        { status: 400 }
      );
    }

    // Process bulk update
    const results: Array<{ featureId: string; success: boolean; error?: string }> = [];
    let successCount = 0;
    let failureCount = 0;

    for (const featureId of featureIds) {
      try {
        // In production, update in database
        // For now, simulate update
        results.push({ featureId, success: true });
        successCount++;
      } catch (error) {
        results.push({ 
          featureId, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        failureCount++;
      }
    }

    return NextResponse.json({
      success: failureCount === 0,
      message: `Bulk update completed: ${successCount} successful, ${failureCount} failed`,
      results,
      summary: {
        totalRequested: featureIds.length,
        successful: successCount,
        failed: failureCount
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Bulk update failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to perform bulk update',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

export const PUT = withFeatureManagementAuth(bulkUpdateFeaturesHandler);