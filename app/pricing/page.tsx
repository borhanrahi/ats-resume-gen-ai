'use client';

import { useState } from 'react';
import { Check, Crown, Zap, Star } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStatus } from '@/lib/auth/AuthContext';

const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started with resume optimization',
    features: [
      '5 resume analyses per day',
      'Basic ATS scoring',
      'Grammar checking',
      'Keyword matching',
      'Basic recommendations',
      'Ad-supported experience'
    ],
    limitations: [
      'Limited daily usage',
      'Basic features only',
      'No export options',
      'No history tracking'
    ],
    cta: 'Get Started Free',
    popular: false,
    icon: Zap
  },
  {
    name: 'Premium',
    price: '$9.99',
    period: 'per month',
    description: 'Unlock the full power of AI-driven resume optimization',
    features: [
      'Unlimited resume analyses',
      'Advanced ATS scoring with detailed breakdown',
      'AI-powered resume builder',
      'Visual drag-and-drop editor',
      'Professional resume templates',
      'Export to PDF and DOCX',
      'Analysis history and tracking',
      'Priority customer support',
      'No advertisements',
      'Advanced grammar and style checking',
      'Keyword optimization suggestions',
      'Industry-specific recommendations'
    ],
    limitations: [],
    cta: 'Start Premium Trial',
    popular: true,
    icon: Crown
  }
];

export default function PricingPage() {
  const { isAuthenticated } = useAuthStatus();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container-mobile py-12 md:py-16 lg:py-20">
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Start free and upgrade when you&apos;re ready for advanced features
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center mb-8 md:mb-12">
          <div className="bg-muted rounded-lg p-1 flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                billingCycle === 'monthly'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                billingCycle === 'yearly'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
          {pricingPlans.map((plan) => {
            const Icon = plan.icon;
            const price = plan.name === 'Premium' && billingCycle === 'yearly' 
              ? '$7.99' 
              : plan.price;
            const period = plan.name === 'Premium' && billingCycle === 'yearly'
              ? 'per month (billed yearly)'
              : plan.period;

            return (
              <Card
                key={plan.name}
                className={`relative ${
                  plan.popular
                    ? 'border-primary shadow-lg scale-105'
                    : 'border-border'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Most Popular
                    </div>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-center mb-4">
                    <div className={`p-3 rounded-lg ${
                      plan.popular ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        plan.popular ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">{price}</span>
                    <span className="text-muted-foreground ml-2">/{period}</span>
                  </div>
                  <CardDescription className="mt-2">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Features */}
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">What&apos;s included:</h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <div className="pt-4">
                    {plan.name === 'Free' ? (
                      <Button
                        asChild
                        variant="outline"
                        className="w-full min-h-[44px]"
                      >
                        <Link href={isAuthenticated ? '/analyze' : '/auth/signup'}>
                          {plan.cta}
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        asChild
                        className="w-full min-h-[44px]"
                      >
                        <Link href={isAuthenticated ? '/dashboard' : '/auth/signup?plan=premium'}>
                          {plan.cta}
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 md:mt-20">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-8">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-2">
                Can I cancel my subscription anytime?
              </h3>
              <p className="text-muted-foreground">
                Yes, you can cancel your premium subscription at any time. You&apos;ll continue to have access to premium features until the end of your billing period.
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-2">
                Is there a free trial for premium features?
              </h3>
              <p className="text-muted-foreground">
                Yes, we offer a 7-day free trial for all premium features. No credit card required to start your trial.
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-muted-foreground">
                We accept all major credit cards, PayPal, and other secure payment methods through our payment processor.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}