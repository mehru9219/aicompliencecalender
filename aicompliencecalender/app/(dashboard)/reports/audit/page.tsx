/**
 * Audit Export Page - Generate audit-ready PDF reports.
 */

"use client";

import { useOrganization } from "@/hooks/useOrganization";
import { AuditExportWizard } from "@/components/features/reports";
import { FileText } from "lucide-react";

export default function AuditExportPage() {
  const { currentOrg, isLoading: orgLoading } = useOrganization();

  if (orgLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!currentOrg) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">
          Please select an organization to generate audit reports.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Audit Export</h1>
        <p className="mt-1 text-muted-foreground">
          Generate comprehensive audit reports for compliance documentation
        </p>
      </div>

      {/* Info Banner */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
        <div className="flex gap-3">
          <FileText className="h-5 w-5 text-blue-600 shrink-0" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium">Audit-Ready Reports</p>
            <p className="mt-1 text-blue-600 dark:text-blue-400">
              Generate professional PDF reports containing deadline compliance
              history, documentation inventory, alert delivery logs, and
              activity timelines. Perfect for regulatory audits, internal
              reviews, and compliance documentation.
            </p>
          </div>
        </div>
      </div>

      {/* Wizard */}
      <div className="flex justify-center">
        <AuditExportWizard orgId={currentOrg._id} />
      </div>
    </div>
  );
}
