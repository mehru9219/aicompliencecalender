import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold hover:text-primary">
            AI Compliance Calendar
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/deadlines"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Deadlines
            </Link>
            <Link
              href="/documents"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Documents
            </Link>
            <Link
              href="/templates"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Templates
            </Link>
            <Link
              href="/calendar"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Calendar
            </Link>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
