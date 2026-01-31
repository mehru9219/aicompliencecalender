/**
 * Trial banner component for displaying trial status and upgrade prompts.
 */

"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X, Clock, AlertTriangle, Zap } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

interface TrialBannerProps {
  daysRemaining: number;
  onUpgrade?: () => void;
  dismissible?: boolean;
}

export function TrialBanner({
  daysRemaining,
  onUpgrade,
  dismissible = true,
}: TrialBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const isUrgent = daysRemaining <= 3;
  const isExpired = daysRemaining <= 0;

  const getMessage = () => {
    if (isExpired) {
      return "Your free trial has expired. Upgrade now to continue using all features.";
    }
    if (daysRemaining === 1) {
      return "Your free trial expires tomorrow! Upgrade now to keep your data.";
    }
    if (isUrgent) {
      return `Only ${daysRemaining} days left in your trial. Upgrade now to continue.`;
    }
    return `${daysRemaining} days left in your free trial. Upgrade anytime for full access.`;
  };

  const Icon = isExpired ? AlertTriangle : isUrgent ? Clock : Zap;

  return (
    <div
      className={cn(
        "relative flex items-center justify-between gap-4 px-4 py-3 text-sm",
        isExpired
          ? "bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100"
          : isUrgent
            ? "bg-yellow-50 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-100"
            : "bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100",
      )}
    >
      <div className="flex items-center gap-3">
        <Icon
          className={cn(
            "h-5 w-5 shrink-0",
            isExpired
              ? "text-red-600"
              : isUrgent
                ? "text-yellow-600"
                : "text-blue-600",
          )}
        />
        <span>{getMessage()}</span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={isExpired || isUrgent ? "default" : "outline"}
          onClick={onUpgrade}
          asChild={!onUpgrade}
          className={cn(
            isExpired && "bg-red-600 hover:bg-red-700",
            isUrgent && !isExpired && "bg-yellow-600 hover:bg-yellow-700",
          )}
        >
          {onUpgrade ? (
            "Upgrade Now"
          ) : (
            <Link href="/dashboard/settings/billing">Upgrade Now</Link>
          )}
        </Button>

        {dismissible && !isExpired && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => setIsDismissed(true)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        )}
      </div>
    </div>
  );
}

interface TrialStatusProps {
  trialEnd: number | null;
  status:
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "unpaid"
    | "incomplete"
    | "incomplete_expired"
    | "paused";
}

// Helper to calculate days until trial ends
function calculateDaysRemaining(trialEnd: number): number {
  const now = Date.now();
  return Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)));
}

export function TrialStatus({ trialEnd, status }: TrialStatusProps) {
  // Use lazy state initialization with function to avoid render-time Date.now()
  const [daysRemaining, setDaysRemaining] = useState(() =>
    trialEnd ? calculateDaysRemaining(trialEnd) : 0,
  );

  // Update days remaining when trialEnd changes
  if (trialEnd && status === "trialing") {
    const newDays = calculateDaysRemaining(trialEnd);
    if (newDays !== daysRemaining) {
      setDaysRemaining(newDays);
    }
  }

  if (status !== "trialing" || !trialEnd) {
    return null;
  }

  return <TrialBanner daysRemaining={daysRemaining} />;
}
