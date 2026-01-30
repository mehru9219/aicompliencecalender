"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TrustMetric } from "../elements/ComplianceBadge";

export function TestimonialSection() {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-4xl mx-auto px-6">
        <div className="relative text-center">
          {/* Quote mark decoration */}
          <div className="quote-mark absolute -top-8 left-1/2 -translate-x-1/2 select-none pointer-events-none">
            &ldquo;
          </div>

          {/* Quote */}
          <blockquote className="relative z-10">
            <p className="font-display text-2xl sm:text-3xl lg:text-4xl font-medium text-foreground leading-relaxed mb-8">
              We went from spending 20+ hours a week on compliance tracking to
              maybe 2 hours. The AI form fill alone saves us days every quarter.{" "}
              <span className="text-primary">This tool paid for itself in the first month.</span>
            </p>
          </blockquote>

          {/* Author */}
          <div className="flex flex-col items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-primary/20">
              <AvatarImage src="/testimonials/sarah.jpg" alt="Sarah Chen" />
              <AvatarFallback className="bg-primary/10 text-primary font-display text-lg">
                SC
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-foreground">Sarah Chen</p>
              <p className="text-sm text-muted-foreground">
                Chief Compliance Officer, TechCorp Inc.
              </p>
            </div>
          </div>

          {/* Impact metric */}
          <div className="mt-12 pt-8 border-t border-border">
            <div className="flex justify-center gap-12">
              <TrustMetric value="94%" label="Compliance score improvement" />
              <div className="hidden sm:block w-px bg-border" />
              <TrustMetric value="18 hrs" label="Saved per week" className="hidden sm:block" />
              <div className="hidden md:block w-px bg-border" />
              <TrustMetric value="$0" label="Fines since adoption" className="hidden md:block" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
