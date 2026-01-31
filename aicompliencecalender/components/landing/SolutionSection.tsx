"use client";

import { cn } from "@/lib/utils";
import { AnimatedSection } from "./ui/AnimatedSection";
import { GlassCard } from "./ui/GlassCard";
import {
  Calendar,
  Bell,
  Sparkles,
  FolderOpen,
  LayoutDashboard,
  CheckCircle2,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  headline: string;
  description: string;
  benefits: string[];
}

const FEATURES: Feature[] = [
  {
    icon: Calendar,
    title: "Smart Deadline Tracking",
    headline: "Never wonder what's due next",
    description:
      "Import your industry template or create custom deadlines. We track everything so you never miss a renewal, filing, or certification.",
    benefits: [
      "Pre-built industry templates",
      "Recurring deadline support",
      "Team assignment & accountability",
    ],
  },
  {
    icon: Bell,
    title: "Multi-Channel Alerts",
    headline: "Notifications that actually reach you",
    description:
      "Get notified where you actually check - email, SMS, or in-app. No more buried alerts in spam folders.",
    benefits: [
      "Email + SMS + push notifications",
      "Escalation if missed",
      "Snooze & acknowledge",
    ],
  },
  {
    icon: Sparkles,
    title: "AI Form Pre-Fill",
    headline: "30-minute forms done in 5 minutes",
    description:
      "Upload any compliance form and our AI extracts fields, suggests answers from your data, and helps you submit faster.",
    benefits: [
      "Automatic field detection",
      "Smart answer suggestions",
      "Document data extraction",
    ],
  },
  {
    icon: FolderOpen,
    title: "Document Vault",
    headline: "Every document ready for any audit",
    description:
      "Store licenses, certificates, and compliance docs in one secure place. Quick search, version history, expiration tracking.",
    benefits: [
      "Secure cloud storage",
      "Expiration alerts",
      "Audit-ready organization",
    ],
  },
  {
    icon: LayoutDashboard,
    title: "Compliance Dashboard",
    headline: "Know your status at a glance",
    description:
      "See your compliance health score, upcoming deadlines, team workload, and historical trends in one beautiful dashboard.",
    benefits: [
      "Real-time compliance score",
      "Team performance metrics",
      "Exportable audit reports",
    ],
  },
];

function FeatureBlock({ feature, index }: { feature: Feature; index: number }) {
  const isReversed = index % 2 === 1;
  const Icon = feature.icon;

  return (
    <div
      className={cn(
        "grid md:grid-cols-2 gap-8 md:gap-12 items-center",
        isReversed && "md:[direction:rtl]"
      )}
    >
      {/* Content */}
      <AnimatedSection animation="fade-up" className="md:[direction:ltr]">
        <div className="space-y-4">
          <div
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
              "bg-primary/10 text-primary text-sm font-medium"
            )}
          >
            <Icon className="h-4 w-4" />
            {feature.title}
          </div>

          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            {feature.headline}
          </h3>

          <p className="text-muted-foreground">{feature.description}</p>

          <ul className="space-y-2 pt-2">
            {feature.benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-status-completed shrink-0" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </AnimatedSection>

      {/* Visual */}
      <AnimatedSection animation="fade-up" delay={150} className="md:[direction:ltr]">
        <GlassCard
          className="aspect-[4/3] flex items-center justify-center"
          elevated
        >
          <div className="text-center">
            <div
              className={cn(
                "w-16 h-16 mx-auto mb-4 rounded-2xl",
                "bg-primary/10",
                "flex items-center justify-center"
              )}
            >
              <Icon className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">{feature.title} Preview</p>
          </div>
        </GlassCard>
      </AnimatedSection>
    </div>
  );
}

export function SolutionSection() {
  return (
    <section className="py-24 lg:py-32">
      <div className="max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto px-6">
        {/* Header */}
        <AnimatedSection className="text-center mb-20">
          <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
            The Solution
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mt-4">
            One Platform.{" "}
            <span className="text-primary">Zero Missed Deadlines.</span>
          </h2>
          <p className="text-muted-foreground text-lg mt-4 max-w-2xl mx-auto">
            Everything you need to stay compliant, automatically.
          </p>
        </AnimatedSection>

        {/* Features */}
        <div className="space-y-20">
          {FEATURES.map((feature, i) => (
            <FeatureBlock key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
