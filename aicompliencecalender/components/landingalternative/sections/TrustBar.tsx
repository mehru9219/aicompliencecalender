"use client";

import { ComplianceBadge, TrustMetric } from "../elements/ComplianceBadge";

const frameworks = ["SOC 2", "HIPAA", "GDPR", "PCI-DSS", "ISO 27001"];

export function TrustBar() {
  return (
    <section className="py-12 border-y border-border bg-muted/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Trust text */}
          <div className="text-center lg:text-left">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Trusted by 500+ compliance teams
            </p>
          </div>

          {/* Compliance badges */}
          <div className="flex flex-wrap justify-center gap-3">
            {frameworks.map((framework) => (
              <ComplianceBadge key={framework} name={framework} variant="outline" />
            ))}
          </div>

          {/* Quick stats */}
          <div className="hidden xl:flex items-center gap-8">
            <TrustMetric value="99.9%" label="Uptime" />
            <div className="w-px h-10 bg-border" />
            <TrustMetric value="2M+" label="Deadlines tracked" />
          </div>
        </div>
      </div>
    </section>
  );
}
