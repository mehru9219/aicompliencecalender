"use client";

import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Calendar, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type DeadlineStatus = "upcoming" | "due_soon" | "overdue" | "completed";

interface DeadlineStatusBadgeProps {
  status: DeadlineStatus;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const statusConfig: Record<
  DeadlineStatus,
  { label: string; icon: typeof Clock; className: string }
> = {
  overdue: {
    label: "Overdue",
    icon: AlertTriangle,
    className: "bg-red-600 text-white hover:bg-red-700",
  },
  due_soon: {
    label: "Due Soon",
    icon: Clock,
    className: "bg-amber-500 text-black hover:bg-amber-600",
  },
  upcoming: {
    label: "Upcoming",
    icon: Calendar,
    className: "bg-blue-600 text-white hover:bg-blue-700",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle,
    className: "bg-green-600 text-white hover:bg-green-700",
  },
};

const sizeConfig = {
  sm: { badge: "text-xs px-2 py-0.5", icon: "h-3 w-3" },
  md: { badge: "text-sm px-2.5 py-1", icon: "h-4 w-4" },
  lg: { badge: "text-base px-3 py-1.5", icon: "h-5 w-5" },
};

export function DeadlineStatusBadge({
  status,
  size = "md",
  className,
}: DeadlineStatusBadgeProps) {
  const config = statusConfig[status];
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  return (
    <Badge
      variant="default"
      className={cn(config.className, sizes.badge, "gap-1.5", className)}
    >
      <Icon className={sizes.icon} aria-hidden="true" />
      <span>{config.label}</span>
    </Badge>
  );
}
