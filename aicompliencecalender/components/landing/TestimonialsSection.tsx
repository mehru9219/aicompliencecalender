"use client";

import { cn } from "@/lib/utils";
import { GlassCard } from "./ui/GlassCard";
import { AnimatedSection } from "./ui/AnimatedSection";
import { Quote, Star } from "lucide-react";

const TESTIMONIALS = [
  {
    quote:
      "Before ComplianceCal, I missed our DEA license renewal. $5,000 fine and 2 weeks of stress. Never again.",
    author: "Dr. Sarah Chen",
    title: "Practice Manager",
    company: "Chen Medical Group",
    industry: "Healthcare",
    avatar: "SC",
  },
  {
    quote:
      "We reduced our compliance tracking time from 10 hours/week to 30 minutes. The AI form fill alone saved us thousands.",
    author: "Michael Rodriguez",
    title: "Operations Director",
    company: "Pacific Legal Associates",
    industry: "Legal",
    avatar: "MR",
  },
  {
    quote:
      "Finally, one place for all our licenses and certifications. The SMS alerts are a lifesaver when things get busy.",
    author: "Jennifer Park",
    title: "Compliance Officer",
    company: "Apex Financial",
    industry: "Financial",
    avatar: "JP",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-muted/10">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <AnimatedSection className="text-center mb-16">
          <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
            Testimonials
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mt-4">
            Don&apos;t Take Our{" "}
            <span className="text-primary">Word For It</span>
          </h2>
        </AnimatedSection>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((testimonial, i) => (
            <AnimatedSection
              key={testimonial.author}
              animation="fade-up"
              delay={i * 150}
            >
              <GlassCard className="h-full flex flex-col" elevated>
                <Quote className="h-8 w-8 text-primary/30 mb-4" />

                <blockquote className="text-foreground font-medium mb-6 flex-1">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>

                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full",
                      "bg-primary/10 text-primary",
                      "flex items-center justify-center",
                      "font-semibold text-sm"
                    )}
                  >
                    {testimonial.avatar}
                  </div>

                  <div className="flex-1">
                    <p className="font-semibold text-sm">{testimonial.author}</p>
                    <p className="text-xs text-muted-foreground">
                      {testimonial.title}, {testimonial.company}
                    </p>
                  </div>

                  <span
                    className={cn(
                      "px-2 py-1 rounded-full",
                      "bg-secondary text-secondary-foreground",
                      "text-[10px] font-medium"
                    )}
                  >
                    {testimonial.industry}
                  </span>
                </div>
              </GlassCard>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
