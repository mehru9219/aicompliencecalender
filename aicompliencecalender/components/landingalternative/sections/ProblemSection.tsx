"use client";

import { AlertTriangle, TrendingDown, Clock } from "lucide-react";

const stats = [
  {
    icon: AlertTriangle,
    value: "$147K",
    label: "Average fine for missed GDPR deadline",
    color: "text-destructive",
  },
  {
    icon: TrendingDown,
    value: "89%",
    label: "Of data breaches involve compliance failures",
    color: "text-status-due-soon",
  },
  {
    icon: Clock,
    value: "23 hrs",
    label: "Per week spent on manual tracking",
    color: "text-status-upcoming",
  },
];

export function ProblemSection() {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Compliance Chaos is{" "}
            <span className="text-destructive">Expensive</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Missed deadlines don&apos;t just cost money—they cost reputation,
            trust, and countless hours of damage control.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="relative p-8 rounded-2xl bg-card border border-border text-center group hover:border-primary/30 transition-colors reveal-section"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Icon */}
                <div className={`inline-flex p-3 rounded-xl bg-muted mb-4 ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>

                {/* Value */}
                <div className={`font-display text-4xl sm:text-5xl font-bold mb-2 ${stat.color}`}>
                  {stat.value}
                </div>

                {/* Label */}
                <p className="text-muted-foreground">{stat.label}</p>

                {/* Hover glow */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-destructive/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            );
          })}
        </div>

        {/* CTA text */}
        <div className="text-center mt-12">
          <p className="text-lg font-medium text-foreground">
            There&apos;s a better way.{" "}
            <span className="text-primary">Let us show you.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
