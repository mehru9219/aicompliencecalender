"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ONBOARDING_STEPS, type OnboardingSteps } from "@/types/onboarding";

interface ProgressIndicatorProps {
  steps: OnboardingSteps;
  currentStep: number;
  variant?: "bar" | "dots";
}

export function ProgressIndicator({
  steps,
  currentStep,
  variant = "bar",
}: ProgressIndicatorProps) {
  const wizardSteps = ONBOARDING_STEPS; // Steps shown in wizard

  if (variant === "dots") {
    return (
      <TooltipProvider>
        <div className="flex items-center justify-center gap-2">
          {wizardSteps.map((step, index) => {
            const isComplete = steps[step.id];
            const isCurrent = index === currentStep;

            return (
              <Tooltip key={step.id}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full transition-all",
                      isComplete && "bg-green-500",
                      isCurrent &&
                        !isComplete &&
                        "bg-blue-500 ring-4 ring-blue-100",
                      !isComplete && !isCurrent && "bg-gray-200",
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {isComplete
                      ? "Completed"
                      : isCurrent
                        ? "In progress"
                        : "Pending"}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    );
  }

  // Bar variant (default)
  return (
    <TooltipProvider>
      <div className="flex gap-1.5">
        {wizardSteps.map((step, index) => {
          const isComplete = steps[step.id];
          const isCurrent = index === currentStep;

          return (
            <Tooltip key={step.id}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "flex-1 h-2 rounded-full transition-all relative",
                    isComplete && "bg-green-500",
                    isCurrent && !isComplete && "bg-blue-500",
                    !isComplete && !isCurrent && "bg-gray-200",
                  )}
                >
                  {isComplete && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="size-2.5 text-white" />
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <p className="font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                  {!step.required && (
                    <p className="text-xs text-blue-500">Optional</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

// Compact version for header/navigation
export function CompactProgress({
  steps,
  className,
}: {
  steps: OnboardingSteps;
  className?: string;
}) {
  const wizardSteps = ONBOARDING_STEPS;
  const completedCount = wizardSteps.filter((s) => steps[s.id]).length;
  const totalCount = wizardSteps.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {completedCount}/{totalCount}
      </span>
    </div>
  );
}
