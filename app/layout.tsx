import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navigation from "@/components/layout/Navigation";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { AuthProvider } from "@/lib/auth/AuthContext";
import AuthStatusIndicator from '@/components/layout/AuthStatusIndicator';
import StructuredData from "@/components/layout/StructuredData";
import { AdSenseScript } from "@/components/monetization";
import ErrorBoundary from "@/components/layout/ErrorBoundary";
import OfflineIndicator from "@/components/layout/OfflineIndicator";
import GlobalLoadingIndicator from "@/components/layout/GlobalLoadingIndicator";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Enhanced mobile-first SEO optimization with comprehensive meta tags
export const metadata: Metadata = {
  title: {
    default: "AI-Powered ATS Resume Checker - Free Resume Analysis Tool",
    template: "%s | ATS Resume Checker"
  },
  description: "Free AI-powered resume analysis tool. Check ATS compatibility, optimize keywords, and improve your chances of landing interviews. Get instant feedback on your resume with our advanced AI technology. Mobile-optimized, privacy-first, and completely free.",
  keywords: [
    // Primary keywords
    "resume checker",
    "ATS resume",
    "resume analysis",
    "AI resume",
    "free resume checker",
    // Secondary keywords
    "job application",
    "resume optimization",
    "applicant tracking system",
    "resume scanner",
    "resume keywords",
    "job matching",
    "resume feedback",
    // Long-tail keywords
    "mobile resume checker",
    "online resume analysis",
    "resume ATS compatibility",
    "AI resume feedback",
    "resume improvement tool",
    "job search optimization",
    "resume parsing tool",
    "career advancement tool"
  ],
  authors: [{ name: "ATS Resume Checker Team" }],
  creator: "ATS Resume Checker",
  publisher: "ATS Resume Checker",
  category: "Business Tools",
  classification: "Resume Analysis Software",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://ats-resume-checker.vercel.app'),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/',
      'en': '/en',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'AI-Powered ATS Resume Checker - Free Resume Analysis Tool',
    description: 'Free AI-powered resume analysis tool. Check ATS compatibility, optimize keywords, and improve your chances of landing interviews. Mobile-optimized and privacy-first.',
    siteName: 'ATS Resume Checker',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ATS Resume Checker - AI-Powered Resume Analysis Tool for Mobile and Desktop',
        type: 'image/jpeg',
      },
      {
        url: '/og-image-mobile.jpg',
        width: 800,
        height: 600,
        alt: 'Mobile-First ATS Resume Checker Interface',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@atsresumechecker',
    creator: '@atsresumechecker',
    title: 'AI-Powered ATS Resume Checker - Free Resume Analysis Tool',
    description: 'Free AI-powered resume analysis tool. Check ATS compatibility, optimize keywords, and improve your chances of landing interviews. Mobile-optimized and privacy-first.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    yahoo: process.env.YAHOO_VERIFICATION,
  },
  other: {
    // Mobile-specific meta tags
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'ATS Resume Checker',
    'application-name': 'ATS Resume Checker',
    'msapplication-TileColor': '#2563eb',
    'msapplication-config': '/browserconfig.xml',
    // Performance and caching
    'Cache-Control': 'public, max-age=31536000, immutable',
    // Security
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    // Additional SEO
    'revisit-after': '7 days',
    'distribution': 'global',
    'rating': 'general',
    'language': 'en',
    'geo.region': 'US',
    'geo.placename': 'United States',
  },
};

// Enhanced mobile-first viewport configuration for optimal mobile experience
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover', // For devices with notches
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
    { media: '(prefers-color-scheme: light) and (max-width: 640px)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark) and (max-width: 640px)', color: '#0f172a' },
  ],
  colorScheme: 'light dark',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <StructuredData />
        <AdSenseScript />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ATS Resume Checker" />
        <meta name="application-name" content="ATS Resume Checker" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <ToastProvider>
            <ThemeProvider
              defaultTheme="system"
              storageKey="ats-theme"
            >
              <AuthProvider>
                <OfflineIndicator showDetails />
                <GlobalLoadingIndicator variant="minimal" position="top" />
                <AuthStatusIndicator />
                <Navigation />
                {children}
              </AuthProvider>
            </ThemeProvider>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
