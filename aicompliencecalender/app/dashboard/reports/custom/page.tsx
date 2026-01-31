/**
 * Custom Report Builder Page.
 */

"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useOrganization } from "@/hooks/useOrganization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportBuilder, ExportButtons } from "@/components/features/reports";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { BarChart3 } from "lucide-react";

interface ReportResults {
  completionRate?: number;
  onTimeRate?: number;
  byCategory?: Array<{
    category: string;
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  }>;
  byStatus?: Array<{
    status: string;
    count: number;
  }>;
  trend?: Array<{
    period: string;
    total: number;
    completed: number;
    onTime: number;
  }>;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function CustomReportPage() {
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const { userId } = useAuth();
  const [results, setResults] = useState<ReportResults | null>(null);

  if (orgLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!currentOrg || !userId) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">
          Please sign in and select an organization to create custom reports.
        </p>
      </div>
    );
  }

  const handleReportRun = (data: unknown) => {
    setResults(data as ReportResults);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Custom Report Builder</h1>
        <p className="mt-1 text-muted-foreground">
          Build custom reports with your choice of metrics, filters, and
          visualizations
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Builder */}
        <div>
          <ReportBuilder
            orgId={currentOrg._id}
            userId={userId}
            onReportRun={handleReportRun}
          />
        </div>

        {/* Results */}
        <div className="space-y-4">
          {results ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Report Results</h2>
                <ExportButtons data={results} filename="custom-report" />
              </div>

              {/* Rate Cards */}
              {(results.completionRate !== undefined ||
                results.onTimeRate !== undefined) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {results.completionRate !== undefined && (
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">
                          Completion Rate
                        </p>
                        <p className="mt-2 text-4xl font-bold text-primary">
                          {results.completionRate}%
                        </p>
                      </CardContent>
                    </Card>
                  )}
                  {results.onTimeRate !== undefined && (
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">
                          On-Time Rate
                        </p>
                        <p
                          className={`mt-2 text-4xl font-bold ${
                            results.onTimeRate >= 90
                              ? "text-green-600"
                              : results.onTimeRate >= 70
                                ? "text-yellow-600"
                                : "text-red-600"
                          }`}
                        >
                          {results.onTimeRate}%
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* By Category Chart */}
              {results.byCategory && results.byCategory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">By Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={results.byCategory} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis
                          type="category"
                          dataKey="category"
                          width={100}
                          tick={{ fontSize: 11 }}
                          tickFormatter={(val) =>
                            val.replace(/_/g, " ").slice(0, 12)
                          }
                        />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="completed"
                          fill="hsl(var(--chart-1))"
                          name="Completed"
                        />
                        <Bar
                          dataKey="pending"
                          fill="hsl(var(--chart-2))"
                          name="Pending"
                        />
                        <Bar
                          dataKey="overdue"
                          fill="hsl(var(--chart-3))"
                          name="Overdue"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* By Status Pie Chart */}
              {results.byStatus && results.byStatus.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">By Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={results.byStatus}
                          dataKey="count"
                          nameKey="status"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {results.byStatus.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Trend Chart */}
              {results.trend && results.trend.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Trend Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={results.trend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="total"
                          stroke="hsl(var(--chart-1))"
                          name="Total"
                        />
                        <Line
                          type="monotone"
                          dataKey="completed"
                          stroke="hsl(var(--chart-2))"
                          name="Completed"
                        />
                        <Line
                          type="monotone"
                          dataKey="onTime"
                          stroke="hsl(var(--chart-3))"
                          name="On Time"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <BarChart3 className="h-16 w-16 text-muted-foreground/30" />
                <h3 className="mt-4 text-lg font-medium">No Results Yet</h3>
                <p className="mt-1 text-center text-sm text-muted-foreground">
                  Configure your report options and click &quot;Run Report&quot;
                  to see results
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
