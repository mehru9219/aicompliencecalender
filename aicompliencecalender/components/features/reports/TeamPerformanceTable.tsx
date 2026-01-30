/**
 * Table component showing team member performance metrics.
 */

"use client";

import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from "lucide-react";

interface TeamMemberStats {
  userId: string;
  userName?: string;
  role?: string;
  completed: number;
  onTimeRate: number;
  avgDaysBefore: number;
  activeAssignments: number;
}

interface TeamPerformanceTableProps {
  data: TeamMemberStats[];
  showRoles?: boolean;
}

function getPerformanceIndicator(onTimeRate: number) {
  if (onTimeRate >= 90) {
    return {
      icon: ArrowUpIcon,
      color: "text-green-600",
      label: "Excellent",
    };
  }
  if (onTimeRate >= 70) {
    return {
      icon: MinusIcon,
      color: "text-yellow-600",
      label: "Good",
    };
  }
  return {
    icon: ArrowDownIcon,
    color: "text-red-600",
    label: "Needs Improvement",
  };
}

function formatRole(role?: string): string {
  if (!role) return "Member";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function TeamPerformanceTable({
  data,
  showRoles = true,
}: TeamPerformanceTableProps) {
  // Sort by on-time rate descending
  const sortedData = [...data].sort((a, b) => b.onTimeRate - a.onTimeRate);

  // Calculate team averages
  const teamAvgOnTime =
    data.length > 0
      ? Math.round(data.reduce((sum, d) => sum + d.onTimeRate, 0) / data.length)
      : 0;

  const teamTotalCompleted = data.reduce((sum, d) => sum + d.completed, 0);

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Team Performance
          </h3>
          <p className="text-2xl font-bold">
            {teamAvgOnTime}%
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              team on-time rate
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total Completed</p>
          <p className="text-lg font-semibold">{teamTotalCompleted}</p>
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Member
                </th>
                {showRoles && (
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Role
                  </th>
                )}
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Completed
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  On-Time Rate
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Avg Days Early
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Active
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedData.map((member, index) => {
                const indicator = getPerformanceIndicator(member.onTimeRate);
                const Icon = indicator.icon;

                return (
                  <tr
                    key={member.userId}
                    className={
                      index % 2 === 0 ? "bg-background" : "bg-muted/20"
                    }
                  >
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                          {member.userName
                            ? member.userName.charAt(0).toUpperCase()
                            : member.userId.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium">
                          {member.userName ||
                            `User ${member.userId.slice(0, 8)}`}
                        </span>
                      </div>
                    </td>
                    {showRoles && (
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                        {formatRole(member.role)}
                      </td>
                    )}
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                      {member.completed}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <span
                        className={`text-sm font-medium ${
                          member.onTimeRate >= 90
                            ? "text-green-600"
                            : member.onTimeRate >= 70
                              ? "text-yellow-600"
                              : "text-red-600"
                        }`}
                      >
                        {member.onTimeRate}%
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                      {member.avgDaysBefore > 0 ? (
                        <span className="text-green-600">
                          +{member.avgDaysBefore}
                        </span>
                      ) : member.avgDaysBefore < 0 ? (
                        <span className="text-red-600">
                          {member.avgDaysBefore}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                      {member.activeAssignments > 0 ? (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {member.activeAssignments}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Icon className={`h-4 w-4 ${indicator.color}`} />
                        <span className={`text-xs ${indicator.color}`}>
                          {indicator.label}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {data.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No team performance data available
          </div>
        )}
      </div>
    </div>
  );
}
