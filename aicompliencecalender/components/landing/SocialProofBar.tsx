"use client";

import { cn } from "@/lib/utils";
import { AnimatedSection } from "./ui/AnimatedSection";
import {
  Building2,
  Stethoscope,
  Scale,
  Landmark,
  Heart,
  Briefcase,
} from "lucide-react";

const COMPANIES = [
  { name: "MedCare Plus", icon: Stethoscope },
  { name: "Legal Associates", icon: Scale },
  { name: "FinTrust Bank", icon: Landmark },
  { name: "Dental Excellence", icon: Heart },
  { name: "Corporate Solutions", icon: Building2 },
  { name: "Business Group", icon: Briefcase },
];

export function SocialProofBar() {
  return (
    <AnimatedSection as="section" animation="fade" className="py-16 bg-muted/20">
      <div className="max-w-5xl mx-auto px-6">
        <p className="text-center text-sm text-muted-foreground mb-8">
          Trusted by{" "}
          <span className="font-semibold text-foreground">500+</span> healthcare,
          legal, and financial businesses
        </p>

        <div className="relative overflow-hidden">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-muted/20 to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-muted/20 to-transparent z-10" />

          {/* Marquee */}
          <div className="flex animate-marquee">
            {[...COMPANIES, ...COMPANIES].map((company, i) => (
              <div
                key={`${company.name}-${i}`}
                className={cn(
                  "flex items-center gap-2 px-8",
                  "opacity-40 grayscale",
                  "hover:opacity-100 hover:grayscale-0",
                  "transition-all duration-300"
                )}
              >
                <company.icon className="h-5 w-5" />
                <span className="text-sm font-medium whitespace-nowrap">
                  {company.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
