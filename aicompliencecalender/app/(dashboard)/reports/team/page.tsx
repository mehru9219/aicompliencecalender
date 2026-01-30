/**
 * Team Performance Report Page.
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
  TeamPerformanceTable,
  ExportButtons,
} from "@/components/features/reports";
import { Users, Trophy, Clock, Target } from "lucide-react";

type DateRangeType = "last_30_days" | "last_quarter" | "last_year";

function getDateRange(
  type: DateRangeType,
): { from: number; to: number } | undefined {
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

export default function TeamPerformancePage() {
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const [dateRange, setDateRange] = useState<DateRangeType>("last_quarter");

  const teamPerformance = useQuery(
    api.reports.getTeamPerformance,
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

  const isLoading = teamPerformance === undefined;

  // Calculate team-wide stats
  const teamStats = teamPerformance
    ? {
        totalMembers: teamPerformance.length,
        totalCompleted: teamPerformance.reduce(
          (sum, m) => sum + m.completed,
          0,
        ),
        avgOnTimeRate:
          teamPerformance.length > 0
            ? Math.round(
                teamPerformance.reduce((sum, m) => sum + m.onTimeRate, 0) /
                  teamPerformance.length,
              )
            : 0,
        activeAssignments: teamPerformance.reduce(
          (sum, m) => sum + m.activeAssignments,
          0,
        ),
        topPerformer: teamPerformance
          .filter((m) => m.completed > 0)
          .sort((a, b) => b.onTimeRate - a.onTimeRate)[0],
      }
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Performance</h1>
          <p className="mt-1 text-muted-foreground">
            Individual performance metrics and workload distribution
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
          {teamPerformance && (
            <ExportButtons
              data={teamPerformance}
              filename={`team-performance-${dateRange}`}
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Team Size</p>
                    <p className="text-2xl font-bold">
                      {teamStats?.totalMembers}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                    <Target className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Avg On-Time Rate
                    </p>
                    <p className="text-2xl font-bold">
                      {teamStats?.avgOnTimeRate}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Completed
                    </p>
                    <p className="text-2xl font-bold">
                      {teamStats?.totalCompleted}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900/30">
                    <Trophy className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Top Performer
                    </p>
                    <p className="text-lg font-bold">
                      {teamStats?.topPerformer
                        ? `${teamStats.topPerformer.onTimeRate}%`
                        : "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Individual Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {teamPerformance && teamPerformance.length > 0 ? (
                <TeamPerformanceTable data={teamPerformance} showRoles />
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No team data</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Invite team members and complete deadlines to see
                    performance metrics.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Workload Distribution */}
          {teamPerformance && teamPerformance.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Active Workload Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamPerformance
                    .filter((m) => m.activeAssignments > 0)
                    .sort((a, b) => b.activeAssignments - a.activeAssignments)
                    .map((member) => {
                      const maxAssignments = Math.max(
                        ...teamPerformance.map((m) => m.activeAssignments),
                        1,
                      );
                      const percentage =
                        (member.activeAssignments / maxAssignments) * 100;

                      return (
                        <div key={member.userId}>
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">
                              {member.userName ||
                                `User ${member.userId.slice(0, 8)}`}
                            </span>
                            <span className="text-muted-foreground">
                              {member.activeAssignments} active
                            </span>
                          </div>
                          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>

                {teamPerformance.filter((m) => m.activeAssignments > 0)
                  .length === 0 && (
                  <p className="text-center text-sm text-muted-foreground">
                    No active assignments
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
