/**
 * Upgrade modal component for plan selection and checkout.
 */

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PlanCard } from "./PlanCard";
import { PlanComparisonTable } from "./PlanComparisonTable";
import { PLANS, getPriceId, type BillingCycle } from "@/lib/billing/plans";
import { useToast } from "@/hooks/use-toast";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlanId?: string;
  orgId: string;
}

export function UpgradeModal({
  open,
  onOpenChange,
  currentPlanId,
  orgId,
}: UpgradeModalProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSelectPlan = async (planId: string) => {
    if (planId === currentPlanId) return;

    setIsLoading(planId);

    try {
      const priceId = getPriceId(
        planId as "starter" | "professional" | "business",
        billingCycle,
      );

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, priceId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to start checkout",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  const plans = Object.entries(PLANS);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upgrade Your Plan</DialogTitle>
          <DialogDescription>
            Choose the plan that best fits your organization&apos;s needs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Billing cycle toggle */}
          <div className="flex justify-center">
            <ToggleGroup
              type="single"
              value={billingCycle}
              onValueChange={(v: string) =>
                v && setBillingCycle(v as BillingCycle)
              }
            >
              <ToggleGroupItem value="monthly">Monthly</ToggleGroupItem>
              <ToggleGroupItem value="yearly">
                Yearly
                <span className="ml-2 text-xs text-green-600 font-medium">
                  Save 17%
                </span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(([id, plan]) => (
              <PlanCard
                key={id}
                plan={plan}
                billingCycle={billingCycle}
                isCurrentPlan={id === currentPlanId}
                isPopular={id === "professional"}
                onSelect={() => handleSelectPlan(id)}
                isLoading={isLoading === id}
              />
            ))}
          </div>

          {/* Detailed comparison */}
          <div className="pt-6 border-t">
            <h3 className="text-lg font-semibold mb-4">Detailed Comparison</h3>
            <PlanComparisonTable
              billingCycle={billingCycle}
              currentPlanId={currentPlanId}
            />
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground">
            <p>All plans include a 14-day free trial. Cancel anytime.</p>
            <p className="mt-1">
              Questions? Contact us at{" "}
              <a
                href="mailto:support@compliancecalendar.com"
                className="underline"
              >
                support@compliancecalendar.com
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
