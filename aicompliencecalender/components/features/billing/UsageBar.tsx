/**
 * Usage bar component for displaying usage limits and current consumption.
 */

"use client";

import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle } from "lucide-react";

interface UsageBarProps {
  label: string;
  current: number;
  limit: number | "unlimited";
  unit?: string;
  showWarning?: boolean;
  warningThreshold?: number; // Percentage (0-100)
}

export function UsageBar({
  label,
  current,
  limit,
  unit = "",
  showWarning = true,
  warningThreshold = 80,
}: UsageBarProps) {
  const isUnlimited = limit === "unlimited";
  const percentage = isUnlimited ? 0 : Math.min(100, (current / limit) * 100);
  const isWarning = !isUnlimited && percentage >= warningThreshold;
  const isExceeded = !isUnlimited && current >= limit;

  const formatValue = (value: number): string => {
    if (unit === "GB" && value < 1) {
      return `${Math.round(value * 1024)}MB`;
    }
    return `${value}${unit}`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium flex items-center gap-2">
          {label}
          {showWarning && isWarning && !isExceeded && (
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          )}
          {isExceeded && <AlertTriangle className="h-4 w-4 text-red-500" />}
        </span>
        <span className="text-muted-foreground">
          {isUnlimited ? (
            <span className="text-green-600">Unlimited</span>
          ) : (
            <>
              <span className={cn(isExceeded && "text-red-600 font-medium")}>
                {formatValue(current)}
              </span>
              {" / "}
              {formatValue(limit as number)}
            </>
          )}
        </span>
      </div>

      {!isUnlimited && (
        <Progress
          value={percentage}
          className={cn(
            "h-2",
            isExceeded && "[&>div]:bg-red-500",
            isWarning && !isExceeded && "[&>div]:bg-yellow-500",
          )}
        />
      )}

      {isExceeded && (
        <p className="text-xs text-red-600">
          You have exceeded your plan limit. Upgrade to continue.
        </p>
      )}
    </div>
  );
}

interface UsageSummaryProps {
  usage: {
    deadlines: { current: number; limit: number | "unlimited" };
    storage: { current: number; limit: number | "unlimited" };
    formPreFills: { current: number; limit: number | "unlimited" };
    users: { current: number; limit: number | "unlimited" };
  };
}

export function UsageSummary({ usage }: UsageSummaryProps) {
  return (
    <div className="space-y-4">
      <UsageBar
        label="Deadlines this month"
        current={usage.deadlines.current}
        limit={usage.deadlines.limit}
      />
      <UsageBar
        label="Document storage"
        current={usage.storage.current}
        limit={usage.storage.limit}
        unit="GB"
      />
      <UsageBar
        label="AI form pre-fills this month"
        current={usage.formPreFills.current}
        limit={usage.formPreFills.limit}
      />
      <UsageBar
        label="Team members"
        current={usage.users.current}
        limit={usage.users.limit}
      />
    </div>
  );
}
