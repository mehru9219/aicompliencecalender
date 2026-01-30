"use client";

import { useState } from "react";
import {
  AlertPreferencesForm,
  AlertHistory,
} from "@/components/features/alerts";
import type { Id } from "@/convex/_generated/dataModel";

// TODO: Get from auth context
const MOCK_ORG_ID = "placeholder" as Id<"organizations">;

export default function AlertSettingsPage() {
  const [activeTab, setActiveTab] = useState<"preferences" | "history">(
    "preferences",
  );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Alert Settings</h1>
        <p className="mt-1 text-gray-500">
          Configure how and when you receive deadline alerts
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("preferences")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "preferences"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Preferences
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "history"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Alert History
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {activeTab === "preferences" ? (
          <AlertPreferencesForm
            orgId={MOCK_ORG_ID}
            onSave={() => {
              // Show success toast
            }}
          />
        ) : (
          <AlertHistory orgId={MOCK_ORG_ID} />
        )}
      </div>
    </div>
  );
}
