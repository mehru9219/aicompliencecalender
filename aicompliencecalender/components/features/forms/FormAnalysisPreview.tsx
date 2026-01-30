"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle,
  AlertCircle,
  HelpCircle,
  FileText,
  Hash,
  Type,
  SquareCheck,
  List,
  Radio,
  PenTool,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FieldAnalysis {
  fieldName: string;
  semanticType: string;
  confidence: string;
  notes?: string;
}

interface FieldMapping {
  value: string;
  source: string;
  confidence: string;
}

interface FormAnalysisPreviewProps {
  fields: Array<{ name: string; type: string; options?: string[] }>;
  analysis: FieldAnalysis[];
  mappings: Record<string, FieldMapping>;
  unmatchedFields: string[];
  isLoading?: boolean;
  className?: string;
}

const fieldTypeIcons: Record<string, React.ReactNode> = {
  text: <Type className="h-4 w-4" />,
  checkbox: <SquareCheck className="h-4 w-4" />,
  dropdown: <List className="h-4 w-4" />,
  radio: <Radio className="h-4 w-4" />,
  signature: <PenTool className="h-4 w-4" />,
  date: <Hash className="h-4 w-4" />,
};

const confidenceConfig = {
  high: {
    color: "bg-green-500",
    textColor: "text-green-700",
    bgColor: "bg-green-50",
    icon: <CheckCircle className="h-4 w-4 text-green-500" />,
    label: "High",
  },
  medium: {
    color: "bg-yellow-500",
    textColor: "text-yellow-700",
    bgColor: "bg-yellow-50",
    icon: <HelpCircle className="h-4 w-4 text-yellow-500" />,
    label: "Medium",
  },
  low: {
    color: "bg-red-500",
    textColor: "text-red-700",
    bgColor: "bg-red-50",
    icon: <AlertCircle className="h-4 w-4 text-red-500" />,
    label: "Low",
  },
};

export function FormAnalysisPreview({
  fields,
  analysis,
  mappings,
  unmatchedFields,
  isLoading = false,
  className,
}: FormAnalysisPreviewProps) {
  // Create a map for quick lookup
  const analysisMap = useMemo(() => {
    const map = new Map<string, FieldAnalysis>();
    for (const item of analysis) {
      map.set(item.fieldName, item);
    }
    return map;
  }, [analysis]);

  const fieldMap = useMemo(() => {
    const map = new Map<
      string,
      { name: string; type: string; options?: string[] }
    >();
    for (const field of fields) {
      map.set(field.name, field);
    }
    return map;
  }, [fields]);

  // Statistics
  const stats = useMemo(() => {
    const matched = Object.keys(mappings).length;
    const total = fields.length;
    const byConfidence = { high: 0, medium: 0, low: 0 };

    for (const mapping of Object.values(mappings)) {
      const conf = mapping.confidence as keyof typeof byConfidence;
      if (conf in byConfidence) {
        byConfidence[conf]++;
      }
    }

    return {
      total,
      matched,
      unmatched: unmatchedFields.length,
      percentage: total > 0 ? Math.round((matched / total) * 100) : 0,
      byConfidence,
    };
  }, [fields, mappings, unmatchedFields]);

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Analyzing form fields...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Fields</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.matched}
            </div>
            <p className="text-xs text-muted-foreground">Matched</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.unmatched}
            </div>
            <p className="text-xs text-muted-foreground">Unmatched</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.percentage}%</div>
            <p className="text-xs text-muted-foreground">Coverage</p>
          </CardContent>
        </Card>
      </div>

      {/* Confidence Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Confidence Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              {confidenceConfig.high.icon}
              <span className="text-sm">{stats.byConfidence.high} High</span>
            </div>
            <div className="flex items-center gap-2">
              {confidenceConfig.medium.icon}
              <span className="text-sm">
                {stats.byConfidence.medium} Medium
              </span>
            </div>
            <div className="flex items-center gap-2">
              {confidenceConfig.low.icon}
              <span className="text-sm">{stats.byConfidence.low} Low</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Field List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Detected Fields
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {fields.map((field) => {
                const fieldAnalysis = analysisMap.get(field.name);
                const mapping = mappings[field.name];
                const isUnmatched = unmatchedFields.includes(field.name);
                const confidence = (fieldAnalysis?.confidence ||
                  "low") as keyof typeof confidenceConfig;
                const config = confidenceConfig[confidence];

                return (
                  <div
                    key={field.name}
                    className={cn(
                      "p-3 rounded-lg border",
                      mapping ? config.bgColor : "bg-muted/30",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-muted-foreground">
                          {fieldTypeIcons[field.type] || (
                            <Type className="h-4 w-4" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">
                            {field.name}
                          </p>
                          {fieldAnalysis && (
                            <p className="text-xs text-muted-foreground">
                              Detected:{" "}
                              {fieldAnalysis.semanticType.replace(/_/g, " ")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-xs">
                          {field.type}
                        </Badge>
                        {mapping && config.icon}
                        {isUnmatched && (
                          <Badge variant="secondary" className="text-xs">
                            Manual
                          </Badge>
                        )}
                      </div>
                    </div>

                    {mapping && (
                      <div className="mt-2 pt-2 border-t border-dashed">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {mapping.value}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Source: {mapping.source}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn("text-xs", config.textColor)}
                          >
                            {config.label}
                          </Badge>
                        </div>
                      </div>
                    )}

                    {fieldAnalysis?.notes && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        Note: {fieldAnalysis.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Unmatched Fields */}
      {unmatchedFields.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-yellow-700">
              <AlertCircle className="h-4 w-4" />
              Fields Requiring Manual Entry ({unmatchedFields.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {unmatchedFields.map((fieldName) => (
                <Badge key={fieldName} variant="outline" className="bg-white">
                  {fieldName}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
