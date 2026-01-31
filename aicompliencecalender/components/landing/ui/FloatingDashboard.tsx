"use client";

import { cn } from "@/lib/utils";
import {
  Calendar,
  Bell,
  CheckCircle2,
  AlertTriangle,
  FileText,
} from "lucide-react";

interface FloatingDashboardProps {
  className?: string;
}

export function FloatingDashboard({ className }: FloatingDashboardProps) {
  return (
    <div className={cn("relative w-full max-w-3xl lg:max-w-4xl mx-auto", className)}>
      {/* Main dashboard card */}
      <div
        className={cn(
          "relative",
          "rounded-2xl overflow-hidden",
          "bg-card",
          "border border-border",
          "shadow-xl",
          
        )}
      >
        {/* Browser chrome */}
        <div className="h-10 bg-muted/50 flex items-center gap-2 px-4 border-b border-border">
          <span className="w-3 h-3 rounded-full bg-red-400/80" />
          <span className="w-3 h-3 rounded-full bg-yellow-400/80" />
          <span className="w-3 h-3 rounded-full bg-green-400/80" />
          <span className="ml-4 text-xs text-muted-foreground">
            app.compliancecal.com
          </span>
        </div>

        {/* Dashboard content */}
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="h-4 w-32 bg-foreground/10 rounded" />
              <div className="h-3 w-24 bg-muted-foreground/20 rounded mt-2" />
            </div>
            <div className="h-8 w-8 bg-primary/20 rounded-lg flex items-center justify-center">
              <Bell className="h-4 w-4 text-primary" />
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-status-completed/10 rounded-xl border border-status-completed/20">
              <CheckCircle2 className="h-4 w-4 text-status-completed mb-1" />
              <div className="text-xl font-bold text-foreground">24</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="p-3 bg-status-due-soon/10 rounded-xl border border-status-due-soon/20">
              <AlertTriangle className="h-4 w-4 text-status-due-soon mb-1" />
              <div className="text-xl font-bold text-foreground">3</div>
              <div className="text-xs text-muted-foreground">Due Soon</div>
            </div>
            <div className="p-3 bg-status-upcoming/10 rounded-xl border border-status-upcoming/20">
              <Calendar className="h-4 w-4 text-status-upcoming mb-1" />
              <div className="text-xl font-bold text-foreground">12</div>
              <div className="text-xs text-muted-foreground">Upcoming</div>
            </div>
          </div>

          {/* Mini list */}
          <div className="p-3 bg-muted/30 rounded-xl space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-status-due-soon" />
              <div className="h-3 flex-1 bg-foreground/10 rounded" />
              <div className="text-xs text-muted-foreground">Mar 15</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-status-upcoming" />
              <div className="h-3 flex-1 bg-foreground/10 rounded" />
              <div className="text-xs text-muted-foreground">Mar 22</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-status-upcoming" />
              <div className="h-3 flex-1 bg-foreground/10 rounded" />
              <div className="text-xs text-muted-foreground">Apr 1</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating notification - contained within bounds */}
      <div
        className={cn(
          "absolute -top-3 right-4 md:right-8",
          "p-3 rounded-xl",
          "bg-card",
          "border border-border",
          "shadow-lg",
          "animate-float",
          "[animation-delay:1s]"
        )}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-status-due-soon/20 rounded-full flex items-center justify-center">
            <Bell className="h-3.5 w-3.5 text-status-due-soon" />
          </div>
          <div>
            <div className="text-xs font-medium">License Renewal</div>
            <div className="text-[10px] text-muted-foreground">Due in 3 days</div>
          </div>
        </div>
      </div>

      {/* Floating score - contained within bounds */}
      <div
        className={cn(
          "absolute -bottom-3 left-4 md:left-8",
          "p-3 rounded-xl",
          "bg-card",
          "border border-border",
          "shadow-lg",
          "animate-float",
          "[animation-delay:2s]"
        )}
      >
        <div className="text-center">
          <div className="text-xl font-bold text-status-completed">94%</div>
          <div className="text-[10px] text-muted-foreground">Compliance</div>
        </div>
      </div>

      {/* Floating docs - desktop only */}
      <div
        className={cn(
          "absolute top-1/2 right-4 -translate-y-1/2",
          "p-2.5 rounded-lg",
          "bg-card",
          "border border-border",
          "shadow-md",
          "animate-float",
          "[animation-delay:0.5s]",
          "hidden lg:flex items-center gap-2"
        )}
      >
        <FileText className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs">12 docs</span>
      </div>
    </div>
  );
}
