"use client";

import { cn } from "@/lib/utils";
import { AnimatedSection } from "./ui/AnimatedSection";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export function FinalCTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Clean gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/20 to-primary/5" />

      <div className="max-w-3xl mx-auto px-6 relative">
        <AnimatedSection className="text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Ready to Never Miss a{" "}
            <span className="text-primary">Deadline</span> Again?
          </h2>

          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Join 500+ businesses who trust ComplianceCal to keep them compliant.
            Start your free trial today.
          </p>

          <Button asChild size="lg" className="text-base font-medium group">
            <Link href="/sign-up">
              Start Your Free Trial
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>

          <div
            className={cn(
              "flex flex-wrap items-center justify-center gap-6",
              "text-sm text-muted-foreground mt-8"
            )}
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-status-completed" />
              14-day free trial
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-status-completed" />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-status-completed" />
              Cancel anytime
            </span>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
