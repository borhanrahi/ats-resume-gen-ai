'use client';

import { useState } from 'react';
import { List, Calendar, Settings } from 'lucide-react';
import FeatureTracker from './FeatureTracker';
import FeatureRoadmap from './FeatureRoadmap';

interface FeatureManagementProps {
  onNavigate?: (section: string) => void;
}

type ViewMode = 'tracker' | 'roadmap';

export default function FeatureManagement({ onNavigate }: FeatureManagementProps) {
  const [currentView, setCurrentView] = useState<ViewMode>('tracker');

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          <button
            onClick={() => setCurrentView('tracker')}
            className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              currentView === 'tracker'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
            }`}
          >
            <List className="w-4 h-4" />
            <span>Feature Tracker</span>
          </button>
          <button
            onClick={() => setCurrentView('roadmap')}
            className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              currentView === 'roadmap'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Roadmap</span>
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="min-h-[600px]">
        {currentView === 'tracker' && <FeatureTracker onNavigate={onNavigate} />}
        {currentView === 'roadmap' && <FeatureRoadmap onNavigate={onNavigate} />}
      </div>
    </div>
  );
}