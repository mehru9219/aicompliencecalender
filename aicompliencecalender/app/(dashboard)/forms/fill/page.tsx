"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  FormUploader,
  FormAnalysisPreview,
  FieldMappingEditor,
  FormFillReview,
} from "@/components/features/forms";
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  Scan,
  Edit,
  FileCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

// TODO: Get from auth context
const MOCK_ORG_ID = "placeholder" as Id<"organizations">;
const MOCK_USER_ID = "user123";

type WizardStep = "upload" | "analyze" | "edit" | "review";

interface FieldMapping {
  value: string;
  source: string;
  confidence: string;
}

interface AnalysisResult {
  storageId: Id<"_storage">;
  fileName: string;
  fields: Array<{ name: string; type: string; options?: string[] }>;
  analysis: Array<{
    fieldName: string;
    semanticType: string;
    confidence: string;
    notes?: string;
  }>;
  mappings: Record<string, FieldMapping>;
  unmatchedFields: string[];
}

const STEPS: { key: WizardStep; label: string; icon: React.ReactNode }[] = [
  { key: "upload", label: "Upload Form", icon: <Upload className="h-4 w-4" /> },
  { key: "analyze", label: "Analyze", icon: <Scan className="h-4 w-4" /> },
  { key: "edit", label: "Edit Mappings", icon: <Edit className="h-4 w-4" /> },
  {
    key: "review",
    label: "Review & Generate",
    icon: <FileCheck className="h-4 w-4" />,
  },
];

export default function FormFillingWizardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get(
    "template",
  ) as Id<"form_templates"> | null;

  const [currentStep, setCurrentStep] = useState<WizardStep>(
    templateId ? "edit" : "upload",
  );
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null,
  );
  const [mappings, setMappings] = useState<Record<string, FieldMapping>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const fillFromTemplate = useAction(api.forms.fillFromTemplate);

  // If template ID is provided, fetch it
  const template = useQuery(
    api.forms.getTemplate,
    templateId ? { templateId } : "skip",
  );

  // Initialize from template if provided
  useEffect(() => {
    if (template && !analysisResult) {
      // Convert template to analysis result format
      const fields = template.fieldMappings.map(
        (m: { fieldName: string; fieldType: string; profileKey: string }) => ({
          name: m.fieldName,
          type: m.fieldType,
        }),
      );

      const analysis = template.fieldMappings.map(
        (m: { fieldName: string; fieldType: string; profileKey: string }) => ({
          fieldName: m.fieldName,
          semanticType: m.profileKey.split("[")[0], // Simplified
          confidence: "high" as const,
        }),
      );

      const mappingsFromTemplate: Record<string, FieldMapping> = {};
      for (const m of template.fieldMappings) {
        mappingsFromTemplate[m.fieldName] = {
          value: "", // Will be filled from profile
          source: m.profileKey,
          confidence: "high",
        };
      }

      setAnalysisResult({
        storageId: template.originalStorageId,
        fileName: template.name,
        fields,
        analysis,
        mappings: mappingsFromTemplate,
        unmatchedFields: [],
      });
      setMappings(mappingsFromTemplate);
    }
  }, [template, analysisResult]);

  const handleAnalysisComplete = useCallback((result: AnalysisResult) => {
    setAnalysisResult(result);
    setMappings(result.mappings);
    setCurrentStep("analyze");
  }, []);

  const handleMappingsChange = useCallback(
    (newMappings: Record<string, FieldMapping>) => {
      setMappings(newMappings);
    },
    [],
  );

  const handleGenerate = useCallback(
    async (finalValues: Record<string, string>) => {
      if (!templateId && !analysisResult) return;

      setIsGenerating(true);
      try {
        if (templateId) {
          // Fill from existing template
          const result = await fillFromTemplate({
            orgId: MOCK_ORG_ID,
            templateId,
            overrides: finalValues,
            filledBy: MOCK_USER_ID,
          });

          if (result.success && result.downloadUrl) {
            setGeneratedUrl(result.downloadUrl);
          } else {
            throw new Error(result.error || "Generation failed");
          }
        } else {
          // For new forms, we'd need to create a template first
          // This is a simplified implementation
          throw new Error("Please save as template first");
        }
      } catch (error) {
        console.error("Generation error:", error);
        alert(error instanceof Error ? error.message : "Generation failed");
      } finally {
        setIsGenerating(false);
      }
    },
    [templateId, analysisResult, fillFromTemplate],
  );

  const goToStep = useCallback((step: WizardStep) => {
    setCurrentStep(step);
  }, []);

  const goBack = useCallback(() => {
    const currentIndex = STEPS.findIndex((s) => s.key === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].key);
    }
  }, [currentStep]);

  const goNext = useCallback(() => {
    const currentIndex = STEPS.findIndex((s) => s.key === currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].key);
    }
  }, [currentStep]);

  const canGoBack =
    currentStep !== "upload" && (currentStep !== "analyze" || !templateId);
  const canGoNext =
    currentStep !== "review" &&
    (currentStep === "upload" ? !!analysisResult : true);

  return (
    <div className="container py-6 space-y-6">
      {/* Header with Steps */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push("/forms")}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Library
        </Button>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2">
          {STEPS.map((step, index) => {
            const isActive = step.key === currentStep;
            const isPast =
              STEPS.findIndex((s) => s.key === currentStep) > index;

            return (
              <div key={step.key} className="flex items-center">
                <button
                  onClick={() => isPast && goToStep(step.key)}
                  disabled={!isPast && !isActive}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                    isActive && "bg-primary text-primary-foreground",
                    isPast && "bg-green-100 text-green-700 hover:bg-green-200",
                    !isActive && !isPast && "bg-muted text-muted-foreground",
                  )}
                >
                  {step.icon}
                  <span className="hidden sm:inline text-sm font-medium">
                    {step.label}
                  </span>
                </button>
                {index < STEPS.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground mx-2" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-4xl mx-auto">
        {currentStep === "upload" && (
          <FormUploader
            orgId={MOCK_ORG_ID}
            onAnalysisComplete={handleAnalysisComplete}
            onError={(error) => alert(error)}
          />
        )}

        {currentStep === "analyze" && analysisResult && (
          <FormAnalysisPreview
            fields={analysisResult.fields}
            analysis={analysisResult.analysis}
            mappings={mappings}
            unmatchedFields={analysisResult.unmatchedFields}
          />
        )}

        {currentStep === "edit" && analysisResult && (
          <FieldMappingEditor
            fields={analysisResult.fields}
            mappings={mappings}
            unmatchedFields={analysisResult.unmatchedFields}
            onMappingsChange={handleMappingsChange}
          />
        )}

        {currentStep === "review" && analysisResult && (
          <FormFillReview
            fields={analysisResult.fields}
            mappings={mappings}
            unmatchedFields={analysisResult.unmatchedFields}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            generatedUrl={generatedUrl}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <Button
          variant="outline"
          onClick={goBack}
          disabled={!canGoBack}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>

        <Button onClick={goNext} disabled={!canGoNext} className="gap-2">
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
