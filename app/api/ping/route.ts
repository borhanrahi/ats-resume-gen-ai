import { NextResponse } from 'next/server';
import { Client, Account } from 'appwrite';

/**
 * Appwrite connection test endpoint
 * Tests the connection to Appwrite server and returns status
 */
export async function GET() {
  try {
    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

    const account = new Account(client);

    // Test the connection by trying to get account info (will fail if not authenticated, but connection works)
    try {
      await account.get();
      // If we get here, user is authenticated
      return NextResponse.json(
        { 
          success: true,
          message: 'Appwrite connection successful! User is authenticated.',
          timestamp: new Date().toISOString(),
          server: 'ats-resume-checker',
          appwrite: {
            endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
            projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
            status: 'connected'
          }
        },
        { 
          status: 200,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      );
    } catch (authError: any) {
      // If we get a 401, it means connection works but user is not authenticated
      if (authError.code === 401) {
        return NextResponse.json(
          { 
            success: true,
            message: 'Appwrite connection successful! (User not authenticated, which is expected)',
            timestamp: new Date().toISOString(),
            server: 'ats-resume-checker',
            appwrite: {
              endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
              projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
              status: 'connected'
            }
          },
          { 
            status: 200,
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
            }
          }
        );
      }
      
      // Other auth errors might indicate connection issues
      throw authError;
    }
  } catch (error: unknown) {
    console.error('Appwrite connection test failed:', error);
    
    return NextResponse.json(
      { 
        success: false,
        message: 'Appwrite connection failed',
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString(),
        server: 'ats-resume-checker',
        appwrite: {
          endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
          projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
          status: 'disconnected'
        }
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  }
}

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  });
}