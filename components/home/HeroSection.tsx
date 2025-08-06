'use client';

import { Zap, Shield, Clock, Star, Sparkles, ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  onQuickStart: () => void;
}

export default function HeroSection({ onQuickStart }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5" />
      
      <div className="container-mobile py-12 sm:py-16 md:py-24 lg:py-32 relative">
        <div className="text-center max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-primary/10 border border-primary/20 mb-4 sm:mb-6">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
            <span className="text-xs sm:text-sm font-medium text-primary">Powered by AI</span>
          </div>

          {/* Mobile-first heading with progressive enhancement */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold text-foreground mb-4 sm:mb-6 leading-tight">
            AI-Powered{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ATS Resume
            </span>{' '}
            Checker
          </h1>
          
          {/* Mobile-optimized description */}
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-2 sm:px-0">
            Get instant AI-powered feedback on your resume. Check ATS compatibility, 
            optimize keywords, and increase your chances of landing interviews.
          </p>
          
          {/* Enhanced Mobile-first CTA Button with better touch targets */}
          <div className="mb-12 sm:mb-16">
            <button
              onClick={onQuickStart}
              className="btn-touch w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 sm:px-8 py-4 sm:py-5 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl font-semibold text-base sm:text-lg hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 group active:scale-95 touch-manipulation"
              style={{ minHeight: '56px' }} // Ensure 56px minimum for better touch targets
            >
              <span>Start Free Analysis</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
            <p className="text-xs sm:text-sm text-muted-foreground mt-3 text-center">
              No signup required • 5 free analyses daily • Works on mobile
            </p>
            
            {/* Mobile-specific trust indicators */}
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground sm:hidden">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Mobile Optimized</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>30s Results</span>
              </div>
            </div>
          </div>
          
          {/* Enhanced Mobile-first Features Grid with better touch interactions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="group flex flex-col items-center p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 active:scale-95 touch-manipulation">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-2 text-center">Instant Analysis</h3>
              <p className="text-sm text-muted-foreground text-center leading-relaxed">
                Get comprehensive results in seconds with our advanced AI engine
              </p>
            </div>
            
            <div className="group flex flex-col items-center p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-secondary/30 transition-all duration-300 hover:shadow-lg hover:shadow-secondary/10 active:scale-95 touch-manipulation">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-secondary-foreground" />
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-2 text-center">Privacy First</h3>
              <p className="text-sm text-muted-foreground text-center leading-relaxed">
                Your resume data is processed securely and never stored on our servers
              </p>
            </div>
            
            <div className="group flex flex-col items-center p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-accent/30 transition-all duration-300 hover:shadow-lg hover:shadow-accent/10 active:scale-95 touch-manipulation">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-accent-foreground" />
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-2 text-center">Free to Use</h3>
              <p className="text-sm text-muted-foreground text-center leading-relaxed">
                5 free analyses per day, no signup or payment required
              </p>
            </div>
            
            <div className="group flex flex-col items-center p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 active:scale-95 touch-manipulation">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                <Star className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-2 text-center">ATS Optimized</h3>
              <p className="text-sm text-muted-foreground text-center leading-relaxed">
                Designed specifically for modern ATS systems and recruiters
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}