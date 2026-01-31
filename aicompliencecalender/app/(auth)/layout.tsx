import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Calendar } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight"
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Calendar className="h-4 w-4 text-primary-foreground" />
            </div>
            <span>ComplianceCal</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Centered content */}
      <main className="flex-1 flex items-center justify-center p-6 relative">
        {/* Background gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 40%, oklch(0.43 0.04 42 / 0.08), transparent 70%)",
          }}
        />

        {/* Glass overlay container */}
        <div className="relative z-10 w-full max-w-md">
          {children}
        </div>
      </main>
    </div>
  );
}
