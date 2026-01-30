"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { BarChart3 } from "lucide-react";

interface CategoryData {
  category: string;
  count: number;
  overdueCount: number;
}

interface CategoryBreakdownChartProps {
  data: CategoryData[];
  className?: string;
}

// Color palette for categories
const COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#f97316", // orange
];

function formatCategoryName(category: string): string {
  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function CategoryBreakdownChart({
  data,
  className,
}: CategoryBreakdownChartProps) {
  if (data.length === 0) {
    return (
      <Card className={`hidden md:block ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-5 w-5" />
            Deadlines by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            No active deadlines to display.
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item, index) => ({
    name: formatCategoryName(item.category),
    value: item.count,
    overdueCount: item.overdueCount,
    color: COLORS[index % COLORS.length],
  }));

  const totalOverdue = data.reduce((sum, item) => sum + item.overdueCount, 0);

  return (
    <Card className={`hidden md:block ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-5 w-5" />
          <span>Deadlines by Category</span>
          {totalOverdue > 0 && (
            <span className="ml-2 text-xs font-normal bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full">
              {totalOverdue} overdue
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke={entry.overdueCount > 0 ? "#ef4444" : "transparent"}
                    strokeWidth={entry.overdueCount > 0 ? 3 : 0}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border rounded-lg shadow-lg p-3">
                        <p className="font-medium">{data.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Total: {data.value}
                        </p>
                        {data.overdueCount > 0 && (
                          <p className="text-sm text-red-600">
                            Overdue: {data.overdueCount}
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="text-sm text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
