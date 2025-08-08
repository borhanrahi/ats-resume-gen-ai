'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface PingResponse {
  success: boolean;
  message: string;
  user?: any;
  error?: string;
}

export default function PingTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PingResponse | null>(null);

  const sendPing = async () => {
    setIsLoading(true);
    setResult(null);

    let apiResult: PingResponse | null = null;

    try {
      const response = await fetch('/api/ping');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      apiResult = await response.json();

    } catch (error) {
      apiResult = {
        success: false,
        message: 'A network or server error occurred.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      setResult(apiResult);
      setIsLoading(false);
    }
  };

  const testSetup = async () => {
    setIsLoading(true);
    setResult(null);

    let apiResult: PingResponse | null = null;

    try {
      const response = await fetch('/api/appwrite-setup');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      apiResult = await response.json();

    } catch (error) {
      apiResult = {
        success: false,
        message: 'Setup test failed.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      setResult(apiResult);
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Appwrite Connection Test
        </CardTitle>
        <CardDescription>
          Click the button below to send a test request to your Appwrite server and verify the connection.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button onClick={sendPing} disabled={isLoading} variant="default">
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing...</>
            ) : (
              'Test Connection'
            )}
          </Button>
          <Button onClick={testSetup} disabled={isLoading} variant="outline">
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking...</>
            ) : (
              'Check Setup'
            )}
          </Button>
        </div>
        {result && (
          <Card className={result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? <CheckCircle className="text-green-600" /> : <XCircle className="text-red-600" />}
                Connection {result.success ? 'Successful' : 'Failed'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>{result.message}</p>
              {result.error && (
                <div className="text-sm text-red-700 bg-red-100 p-2 rounded">
                  <strong>Error:</strong> {result.error}
                </div>
              )}
              {(result as any).appwrite && (
                <div className="text-sm bg-gray-100 p-3 rounded">
                  <h4 className="font-semibold mb-2">Appwrite Configuration:</h4>
                  <div className="space-y-1">
                    <div><strong>Endpoint:</strong> {(result as any).appwrite.endpoint}</div>
                    <div><strong>Project ID:</strong> {(result as any).appwrite.projectId}</div>
                    <div><strong>Status:</strong> 
                      <Badge variant={(result as any).appwrite.status === 'connected' ? 'default' : 'destructive'} className="ml-2">
                        {(result as unknown).appwrite.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
              {result.user && <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">{JSON.stringify(result.user, null, 2)}</pre>}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
