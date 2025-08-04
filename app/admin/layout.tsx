export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-[1920px] mx-auto px-6 py-6">
        <div className="w-full max-w-[1280px] mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}