"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { AnimatedSection } from "./ui/AnimatedSection";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "How does the 14-day free trial work?",
    answer:
      "Start with full Professional plan features immediately. No credit card required to sign up. You'll have complete access to all features including AI form fills, SMS alerts, and unlimited deadlines. At the end of 14 days, choose your plan or downgrade to a limited free tier.",
  },
  {
    question: "Can I import my existing compliance deadlines?",
    answer:
      "Yes! You can import deadlines via CSV upload or manually add them. We also offer direct integrations with popular practice management systems. Our onboarding team can help migrate your existing tracking system for Business plan customers.",
  },
  {
    question: "How do SMS alerts work?",
    answer:
      "Configure multiple recipients per deadline and set your preferred alert schedule (30 days, 7 days, 3 days, 1 day before). SMS alerts are included in Professional and Business plans. You can also set escalation rules - if no one acknowledges an alert, it escalates to additional team members.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Absolutely. We're SOC 2 Type II compliant with enterprise-grade security. All data is encrypted at rest and in transit. We use role-based access controls, maintain detailed audit logs, and never share your data with third parties. Your compliance documents are stored in secure, geographically redundant cloud storage.",
  },
  {
    question: "Can multiple team members access the same account?",
    answer:
      "Yes, Professional and Business plans support multiple users with role-based permissions. Assign team members to specific deadlines, track who completed what, and maintain accountability across your organization. Each user gets their own login and notification preferences.",
  },
  {
    question: "What happens if I still miss a deadline?",
    answer:
      "Our escalation system is designed to prevent this, but if a deadline passes without completion, we immediately notify all assigned team members and admins. The overdue item is prominently displayed in your dashboard, and we maintain a full audit trail showing all notifications sent. Many customers use this as documentation for regulators showing due diligence.",
  },
];

function FAQAccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card/50">
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between gap-4",
          "p-5 text-left",
          "hover:bg-muted/50",
          "transition-colors"
        )}
      >
        <span className="font-medium">{item.question}</span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-muted-foreground",
            "transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-all duration-200",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 text-muted-foreground text-sm">
            {item.answer}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 lg:py-32 bg-muted/10">
      <div className="max-w-3xl lg:max-w-4xl mx-auto px-6">
        {/* Header */}
        <AnimatedSection className="text-center mb-16">
          <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mt-4">
            Frequently Asked <span className="text-primary">Questions</span>
          </h2>
        </AnimatedSection>

        {/* Items */}
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <AnimatedSection key={item.question} animation="fade-up" delay={i * 100}>
              <FAQAccordionItem
                item={item}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
