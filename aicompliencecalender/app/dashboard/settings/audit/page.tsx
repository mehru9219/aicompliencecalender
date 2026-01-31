"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { format } from "date-fns";
import {
  Download,
  Filter,
  History,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useOrgContext } from "@/components/providers/OrgProvider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { DateRange } from "react-day-picker";

interface AuditLogEntry {
  _id: Id<"activity_log">;
  orgId: Id<"organizations">;
  userId: string;
  action: string;
  targetType: string;
  targetId: string | null;
  targetTitle: string | null;
  metadata: unknown;
  timestamp: number;
  ipAddress: string | null;
}

const ACTION_LABELS: Record<string, string> = {
  deadline_created: "Created deadline",
  deadline_completed: "Completed deadline",
  deadline_updated: "Updated deadline",
  deadline_deleted: "Deleted deadline",
  document_uploaded: "Uploaded document",
  document_deleted: "Deleted document",
  alert_sent: "Sent alert",
  alert_acknowledged: "Acknowledged alert",
  template_imported: "Imported template",
  settings_updated: "Updated settings",
  user_invited: "Invited user",
  user_joined: "User joined",
  user_removed: "Removed user",
  role_changed: "Changed role",
  invitation_revoked: "Revoked invitation",
  ownership_transferred: "Transferred ownership",
};

const ACTION_VARIANTS: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  deadline_created: "default",
  deadline_completed: "default",
  deadline_updated: "secondary",
  deadline_deleted: "destructive",
  document_uploaded: "default",
  document_deleted: "destructive",
  user_invited: "default",
  user_joined: "default",
  user_removed: "destructive",
  role_changed: "secondary",
  ownership_transferred: "secondary",
};

export default function AuditLogPage() {
  const { orgId, isLoading: orgLoading } = useOrgContext();
  const [userFilter, setUserFilter] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [cursor, setCursor] = useState<string | undefined>();

  // Build filters object
  const filters = useMemo(() => {
    const f: {
      userId?: string;
      action?: string;
      dateRange?: { from: number; to: number };
    } = {};

    if (userFilter) f.userId = userFilter;
    if (actionFilter) f.action = actionFilter;
    if (dateRange?.from && dateRange?.to) {
      f.dateRange = {
        from: dateRange.from.getTime(),
        to: dateRange.to.getTime() + 24 * 60 * 60 * 1000 - 1, // End of day
      };
    }

    return Object.keys(f).length > 0 ? f : undefined;
  }, [userFilter, actionFilter, dateRange]);

  const auditLog = useQuery(
    api.audit.getAuditLog,
    orgId ? { orgId, filters, limit: 50, cursor } : "skip"
  );

  const actionTypes = useQuery(
    api.audit.getAuditActionTypes,
    orgId ? { orgId } : "skip"
  );
  const users = useQuery(
    api.audit.getAuditUsers,
    orgId ? { orgId } : "skip"
  );

  const isLoading = orgLoading || auditLog === undefined;

  if (!orgId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No Organization Selected</h2>
        <p className="text-muted-foreground">
          Please select an organization to view audit logs.
        </p>
      </div>
    );
  }

  const handleExportCSV = () => {
    if (!auditLog?.logs) return;

    const headers = [
      "Timestamp",
      "User",
      "Action",
      "Resource Type",
      "Resource",
      "Details",
    ];
    const rows = auditLog.logs.map((log: AuditLogEntry) => [
      format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss"),
      log.userId,
      log.action,
      log.targetType,
      log.targetTitle || log.targetId || "",
      JSON.stringify(log.metadata || {}),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row: string[]) =>
        row
          .map((cell: string) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `audit-log-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const clearFilters = () => {
    setUserFilter("");
    setActionFilter("");
    setDateRange(undefined);
    setCursor(undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="size-6" />
            Audit Log
          </h1>
          <p className="text-muted-foreground mt-1">
            View all activity in your organization for compliance and security
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExportCSV}
          disabled={!auditLog?.logs.length}
        >
          <Download className="size-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="size-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All users</SelectItem>
                {users?.map((userId: string) => (
                  <SelectItem key={userId} value={userId}>
                    {userId.slice(0, 12)}...
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All actions</SelectItem>
                {actionTypes?.map((action: string) => (
                  <SelectItem key={action} value={action}>
                    {ACTION_LABELS[action] || action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder="Date range"
            />

            {(userFilter || actionFilter || dateRange) && (
              <Button variant="ghost" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity History</CardTitle>
          <CardDescription>
            All actions are permanently recorded and cannot be modified
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : auditLog.logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="size-12 mx-auto mb-3 opacity-50" />
              <p>No audit log entries found</p>
              {(userFilter || actionFilter || dateRange) && (
                <p className="text-sm mt-1">Try adjusting your filters</p>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-44">Timestamp</TableHead>
                    <TableHead className="w-32">User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead className="w-32">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLog.logs.map((log: AuditLogEntry) => (
                    <TableRow key={log._id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(log.timestamp), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.userId.slice(0, 12)}...
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={ACTION_VARIANTS[log.action] || "outline"}
                        >
                          {ACTION_LABELS[log.action] || log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.targetTitle || log.targetId || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.metadata ? (
                          <code className="bg-muted px-1 py-0.5 rounded">
                            {JSON.stringify(log.metadata).slice(0, 30)}
                            {JSON.stringify(log.metadata).length > 30 && "..."}
                          </code>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {auditLog.logs.length} entries
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!cursor}
                    onClick={() => setCursor(undefined)}
                  >
                    <ChevronLeft className="size-4 mr-1" />
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!auditLog.hasMore}
                    onClick={() => setCursor(auditLog.nextCursor ?? undefined)}
                  >
                    Next
                    <ChevronRight className="size-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
