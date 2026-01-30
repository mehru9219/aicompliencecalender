"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Check, Loader2, Calendar, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TemplateImportStepProps {
  orgId: Id<"organizations">;
  industry: string;
  onComplete: () => void;
  onSkip: () => void;
}

interface TemplateDeadline {
  id: string;
  title: string;
  description: string;
  category: string;
  recurrence: {
    type:
      | "weekly"
      | "monthly"
      | "quarterly"
      | "semi_annual"
      | "annual"
      | "custom";
    interval?: number;
  };
  importance: "critical" | "high" | "medium" | "low";
}

interface TemplateListItem {
  _id: Id<"industry_templates">;
  slug: string;
  name: string;
  description: string;
  deadlineCount: number;
}

interface Template {
  _id: Id<"industry_templates">;
  name: string;
  description: string;
  deadlines: TemplateDeadline[];
}

export function TemplateImportStep({
  orgId,
  industry,
  onComplete,
  onSkip,
}: TemplateImportStepProps) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [selectedDeadlines, setSelectedDeadlines] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Query templates for the industry (list view)
  const templateList = useQuery(api.templates.list, { industry });
  // Query selected template details
  const selectedTemplate = useQuery(
    api.templates.getBySlug,
    selectedSlug ? { slug: selectedSlug } : "skip",
  ) as Template | null | undefined;
  const markStepComplete = useMutation(api.onboarding.markStepComplete);

  const handleSelectTemplate = (slug: string) => {
    setSelectedSlug(slug);
    // Reset selected deadlines - will be populated when template loads
    setSelectedDeadlines([]);
  };

  // Auto-select all deadlines when template loads
  if (
    selectedTemplate &&
    selectedDeadlines.length === 0 &&
    selectedTemplate.deadlines.length > 0
  ) {
    setSelectedDeadlines(
      selectedTemplate.deadlines.map((d: TemplateDeadline) => d.id),
    );
  }

  const handleToggleDeadline = (deadlineId: string) => {
    setSelectedDeadlines((prev) =>
      prev.includes(deadlineId)
        ? prev.filter((id) => id !== deadlineId)
        : [...prev, deadlineId],
    );
  };

  const handleSelectAll = () => {
    if (selectedTemplate) {
      setSelectedDeadlines(
        selectedTemplate.deadlines.map((d: TemplateDeadline) => d.id),
      );
    }
  };

  const handleSelectNone = () => {
    setSelectedDeadlines([]);
  };

  const handleImport = async () => {
    if (!selectedSlug || selectedDeadlines.length === 0) return;

    setIsImporting(true);
    try {
      // In production, call api.templates.import with selected deadlines
      await markStepComplete({ orgId, step: "template_imported" });
      onComplete();
    } catch (error) {
      console.error("Failed to import template:", error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleSkip = async () => {
    // Mark as complete even when skipping (optional step)
    await markStepComplete({ orgId, step: "template_imported" });
    onSkip();
  };

  const getImportanceBadge = (importance: string) => {
    const variants: Record<
      string,
      "destructive" | "default" | "secondary" | "outline"
    > = {
      critical: "destructive",
      high: "default",
      medium: "secondary",
      low: "outline",
    };
    return (
      <Badge variant={variants[importance] || "outline"} className="text-xs">
        {importance}
      </Badge>
    );
  };

  const getRecurrenceLabel = (recurrence: TemplateDeadline["recurrence"]) => {
    const labels: Record<string, string> = {
      weekly: "Weekly",
      monthly: "Monthly",
      quarterly: "Quarterly",
      semi_annual: "Semi-annual",
      annual: "Annual",
      custom: `Every ${recurrence.interval} days`,
    };
    return labels[recurrence.type] || recurrence.type;
  };

  if (templateList === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mb-4">
          <FileText className="size-6 text-purple-600" />
        </div>
        <h2 className="text-xl font-semibold">Start with a template</h2>
        <p className="text-muted-foreground mt-1">
          We&apos;ve prepared compliance checklists for your industry. Select
          the items relevant to your business.
        </p>
      </div>

      {templateList.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-muted/50">
          <AlertCircle className="size-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">
            No templates available for your industry yet.
          </p>
          <Button variant="outline" className="mt-4" onClick={handleSkip}>
            Skip for now
          </Button>
        </div>
      ) : (
        <>
          {/* Template Selection */}
          {!selectedSlug && (
            <div className="grid gap-3">
              {templateList.map((template) => (
                <Card
                  key={template._id}
                  className={cn(
                    "cursor-pointer transition-all hover:border-primary",
                    selectedSlug === template.slug &&
                      "border-primary bg-primary/5",
                  )}
                  onClick={() => handleSelectTemplate(template.slug)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {template.name}
                      </CardTitle>
                      <Badge variant="secondary">
                        {template.deadlineCount} deadlines
                      </Badge>
                    </div>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}

          {/* Deadline Selection */}
          {selectedTemplate && (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {selectedTemplate.name}
                      </CardTitle>
                      <CardDescription>
                        Select which deadlines to import
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSlug(null)}
                    >
                      Change
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
                    <span className="text-sm text-muted-foreground">
                      {selectedDeadlines.length} of{" "}
                      {selectedTemplate.deadlines.length} selected
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSelectAll}
                      >
                        Select All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSelectNone}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                  <ScrollArea className="h-64">
                    <div className="divide-y">
                      {selectedTemplate.deadlines.map(
                        (deadline: TemplateDeadline) => (
                          <label
                            key={deadline.id}
                            className="flex items-start gap-3 p-4 hover:bg-muted/50 cursor-pointer"
                          >
                            <Checkbox
                              checked={selectedDeadlines.includes(deadline.id)}
                              onCheckedChange={() =>
                                handleToggleDeadline(deadline.id)
                              }
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">
                                  {deadline.title}
                                </span>
                                {getImportanceBadge(deadline.importance)}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {deadline.description}
                              </p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="size-3" />
                                  {getRecurrenceLabel(deadline.recurrence)}
                                </span>
                                <span>{deadline.category}</span>
                              </div>
                            </div>
                          </label>
                        ),
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleSkip} className="flex-1">
              Skip for now
            </Button>
            <Button
              onClick={handleImport}
              disabled={
                !selectedSlug || selectedDeadlines.length === 0 || isImporting
              }
              className="flex-1"
            >
              {isImporting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Check className="size-4 mr-2" />
                  Import {selectedDeadlines.length} deadlines
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
