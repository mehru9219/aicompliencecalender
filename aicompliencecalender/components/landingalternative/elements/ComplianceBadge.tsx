"use client";

import { Shield, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComplianceBadgeProps {
  name: string;
  variant?: "default" | "outline";
  className?: string;
}

export function ComplianceBadge({ name, variant = "default", className }: ComplianceBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
        "transition-all duration-200 hover:scale-105",
        variant === "default" && "compliance-badge text-foreground",
        variant === "outline" && "border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
        className
      )}
    >
      <Shield className="w-4 h-4" />
      <span>{name}</span>
      <CheckCircle className="w-3.5 h-3.5 text-status-completed" />
    </div>
  );
}

interface TrustMetricProps {
  value: string;
  label: string;
  className?: string;
}

export function TrustMetric({ value, label, className }: TrustMetricProps) {
  return (
    <div className={cn("text-center", className)}>
      <div className="font-display text-3xl font-bold text-foreground">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
