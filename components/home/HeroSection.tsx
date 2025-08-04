'use client';

import { Zap, Shield, Clock, Star } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="container-mobile py-12 md:py-20 lg:py-24">
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold text-foreground mb-4 md:mb-6">
          AI-Powered{' '}
          <span className="text-primary">
            ATS Resume Checker
          </span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8 md:mb-12 max-w-2xl mx-auto">
          Get instant AI-powered feedback on your resume. Check ATS compatibility, 
          optimize keywords, and increase your chances of landing interviews.
        </p>
        
        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12 md:mb-16">
          <div className="flex flex-col items-center p-4 md:p-6 rounded-lg bg-card border">
            <Zap className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">Instant Analysis</h3>
            <p className="text-sm text-muted-foreground text-center">
              Get results in seconds with our AI engine
            </p>
          </div>
          <div className="flex flex-col items-center p-4 md:p-6 rounded-lg bg-card border">
            <Shield className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">Privacy First</h3>
            <p className="text-sm text-muted-foreground text-center">
              Your resume is processed client-side
            </p>
          </div>
          <div className="flex flex-col items-center p-4 md:p-6 rounded-lg bg-card border">
            <Clock className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">Free to Use</h3>
            <p className="text-sm text-muted-foreground text-center">
              5 free analyses per day, no signup required
            </p>
          </div>
          <div className="flex flex-col items-center p-4 md:p-6 rounded-lg bg-card border">
            <Star className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">ATS Optimized</h3>
            <p className="text-sm text-muted-foreground text-center">
              Designed for modern ATS systems
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}