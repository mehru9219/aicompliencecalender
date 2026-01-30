"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import { ProgressIndicator } from "./ProgressIndicator";
import { OrgSetupStep } from "./OrgSetupStep";
import { TemplateImportStep } from "./TemplateImportStep";
import { AlertSetupStep } from "./AlertSetupStep";
import { FirstDeadlineStep } from "./FirstDeadlineStep";
import { TeamInviteStep } from "./TeamInviteStep";
import { ONBOARDING_STEPS, isOnboardingComplete } from "@/types/onboarding";

interface OnboardingWizardProps {
  orgId: Id<"organizations">;
  industry?: string;
  onComplete?: () => void;
  onDismiss?: () => void;
}

export function OnboardingWizard({
  orgId,
  industry = "other",
  onComplete,
  onDismiss,
}: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(true);

  const progress = useQuery(api.onboarding.getProgress, { orgId });
  const initializeProgress = useMutation(api.onboarding.initializeProgress);
  const markComplete = useMutation(api.onboarding.markComplete);

  // Initialize progress if not exists
  useEffect(() => {
    if (progress === null) {
      initializeProgress({ orgId });
    }
  }, [progress, orgId, initializeProgress]);

  // Calculate initial step from progress (only runs once per progress change)
  const initialStep = progress?.steps
    ? ONBOARDING_STEPS.findIndex((step) => !progress.steps[step.id])
    : 0;

  // Set current step to first incomplete when progress loads
  useEffect(() => {
    if (progress?.steps && initialStep !== -1 && currentStep === 0) {
      setCurrentStep(initialStep);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStep]);

  const handleFinish = async () => {
    if (progress?.steps && isOnboardingComplete(progress.steps)) {
      await markComplete({ orgId });
    }
    setIsOpen(false);
    onComplete?.();
  };

  const handleAdvance = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Last step completed
      handleFinish();
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    onDismiss?.();
  };

  // Loading state
  if (progress === undefined) {
    return (
      <Dialog open>
        <DialogContent className="max-w-lg">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Already complete
  if (progress?.completedAt) {
    return null;
  }

  const steps = progress?.steps || {
    account_created: true,
    org_setup: false,
    template_imported: false,
    alerts_configured: false,
    first_deadline: false,
    team_invited: false,
    first_completion: false,
  };

  const currentStepInfo = ONBOARDING_STEPS[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Welcome to Compliance Calendar</DialogTitle>
              <DialogDescription>
                Let&apos;s get you set up in just a few steps
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="-mr-2"
              onClick={handleDismiss}
            >
              <X className="size-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Progress */}
        <div className="py-4 flex-shrink-0">
          <ProgressIndicator steps={steps} currentStep={currentStep} />
          <p className="text-sm text-center text-muted-foreground mt-2">
            Step {currentStep + 1} of {ONBOARDING_STEPS.length}
            {currentStepInfo && !currentStepInfo.required && " (Optional)"}
          </p>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-1">
          {currentStep === 0 && (
            <OrgSetupStep orgId={orgId} onComplete={handleAdvance} />
          )}
          {currentStep === 1 && (
            <TemplateImportStep
              orgId={orgId}
              industry={industry}
              onComplete={handleAdvance}
              onSkip={handleAdvance}
            />
          )}
          {currentStep === 2 && (
            <AlertSetupStep orgId={orgId} onComplete={handleAdvance} />
          )}
          {currentStep === 3 && (
            <FirstDeadlineStep
              orgId={orgId}
              industry={industry}
              onComplete={handleAdvance}
            />
          )}
          {currentStep === 4 && (
            <TeamInviteStep
              orgId={orgId}
              onComplete={handleFinish}
              onSkip={handleFinish}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 pt-4 border-t">
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={handleDismiss}
          >
            Continue later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to check if onboarding should be shown
export function useOnboardingStatus(orgId: Id<"organizations"> | undefined) {
  const progress = useQuery(
    api.onboarding.getProgress,
    orgId ? { orgId } : "skip",
  );

  return {
    isLoading: progress === undefined,
    isComplete: !!progress?.completedAt,
    progress: progress,
    shouldShowWizard: progress !== undefined && !progress?.completedAt,
  };
}
