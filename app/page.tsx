'use client';

import { useState } from 'react';
import HeroSection from '@/components/home/HeroSection';
import AnalysisOptions from '@/components/home/AnalysisOptions';
import UploadModal from '@/components/upload/UploadModal';

export default function Home() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [analysisType, setAnalysisType] = useState<'normal' | 'job'>('normal');

  const handleAnalysisClick = (type: 'normal' | 'job') => {
    setAnalysisType(type);
    setShowUploadModal(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <AnalysisOptions onAnalysisClick={handleAnalysisClick} />
      
      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          analysisType={analysisType}
        />
      )}
    </div>
  );
}
