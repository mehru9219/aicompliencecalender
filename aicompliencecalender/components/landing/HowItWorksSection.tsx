"use client";

import { cn } from "@/lib/utils";
import { AnimatedSection } from "./ui/AnimatedSection";
import { Building2, Bell, Coffee } from "lucide-react";

const STEPS = [
  {
    number: 1,
    icon: Building2,
    title: "Pick Your Industry",
    description:
      "Choose from 20+ industry templates with pre-built deadlines for healthcare, legal, financial, and more.",
  },
  {
    number: 2,
    icon: Bell,
    title: "Configure Your Alerts",
    description:
      "Set email, SMS, or both. Choose when to be notified - 30 days, 7 days, or the day before.",
  },
  {
    number: 3,
    icon: Coffee,
    title: "Relax & Focus",
    description:
      "We track and alert. You run your business. Never worry about missing compliance again.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-24 bg-muted/10">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <AnimatedSection className="text-center mb-16">
          <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mt-4">
            Get Started in <span className="text-primary">10 Minutes</span>
          </h2>
        </AnimatedSection>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-12 left-[16.67%] right-[16.67%] h-0.5">
            <div className="w-full h-full border-t-2 border-dashed border-border" />
          </div>

          {STEPS.map((step, i) => (
            <AnimatedSection
              key={step.number}
              animation="fade-up"
              delay={i * 150}
              className="text-center relative"
            >
              {/* Number circle */}
              <div
                className={cn(
                  "w-24 h-24 mx-auto mb-6 rounded-full",
                  "bg-primary",
                  "flex items-center justify-center",
                  "shadow-md",
                  "relative z-10"
                )}
              >
                <span className="text-3xl font-bold text-primary-foreground">
                  {step.number}
                </span>
              </div>

              {/* Icon badge */}
              <div
                className={cn(
                  "absolute top-16 left-1/2 -translate-x-1/2",
                  "w-10 h-10 rounded-full",
                  "bg-background border-2 border-primary",
                  "flex items-center justify-center",
                  "z-20"
                )}
              >
                <step.icon className="h-5 w-5 text-primary" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold mt-4 mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm">{step.description}</p>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
