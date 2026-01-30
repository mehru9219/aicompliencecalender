"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductMockup } from "../elements/ProductMockup";
import { ArrowRight, Play, Clock } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center grain-overlay overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Content */}
          <div className="space-y-8">
            {/* Alert chip */}
            <div className="reveal-section">
              <Badge
                variant="outline"
                className="px-4 py-2 text-sm font-medium border-primary/30 bg-primary/5"
              >
                <Clock className="w-4 h-4 mr-2 text-primary" />
                <span className="text-foreground">3 deadlines due this week</span>
              </Badge>
            </div>

            {/* Headline */}
            <div className="space-y-4 reveal-section reveal-delay-1">
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-[1.1] tracking-tight">
                Never Miss Another{" "}
                <span className="text-primary">Compliance Deadline</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed">
                AI-powered deadline tracking that keeps your organization protected.
                Automate forms, centralize documents, and sleep soundly.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 reveal-section reveal-delay-2">
              <Button
                size="lg"
                className="glow-warm text-base px-8 py-6 rounded-xl"
                asChild
              >
                <Link href="/sign-up">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-base px-8 py-6 rounded-xl border-2"
                asChild
              >
                <Link href="#demo">
                  <Play className="mr-2 w-5 h-5" />
                  Watch Demo
                </Link>
              </Button>
            </div>

            {/* Trust line */}
            <p className="text-sm text-muted-foreground reveal-section reveal-delay-3">
              <span className="text-status-completed">&#10003;</span> No credit card required
              <span className="mx-3">&#183;</span>
              <span className="text-status-completed">&#10003;</span> 14-day free trial
              <span className="mx-3">&#183;</span>
              <span className="text-status-completed">&#10003;</span> Cancel anytime
            </p>
          </div>

          {/* Right: Product mockup */}
          <div className="reveal-section reveal-delay-2 lg:reveal-delay-3">
            <ProductMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
