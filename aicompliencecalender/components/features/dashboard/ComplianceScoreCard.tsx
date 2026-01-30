"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CircularProgress } from "@/components/ui/circular-progress";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { getScoreStatus, getScoreColorClasses } from "@/lib/utils/score";

interface ComplianceScoreCardProps {
  score: number;
  previousScore?: number;
  className?: string;
}

export function ComplianceScoreCard({
  score,
  previousScore,
  className,
}: ComplianceScoreCardProps) {
  const status = getScoreStatus(score);

  const statusIcons = {
    green: CheckCircle2,
    yellow: AlertTriangle,
    red: XCircle,
  };

  const StatusIcon = statusIcons[status.color];

  // Calculate trend
  const trend =
    previousScore !== undefined
      ? score > previousScore
        ? "up"
        : score < previousScore
          ? "down"
          : "same"
      : null;

  const trendDiff =
    previousScore !== undefined ? Math.abs(score - previousScore) : 0;

  return (
    <Card
      className={cn(
        "overflow-hidden",
        getScoreColorClasses(score, "bg"),
        getScoreColorClasses(score, "border"),
        className,
      )}
    >
      <CardContent className="py-6">
        <div className="flex items-center justify-between gap-6">
          {/* Score Text */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">
              Compliance Score
            </p>
            <div className="flex items-baseline gap-2">
              <span
                className={cn(
                  "text-5xl font-bold tracking-tight",
                  getScoreColorClasses(score, "text"),
                )}
              >
                {score}%
              </span>
              {trend && trendDiff > 0 && (
                <span
                  className={cn(
                    "flex items-center text-sm font-medium",
                    trend === "up" && "text-green-600",
                    trend === "down" && "text-red-600",
                    trend === "same" && "text-muted-foreground",
                  )}
                >
                  {trend === "up" && <TrendingUp className="h-4 w-4 mr-1" />}
                  {trend === "down" && (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  {trend === "same" && <Minus className="h-4 w-4 mr-1" />}
                  {trendDiff}%
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <StatusIcon
                className={cn("h-5 w-5", getScoreColorClasses(score, "text"))}
              />
              <span
                className={cn(
                  "text-base font-semibold",
                  getScoreColorClasses(score, "text"),
                )}
              >
                {status.label}
              </span>
            </div>
          </div>

          {/* Circular Progress */}
          <div className="flex-shrink-0">
            <CircularProgress
              value={score}
              size={100}
              strokeWidth={10}
              color={status.color}
            />
          </div>
        </div>

        {/* Score interpretation */}
        <p className="mt-4 text-sm text-muted-foreground">
          {score >= 80
            ? "All deadlines are on track. Keep up the good work!"
            : score >= 60
              ? "Some items need attention. Review upcoming deadlines."
              : "Critical items are overdue. Immediate action required."}
        </p>
      </CardContent>
    </Card>
  );
}
