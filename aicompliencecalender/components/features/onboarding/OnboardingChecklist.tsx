"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles,
  CheckCircle,
  Circle,
  ChevronDown,
  ChevronUp,
  Calendar,
  Bell,
  Users,
  CheckCheck,
  ArrowRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CHECKLIST_ITEMS, type OnboardingSteps } from "@/types/onboarding";

interface OnboardingChecklistProps {
  orgId: Id<"organizations">;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const STEP_ICONS: Record<string, React.ElementType> = {
  first_deadline: Calendar,
  alerts_configured: Bell,
  team_invited: Users,
  first_completion: CheckCheck,
};

export function OnboardingChecklist({
  orgId,
  dismissible = true,
  onDismiss,
}: OnboardingChecklistProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  const progress = useQuery(api.onboarding.getProgress, { orgId });

  // Loading or dismissed
  if (progress === undefined || isDismissed) {
    return null;
  }

  // Already completed
  if (progress?.completedAt) {
    return null;
  }

  const steps = progress?.steps || ({} as OnboardingSteps);
  const completedCount = CHECKLIST_ITEMS.filter(
    (item) => steps[item.id],
  ).length;
  const totalCount = CHECKLIST_ITEMS.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  // All complete
  if (completedCount === totalCount) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <Card className="border-primary/20 bg-card">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-blue-100">
                <Sparkles className="size-4 text-blue-600" />
              </div>
              <CardTitle className="text-base">Getting Started</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              {dismissible && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleDismiss}
                >
                  <X className="size-4" />
                </Button>
              )}
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  {isOpen ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <Progress value={percentage} className="h-2" />
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {completedCount}/{totalCount}
            </span>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-2">
            <ul className="space-y-2">
              {CHECKLIST_ITEMS.map((item) => {
                const isComplete = steps[item.id];
                const Icon = STEP_ICONS[item.id] || Circle;

                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg transition-colors",
                        isComplete
                          ? "text-muted-foreground"
                          : "hover:bg-blue-100/50",
                      )}
                    >
                      {isComplete ? (
                        <CheckCircle className="size-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <div className="p-1 rounded-full bg-gray-100 flex-shrink-0">
                          <Icon className="size-3 text-gray-500" />
                        </div>
                      )}
                      <span
                        className={cn(
                          "flex-1 text-sm",
                          isComplete && "line-through",
                        )}
                      >
                        {item.label}
                      </span>
                      {!isComplete && (
                        <ArrowRight className="size-4 text-muted-foreground" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// Minimal inline version for tight spaces
export function InlineChecklist({
  orgId,
  className,
}: {
  orgId: Id<"organizations">;
  className?: string;
}) {
  const progress = useQuery(api.onboarding.getProgress, { orgId });

  if (!progress || progress.completedAt) {
    return null;
  }

  const steps = progress.steps;
  const completedCount = CHECKLIST_ITEMS.filter(
    (item) => steps[item.id],
  ).length;
  const totalCount = CHECKLIST_ITEMS.length;

  if (completedCount === totalCount) {
    return null;
  }

  // Find first incomplete item
  const nextItem = CHECKLIST_ITEMS.find((item) => !steps[item.id]);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex items-center gap-1.5">
        <Sparkles className="size-4 text-blue-500" />
        <span className="text-sm font-medium">
          {completedCount}/{totalCount} complete
        </span>
      </div>
      {nextItem && (
        <Link
          href={nextItem.href}
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          Next: {nextItem.label}
          <ArrowRight className="size-3" />
        </Link>
      )}
    </div>
  );
}
