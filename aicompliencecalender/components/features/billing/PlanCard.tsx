/**
 * Plan card component for displaying subscription plan details.
 */

"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import type { Plan, BillingCycle } from "@/types/billing";

interface PlanCardProps {
  plan: Plan;
  billingCycle: BillingCycle;
  isCurrentPlan?: boolean;
  isPopular?: boolean;
  onSelect?: () => void;
  isLoading?: boolean;
}

export function PlanCard({
  plan,
  billingCycle,
  isCurrentPlan = false,
  isPopular = false,
  onSelect,
  isLoading = false,
}: PlanCardProps) {
  const price =
    billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
  const monthlyEquivalent =
    billingCycle === "yearly"
      ? Math.round(plan.yearlyPrice / 12)
      : plan.monthlyPrice;
  const yearlyDiscount =
    billingCycle === "yearly"
      ? Math.round((1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100)
      : 0;

  const features = [
    `${plan.features.users === -1 ? "Unlimited" : plan.features.users} team member${plan.features.users !== 1 ? "s" : ""}`,
    `${plan.features.deadlines === -1 ? "Unlimited" : plan.features.deadlines} deadlines/month`,
    `${plan.features.storage}GB document storage`,
    plan.features.emailAlerts ? "Email alerts" : null,
    plan.features.smsAlerts ? "SMS alerts" : null,
    plan.features.formPreFills > 0 || plan.features.formPreFills === -1
      ? `${plan.features.formPreFills === -1 ? "Unlimited" : plan.features.formPreFills} AI form pre-fills/month`
      : null,
    plan.features.customBranding ? "Custom branding" : null,
    plan.features.prioritySupport ? "Priority support" : null,
    plan.features.apiAccess ? "API access" : null,
  ].filter(Boolean);

  return (
    <Card
      className={cn(
        "relative flex flex-col",
        isCurrentPlan && "border-primary",
        isPopular && "border-primary shadow-lg scale-105",
      )}
    >
      {isPopular && (
        <Badge
          className="absolute -top-3 left-1/2 -translate-x-1/2"
          variant="default"
        >
          Most Popular
        </Badge>
      )}

      {isCurrentPlan && (
        <Badge className="absolute -top-3 right-4" variant="secondary">
          Current Plan
        </Badge>
      )}

      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        <div className="text-center">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold">${monthlyEquivalent}</span>
            <span className="text-muted-foreground">/month</span>
          </div>
          {billingCycle === "yearly" && yearlyDiscount > 0 && (
            <p className="text-sm text-green-600 mt-1">
              Save {yearlyDiscount}% with annual billing (${price}/year)
            </p>
          )}
          {billingCycle === "monthly" && (
            <p className="text-sm text-muted-foreground mt-1">billed monthly</p>
          )}
        </div>

        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={
            isCurrentPlan ? "outline" : isPopular ? "default" : "secondary"
          }
          onClick={onSelect}
          disabled={isCurrentPlan || isLoading}
        >
          {isLoading
            ? "Loading..."
            : isCurrentPlan
              ? "Current Plan"
              : "Select Plan"}
        </Button>
      </CardFooter>
    </Card>
  );
}
