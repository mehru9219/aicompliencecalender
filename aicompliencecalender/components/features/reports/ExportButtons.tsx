/**
 * Export buttons for downloading reports in various formats.
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ExportButtonsProps {
  data: unknown;
  filename?: string;
  onExport?: (format: string) => void;
}

export function ExportButtons({
  data,
  filename = "report",
  onExport,
}: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const exportToCSV = () => {
    setIsExporting("csv");
    try {
      const csvContent = convertToCSV(data);
      downloadFile(csvContent, `${filename}.csv`, "text/csv");
      toast.success("CSV exported successfully");
      onExport?.("csv");
    } catch {
      toast.error("Failed to export CSV");
    } finally {
      setIsExporting(null);
    }
  };

  const exportToJSON = () => {
    setIsExporting("json");
    try {
      const jsonContent = JSON.stringify(data, null, 2);
      downloadFile(jsonContent, `${filename}.json`, "application/json");
      toast.success("JSON exported successfully");
      onExport?.("json");
    } catch {
      toast.error("Failed to export JSON");
    } finally {
      setIsExporting(null);
    }
  };

  const printReport = () => {
    window.print();
    onExport?.("print");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJSON}>
          <FileText className="mr-2 h-4 w-4" />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={printReport}>
          <FileText className="mr-2 h-4 w-4" />
          Print Report
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Helper to convert data to CSV format
function convertToCSV(data: unknown): string {
  if (!data || typeof data !== "object") {
    return "";
  }

  // Handle array of objects
  if (Array.isArray(data)) {
    if (data.length === 0) return "";

    const headers = Object.keys(data[0] as object);
    const rows = data.map((item) =>
      headers
        .map((header) => {
          const value = (item as Record<string, unknown>)[header];
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = String(value ?? "");
          if (stringValue.includes(",") || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(","),
    );

    return [headers.join(","), ...rows].join("\n");
  }

  // Handle object with nested data
  const obj = data as Record<string, unknown>;
  const sections: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value) && value.length > 0) {
      sections.push(`\n${key.toUpperCase()}`);
      sections.push(convertToCSV(value));
    } else if (typeof value === "object" && value !== null) {
      sections.push(`\n${key.toUpperCase()}`);
      const entries = Object.entries(value as object);
      sections.push(entries.map(([k, v]) => `${k},${v}`).join("\n"));
    } else {
      sections.push(`${key},${value}`);
    }
  }

  return sections.join("\n");
}

// Helper to download a file
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
