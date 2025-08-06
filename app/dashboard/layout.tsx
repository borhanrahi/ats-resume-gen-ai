import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard - ATS Resume Checker',
  description: 'Premium dashboard for resume analysis and optimization',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}