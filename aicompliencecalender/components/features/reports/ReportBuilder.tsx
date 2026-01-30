/**
 * Custom report builder component with configurable metrics and filters.
 */

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  LineChart,
  PieChart,
  Save,
  Play,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

interface ReportBuilderProps {
  orgId: Id<"organizations">;
  userId: string;
  onReportRun?: (results: unknown) => void;
}

type DateRangeType =
  | "last_7_days"
  | "last_30_days"
  | "last_quarter"
  | "last_year"
  | "custom";

const METRICS = [
  {
    value: "completion_rate",
    label: "Completion Rate",
    description: "Percentage of deadlines completed",
  },
  {
    value: "on_time_rate",
    label: "On-Time Rate",
    description: "Percentage completed before due date",
  },
  {
    value: "by_category",
    label: "By Category",
    description: "Breakdown by compliance category",
  },
  {
    value: "by_status",
    label: "By Status",
    description: "Breakdown by completion status",
  },
  {
    value: "trend",
    label: "Trend Over Time",
    description: "Changes over selected period",
  },
];

const CATEGORIES = [
  "licenses",
  "certifications",
  "training_records",
  "audit_reports",
  "policies",
  "insurance",
  "contracts",
  "tax_filing",
  "other",
];

const CHART_TYPES = [
  { value: "bar", label: "Bar Chart", icon: BarChart3 },
  { value: "line", label: "Line Chart", icon: LineChart },
  { value: "pie", label: "Pie Chart", icon: PieChart },
];

export function ReportBuilder({
  orgId,
  userId,
  onReportRun,
}: ReportBuilderProps) {
  const [reportName, setReportName] = useState("");
  const [dateRangeType, setDateRangeType] =
    useState<DateRangeType>("last_30_days");
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    "completion_rate",
    "on_time_rate",
  ]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCharts, setSelectedCharts] = useState<string[]>(["bar"]);
  const [groupBy, setGroupBy] = useState<string>("month");
  const [isRunning, setIsRunning] = useState(false);

  const saveReport = useMutation(api.reports.saveReport);

  const runReport = useQuery(
    api.reports.runCustomReport,
    isRunning
      ? {
          orgId,
          config: {
            dateRangeType,
            customDateRange: undefined,
            categories: selectedCategories,
            metrics: selectedMetrics,
            chartTypes: selectedCharts,
            groupBy,
          },
        }
      : "skip",
  );

  const handleRunReport = () => {
    if (selectedMetrics.length === 0) {
      toast.error("Please select at least one metric");
      return;
    }
    setIsRunning(true);
  };

  // Handle report results
  if (runReport && isRunning) {
    onReportRun?.(runReport);
    setIsRunning(false);
  }

  const handleSaveReport = async () => {
    if (!reportName.trim()) {
      toast.error("Please enter a report name");
      return;
    }

    try {
      await saveReport({
        orgId,
        name: reportName,
        reportType: "custom",
        config: {
          dateRangeType,
          customDateRange: undefined,
          categories: selectedCategories,
          metrics: selectedMetrics,
          chartTypes: selectedCharts,
          groupBy,
        },
        userId,
      });
      toast.success("Report saved successfully");
    } catch {
      toast.error("Failed to save report");
    }
  };

  const toggleMetric = (metric: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metric)
        ? prev.filter((m) => m !== metric)
        : [...prev, metric],
    );
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const toggleChart = (chart: string) => {
    setSelectedCharts((prev) =>
      prev.includes(chart) ? prev.filter((c) => c !== chart) : [...prev, chart],
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Custom Report Builder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Report Name */}
        <div className="space-y-2">
          <Label htmlFor="report-name">Report Name (optional)</Label>
          <Input
            id="report-name"
            placeholder="My Custom Report"
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
          />
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Date Range
          </Label>
          <Select
            value={dateRangeType}
            onValueChange={(val) => setDateRangeType(val as DateRangeType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_7_days">Last 7 Days</SelectItem>
              <SelectItem value="last_30_days">Last 30 Days</SelectItem>
              <SelectItem value="last_quarter">Last Quarter</SelectItem>
              <SelectItem value="last_year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Metrics */}
        <div className="space-y-3">
          <Label>Metrics to Include</Label>
          <div className="grid gap-2">
            {METRICS.map((metric) => (
              <label
                key={metric.value}
                className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 cursor-pointer"
              >
                <Checkbox
                  checked={selectedMetrics.includes(metric.value)}
                  onCheckedChange={() => toggleMetric(metric.value)}
                />
                <div>
                  <p className="font-medium text-sm">{metric.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {metric.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Categories Filter */}
        <div className="space-y-3">
          <Label>Filter by Category (leave empty for all)</Label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <Button
                key={category}
                variant={
                  selectedCategories.includes(category) ? "default" : "outline"
                }
                size="sm"
                onClick={() => toggleCategory(category)}
                className="capitalize"
              >
                {category.replace(/_/g, " ")}
              </Button>
            ))}
          </div>
        </div>

        {/* Chart Types */}
        <div className="space-y-3">
          <Label>Chart Types</Label>
          <div className="flex gap-3">
            {CHART_TYPES.map((chart) => {
              const Icon = chart.icon;
              return (
                <Button
                  key={chart.value}
                  variant={
                    selectedCharts.includes(chart.value) ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => toggleChart(chart.value)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {chart.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Group By (for trend) */}
        {selectedMetrics.includes("trend") && (
          <div className="space-y-2">
            <Label>Group Trend By</Label>
            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="quarter">Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button onClick={handleRunReport} disabled={isRunning}>
            <Play className="mr-2 h-4 w-4" />
            Run Report
          </Button>
          <Button
            variant="outline"
            onClick={handleSaveReport}
            disabled={!reportName.trim()}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
