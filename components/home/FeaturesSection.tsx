'use client';

import { 
  FileText, 
  Target, 
  Brain, 
  CheckCircle, 
  TrendingUp, 
  Users,
  Smartphone,
  Globe
} from 'lucide-react';

export default function FeaturesSection() {
  return (
    <section className="py-16 sm:py-20 md:py-24 bg-muted/30">
      <div className="container-mobile">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need to Optimize Your Resume
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Our comprehensive AI analysis covers all aspects of resume optimization 
            to help you stand out from the competition.
          </p>
        </div>

        {/* Main Features Grid - Mobile First */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-16">
          {/* ATS Compatibility */}
          <div className="group bg-card rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3">
              ATS Compatibility Check
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
              Ensure your resume passes through Applicant Tracking Systems with our 
              comprehensive format and structure analysis.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                <span>Format compatibility score</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                <span>Structure optimization</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                <span>Parsing error detection</span>
              </li>
            </ul>
          </div>

          {/* Keyword Optimization */}
          <div className="group bg-card rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-border hover:border-accent/30 transition-all duration-300 hover:shadow-lg">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-accent to-accent/80 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
              <Target className="w-6 h-6 sm:w-8 sm:h-8 text-accent-foreground" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3">
              Keyword Optimization
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
              Match your resume against job descriptions to identify missing keywords 
              and improve your chances of getting noticed.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                <span>Job description matching</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                <span>Missing keyword identification</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                <span>Keyword density analysis</span>
              </li>
            </ul>
          </div>

          {/* AI-Powered Analysis */}
          <div className="group bg-card rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-border hover:border-secondary/30 transition-all duration-300 hover:shadow-lg md:col-span-2 lg:col-span-1">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-secondary to-secondary/80 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
              <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-secondary-foreground" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3">
              AI-Powered Insights
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
              Get intelligent recommendations powered by advanced AI models that 
              understand modern hiring practices and industry standards.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                <span>Grammar and style analysis</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                <span>Content quality assessment</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                <span>Personalized recommendations</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Stats Section - Mobile First */}
        <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-12">
          <div className="text-center mb-8 sm:mb-12">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-3">
              Trusted by Job Seekers Worldwide
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Join thousands of professionals who have improved their resumes with our AI-powered analysis
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1">10K+</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Resumes Analyzed</div>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-accent" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1">95%</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Improvement Rate</div>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-secondary/10 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Smartphone className="w-6 h-6 sm:w-8 sm:h-8 text-secondary" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1">100%</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Mobile Optimized</div>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Globe className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1">50+</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Countries Served</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}