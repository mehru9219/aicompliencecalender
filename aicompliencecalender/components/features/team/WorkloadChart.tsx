"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Member {
  userId: string;
  name: string | null;
  email: string | null;
  deadlineCount: number;
}

interface WorkloadChartProps {
  members: Member[];
  className?: string;
}

const COLORS = {
  low: "hsl(var(--chart-1))", // Green-ish
  medium: "hsl(var(--chart-2))", // Blue-ish
  high: "hsl(var(--chart-3))", // Yellow-ish
  overloaded: "hsl(var(--destructive))", // Red
};

function getLoadColor(count: number, average: number): string {
  if (count === 0) return COLORS.low;
  const ratio = count / average;
  if (ratio <= 0.75) return COLORS.low;
  if (ratio <= 1.25) return COLORS.medium;
  if (ratio <= 1.75) return COLORS.high;
  return COLORS.overloaded;
}

export function WorkloadChart({ members, className }: WorkloadChartProps) {
  const chartData = useMemo(() => {
    // Sort by deadline count descending for better visualization
    const sorted = [...members].sort(
      (a, b) => b.deadlineCount - a.deadlineCount,
    );

    const average =
      members.length > 0
        ? members.reduce((sum, m) => sum + m.deadlineCount, 0) / members.length
        : 0;

    return sorted.map((member) => ({
      name:
        member.name || member.email?.split("@")[0] || member.userId.slice(0, 8),
      deadlines: member.deadlineCount,
      color: getLoadColor(member.deadlineCount, average),
    }));
  }, [members]);

  const totalDeadlines = members.reduce((sum, m) => sum + m.deadlineCount, 0);
  const maxDeadlines = Math.max(...members.map((m) => m.deadlineCount), 1);

  if (members.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Team Workload</CardTitle>
        <CardDescription>
          {totalDeadlines} total deadline{totalDeadlines !== 1 ? "s" : ""}{" "}
          assigned across {members.length} team member
          {members.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis
                type="number"
                domain={[0, maxDeadlines + 1]}
                tickFormatter={(value) => value.toString()}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border rounded-lg px-3 py-2 shadow-md">
                        <p className="font-medium">{data.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.deadlines} deadline
                          {data.deadlines !== 1 ? "s" : ""}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="deadlines" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div
              className="size-3 rounded"
              style={{ backgroundColor: COLORS.low }}
            />
            <span>Low</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="size-3 rounded"
              style={{ backgroundColor: COLORS.medium }}
            />
            <span>Average</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="size-3 rounded"
              style={{ backgroundColor: COLORS.high }}
            />
            <span>High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="size-3 rounded"
              style={{ backgroundColor: COLORS.overloaded }}
            />
            <span>Overloaded</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
