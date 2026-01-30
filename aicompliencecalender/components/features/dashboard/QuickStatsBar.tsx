"use client";

import { StatCard } from "./StatCard";
import { Clock, CheckCircle, FileText, TrendingUp } from "lucide-react";

interface QuickStatsBarProps {
  stats: {
    totalActive: number;
    completedThisMonth: number;
    documentsStored: number;
    onTimeRate: number;
  };
  className?: string;
}

export function QuickStatsBar({ stats, className }: QuickStatsBarProps) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      <StatCard
        icon={Clock}
        label="Active Deadlines"
        value={stats.totalActive}
        href="/deadlines"
      />
      <StatCard
        icon={CheckCircle}
        label="Completed This Month"
        value={stats.completedThisMonth}
        href="/deadlines?filter=completed"
      />
      <StatCard
        icon={FileText}
        label="Documents Stored"
        value={stats.documentsStored}
        href="/documents"
      />
      <StatCard
        icon={TrendingUp}
        label="On-Time Rate"
        value={`${stats.onTimeRate}%`}
      />
    </div>
  );
}
