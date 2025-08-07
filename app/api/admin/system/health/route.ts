import { NextRequest, NextResponse } from 'next/server';

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  lastUpdated: Date;
  services: {
    api: 'online' | 'offline' | 'degraded';
    database: 'online' | 'offline' | 'degraded';
    aiModels: 'online' | 'offline' | 'degraded';
    storage: 'online' | 'offline' | 'degraded';
  };
}

const checkServiceHealth = async (service: string): Promise<'online' | 'offline' | 'degraded'> => {
  // Mock health checks - replace with actual service health checks
  const healthScore = Math.random();
  
  if (healthScore > 0.9) return 'online';
  if (healthScore > 0.7) return 'degraded';
  return 'offline';
};

const generateSystemHealth = async (): Promise<SystemHealth> => {
  const services = {
    api: await checkServiceHealth('api'),
    database: await checkServiceHealth('database'),
    aiModels: await checkServiceHealth('aiModels'),
    storage: await checkServiceHealth('storage')
  };

  // Determine overall system status
  const serviceStatuses = Object.values(services);
  const offlineCount = serviceStatuses.filter(s => s === 'offline').length;
  const degradedCount = serviceStatuses.filter(s => s === 'degraded').length;

  let status: 'healthy' | 'warning' | 'critical';
  if (offlineCount > 0) {
    status = 'critical';
  } else if (degradedCount > 1) {
    status = 'warning';
  } else {
    status = 'healthy';
  }

  // Mock uptime (in production, this would come from system monitoring)
  const uptime = 86400 * 30 + Math.floor(Math.random() * 86400); // ~30 days

  return {
    status,
    uptime,
    lastUpdated: new Date(),
    services
  };
};

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // const adminUser = await verifyAdminAuth(request);
    // if (!adminUser) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const health = await generateSystemHealth();

    return NextResponse.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Error checking system health:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check system health' 
      },
      { status: 500 }
    );
  }
}

// POST endpoint for triggering health checks
export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    const body = await request.json();
    const { service } = body;

    if (service) {
      // Check specific service health
      const serviceHealth = await checkServiceHealth(service);
      
      return NextResponse.json({
        success: true,
        data: {
          service,
          status: serviceHealth,
          timestamp: new Date()
        }
      });
    } else {
      // Trigger full system health check
      const health = await generateSystemHealth();
      
      return NextResponse.json({
        success: true,
        data: health
      });
    }
  } catch (error) {
    console.error('Error triggering health check:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to trigger health check' 
      },
      { status: 500 }
    );
  }
}