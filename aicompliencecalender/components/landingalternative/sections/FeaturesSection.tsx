"use client";

import { FeatureCard } from "../elements/FeatureCard";
import { Sparkles, Bell, FolderLock } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI Form Prefill",
    description:
      "Upload any compliance form and watch AI fill it in seconds using your organization's data. No more manual data entry.",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    description:
      "Multi-channel reminders via email, SMS, and Slack. Never miss a deadline with escalating notifications.",
  },
  {
    icon: FolderLock,
    title: "Document Vault",
    description:
      "Every file organized, version-controlled, and audit-ready. Find any document in seconds, not hours.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 bg-muted/30 grain-overlay">
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Everything You Need to{" "}
            <span className="text-primary">Stay Compliant</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Purpose-built tools that automate the tedious work so you can focus on
            what matters—protecting your organization.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={idx * 100}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
