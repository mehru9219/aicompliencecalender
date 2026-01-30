/**
 * Card component showing cost avoidance estimates.
 */

"use client";

import { DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CostBreakdown {
  category: string;
  count: number;
  totalAvoided: number;
}

interface CostAvoidanceCardProps {
  totalAvoided: number;
  deadlinesCompletedOnTime: number;
  byCategory: CostBreakdown[];
  disclaimer?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatCategory(category: string): string {
  return category
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function CostAvoidanceCard({
  totalAvoided,
  deadlinesCompletedOnTime,
  byCategory,
  disclaimer,
}: CostAvoidanceCardProps) {
  // Sort categories by total avoided descending
  const sortedCategories = [...byCategory].sort(
    (a, b) => b.totalAvoided - a.totalAvoided,
  );

  // Calculate average per deadline
  const avgPerDeadline =
    deadlinesCompletedOnTime > 0
      ? Math.round(totalAvoided / deadlinesCompletedOnTime)
      : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="h-5 w-5 text-green-600" />
          Estimated Cost Avoidance
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Main stat */}
        <div className="mb-6">
          <p className="text-4xl font-bold text-green-600">
            {formatCurrency(totalAvoided)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            saved by completing {deadlinesCompletedOnTime} deadlines on time
          </p>
        </div>

        {/* Stats row */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-green-50 p-3 dark:bg-green-950/30">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-700 dark:text-green-400">
                Avg. Per Deadline
              </span>
            </div>
            <p className="mt-1 text-lg font-semibold text-green-700 dark:text-green-400">
              {formatCurrency(avgPerDeadline)}
            </p>
          </div>
          <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                On-Time Completions
              </span>
            </div>
            <p className="mt-1 text-lg font-semibold text-blue-700 dark:text-blue-400">
              {deadlinesCompletedOnTime}
            </p>
          </div>
        </div>

        {/* Category breakdown */}
        {sortedCategories.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              By Category
            </h4>
            <div className="space-y-2">
              {sortedCategories.slice(0, 5).map((cat) => {
                const percentage = (cat.totalAvoided / totalAvoided) * 100;
                return (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between text-sm">
                      <span>{formatCategory(cat.category)}</span>
                      <span className="font-medium">
                        {formatCurrency(cat.totalAvoided)}
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {cat.count} deadline{cat.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        {disclaimer && (
          <p className="mt-4 text-xs text-muted-foreground">{disclaimer}</p>
        )}
      </CardContent>
    </Card>
  );
}
