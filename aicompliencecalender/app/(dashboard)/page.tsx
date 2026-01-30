"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// Dashboard components
import { ComplianceScoreCard } from "@/components/features/dashboard/ComplianceScoreCard";
import { CriticalAlertsSection } from "@/components/features/dashboard/CriticalAlertsSection";
import { DueThisWeekSection } from "@/components/features/dashboard/DueThisWeekSection";
import { QuickStatsBar } from "@/components/features/dashboard/QuickStatsBar";
import { UpcomingSection } from "@/components/features/dashboard/UpcomingSection";
import { RecentActivityFeed } from "@/components/features/dashboard/RecentActivityFeed";
import { CategoryBreakdownChart } from "@/components/features/dashboard/CategoryBreakdownChart";
import { QuickActionsBar } from "@/components/features/dashboard/QuickActionsBar";
import { DashboardSkeleton } from "@/components/features/dashboard/DashboardSkeleton";

// Onboarding
import { OnboardingChecklist } from "@/components/features/onboarding/OnboardingChecklist";

// UI components
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

type ViewMode = "team" | "my_items" | "category";

// Placeholder org ID - in production would come from auth/context
const DEMO_ORG_ID = "placeholder" as Id<"organizations">;

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get view mode from URL or localStorage
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const urlMode = searchParams.get("view") as ViewMode | null;
    if (urlMode && ["team", "my_items", "category"].includes(urlMode)) {
      return urlMode;
    }
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("dashboard_view_mode");
      if (stored && ["team", "my_items", "category"].includes(stored)) {
        return stored as ViewMode;
      }
    }
    return "team";
  });

  // Update localStorage when view mode changes
  useEffect(() => {
    localStorage.setItem("dashboard_view_mode", viewMode);
    // Update URL without navigation
    const url = new URL(window.location.href);
    url.searchParams.set("view", viewMode);
    router.replace(url.pathname + url.search, { scroll: false });
  }, [viewMode, router]);

  // Fetch dashboard data
  // Note: In production, orgId would come from user context/auth
  const dashboard = useQuery(api.dashboard.getDashboardData, {
    orgId: DEMO_ORG_ID,
    viewMode,
    userId: undefined, // Would come from auth
  });

  // Handle view mode toggle
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  // Loading state
  if (dashboard === undefined) {
    return (
      <div className="space-y-6">
        <ViewModeToggle mode={viewMode} onChange={handleViewModeChange} />
        <DashboardSkeleton />
      </div>
    );
  }

  // Error state - dashboard returned but might be empty due to missing org
  if (!dashboard) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Unable to load dashboard</h2>
        <p className="text-muted-foreground text-center max-w-md">
          There was an error loading your dashboard data. Please try refreshing
          the page or contact support if the problem persists.
        </p>
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Page
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <ViewModeToggle mode={viewMode} onChange={handleViewModeChange} />

      {/* Onboarding Checklist - shown until complete */}
      <OnboardingChecklist orgId={DEMO_ORG_ID} />

      {/* Compliance Score - Hero */}
      <ComplianceScoreCard score={dashboard.score} />

      {/* Critical Alerts - Red Zone (overdue + due today) */}
      <CriticalAlertsSection
        overdue={dashboard.overdue}
        dueToday={dashboard.dueToday}
      />

      {/* Due This Week - Yellow Zone */}
      <DueThisWeekSection deadlines={dashboard.dueThisWeek} />

      {/* Quick Stats Bar */}
      <QuickStatsBar stats={dashboard.stats} />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingSection deadlines={dashboard.upcoming} maxItems={5} />
        <RecentActivityFeed activities={dashboard.recentActivity} />
      </div>

      {/* Category Breakdown Chart (hidden on mobile) */}
      <CategoryBreakdownChart data={dashboard.byCategory} />

      {/* Quick Actions */}
      <QuickActionsBar />
    </div>
  );
}

// View mode toggle component
function ViewModeToggle({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground mr-2">View:</span>
      <Button
        size="sm"
        variant={mode === "team" ? "default" : "outline"}
        onClick={() => onChange("team")}
      >
        Team
      </Button>
      <Button
        size="sm"
        variant={mode === "my_items" ? "default" : "outline"}
        onClick={() => onChange("my_items")}
      >
        My Items
      </Button>
      <Button
        size="sm"
        variant={mode === "category" ? "default" : "outline"}
        onClick={() => onChange("category")}
      >
        By Category
      </Button>
    </div>
  );
}
