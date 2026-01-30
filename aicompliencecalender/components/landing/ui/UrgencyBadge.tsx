"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

interface UrgencyBadgeProps {
  className?: string;
}

export function UrgencyBadge({ className }: UrgencyBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full",
        "bg-destructive/10",
        "border border-destructive/20",
        "text-destructive",
        "text-sm font-medium",
        className
      )}
    >
      <AlertTriangle className="h-4 w-4" />
      Average penalty: $12,000+ per violation
    </span>
  );
}
