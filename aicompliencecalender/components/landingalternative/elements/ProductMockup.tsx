"use client";

import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
} from "lucide-react";

const mockDeadlines = [
  {
    title: "GDPR Annual Review",
    status: "completed",
    date: "Jan 15",
    icon: CheckCircle2,
  },
  {
    title: "SOC 2 Audit Prep",
    status: "due-soon",
    date: "Jan 28",
    icon: AlertTriangle,
  },
  {
    title: "HIPAA Training",
    status: "upcoming",
    date: "Feb 12",
    icon: Clock,
  },
  {
    title: "PCI-DSS Assessment",
    status: "upcoming",
    date: "Feb 28",
    icon: FileText,
  },
];

const statusColors: Record<string, string> = {
  completed: "bg-status-completed/20 text-status-completed border-status-completed/30",
  "due-soon": "bg-status-due-soon/20 text-status-due-soon border-status-due-soon/30",
  upcoming: "bg-status-upcoming/20 text-status-upcoming border-status-upcoming/30",
  overdue: "bg-status-overdue/20 text-status-overdue border-status-overdue/30",
};

export function ProductMockup() {
  return (
    <div className="animate-gentle-float">
      <div className="relative">
        {/* Browser chrome */}
        <div className="rounded-t-xl bg-card border border-b-0 border-border px-4 py-3 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive/60" />
            <div className="w-3 h-3 rounded-full bg-secondary" />
            <div className="w-3 h-3 rounded-full bg-status-completed/60" />
          </div>
          <div className="flex-1 mx-4">
            <div className="bg-muted rounded-md px-3 py-1 text-xs text-muted-foreground text-center">
              app.compliancecalendar.ai
            </div>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="rounded-b-xl bg-card border border-border shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Calendar className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-card-foreground">Dashboard</span>
            </div>
            <Badge className="bg-secondary text-secondary-foreground border-0">
              3 due this week
            </Badge>
          </div>

          {/* Compliance score */}
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Compliance Score</span>
              <span className="text-2xl font-display font-semibold text-primary">94%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-1000"
                style={{ width: "94%" }}
              />
            </div>
          </div>

          {/* Deadline list */}
          <div className="px-6 py-4 space-y-3">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Upcoming Deadlines
            </h4>
            {mockDeadlines.map((deadline, idx) => {
              const Icon = deadline.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${statusColors[deadline.status]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-card-foreground truncate">
                      {deadline.title}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{deadline.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Decorative shadow/glow */}
        <div className="absolute -inset-4 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 rounded-2xl -z-10 blur-xl" />
      </div>
    </div>
  );
}
