"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UrgencyBadge } from "./ui/UrgencyBadge";
import { FloatingDashboard } from "./ui/FloatingDashboard";
import { AnimatedSection } from "./ui/AnimatedSection";
import Link from "next/link";
import { Play, CheckCircle2, ArrowRight } from "lucide-react";
import { ThreadsBackground } from "./ui/ThreadsBackground";

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-24 overflow-hidden">
      {/* Subtle radial gradient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, oklch(0.43 0.04 42 / 0.06), transparent 60%)",
        }}
      />

      {/* Threads animated background */}
      <ThreadsBackground />

      <div className="max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto px-6 relative">
        <div className="max-w-3xl lg:max-w-4xl mx-auto text-center">
          {/* Urgency Badge */}
          <AnimatedSection animation="fade" delay={0}>
            <div className="mb-8">
              <UrgencyBadge />
            </div>
          </AnimatedSection>

          {/* Headline */}
          <AnimatedSection animation="fade-up" delay={150}>
            <h1
              className={cn(
                "text-4xl sm:text-5xl md:text-6xl lg:text-7xl",
                "font-bold tracking-tight",
                "leading-[1.1]",
                "mb-6"
              )}
            >
              Never Miss a Compliance{" "}
              <span className="text-primary">Deadline</span> Again
            </h1>
          </AnimatedSection>

          {/* Subheadline */}
          <AnimatedSection animation="fade-up" delay={300}>
            <p
              className={cn(
                "text-lg sm:text-xl lg:text-2xl",
                "text-muted-foreground",
                "max-w-2xl mx-auto",
                "mb-8"
              )}
            >
              Track deadlines. Get alerts. Fill forms with AI.{" "}
              <span className="text-foreground font-medium">
                One platform to keep your business compliant.
              </span>
            </p>
          </AnimatedSection>

          {/* CTA Buttons */}
          <AnimatedSection animation="fade-up" delay={450}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <Button asChild size="lg" className="text-base font-medium group">
                <Link href="/sign-up">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-base font-medium"
                asChild
              >
                <Link href="#demo">
                  <Play className="mr-2 h-4 w-4" />
                  Watch Demo
                </Link>
              </Button>
            </div>
          </AnimatedSection>

          {/* Trust line */}
          <AnimatedSection animation="fade" delay={600}>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-status-completed" />
                14-day free trial
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-status-completed" />
                No credit card required
              </span>
            </div>
          </AnimatedSection>
        </div>

        {/* Dashboard Preview */}
        <AnimatedSection animation="scale" delay={750} className="mt-16">
          <FloatingDashboard />
        </AnimatedSection>
      </div>
    </section>
  );
}
