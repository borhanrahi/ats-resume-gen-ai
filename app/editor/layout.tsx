import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Resume Editor - ATS Resume Checker',
  description: 'Premium visual resume editor with drag-and-drop functionality',
};

export default function EditorLayout({
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