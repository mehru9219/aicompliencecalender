"use client";

import { cn } from "@/lib/utils";
import { GlassCard } from "./ui/GlassCard";
import { AnimatedSection } from "./ui/AnimatedSection";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Stethoscope,
  Scale,
  Landmark,
  Heart,
  Briefcase,
  ArrowRight,
} from "lucide-react";

const INDUSTRIES = [
  {
    id: "healthcare",
    name: "Healthcare",
    icon: Stethoscope,
    deadlines: 24,
    color: "oklch(0.6 0.15 180)",
    examples: ["HIPAA compliance", "Medical licenses", "DEA registrations"],
  },
  {
    id: "legal",
    name: "Legal",
    icon: Scale,
    deadlines: 18,
    color: "oklch(0.6 0.12 250)",
    examples: ["Bar renewals", "CLE credits", "Trust account audits"],
  },
  {
    id: "financial",
    name: "Financial Services",
    icon: Landmark,
    deadlines: 31,
    color: "oklch(0.6 0.15 140)",
    examples: ["SEC filings", "Audits", "License renewals"],
  },
  {
    id: "dental",
    name: "Dental",
    icon: Heart,
    deadlines: 22,
    color: "oklch(0.6 0.18 300)",
    examples: ["DEA licenses", "X-ray certifications", "OSHA compliance"],
  },
  {
    id: "general",
    name: "General Business",
    icon: Briefcase,
    deadlines: 15,
    color: "oklch(0.5 0.1 60)",
    examples: ["Business licenses", "Insurance renewals", "Tax filings"],
  },
];

export function IndustryTemplatesSection() {
  return (
    <section className="py-24">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <AnimatedSection className="text-center mb-16">
          <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
            Industry Templates
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mt-4">
            Templates Built for{" "}
            <span className="text-primary">Your Industry</span>
          </h2>
          <p className="text-muted-foreground text-lg mt-4 max-w-2xl mx-auto">
            Start with pre-configured deadlines specific to your industry.
            Customize as needed.
          </p>
        </AnimatedSection>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {INDUSTRIES.map((industry, i) => {
            const Icon = industry.icon;
            return (
              <AnimatedSection
                key={industry.id}
                animation="fade-up"
                delay={i * 100}
              >
                <GlassCard className="h-full group cursor-pointer" elevated>
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl mb-4",
                      "flex items-center justify-center",
                      "transition-transform duration-200 group-hover:scale-105"
                    )}
                    style={{ backgroundColor: `${industry.color}20` }}
                  >
                    <Icon
                      className="h-6 w-6"
                      style={{ color: industry.color }}
                    />
                  </div>

                  <h3 className="font-semibold mb-1">{industry.name}</h3>
                  <p className="text-2xl font-bold text-primary mb-2">
                    {industry.deadlines}
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    deadlines included
                  </p>

                  <div className="text-xs text-muted-foreground space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {industry.examples.map((ex) => (
                      <p key={ex}>• {ex}</p>
                    ))}
                  </div>
                </GlassCard>
              </AnimatedSection>
            );
          })}
        </div>

        {/* CTA */}
        <AnimatedSection animation="fade-up" delay={600} className="text-center mt-12">
          <Button variant="outline" asChild className="group">
            <Link href="/templates">
              Browse All Templates
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </AnimatedSection>
      </div>
    </section>
  );
}
