"use client";

import { HeroSection } from "./sections/HeroSection";
import { TrustBar } from "./sections/TrustBar";
import { ProblemSection } from "./sections/ProblemSection";
import { FeaturesSection } from "./sections/FeaturesSection";
import { TestimonialSection } from "./sections/TestimonialSection";
import { CTASection } from "./sections/CTASection";

export function LandingAlternative() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <TrustBar />
      <ProblemSection />
      <FeaturesSection />
      <TestimonialSection />
      <CTASection />

      {/* Footer spacer */}
      <footer className="py-8 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Compliance Calendar. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
