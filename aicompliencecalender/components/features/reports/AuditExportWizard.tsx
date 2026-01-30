/**
 * Multi-step wizard for generating audit reports.
 */

"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  FileText,
  Calendar,
  CheckCircle,
  Download,
  Loader2,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

interface AuditExportWizardProps {
  orgId: Id<"organizations">;
  onComplete?: (url: string) => void;
  onCancel?: () => void;
}

type Step = "category" | "dateRange" | "confirm" | "generating" | "complete";

const COMPLIANCE_CATEGORIES = [
  {
    value: "licenses",
    label: "Licenses",
    description: "Business and professional licenses",
  },
  {
    value: "certifications",
    label: "Certifications",
    description: "Professional and organizational certifications",
  },
  {
    value: "training_records",
    label: "Training Records",
    description: "Employee training and compliance education",
  },
  {
    value: "audit_reports",
    label: "Audit Reports",
    description: "Internal and external audit documentation",
  },
  {
    value: "policies",
    label: "Policies",
    description: "Company policies and procedures",
  },
  {
    value: "insurance",
    label: "Insurance",
    description: "Insurance policies and certificates",
  },
  {
    value: "contracts",
    label: "Contracts",
    description: "Regulatory and compliance contracts",
  },
  {
    value: "tax_filing",
    label: "Tax Filing",
    description: "Tax returns and filings",
  },
];

const DATE_RANGE_OPTIONS = [
  { value: "last_quarter", label: "Last Quarter", days: 90 },
  { value: "last_6_months", label: "Last 6 Months", days: 180 },
  { value: "last_year", label: "Last Year", days: 365 },
  { value: "last_2_years", label: "Last 2 Years", days: 730 },
];

export function AuditExportWizard({
  orgId,
  onComplete,
  onCancel,
}: AuditExportWizardProps) {
  const [step, setStep] = useState<Step>("category");
  const [category, setCategory] = useState<string>("");
  const [dateRangeOption, setDateRangeOption] = useState<string>("last_year");
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [error, setError] = useState<string>("");

  const generateReport = useAction(api.auditReports.generateAuditReport);

  const handleGenerate = async () => {
    setStep("generating");
    setError("");

    try {
      const selectedRange = DATE_RANGE_OPTIONS.find(
        (opt) => opt.value === dateRangeOption,
      );
      const days = selectedRange?.days || 365;
      const now = Date.now();

      const url = await generateReport({
        orgId,
        complianceArea: category,
        dateRange: {
          from: now - days * 24 * 60 * 60 * 1000,
          to: now,
        },
      });

      setPdfUrl(url);
      setStep("complete");
      onComplete?.(url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate report",
      );
      setStep("confirm");
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: "category", label: "Category" },
      { key: "dateRange", label: "Date Range" },
      { key: "confirm", label: "Confirm" },
    ];

    const currentIndex = steps.findIndex((s) => s.key === step);

    return (
      <div className="mb-6 flex items-center justify-center">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                i <= currentIndex
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`mx-2 text-sm ${
                i <= currentIndex ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div
                className={`h-0.5 w-8 ${
                  i < currentIndex ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Generate Audit Report
        </CardTitle>
      </CardHeader>
      <CardContent>
        {step !== "generating" && step !== "complete" && renderStepIndicator()}

        {/* Step 1: Select Category */}
        {step === "category" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select the compliance area for your audit report.
            </p>
            <RadioGroup value={category} onValueChange={setCategory}>
              <div className="grid gap-3">
                {COMPLIANCE_CATEGORIES.map((cat) => (
                  <label
                    key={cat.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                      category === cat.value
                        ? "border-primary bg-primary/5"
                        : ""
                    }`}
                  >
                    <RadioGroupItem value={cat.value} className="mt-0.5" />
                    <div>
                      <p className="font-medium">{cat.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {cat.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </RadioGroup>
            <div className="flex justify-end gap-2 pt-4">
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button onClick={() => setStep("dateRange")} disabled={!category}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Select Date Range */}
        {step === "dateRange" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Select the time period for your audit report.
              </p>
            </div>
            <RadioGroup
              value={dateRangeOption}
              onValueChange={setDateRangeOption}
            >
              <div className="grid gap-3">
                {DATE_RANGE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                      dateRangeOption === opt.value
                        ? "border-primary bg-primary/5"
                        : ""
                    }`}
                  >
                    <RadioGroupItem value={opt.value} />
                    <span className="font-medium">{opt.label}</span>
                  </label>
                ))}
              </div>
            </RadioGroup>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep("category")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={() => setStep("confirm")}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === "confirm" && (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <h4 className="mb-3 font-medium">Report Summary</h4>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Compliance Area:</dt>
                  <dd className="font-medium">
                    {
                      COMPLIANCE_CATEGORIES.find((c) => c.value === category)
                        ?.label
                    }
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Date Range:</dt>
                  <dd className="font-medium">
                    {
                      DATE_RANGE_OPTIONS.find(
                        (d) => d.value === dateRangeOption,
                      )?.label
                    }
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm dark:border-blue-800 dark:bg-blue-950/50">
              <p className="font-medium text-blue-700 dark:text-blue-300">
                Report includes:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-blue-600 dark:text-blue-400">
                <li>Executive summary with compliance statistics</li>
                <li>Deadline compliance history</li>
                <li>Documentation inventory</li>
                <li>Alert delivery log</li>
                <li>Activity timeline</li>
              </ul>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep("dateRange")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleGenerate}>
                <FileText className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </div>
          </div>
        )}

        {/* Generating */}
        {step === "generating" && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-lg font-medium">Generating Report...</p>
            <p className="text-sm text-muted-foreground">
              This may take a moment
            </p>
          </div>
        )}

        {/* Complete */}
        {step === "complete" && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium">Report Generated!</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Your audit report is ready to download.
            </p>
            <div className="mt-6 flex gap-3">
              <Button asChild>
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </a>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setStep("category");
                  setCategory("");
                  setPdfUrl("");
                }}
              >
                Generate Another
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
