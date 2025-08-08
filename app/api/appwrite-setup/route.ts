import { NextResponse } from 'next/server';
import { Client, Databases, ID } from 'appwrite';

/**
 * Appwrite setup verification endpoint
 * Checks if database and collections exist, creates them if needed
 */
export async function GET() {
  try {
    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

    // Add API key for server-side operations
    if (process.env.APPWRITE_API_KEY) {
      client.setKey(process.env.APPWRITE_API_KEY);
    }

    const databases = new Databases(client);
    const DATABASE_ID = 'main';
    const COLLECTIONS = {
      USERS: 'users',
      ANALYSES: 'analyses',
      TEMPLATES: 'templates',
      PAYMENTS: 'payments',
      ADMIN_CONFIGS: 'admin_configs',
      SYSTEM_LOGS: 'system_logs'
    };

    const setupResults = {
      database: { exists: false, created: false },
      collections: {} as Record<string, { exists: boolean, created: boolean }>
    };

    // Check if database exists
    try {
      await databases.get(DATABASE_ID);
      setupResults.database.exists = true;
    } catch (error: any) {
      if (error.code === 404) {
        // Database doesn't exist, try to create it
        try {
          await databases.create(DATABASE_ID, 'ATS Resume Checker Database');
          setupResults.database.created = true;
          setupResults.database.exists = true;
        } catch (createError: any) {
          return NextResponse.json({
            success: false,
            message: 'Failed to create database. Make sure you have the correct API key with database permissions.',
            error: createError.message,
            setupResults
          }, { status: 500 });
        }
      } else {
        throw error;
      }
    }

    // Check collections
    for (const [name, id] of Object.entries(COLLECTIONS)) {
      try {
        await databases.getCollection(DATABASE_ID, id);
        setupResults.collections[name] = { exists: true, created: false };
      } catch (error: any) {
        if (error.code === 404) {
          // Collection doesn't exist, try to create it
          try {
            await databases.createCollection(DATABASE_ID, id, name);
            setupResults.collections[name] = { exists: true, created: true };
          } catch (createError: any) {
            setupResults.collections[name] = { exists: false, created: false };
          }
        } else {
          setupResults.collections[name] = { exists: false, created: false };
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Appwrite setup check completed',
      config: {
        endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
        projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
        hasApiKey: !!process.env.APPWRITE_API_KEY
      },
      setupResults
    });

  } catch (error: any) {
    console.error('Appwrite setup check failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Appwrite setup check failed',
      error: error.message || 'Unknown error',
      config: {
        endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
        projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
        hasApiKey: !!process.env.APPWRITE_API_KEY
      }
    }, { status: 500 });
  }
}