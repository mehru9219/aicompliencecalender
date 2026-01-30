"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Download,
  FileText,
  Loader2,
  CheckCircle,
  Edit,
  X,
  Check,
  AlertTriangle,
  PenTool,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FieldMapping {
  value: string;
  source: string;
  confidence: string;
}

interface FormFillReviewProps {
  fields: Array<{ name: string; type: string; options?: string[] }>;
  mappings: Record<string, FieldMapping>;
  unmatchedFields: string[];
  onGenerate: (finalValues: Record<string, string>) => Promise<void>;
  isGenerating?: boolean;
  generatedUrl?: string | null;
  className?: string;
}

export function FormFillReview({
  fields,
  mappings,
  unmatchedFields,
  onGenerate,
  isGenerating = false,
  generatedUrl,
  className,
}: FormFillReviewProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [finalValues, setFinalValues] = useState<Record<string, string>>(() => {
    const values: Record<string, string> = {};
    for (const [fieldName, mapping] of Object.entries(mappings)) {
      values[fieldName] = mapping.value;
    }
    return values;
  });
  const [progress, setProgress] = useState(0);

  const startEditing = useCallback(
    (fieldName: string) => {
      setEditingField(fieldName);
      setEditValue(finalValues[fieldName] || "");
    },
    [finalValues],
  );

  const cancelEditing = useCallback(() => {
    setEditingField(null);
    setEditValue("");
  }, []);

  const saveEdit = useCallback(() => {
    if (!editingField) return;
    setFinalValues((prev) => ({
      ...prev,
      [editingField]: editValue,
    }));
    cancelEditing();
  }, [editingField, editValue, cancelEditing]);

  const handleGenerate = useCallback(async () => {
    // Simulate progress
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 10, 90));
    }, 200);

    try {
      await onGenerate(finalValues);
      setProgress(100);
    } finally {
      clearInterval(interval);
    }
  }, [onGenerate, finalValues]);

  // Separate fields into categories
  const mappedFields = fields.filter((f) => f.name in finalValues);
  const signatureFields = fields.filter((f) => f.type === "signature");
  const emptyFields = fields.filter(
    (f) => !(f.name in finalValues) && f.type !== "signature",
  );

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Review Form Values
        </CardTitle>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            {/* Mapped Fields */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Fields to Fill ({mappedFields.length})
              </h3>
              <div className="space-y-2">
                {mappedFields.map((field) => {
                  const isEditing = editingField === field.name;
                  const mapping = mappings[field.name];

                  return (
                    <div
                      key={field.name}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {field.name}
                          </span>
                          {mapping?.source && (
                            <Badge variant="outline" className="text-xs">
                              {mapping.source}
                            </Badge>
                          )}
                        </div>
                        {isEditing ? (
                          <div className="flex items-center gap-2 mt-2">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="h-8"
                              autoFocus
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={saveEdit}
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={cancelEditing}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {finalValues[field.name] || "(empty)"}
                          </p>
                        )}
                      </div>
                      {!isEditing && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => startEditing(field.name)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Signature Fields */}
            {signatureFields.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2 text-yellow-700">
                  <PenTool className="h-4 w-4" />
                  Signature Fields - Manual Entry Required (
                  {signatureFields.length})
                </h3>
                <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <p className="text-sm text-yellow-800 mb-2">
                    The following fields require manual signature after
                    download:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {signatureFields.map((field) => (
                      <Badge
                        key={field.name}
                        variant="outline"
                        className="bg-white"
                      >
                        {field.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Empty Fields */}
            {emptyFields.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2 text-muted-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  Fields Left Empty ({emptyFields.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {emptyFields.map((field) => (
                    <Badge key={field.name} variant="secondary">
                      {field.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="flex flex-col gap-4 border-t pt-4">
        {isGenerating && (
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Generating PDF...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {generatedUrl && !isGenerating && (
          <div className="w-full p-3 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Form generated successfully!
                </span>
              </div>
              <Button asChild size="sm">
                <a href={generatedUrl} download target="_blank" rel="noopener">
                  <Download className="h-4 w-4 mr-1" />
                  Download PDF
                </a>
              </Button>
            </div>
          </div>
        )}

        {!generatedUrl && (
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || mappedFields.length === 0}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Generate Filled Form
              </>
            )}
          </Button>
        )}

        <p className="text-xs text-center text-muted-foreground">
          {mappedFields.length} fields will be filled.{" "}
          {signatureFields.length > 0 &&
            `${signatureFields.length} signature field(s) require manual completion.`}
        </p>
      </CardFooter>
    </Card>
  );
}
