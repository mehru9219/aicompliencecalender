"use client";

import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { DocumentCategorySelector } from "./DocumentCategorySelector";
import { DOCUMENT_CATEGORIES, type DocumentCategory } from "@/types/document";
import { format } from "date-fns";

interface AuditExportWizardProps {
  orgId: Id<"organizations">;
  onComplete?: (downloadUrl: string) => void;
  onCancel?: () => void;
}

type WizardStep = "select" | "dates" | "preview" | "generating" | "complete";

export function AuditExportWizard({
  orgId,
  onComplete,
  onCancel,
}: AuditExportWizardProps) {
  const [step, setStep] = useState<WizardStep>("select");
  const [selectedCategories, setSelectedCategories] = useState<
    DocumentCategory[]
  >([]);
  const [dateFrom, setDateFrom] = useState<number | undefined>();
  const [dateTo, setDateTo] = useState<number | undefined>();
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Get document counts for preview
  const documents = useQuery(
    api.documents.list,
    step === "preview"
      ? {
          orgId,
          category:
            selectedCategories.length === 1 ? selectedCategories[0] : undefined,
          limit: 100,
        }
      : "skip",
  );

  const generateAuditExport = useAction(api.documents.generateAuditExport);

  // Filter documents by date range for preview
  const filteredDocuments =
    documents?.filter((doc: { category: string; uploadedAt: number }) => {
      if (
        selectedCategories.length > 0 &&
        !selectedCategories.includes(doc.category as DocumentCategory)
      ) {
        return false;
      }
      if (dateFrom && doc.uploadedAt < dateFrom) return false;
      if (dateTo && doc.uploadedAt > dateTo) return false;
      return true;
    }) ?? [];

  const handleGenerate = async () => {
    setStep("generating");
    setProgress(10);
    setError(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 10, 90));
      }, 500);

      const result = await generateAuditExport({
        orgId,
        categories:
          selectedCategories.length > 0 ? selectedCategories : undefined,
        dateFrom,
        dateTo,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (result.success && result.downloadUrl) {
        setDownloadUrl(result.downloadUrl);
        setStep("complete");
        onComplete?.(result.downloadUrl);
      } else {
        setError(result.error ?? "Failed to generate export");
        setStep("preview");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
      setStep("preview");
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      const link = window.document.createElement("a");
      link.href = downloadUrl;
      link.download = `audit-export-${format(new Date(), "yyyy-MM-dd")}.zip`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      {["select", "dates", "preview", "complete"].map((s, i) => (
        <div key={s} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === s || (step === "generating" && s === "preview")
                ? "bg-blue-600 text-white"
                : ["select", "dates", "preview", "complete"].indexOf(step) >
                    ["select", "dates", "preview", "complete"].indexOf(s)
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-600"
            }`}
          >
            {i + 1}
          </div>
          {i < 3 && (
            <div
              className={`w-12 h-1 ${
                ["select", "dates", "preview", "complete"].indexOf(step) > i
                  ? "bg-green-500"
                  : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {renderStepIndicator()}

      {/* Step 1: Select categories */}
      {step === "select" && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Select Document Categories</h3>
          <p className="text-sm text-gray-500">
            Choose which document categories to include in your audit export.
            Leave empty to include all categories.
          </p>

          <DocumentCategorySelector
            value={selectedCategories}
            onChange={(val) => setSelectedCategories(val as DocumentCategory[])}
            multiple
            placeholder="All categories"
          />

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={() => setStep("dates")}>Next</Button>
          </div>
        </div>
      )}

      {/* Step 2: Date range */}
      {step === "dates" && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Select Date Range</h3>
          <p className="text-sm text-gray-500">
            Filter documents by upload date. Leave empty to include all dates.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From
              </label>
              <input
                type="date"
                value={
                  dateFrom ? new Date(dateFrom).toISOString().split("T")[0] : ""
                }
                onChange={(e) =>
                  setDateFrom(
                    e.target.value
                      ? new Date(e.target.value).getTime()
                      : undefined,
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To
              </label>
              <input
                type="date"
                value={
                  dateTo ? new Date(dateTo).toISOString().split("T")[0] : ""
                }
                onChange={(e) =>
                  setDateTo(
                    e.target.value
                      ? new Date(e.target.value).getTime()
                      : undefined,
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep("select")}>
              Back
            </Button>
            <Button onClick={() => setStep("preview")}>Next</Button>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === "preview" && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Preview Export</h3>
          <p className="text-sm text-gray-500">
            Review the documents that will be included in your export.
          </p>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Categories:</span>
              <span className="font-medium">
                {selectedCategories.length > 0
                  ? selectedCategories
                      .map((c) => DOCUMENT_CATEGORIES[c])
                      .join(", ")
                  : "All"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Date range:</span>
              <span className="font-medium">
                {dateFrom && dateTo
                  ? `${format(dateFrom, "MMM d, yyyy")} - ${format(dateTo, "MMM d, yyyy")}`
                  : dateFrom
                    ? `From ${format(dateFrom, "MMM d, yyyy")}`
                    : dateTo
                      ? `Until ${format(dateTo, "MMM d, yyyy")}`
                      : "All dates"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Documents:</span>
              <span className="font-medium">
                {documents === undefined
                  ? "Loading..."
                  : `${filteredDocuments.length} documents`}
              </span>
            </div>
          </div>

          {filteredDocuments.length > 0 && (
            <div className="max-h-48 overflow-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                      File Name
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                      Category
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDocuments
                    .slice(0, 20)
                    .map(
                      (doc: {
                        _id: string;
                        fileName: string;
                        category: string;
                        uploadedAt: number;
                      }) => (
                        <tr key={doc._id}>
                          <td className="px-4 py-2 text-sm truncate max-w-xs">
                            {doc.fileName}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {
                              DOCUMENT_CATEGORIES[
                                doc.category as DocumentCategory
                              ]
                            }
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500">
                            {format(doc.uploadedAt, "MMM d, yyyy")}
                          </td>
                        </tr>
                      ),
                    )}
                </tbody>
              </table>
              {filteredDocuments.length > 20 && (
                <div className="px-4 py-2 bg-gray-50 text-sm text-gray-500 text-center">
                  And {filteredDocuments.length - 20} more...
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep("dates")}>
              Back
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={filteredDocuments.length === 0}
            >
              Generate Export
            </Button>
          </div>
        </div>
      )}

      {/* Step 3.5: Generating */}
      {step === "generating" && (
        <div className="space-y-4 text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <h3 className="text-lg font-medium">Generating Export</h3>
          <p className="text-sm text-gray-500">
            Please wait while we prepare your audit export...
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Step 4: Complete */}
      {step === "complete" && (
        <div className="space-y-4 text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium">Export Complete</h3>
          <p className="text-sm text-gray-500">
            Your audit export is ready for download.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={onCancel}>
              Close
            </Button>
            <Button onClick={handleDownload}>Download ZIP</Button>
          </div>
        </div>
      )}
    </div>
  );
}
