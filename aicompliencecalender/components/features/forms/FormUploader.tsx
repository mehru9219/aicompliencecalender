"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import {
  Upload,
  FileText,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
};

type UploadStatus = "idle" | "uploading" | "processing" | "success" | "error";

interface FormUploaderProps {
  orgId: Id<"organizations">;
  onAnalysisComplete?: (result: {
    storageId: Id<"_storage">;
    fileName: string;
    fields: Array<{ name: string; type: string; options?: string[] }>;
    analysis: Array<{
      fieldName: string;
      semanticType: string;
      confidence: string;
      notes?: string;
    }>;
    mappings: Record<
      string,
      { value: string; source: string; confidence: string }
    >;
    unmatchedFields: string[];
  }) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function FormUploader({
  orgId,
  onAnalysisComplete,
  onError,
  className,
}: FormUploaderProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  const handleUpload = useCallback(
    async (file: File) => {
      setStatus("uploading");
      setProgress(0);
      setError(null);
      setFileName(file.name);

      try {
        // Get upload URL
        const uploadUrl = await generateUploadUrl();
        setProgress(20);

        // Upload file
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!response.ok) {
          throw new Error("Failed to upload file");
        }

        const { storageId } = await response.json();
        setProgress(50);
        setStatus("processing");

        // Analyze the form using Convex action
        const analysisResponse = await fetch("/api/forms/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orgId,
            storageId,
            fileName: file.name,
          }),
        });

        setProgress(80);

        if (!analysisResponse.ok) {
          const errorData = await analysisResponse.json();
          throw new Error(errorData.error || "Analysis failed");
        }

        const result = await analysisResponse.json();
        setProgress(100);

        if (!result.success) {
          throw new Error(result.error || "Analysis failed");
        }

        setStatus("success");

        if (onAnalysisComplete) {
          onAnalysisComplete({
            storageId,
            fileName: file.name,
            fields: result.fields || [],
            analysis: result.analysis || [],
            mappings: result.mappings || {},
            unmatchedFields: result.unmatchedFields || [],
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setError(message);
        setStatus("error");
        if (onError) {
          onError(message);
        }
      }
    },
    [generateUploadUrl, orgId, onAnalysisComplete, onError],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setError("File size must be less than 10MB");
        setStatus("error");
        return;
      }

      handleUpload(file);
    },
    [handleUpload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    disabled: status === "uploading" || status === "processing",
  });

  const reset = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setError(null);
    setFileName(null);
  }, []);

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="pt-6">
        {status === "idle" && (
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50",
            )}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-1">
              {isDragActive
                ? "Drop the form here"
                : "Drag & drop a compliance form"}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse files
            </p>
            <p className="text-xs text-muted-foreground">
              Supports PDF files up to 10MB
            </p>
          </div>
        )}

        {(status === "uploading" || status === "processing") && (
          <div className="p-8 text-center">
            <Loader2 className="mx-auto h-12 w-12 text-primary mb-4 animate-spin" />
            <p className="text-lg font-medium mb-2">
              {status === "uploading" ? "Uploading..." : "Analyzing form..."}
            </p>
            {fileName && (
              <p className="text-sm text-muted-foreground mb-4">{fileName}</p>
            )}
            <Progress value={progress} className="w-full max-w-xs mx-auto" />
            <p className="text-xs text-muted-foreground mt-2">
              {status === "processing" &&
                "AI is analyzing form fields. This may take a moment."}
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="p-8 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <p className="text-lg font-medium mb-2">Analysis Complete</p>
            {fileName && (
              <p className="text-sm text-muted-foreground mb-4">{fileName}</p>
            )}
            <Button variant="outline" onClick={reset}>
              Upload Another Form
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium mb-2">Upload Failed</p>
            {error && <p className="text-sm text-destructive mb-4">{error}</p>}
            <Button variant="outline" onClick={reset}>
              <X className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Simple file icon with type indicator.
 */
export function FormFileIcon({
  fileName,
  className,
}: {
  fileName: string;
  className?: string;
}) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const isPdf = ext === "pdf";

  return (
    <div className={cn("relative", className)}>
      <FileText className="h-8 w-8 text-muted-foreground" />
      <span
        className={cn(
          "absolute -bottom-1 -right-1 text-[8px] font-bold px-1 rounded",
          isPdf ? "bg-red-500 text-white" : "bg-blue-500 text-white",
        )}
      >
        {isPdf ? "PDF" : ext?.toUpperCase()}
      </span>
    </div>
  );
}
