'use client';

import { FileText, Briefcase, ArrowRight, CheckCircle } from 'lucide-react';

interface AnalysisOptionsProps {
  onAnalysisClick: (type: 'normal' | 'job') => void;
}

export default function AnalysisOptions({ onAnalysisClick }: AnalysisOptionsProps) {
  return (
    <section className="container-mobile py-16 md:py-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Choose Your Analysis Type
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select the type of analysis that best fits your needs and get personalized recommendations
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Enhanced Normal ATS Check with better mobile touch targets */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-card to-card/50 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 cursor-pointer active:scale-95 touch-manipulation"
               onClick={() => onAnalysisClick('normal')}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center mb-6 gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 mx-auto sm:mx-0">
                  <FileText className="w-8 h-8 text-primary-foreground" />
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground">Normal ATS Check</h3>
                  <p className="text-sm text-primary font-medium">Comprehensive Analysis</p>
                </div>
              </div>
              
              <p className="text-muted-foreground mb-6 sm:mb-8 leading-relaxed text-center sm:text-left">
                Get a comprehensive ATS compatibility score with detailed recommendations 
                for improving your resume format, structure, and content quality.
              </p>
              
              <div className="space-y-3 mb-6 sm:mb-8">
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                  <span>ATS Compatibility Score (0-100)</span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                  <span>Format & Structure Analysis</span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                  <span>Grammar & Content Review</span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                  <span>Actionable Improvement Tips</span>
                </div>
              </div>
              
              <button 
                className="w-full bg-primary text-primary-foreground rounded-xl py-4 px-6 font-semibold hover:bg-primary/90 transition-all duration-300 flex items-center justify-center space-x-2 group-hover:shadow-lg touch-manipulation active:scale-95"
                style={{ minHeight: '56px' }}
              >
                <span>Start ATS Check</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>
          </div>

          {/* Enhanced Job-Specific ATS Check with better mobile touch targets */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-card to-card/50 border border-border/50 hover:border-accent/30 transition-all duration-300 hover:shadow-xl hover:shadow-accent/10 cursor-pointer active:scale-95 touch-manipulation"
               onClick={() => onAnalysisClick('job')}>
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center mb-6 gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-accent to-accent/80 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 mx-auto sm:mx-0">
                  <Briefcase className="w-8 h-8 text-accent-foreground" />
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground">Job-Specific Analysis</h3>
                  <p className="text-sm text-accent-foreground font-medium">Targeted Matching</p>
                </div>
              </div>
              
              <p className="text-muted-foreground mb-6 sm:mb-8 leading-relaxed text-center sm:text-left">
                Upload your resume and paste a job description to get targeted feedback 
                on how well your resume matches the specific role requirements.
              </p>
              
              <div className="space-y-3 mb-6 sm:mb-8">
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-accent-foreground mr-3 flex-shrink-0" />
                  <span>Keyword Match Analysis</span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-accent-foreground mr-3 flex-shrink-0" />
                  <span>Skills Gap Identification</span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-accent-foreground mr-3 flex-shrink-0" />
                  <span>Job-Specific Recommendations</span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-accent-foreground mr-3 flex-shrink-0" />
                  <span>Match Percentage Score</span>
                </div>
              </div>
              
              <button 
                className="w-full bg-accent text-accent-foreground rounded-xl py-4 px-6 font-semibold hover:bg-accent/90 transition-all duration-300 flex items-center justify-center space-x-2 group-hover:shadow-lg touch-manipulation active:scale-95"
                style={{ minHeight: '56px' }}
              >
                <span className="hidden sm:inline">Analyze with Job Description</span>
                <span className="sm:hidden">Job-Specific Analysis</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}