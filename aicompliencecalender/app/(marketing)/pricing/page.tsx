/**
 * Public pricing page.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PLANS, type BillingCycle } from "@/lib/billing/plans";
import { PlanCard, PlanComparisonTable } from "@/components/features/billing";
import { Check, ArrowRight } from "lucide-react";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  const plans = Object.entries(PLANS);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="py-20 px-4 text-center bg-gradient-to-b from-primary/5 to-background">
        <div className="container max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground mt-4 max-w-2xl mx-auto">
            Choose the plan that fits your organization. All plans include a
            14-day free trial.
          </p>

          {/* Billing toggle */}
          <div className="flex justify-center mt-8">
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
                <span className="ml-1 text-xs text-green-600 font-medium">
                  -17%
                </span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </section>

      {/* Plan cards */}
      <section className="py-12 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(([id, plan]) => (
              <PlanCard
                key={id}
                plan={plan}
                billingCycle={billingCycle}
                isPopular={id === "professional"}
                onSelect={() => {
                  // Redirect to signup with plan preselected
                  window.location.href = `/sign-up?plan=${id}&cycle=${billingCycle}`;
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Feature comparison */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Compare Plans</h2>
          <PlanComparisonTable billingCycle={billingCycle} />
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4">
        <div className="container max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold">Can I change plans later?</h3>
              <p className="text-muted-foreground mt-1">
                Yes, you can upgrade or downgrade your plan at any time. Changes
                take effect immediately, and we&apos;ll prorate any differences.
              </p>
            </div>

            <div>
              <h3 className="font-semibold">
                What happens after my trial ends?
              </h3>
              <p className="text-muted-foreground mt-1">
                Your trial lasts 14 days with full access to Professional
                features. If you don&apos;t subscribe, you&apos;ll be moved to
                limited access until you choose a plan.
              </p>
            </div>

            <div>
              <h3 className="font-semibold">Is there a free plan?</h3>
              <p className="text-muted-foreground mt-1">
                We offer a 14-day free trial on all plans. After that,
                you&apos;ll need to choose a paid plan to continue using the
                service.
              </p>
            </div>

            <div>
              <h3 className="font-semibold">How does billing work?</h3>
              <p className="text-muted-foreground mt-1">
                We accept all major credit cards. Monthly plans are billed on
                the same date each month. Annual plans are billed once per year.
              </p>
            </div>

            <div>
              <h3 className="font-semibold">Can I cancel anytime?</h3>
              <p className="text-muted-foreground mt-1">
                Yes, you can cancel your subscription at any time. You&apos;ll
                continue to have access until the end of your billing period.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold">Ready to get started?</h2>
          <p className="mt-4 text-lg opacity-90">
            Start your 14-day free trial today. No credit card required.
          </p>
          <Button size="lg" variant="secondary" className="mt-8" asChild>
            <Link href="/sign-up">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
