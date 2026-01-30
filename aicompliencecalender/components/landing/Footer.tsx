"use client";

import Link from "next/link";
import { Calendar } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 border-t border-border">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold"
          >
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
              <Calendar className="h-3 w-3 text-primary-foreground" />
            </div>
            <span>ComplianceCal</span>
          </Link>

          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} ComplianceCal. All rights reserved.
          </p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
