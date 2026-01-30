/**
 * Bar chart showing deadline breakdown by category.
 */

"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface CategoryData {
  category: string;
  count: number;
  overdue: number;
}

interface CategoryBreakdownChartProps {
  data: CategoryData[];
  height?: number;
}

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  licenses: "hsl(var(--chart-1))",
  certifications: "hsl(var(--chart-2))",
  training_records: "hsl(var(--chart-3))",
  audit_reports: "hsl(var(--chart-4))",
  policies: "hsl(var(--chart-5))",
  insurance: "hsl(210, 70%, 50%)",
  contracts: "hsl(280, 70%, 50%)",
  tax_filing: "hsl(30, 70%, 50%)",
  other: "hsl(0, 0%, 60%)",
};

function getColor(category: string): string {
  return CATEGORY_COLORS[category.toLowerCase()] || "hsl(var(--primary))";
}

function formatCategory(category: string): string {
  return category
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function CategoryBreakdownChart({
  data,
  height = 300,
}: CategoryBreakdownChartProps) {
  const totalItems = data.reduce((sum, d) => sum + d.count, 0);
  const totalOverdue = data.reduce((sum, d) => sum + d.overdue, 0);

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Pending by Category
          </h3>
          <p className="text-2xl font-bold">
            {totalItems}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              total pending
            </span>
          </p>
        </div>
        {totalOverdue > 0 && (
          <div className="rounded-md bg-destructive/10 px-3 py-1">
            <p className="text-sm font-medium text-destructive">
              {totalOverdue} overdue
            </p>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={true}
            vertical={false}
            className="stroke-border"
          />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="category"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={120}
            tickFormatter={formatCategory}
            className="fill-muted-foreground"
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as CategoryData;
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-md">
                    <p className="text-sm font-medium">
                      {formatCategory(item.category)}
                    </p>
                    <div className="mt-1 space-y-1">
                      <p className="text-lg font-bold">{item.count} pending</p>
                      {item.overdue > 0 && (
                        <p className="text-sm text-destructive">
                          {item.overdue} overdue
                        </p>
                      )}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.category)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3">
        {data.slice(0, 6).map((item) => (
          <div key={item.category} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: getColor(item.category) }}
            />
            <span className="text-xs text-muted-foreground">
              {formatCategory(item.category)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
