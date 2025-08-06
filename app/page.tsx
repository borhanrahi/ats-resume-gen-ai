'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import HeroSection from '@/components/home/HeroSection';
import AnalysisOptions from '@/components/home/AnalysisOptions';
import UploadModal from '@/components/upload/UploadModal';
import FeaturesSection from '@/components/home/FeaturesSection';
import CTASection from '@/components/home/CTASection';

export default function Home() {
  const router = useRouter();
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleAnalysisClick = (type: 'normal' | 'job') => {
    // Navigate directly to analyze page with type parameter
    router.push(`/analyze?type=${type}`);
  };

  const handleQuickStart = () => {
    router.push('/analyze');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-first landing page with progressive enhancement */}
      <HeroSection onQuickStart={handleQuickStart} />
      <AnalysisOptions onAnalysisClick={handleAnalysisClick} />
      <FeaturesSection />
      <CTASection onGetStarted={handleQuickStart} />
      
      {/* Upload Modal - kept for backward compatibility */}
      {showUploadModal && (
        <UploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          analysisType="normal"
        />
      )}
    </div>
  );
}
