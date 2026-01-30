"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Shield } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24 bg-gradient-to-br from-primary/5 via-background to-secondary/10 grain-overlay">
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Icon */}
        <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-6">
          <Shield className="w-10 h-10 text-primary" />
        </div>

        {/* Headline */}
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
          Join 500+ Teams Who{" "}
          <span className="text-primary">Sleep Better</span>
        </h2>

        {/* Subtext */}
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Stop worrying about compliance deadlines. Start your free trial today and
          see why leading organizations trust us with their compliance calendar.
        </p>

        {/* CTA button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <Button
            size="lg"
            className="glow-warm text-base px-10 py-7 rounded-xl text-lg"
            asChild
          >
            <Link href="/sign-up">
              Start Your Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>

        {/* Trust copy */}
        <p className="text-sm text-muted-foreground">
          14-day free trial &#183; No credit card required &#183; Setup in under 5 minutes
        </p>

        {/* Urgency element */}
        <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/20 border border-secondary/30 text-sm">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-foreground font-medium">
            Q1 compliance deadlines approaching
          </span>
        </div>
      </div>
    </section>
  );
}
