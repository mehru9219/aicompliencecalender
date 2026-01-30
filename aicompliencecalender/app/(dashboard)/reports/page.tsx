/**
 * Reports Dashboard - Main reports landing page.
 */

"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useOrganization } from "@/hooks/useOrganization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Users,
  DollarSign,
  FileText,
  Plus,
  ArrowRight,
  Clock,
} from "lucide-react";

const REPORT_TYPES = [
  {
    title: "Compliance Summary",
    description:
      "Overview of deadline compliance rates, trends, and status breakdown",
    href: "/reports/compliance",
    icon: BarChart3,
    color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
  },
  {
    title: "Team Performance",
    description: "Individual team member metrics, on-time rates, and workload",
    href: "/reports/team",
    icon: Users,
    color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
  },
  {
    title: "Cost Avoidance",
    description: "Estimated penalties avoided through on-time compliance",
    href: "/reports/compliance#cost-avoidance",
    icon: DollarSign,
    color: "text-green-600 bg-green-100 dark:bg-green-900/30",
  },
  {
    title: "Audit Export",
    description: "Generate audit-ready PDF reports for compliance areas",
    href: "/reports/audit",
    icon: FileText,
    color: "text-orange-600 bg-orange-100 dark:bg-orange-900/30",
  },
  {
    title: "Custom Report",
    description: "Build custom reports with your choice of metrics and filters",
    href: "/reports/custom",
    icon: Plus,
    color: "text-pink-600 bg-pink-100 dark:bg-pink-900/30",
  },
];

export default function ReportsPage() {
  const { currentOrg, isLoading: orgLoading } = useOrganization();

  const savedReports = useQuery(
    api.reports.listSavedReports,
    currentOrg ? { orgId: currentOrg._id } : "skip",
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="mt-1 text-muted-foreground">
          Analytics, compliance insights, and audit documentation
        </p>
      </div>

      {/* Report Type Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {REPORT_TYPES.map((report) => {
          const Icon = report.icon;
          return (
            <Link key={report.href} href={report.href}>
              <Card className="h-full transition-colors hover:border-primary hover:bg-muted/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2 ${report.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {report.description}
                  </p>
                  <div className="mt-4 flex items-center text-sm font-medium text-primary">
                    View Report
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Saved Reports */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Saved Reports</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/reports/custom">
              <Plus className="mr-2 h-4 w-4" />
              New Custom Report
            </Link>
          </Button>
        </div>

        {savedReports === undefined ? (
          <div className="rounded-lg border p-8 text-center">
            <div className="h-6 w-6 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : savedReports.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No saved reports</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a custom report to save it for quick access
              </p>
              <Button className="mt-4" asChild>
                <Link href="/reports/custom">Create Custom Report</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Schedule
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {savedReports.map((report) => (
                  <tr key={report._id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="font-medium">{report.name}</p>
                      {report.description && (
                        <p className="text-sm text-muted-foreground">
                          {report.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm capitalize">
                      {report.reportType.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {report.hasSchedule ? (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <Clock className="h-3 w-3" />
                          Scheduled
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/reports/custom?id=${report._id}`}>
                          View
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
