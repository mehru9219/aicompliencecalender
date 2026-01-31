"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { GlassCard } from "./ui/GlassCard";
import { AnimatedSection } from "./ui/AnimatedSection";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import Link from "next/link";
import { CheckCircle2, Sparkles } from "lucide-react";

type BillingCycle = "monthly" | "annual";

interface Plan {
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  popular?: boolean;
  features: string[];
}

const PLANS: Plan[] = [
  {
    name: "Starter",
    description: "For solo practitioners",
    monthlyPrice: 29,
    annualPrice: 24,
    features: [
      "1 user",
      "25 tracked deadlines",
      "Email alerts only",
      "5 document storage",
      "Basic templates",
    ],
  },
  {
    name: "Professional",
    description: "For growing practices",
    monthlyPrice: 79,
    annualPrice: 65,
    popular: true,
    features: [
      "5 users",
      "Unlimited deadlines",
      "Email + SMS alerts",
      "50 document storage",
      "All industry templates",
      "10 AI form fills/month",
      "Priority support",
    ],
  },
  {
    name: "Business",
    description: "For multi-location teams",
    monthlyPrice: 199,
    annualPrice: 165,
    features: [
      "15 users",
      "Unlimited deadlines",
      "All alert channels",
      "Unlimited document storage",
      "Custom templates",
      "Unlimited AI form fills",
      "Dedicated support",
      "API access",
      "SSO integration",
    ],
  },
];

export function PricingSection() {
  const [billing, setBilling] = useState<BillingCycle>("annual");

  return (
    <section className="py-24 lg:py-32" id="pricing">
      <div className="max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto px-6">
        {/* Header */}
        <AnimatedSection className="text-center mb-12">
          <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mt-4">
            Simple, Transparent <span className="text-primary">Pricing</span>
          </h2>
          <p className="text-muted-foreground text-lg mt-4 max-w-2xl mx-auto">
            Start free for 14 days. No credit card required.
          </p>
        </AnimatedSection>

        {/* Billing toggle */}
        <AnimatedSection animation="fade" delay={150} className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-3 p-1 rounded-full bg-muted">
            <ToggleGroup
              type="single"
              value={billing}
              onValueChange={(v) => v && setBilling(v as BillingCycle)}
            >
              <ToggleGroupItem
                value="monthly"
                className="rounded-full px-4 py-2 text-sm"
              >
                Monthly
              </ToggleGroupItem>
              <ToggleGroupItem
                value="annual"
                className="rounded-full px-4 py-2 text-sm"
              >
                Annual
                <span className="ml-2 text-xs text-status-completed font-medium">
                  Save 17%
                </span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </AnimatedSection>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {PLANS.map((plan, i) => {
            const price = billing === "monthly" ? plan.monthlyPrice : plan.annualPrice;

            return (
              <AnimatedSection key={plan.name} animation="fade-up" delay={i * 150}>
                <GlassCard
                  className={cn(
                    "h-full flex flex-col relative",
                    plan.popular && "border-primary border-2"
                  )}
                  elevated={plan.popular}
                >
                  {plan.popular && (
                    <div
                      className={cn(
                        "absolute -top-3 left-1/2 -translate-x-1/2",
                        "px-3 py-1 rounded-full",
                        "bg-primary text-primary-foreground",
                        "text-xs font-semibold",
                        "flex items-center gap-1"
                      )}
                    >
                      <Sparkles className="h-3 w-3" />
                      Most Popular
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-xl font-semibold">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>

                  <div className="mb-6">
                    <span className="text-4xl font-bold">${price}</span>
                    <span className="text-muted-foreground">/month</span>
                    {billing === "annual" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Billed annually
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-status-completed shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    variant={plan.popular ? "default" : "outline"}
                    className="w-full"
                  >
                    <Link href="/sign-up">Start Free Trial</Link>
                  </Button>
                </GlassCard>
              </AnimatedSection>
            );
          })}
        </div>

        {/* Trust note */}
        <AnimatedSection animation="fade" delay={600} className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            All plans include 14-day free trial. Cancel anytime.
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
}
