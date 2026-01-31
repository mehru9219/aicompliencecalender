"use client";

import { cn } from "@/lib/utils";
import { GlassCard } from "./ui/GlassCard";
import { AnimatedSection } from "./ui/AnimatedSection";
import { Calendar, Bell, FileX, ArrowDown } from "lucide-react";

const PROBLEMS = [
  {
    icon: Calendar,
    title: "Deadlines Scattered",
    description: "Across spreadsheets, emails, and sticky notes",
    consequence: "Missed renewals",
  },
  {
    icon: Bell,
    title: "Alerts Buried",
    description: "Lost in spam folders and notification overload",
    consequence: "Missed notices",
  },
  {
    icon: FileX,
    title: "Forms Filled Wrong",
    description: "Manual data entry leads to costly mistakes",
    consequence: "Rejected filings",
  },
];

export function ProblemSection() {
  return (
    <section className="py-24 lg:py-32 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto px-6">
        {/* Header */}
        <AnimatedSection className="text-center mb-16">
          <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
            The Problem
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mt-4">
            Compliance is complex.{" "}
            <span className="text-destructive">Missing deadlines is expensive.</span>
          </h2>
        </AnimatedSection>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {PROBLEMS.map((problem, i) => (
            <AnimatedSection key={problem.title} animation="fade-up" delay={i * 150}>
              <GlassCard
                className={cn(
                  "h-full flex flex-col items-center text-center",
                  "border-b-4 border-b-destructive/30"
                )}
              >
                <div
                  className={cn(
                    "w-14 h-14 rounded-2xl mb-4",
                    "bg-destructive/10",
                    "flex items-center justify-center"
                  )}
                >
                  <problem.icon className="h-7 w-7 text-destructive" />
                </div>

                <h3 className="text-xl font-semibold mb-2">{problem.title}</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {problem.description}
                </p>

                <ArrowDown className="h-4 w-4 text-muted-foreground/50 my-2" />

                <p className="text-destructive font-medium text-sm mt-auto">
                  {problem.consequence}
                </p>
              </GlassCard>
            </AnimatedSection>
          ))}
        </div>

        {/* Bottom stat */}
        <AnimatedSection animation="fade-up" delay={600} className="text-center mt-16">
          <div className="inline-block">
            <span className="text-5xl sm:text-6xl font-bold text-destructive">
              $12,000+
            </span>
            <p className="text-muted-foreground mt-2">average penalty per violation</p>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
