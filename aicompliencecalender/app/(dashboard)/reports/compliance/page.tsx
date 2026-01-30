/**
 * Compliance Summary Report Page.
 */

"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useOrganization } from "@/hooks/useOrganization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ComplianceScoreChart,
  CategoryBreakdownChart,
  CostAvoidanceCard,
  ExportButtons,
} from "@/components/features/reports";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

type DateRangeType = "last_30_days" | "last_quarter" | "last_year";

function getDateRange(type: DateRangeType): { from: number; to: number } {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  switch (type) {
    case "last_30_days":
      return { from: now - 30 * day, to: now };
    case "last_quarter":
      return { from: now - 90 * day, to: now };
    case "last_year":
      return { from: now - 365 * day, to: now };
  }
}

export default function ComplianceReportPage() {
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const [dateRange, setDateRange] = useState<DateRangeType>("last_quarter");

  const complianceSummary = useQuery(
    api.reports.getComplianceSummary,
    currentOrg
      ? { orgId: currentOrg._id, dateRange: getDateRange(dateRange) }
      : "skip",
  );

  const costAvoidance = useQuery(
    api.reports.getCostAvoidance,
    currentOrg
      ? { orgId: currentOrg._id, dateRange: getDateRange(dateRange) }
      : "skip",
  );

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
          Please select an organization to view reports.
        </p>
      </div>
    );
  }

  const isLoading = complianceSummary === undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Compliance Summary</h1>
          <p className="mt-1 text-muted-foreground">
            Overview of your organization&apos;s compliance performance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select
            value={dateRange}
            onValueChange={(val) => setDateRange(val as DateRangeType)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_30_days">Last 30 Days</SelectItem>
              <SelectItem value="last_quarter">Last Quarter</SelectItem>
              <SelectItem value="last_year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          {complianceSummary && (
            <ExportButtons
              data={complianceSummary}
              filename={`compliance-summary-${dateRange}`}
            />
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">
                      {complianceSummary.summary.total}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">On Time</p>
                    <p className="text-2xl font-bold">
                      {complianceSummary.summary.onTime}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900/30">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold">
                      {complianceSummary.summary.pending}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900/30">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Late</p>
                    <p className="text-2xl font-bold">
                      {complianceSummary.summary.late}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Overdue</p>
                    <p className="text-2xl font-bold">
                      {complianceSummary.summary.overdue}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rate Stats */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Completion Rate
                  </p>
                  <p className="mt-2 text-5xl font-bold text-primary">
                    {complianceSummary.summary.completionRate}%
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {complianceSummary.summary.completed} of{" "}
                    {complianceSummary.summary.total} completed
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">On-Time Rate</p>
                  <p
                    className={`mt-2 text-5xl font-bold ${
                      complianceSummary.summary.onTimeRate >= 90
                        ? "text-green-600"
                        : complianceSummary.summary.onTimeRate >= 70
                          ? "text-yellow-600"
                          : "text-red-600"
                    }`}
                  >
                    {complianceSummary.summary.onTimeRate}%
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {complianceSummary.summary.onTime} of{" "}
                    {complianceSummary.summary.completed} on time
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Score Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ComplianceScoreChart data={complianceSummary.scoreHistory} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>By Category</CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryBreakdownChart data={complianceSummary.byCategory} />
              </CardContent>
            </Card>
          </div>

          {/* Cost Avoidance */}
          <div id="cost-avoidance">
            {costAvoidance && (
              <CostAvoidanceCard
                totalAvoided={costAvoidance.totalAvoided}
                deadlinesCompletedOnTime={
                  costAvoidance.deadlinesCompletedOnTime
                }
                byCategory={costAvoidance.byCategory}
                disclaimer={costAvoidance.disclaimer}
              />
            )}
          </div>

          {/* Overdue Items */}
          {complianceSummary.overdueItems.length > 0 && (
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Overdue Items ({complianceSummary.overdueItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {complianceSummary.overdueItems.slice(0, 10).map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30"
                    >
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.category} • Due{" "}
                          {new Date(item.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-900/50 dark:text-red-300">
                        {item.daysOverdue} days overdue
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Deadlines */}
          {complianceSummary.upcoming.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Deadlines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {complianceSummary.upcoming.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.category}
                        </p>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(item.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
