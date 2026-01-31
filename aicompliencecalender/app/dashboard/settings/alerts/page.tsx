"use client";

import { useState } from "react";
import {
  AlertPreferencesForm,
  AlertHistory,
} from "@/components/features/alerts";
import { AlertCircle, Loader2 } from "lucide-react";
import { useOrgContext } from "@/components/providers/OrgProvider";

export default function AlertSettingsPage() {
  const { orgId, isLoading: orgLoading } = useOrgContext();
  const [activeTab, setActiveTab] = useState<"preferences" | "history">(
    "preferences",
  );

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No Organization Selected</h2>
        <p className="text-muted-foreground">
          Please select an organization to configure alerts.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Alert Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Configure how and when you receive deadline alerts
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("preferences")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "preferences"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            Preferences
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "history"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            Alert History
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        {activeTab === "preferences" ? (
          <AlertPreferencesForm
            orgId={orgId}
            onSave={() => {
              // Show success toast
            }}
          />
        ) : (
          <AlertHistory orgId={orgId} />
        )}
      </div>
    </div>
  );
}
