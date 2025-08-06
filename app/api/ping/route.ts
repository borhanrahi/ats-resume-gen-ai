import { NextRequest, NextResponse } from 'next/server';
import { Client, Account } from 'appwrite';

export async function GET(request: NextRequest) {
    console.log('\n--- [SERVER-SIDE PING] ---');
    console.log('API route /api/ping hit. Attempting to connect to Appwrite from the server...');

    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

    if (!endpoint || !projectId) {
        console.error(' [SERVER-SIDE PING] CRITICAL: Appwrite environment variables are not set on the server.');
        return NextResponse.json({ success: false, error: 'Server misconfiguration: Appwrite env vars missing.' }, { status: 500 });
    }

    console.log(` [SERVER-SIDE PING] Endpoint: ${endpoint}`);
    console.log(` [SERVER-SIDE PING] Project ID: ${projectId}`);

    try {
        const client = new Client()
            .setEndpoint(endpoint)
            .setProject(projectId);

        const account = new Account(client);
        console.log(' [SERVER-SIDE PING] Appwrite client created. Pinging server by calling account.get()...');
        const user = await account.get();

        console.log(' [SERVER-SIDE PING] SUCCESS: Connected to Appwrite and a user session was found.');
        console.log('--- [SERVER-SIDE PING END] ---');
        return NextResponse.json({ success: true, user: user });

    } catch (error: any) {
        if (error.code === 401) {
            console.log(' [SERVER-SIDE PING] SUCCESS: Connected to Appwrite, but no user session was found (which is expected).');
            console.log('--- [SERVER-SIDE PING END] ---');
            return NextResponse.json({ success: true, message: 'Connected to Appwrite, but no user session found.' });
        }

        console.error(' [SERVER-SIDE PING] FAILED:', error);
        console.log('--- [SERVER-SIDE PING END] ---');
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
