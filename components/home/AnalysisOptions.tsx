'use client';

import { FileText, Briefcase } from 'lucide-react';

interface AnalysisOptionsProps {
  onAnalysisClick: (type: 'normal' | 'job') => void;
}

export default function AnalysisOptions({ onAnalysisClick }: AnalysisOptionsProps) {
  return (
    <section className="container-mobile py-12 md:py-16">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">
          Choose Your Analysis Type
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Normal ATS Check */}
          <div className="analysis-card p-6 md:p-8 hover:shadow-lg transition-all duration-200 cursor-pointer group"
               onClick={() => onAnalysisClick('normal')}>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Normal ATS Check</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Get a comprehensive ATS compatibility score with detailed recommendations 
              for improving your resume format, structure, and content.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center text-sm">
                <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                ATS Compatibility Score
              </li>
              <li className="flex items-center text-sm">
                <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                Format & Structure Analysis
              </li>
              <li className="flex items-center text-sm">
                <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                Grammar & Content Review
              </li>
              <li className="flex items-center text-sm">
                <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                Improvement Recommendations
              </li>
            </ul>
            <button className="btn-touch w-full bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors group-hover:bg-primary/90">
              Start ATS Check
            </button>
          </div>

          {/* Job-Specific ATS Check */}
          <div className="analysis-card p-6 md:p-8 hover:shadow-lg transition-all duration-200 cursor-pointer group"
               onClick={() => onAnalysisClick('job')}>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mr-4">
                <Briefcase className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Job-Specific Analysis</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Upload your resume and paste a job description to get targeted feedback 
              on how well your resume matches the specific role requirements.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center text-sm">
                <div className="w-2 h-2 bg-accent-foreground rounded-full mr-3"></div>
                Keyword Match Analysis
              </li>
              <li className="flex items-center text-sm">
                <div className="w-2 h-2 bg-accent-foreground rounded-full mr-3"></div>
                Skills Gap Identification
              </li>
              <li className="flex items-center text-sm">
                <div className="w-2 h-2 bg-accent-foreground rounded-full mr-3"></div>
                Job-Specific Recommendations
              </li>
              <li className="flex items-center text-sm">
                <div className="w-2 h-2 bg-accent-foreground rounded-full mr-3"></div>
                Match Percentage Score
              </li>
            </ul>
            <button className="btn-touch w-full bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent/90 transition-colors group-hover:bg-accent/90">
              Analyze with Job Description
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}