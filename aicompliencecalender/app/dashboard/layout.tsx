"use client";

import Link from "next/link";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { OrgProvider } from "@/components/providers/OrgProvider";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OrgProvider>
      <div className="min-h-screen bg-background">
        <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-xl font-semibold hover:text-primary">
                AI Compliance Calendar
              </Link>
              <OrganizationSwitcher
                afterCreateOrganizationUrl="/dashboard"
                afterSelectOrganizationUrl="/dashboard"
                afterLeaveOrganizationUrl="/dashboard"
              />
            </div>
            <nav className="flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/deadlines"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Deadlines
              </Link>
              <Link
                href="/dashboard/documents"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Documents
              </Link>
              <Link
                href="/dashboard/templates"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Templates
              </Link>
              <Link
                href="/dashboard/calendar"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Calendar
              </Link>
              <ThemeToggle />
              <UserButton afterSignOutUrl="/" />
            </nav>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">{children}</main>
      </div>
    </OrgProvider>
  );
}
