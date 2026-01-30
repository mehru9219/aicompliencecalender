"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
  as?: "div" | "article" | "section";
}

export function GlassCard({
  children,
  className,
  elevated = false,
  as: Component = "div",
}: GlassCardProps) {
  return (
    <Component
      className={cn(
        "rounded-xl p-6",
        "bg-card/80 backdrop-blur-sm",
        "border border-border/50",
        "transition-shadow duration-200",
        elevated && "shadow-md hover:shadow-lg",
        !elevated && "shadow-sm hover:shadow-md",
        className
      )}
    >
      {children}
    </Component>
  );
}
