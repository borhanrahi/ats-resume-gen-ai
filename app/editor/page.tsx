'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { ResumeEditor } from '@/components/editor/ResumeEditor';
import { useAuth } from '@/lib/auth/AuthContext';
import { ResumeData } from '@/types/resume';
import { ExportResult } from '@/lib/utils/exportUtils';

function EditorContent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [initialData, setInitialData] = useState<ResumeData | undefined>();
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Get resume ID from URL params if editing existing resume
  const resumeId = searchParams.get('id');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/editor');
    }
  }, [isAuthenticated, isLoading, router]);

  // Load resume data if editing existing resume
  useEffect(() => {
    const loadResumeData = async () => {
      if (resumeId) {
        try {
          // TODO: Replace with actual API call to load resume data
          // const response = await fetch(`/api/resumes/${resumeId}`);
          // const data = await response.json();
          // setInitialData(data);
          
          // Mock data for development
          console.log('Loading resume with ID:', resumeId);
          setInitialData(undefined); // No initial data for now
        } catch (error) {
          console.error('Failed to load resume data:', error);
        }
      }
      setIsLoadingData(false);
    };

    if (isAuthenticated) {
      loadResumeData();
    }
  }, [resumeId, isAuthenticated]);

  const handleSave = async (data: ResumeData) => {
    try {
      // TODO: Replace with actual API call to save resume
      // const response = await fetch('/api/resumes', {
      //   method: resumeId ? 'PUT' : 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ ...data, id: resumeId })
      // });
      
      console.log('Saving resume data:', data);
      
      // Show success message
      // You could add a toast notification here
      alert('Resume saved successfully!');
    } catch (error) {
      console.error('Failed to save resume:', error);
      alert('Failed to save resume. Please try again.');
    }
  };

  const handleExport = async (format: 'pdf' | 'docx') => {
    try {
      // TODO: Replace with actual export API call
      console.log('Exporting resume as:', format);
    } catch (error) {
      console.error('Failed to export resume:', error);
    }
  };

  const handleExportComplete = (result: ExportResult) => {
    if (result.success) {
      console.log('Export completed successfully:', result);
      // You could add a toast notification here
    } else {
      console.error('Export failed:', result.error);
      alert('Export failed. Please try again.');
    }
  };

  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            {isLoading ? 'Loading editor...' : 'Loading resume data...'}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // AuthGuard will handle the redirect
  }

  return (
    <AuthGuard requireAuth requirePremium>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Mobile-first breadcrumb navigation */}
        <div className="border-b bg-card px-3 py-2 md:px-4 md:py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-1 hover:text-foreground transition-colors min-h-[44px] px-2 -mx-2 rounded"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">
              {resumeId ? 'Edit Resume' : 'New Resume'}
            </span>
          </div>
        </div>

        {/* Resume Editor */}
        <div className="flex-1">
          <ResumeEditor
            initialData={initialData}
            onSave={handleSave}
            onExport={handleExport}
            onExportComplete={handleExportComplete}
            className="h-full"
          />
        </div>
      </div>
    </AuthGuard>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}