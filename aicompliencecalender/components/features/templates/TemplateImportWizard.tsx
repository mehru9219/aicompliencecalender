"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { TemplateDeadline, RegulatoryReference } from "@/types/template";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { TemplateDeadlineList } from "./TemplateDeadlineList";
import { DateCustomizer } from "./DateCustomizer";
import Link from "next/link";

interface TemplateImportWizardProps {
  templateId: Id<"industry_templates">;
  templateName: string;
  templateVersion: string;
  deadlines: TemplateDeadline[];
  regulatoryReferences: RegulatoryReference[];
  orgId: Id<"organizations">;
  onComplete?: (importedIds: Id<"deadlines">[]) => void;
}

type WizardStep = "select" | "customize" | "review" | "complete";

export function TemplateImportWizard({
  templateId,
  templateName,
  templateVersion,
  deadlines,
  orgId,
  onComplete,
}: TemplateImportWizardProps) {
  const [step, setStep] = useState<WizardStep>("select");
  const [selectedIds, setSelectedIds] = useState<string[]>(
    deadlines.map((d) => d.id),
  );
  const [customDates, setCustomDates] = useState<Record<string, number>>({});
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    importId: Id<"template_imports">;
    createdDeadlineIds: Id<"deadlines">[];
  } | null>(null);

  const importTemplate = useMutation(api.templates.importTemplate);

  const selectedDeadlines = deadlines.filter((d) => selectedIds.includes(d.id));

  const deadlinesNeedingDates = selectedDeadlines.filter(
    (d) => d.anchorType === "anniversary" || d.anchorType === "custom",
  );

  const allDatesProvided = deadlinesNeedingDates.every(
    (d) => customDates[d.id] !== undefined,
  );

  const stepProgress: Record<WizardStep, number> = {
    select: 33,
    customize: 66,
    review: 90,
    complete: 100,
  };

  const handleDateChange = (deadlineId: string, date: number) => {
    setCustomDates((prev) => ({
      ...prev,
      [deadlineId]: date,
    }));
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const result = await importTemplate({
        orgId,
        templateId,
        selectedDeadlineIds: selectedIds,
        customDates,
      });
      setImportResult(result);
      setStep("complete");
      onComplete?.(result.createdDeadlineIds);
    } catch (error) {
      console.error("Import failed:", error);
      // TODO: Show error toast
    } finally {
      setIsImporting(false);
    }
  };

  const canProceed = (): boolean => {
    switch (step) {
      case "select":
        return selectedIds.length > 0;
      case "customize":
        return allDatesProvided;
      case "review":
        return true;
      default:
        return false;
    }
  };

  const goNext = () => {
    switch (step) {
      case "select":
        if (deadlinesNeedingDates.length > 0) {
          setStep("customize");
        } else {
          setStep("review");
        }
        break;
      case "customize":
        setStep("review");
        break;
      case "review":
        handleImport();
        break;
    }
  };

  const goBack = () => {
    switch (step) {
      case "customize":
        setStep("select");
        break;
      case "review":
        if (deadlinesNeedingDates.length > 0) {
          setStep("customize");
        } else {
          setStep("select");
        }
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">
            Importing: {templateName} v{templateVersion}
          </span>
          <span className="text-muted-foreground">
            Step{" "}
            {step === "select"
              ? 1
              : step === "customize"
                ? 2
                : step === "review"
                  ? 3
                  : 4}{" "}
            of {deadlinesNeedingDates.length > 0 ? 4 : 3}
          </span>
        </div>
        <Progress value={stepProgress[step]} />
      </div>

      {/* Step 1: Select Deadlines */}
      {step === "select" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Select Deadlines to Import
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Choose which compliance deadlines you want to add to your
              calendar.
            </p>
          </CardHeader>
          <CardContent>
            <TemplateDeadlineList
              deadlines={deadlines}
              selectable
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />
          </CardContent>
        </Card>
      )}

      {/* Step 2: Customize Dates */}
      {step === "customize" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Set Due Dates</CardTitle>
            <p className="text-sm text-muted-foreground">
              The following deadlines require you to set specific dates based on
              your organization&apos;s circumstances.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {deadlinesNeedingDates.map((deadline) => (
              <DateCustomizer
                key={deadline.id}
                deadline={deadline}
                value={customDates[deadline.id]}
                onChange={(date) => handleDateChange(deadline.id, date)}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review */}
      {step === "review" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Review Import</CardTitle>
            <p className="text-sm text-muted-foreground">
              Review your selections before importing.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Template</span>
                <p className="font-medium">
                  {templateName} v{templateVersion}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">
                  Deadlines to Import
                </span>
                <p className="font-medium">{selectedIds.length}</p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium">Selected Deadlines:</span>
              <div className="flex flex-wrap gap-2">
                {selectedDeadlines.map((d) => (
                  <Badge key={d.id} variant="secondary">
                    {d.title}
                  </Badge>
                ))}
              </div>
            </div>

            {Object.keys(customDates).length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium">Custom Dates Set:</span>
                <div className="space-y-1">
                  {Object.entries(customDates).map(([id, date]) => {
                    const deadline = deadlines.find((d) => d.id === id);
                    return (
                      <div key={id} className="text-sm text-muted-foreground">
                        {deadline?.title}: {new Date(date).toLocaleDateString()}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Complete */}
      {step === "complete" && importResult && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Import Complete!</h3>
                <p className="text-muted-foreground">
                  Successfully imported {importResult.createdDeadlineIds.length}{" "}
                  compliance deadline
                  {importResult.createdDeadlineIds.length !== 1 ? "s" : ""}.
                </p>
              </div>
              <div className="pt-4">
                <Link href="/dashboard/deadlines">
                  <Button>View Your Deadlines</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      {step !== "complete" && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={step === "select"}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={goNext} disabled={!canProceed() || isImporting}>
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : step === "review" ? (
              "Import Deadlines"
            ) : (
              <>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
