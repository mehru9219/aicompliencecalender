/**
 * Billing settings page.
 */

"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useOrganization } from "@/hooks/useOrganization";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { PLANS, formatPrice, type BillingCycle } from "@/lib/billing/plans";
import {
  PlanCard,
  UsageSummary,
  TrialBanner,
  UpgradeModal,
} from "@/components/features/billing";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Receipt, ArrowUpCircle } from "lucide-react";

export default function BillingSettingsPage() {
  const { currentOrg } = useOrganization();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const { toast } = useToast();

  const subscription = useQuery(
    api.billing.getSubscription,
    currentOrg ? { orgId: currentOrg._id } : "skip",
  );

  const trialStatus = useQuery(
    api.billing.getTrialStatus,
    currentOrg ? { orgId: currentOrg._id } : "skip",
  );

  const usage = useQuery(
    api.billing.getCurrentUsage,
    currentOrg ? { orgId: currentOrg._id } : "skip",
  );

  const handleManageBilling = async () => {
    if (!currentOrg) return;

    setIsLoadingPortal(true);

    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: currentOrg._id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to open billing portal");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Portal error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to open billing portal",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPortal(false);
    }
  };

  if (!currentOrg) {
    return (
      <div className="container py-8">
        <p>Please select an organization</p>
      </div>
    );
  }

  const isLoading =
    subscription === undefined ||
    trialStatus === undefined ||
    usage === undefined;

  const currentPlan = subscription?.plan ? PLANS[subscription.plan] : null;
  const statusLabel =
    subscription?.status ||
    (trialStatus?.inTrial ? "trialing" : "no_subscription");

  return (
    <div className="container py-8 space-y-8">
      {/* Trial banner */}
      {trialStatus?.inTrial && trialStatus.daysRemaining !== null && (
        <TrialBanner
          daysRemaining={trialStatus.daysRemaining}
          onUpgrade={() => setShowUpgradeModal(true)}
        />
      )}

      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription, view usage, and update payment methods
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <>
          {/* Current subscription */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Current Subscription
                  </CardTitle>
                  <CardDescription>
                    Your active plan and billing details
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    subscription?.status === "active" ? "default" : "secondary"
                  }
                >
                  {statusLabel.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentPlan ? (
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {currentPlan.name}
                    </h3>
                    <p className="text-muted-foreground">
                      {currentPlan.description}
                    </p>
                    {subscription?.billingCycle && (
                      <p className="text-sm mt-1">
                        {formatPrice(
                          subscription.billingCycle === "monthly"
                            ? currentPlan.monthlyPrice
                            : currentPlan.yearlyPrice,
                        )}
                        /
                        {subscription.billingCycle === "monthly"
                          ? "month"
                          : "year"}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowUpgradeModal(true)}
                    >
                      <ArrowUpCircle className="h-4 w-4 mr-2" />
                      Change Plan
                    </Button>
                    {subscription?.stripeCustomerId && (
                      <Button
                        variant="outline"
                        onClick={handleManageBilling}
                        disabled={isLoadingPortal}
                      >
                        <Receipt className="h-4 w-4 mr-2" />
                        {isLoadingPortal ? "Loading..." : "Manage Billing"}
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    You don&apos;t have an active subscription
                  </p>
                  <Button onClick={() => setShowUpgradeModal(true)}>
                    Choose a Plan
                  </Button>
                </div>
              )}

              {subscription?.cancelAtPeriodEnd && (
                <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
                  <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                    Your subscription is set to cancel at the end of the current
                    billing period.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Usage This Month</CardTitle>
              <CardDescription>
                Track your resource usage against your plan limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usage ? (
                <UsageSummary
                  usage={{
                    deadlines: {
                      current: usage.deadlinesCreated,
                      limit:
                        currentPlan?.features.deadlines === -1
                          ? "unlimited"
                          : currentPlan?.features.deadlines || 25,
                    },
                    storage: {
                      current: usage.storageUsedBytes / (1024 * 1024 * 1024), // Convert to GB
                      limit: currentPlan?.features.storage || 1,
                    },
                    formPreFills: {
                      current: usage.formPreFills,
                      limit:
                        currentPlan?.features.formPreFills === -1
                          ? "unlimited"
                          : currentPlan?.features.formPreFills || 0,
                    },
                    users: {
                      current: 1, // Would need to query actual count
                      limit:
                        currentPlan?.features.users === -1
                          ? "unlimited"
                          : currentPlan?.features.users || 1,
                    },
                  }}
                />
              ) : (
                <p className="text-muted-foreground">No usage data available</p>
              )}
            </CardContent>
          </Card>

          {/* Available plans */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Available Plans</h2>
            <div className="flex justify-center mb-6">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(PLANS).map(([id, plan]) => (
                <PlanCard
                  key={id}
                  plan={plan}
                  billingCycle={billingCycle}
                  isCurrentPlan={id === subscription?.plan}
                  isPopular={id === "professional"}
                  onSelect={() => setShowUpgradeModal(true)}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Upgrade modal */}
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        currentPlanId={subscription?.plan}
        orgId={currentOrg._id}
      />
    </div>
  );
}
