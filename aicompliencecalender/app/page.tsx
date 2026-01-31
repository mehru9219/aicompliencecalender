import {
  Navigation,
  HeroSection,
  SocialProofBar,
  ProblemSection,
  SolutionSection,
  HowItWorksSection,
  IndustryTemplatesSection,
  TestimonialsSection,
  PricingSection,
  FAQSection,
  FinalCTASection,
  Footer,
} from "@/components/landing";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        <HeroSection />
        <SocialProofBar />
        <ProblemSection />
        <SolutionSection />
        <HowItWorksSection />
        <IndustryTemplatesSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  );
}
