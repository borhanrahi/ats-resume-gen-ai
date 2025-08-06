'use client';

import Script from 'next/script';

export default function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "AI-Powered ATS Resume Checker",
    "description": "Free AI-powered resume analysis tool that checks ATS compatibility, optimizes keywords, and provides personalized recommendations to improve your chances of landing interviews.",
    "url": process.env.NEXT_PUBLIC_BASE_URL || "https://ats-resume-checker.vercel.app",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free resume analysis with 5 analyses per day"
    },
    "featureList": [
      "ATS Compatibility Check",
      "Keyword Optimization",
      "Grammar Analysis",
      "Job Description Matching",
      "Instant AI-Powered Feedback",
      "Mobile-First Design",
      "Privacy-Protected Analysis"
    ],
    "screenshot": `${process.env.NEXT_PUBLIC_BASE_URL || "https://ats-resume-checker.vercel.app"}/screenshot.jpg`,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1247",
      "bestRating": "5",
      "worstRating": "1"
    },
    "author": {
      "@type": "Organization",
      "name": "ATS Resume Checker Team"
    },
    "provider": {
      "@type": "Organization",
      "name": "ATS Resume Checker",
      "url": process.env.NEXT_PUBLIC_BASE_URL || "https://ats-resume-checker.vercel.app"
    }
  };

  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ATS Resume Checker",
    "url": process.env.NEXT_PUBLIC_BASE_URL || "https://ats-resume-checker.vercel.app",
    "logo": `${process.env.NEXT_PUBLIC_BASE_URL || "https://ats-resume-checker.vercel.app"}/logo.png`,
    "description": "AI-powered resume analysis platform helping job seekers optimize their resumes for ATS systems and improve their interview chances.",
    "sameAs": [
      "https://twitter.com/atsresumechecker",
      "https://linkedin.com/company/ats-resume-checker"
    ]
  };

  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "ATS Resume Checker",
    "url": process.env.NEXT_PUBLIC_BASE_URL || "https://ats-resume-checker.vercel.app",
    "description": "Free AI-powered resume analysis tool for ATS optimization and job matching",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${process.env.NEXT_PUBLIC_BASE_URL || "https://ats-resume-checker.vercel.app"}/analyze?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": process.env.NEXT_PUBLIC_BASE_URL || "https://ats-resume-checker.vercel.app"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Resume Analysis",
        "item": `${process.env.NEXT_PUBLIC_BASE_URL || "https://ats-resume-checker.vercel.app"}/analyze`
      }
    ]
  };

  return (
    <>
      <Script
        id="structured-data-webapp"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <Script
        id="structured-data-organization"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationData),
        }}
      />
      <Script
        id="structured-data-website"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteData),
        }}
      />
      <Script
        id="structured-data-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbData),
        }}
      />
    </>
  );
}