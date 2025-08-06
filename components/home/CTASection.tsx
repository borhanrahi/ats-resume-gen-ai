'use client';

import { ArrowRight, Sparkles, CheckCircle } from 'lucide-react';

interface CTASectionProps {
  onGetStarted: () => void;
}

export default function CTASection({ onGetStarted }: CTASectionProps) {
  return (
    <section className="py-16 sm:py-20 md:py-24">
      <div className="container-mobile">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-accent rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16 text-center">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-4 w-8 h-8 border-2 border-white rounded-full" />
            <div className="absolute top-12 right-8 w-4 h-4 bg-white rounded-full" />
            <div className="absolute bottom-8 left-12 w-6 h-6 border-2 border-white rounded-full" />
            <div className="absolute bottom-4 right-4 w-3 h-3 bg-white rounded-full" />
            <div className="absolute top-1/2 left-8 w-2 h-2 bg-white rounded-full" />
            <div className="absolute top-1/3 right-12 w-5 h-5 border border-white rounded-full" />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-6">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">Ready to Get Started?</span>
            </div>

            {/* Heading */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
              Transform Your Resume Today
            </h2>

            {/* Description */}
            <p className="text-base sm:text-lg md:text-xl text-white/90 mb-8 sm:mb-12 leading-relaxed">
              Join thousands of job seekers who have improved their resumes and 
              increased their interview chances with our AI-powered analysis.
            </p>

            {/* Benefits List - Mobile First */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
              <div className="flex items-center justify-center sm:justify-start gap-3 text-white">
                <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />
                <span className="text-sm sm:text-base font-medium">Free Analysis</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-3 text-white">
                <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />
                <span className="text-sm sm:text-base font-medium">Instant Results</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-3 text-white">
                <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />
                <span className="text-sm sm:text-base font-medium">No Signup Required</span>
              </div>
            </div>

            {/* Enhanced CTA Button - Mobile First with better touch targets */}
            <div className="space-y-4">
              <button
                onClick={onGetStarted}
                className="btn-touch w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 sm:py-5 bg-white text-primary rounded-xl font-semibold text-base sm:text-lg hover:bg-white/95 hover:shadow-xl transition-all duration-300 group active:scale-95 touch-manipulation"
                style={{ minHeight: '56px' }}
              >
                <span>Start Your Free Analysis</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
              
              <p className="text-sm text-white/80 text-center">
                No credit card required • Get results in under 30 seconds • Mobile optimized
              </p>
            </div>
          </div>
        </div>

        {/* Trust Indicators - Mobile First */}
        <div className="mt-12 sm:mt-16">
          <p className="text-center text-sm text-muted-foreground mb-6">
            Trusted by professionals at leading companies
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 opacity-60">
            {/* Placeholder company logos - would be replaced with actual logos */}
            <div className="text-xs sm:text-sm font-semibold text-muted-foreground px-4 py-2 border border-border rounded-lg">
              Google
            </div>
            <div className="text-xs sm:text-sm font-semibold text-muted-foreground px-4 py-2 border border-border rounded-lg">
              Microsoft
            </div>
            <div className="text-xs sm:text-sm font-semibold text-muted-foreground px-4 py-2 border border-border rounded-lg">
              Amazon
            </div>
            <div className="text-xs sm:text-sm font-semibold text-muted-foreground px-4 py-2 border border-border rounded-lg">
              Meta
            </div>
            <div className="text-xs sm:text-sm font-semibold text-muted-foreground px-4 py-2 border border-border rounded-lg">
              Apple
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}