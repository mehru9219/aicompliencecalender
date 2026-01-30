"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { AlertStatusBadge, UrgencyBadge } from "./AlertStatusBadge";
import { SnoozeButton } from "./SnoozeButton";
import { ALERT_CHANNELS } from "@/types/alert";
import type { AlertChannel, AlertStatus, AlertUrgency } from "@/types/alert";

interface AlertHistoryProps {
  orgId: Id<"organizations">;
  deadlineId?: Id<"deadlines">;
  limit?: number;
}

export function AlertHistory({
  orgId,
  deadlineId,
  limit = 50,
}: AlertHistoryProps) {
  const alerts = useQuery(
    deadlineId ? api.alerts.listByDeadline : api.alerts.listByOrg,
    deadlineId ? { deadlineId } : { orgId, limit },
  );

  if (!alerts) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-lg" />
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">No alerts found</div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert: AlertHistoryItemProps["alert"]) => (
        <AlertHistoryItem key={alert._id} alert={alert} />
      ))}
    </div>
  );
}

interface AlertHistoryItemProps {
  alert: {
    _id: Id<"alerts">;
    channel: string;
    urgency: string;
    status: string;
    scheduledFor: number;
    sentAt?: number;
    deliveredAt?: number;
    acknowledgedAt?: number;
    errorMessage?: string;
    retryCount: number;
    snoozedUntil?: number;
  };
}

function AlertHistoryItem({ alert }: AlertHistoryItemProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const channel = alert.channel as AlertChannel;
  const status = alert.status as AlertStatus;
  const urgency = alert.urgency as AlertUrgency;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">
                {ALERT_CHANNELS[channel] ?? channel}
              </span>
              <UrgencyBadge urgency={urgency} />
              <AlertStatusBadge status={status} />
            </div>
            <div className="text-sm text-gray-500">
              Scheduled: {formatDate(alert.scheduledFor)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status === "scheduled" && <SnoozeButton alertId={alert._id} />}
        </div>
      </div>

      <SnoozedStatus
        snoozedUntil={alert.snoozedUntil}
        formatDate={formatDate}
      />

      {status === "failed" && alert.errorMessage && (
        <div className="mt-2 text-sm text-red-600">
          Error: {alert.errorMessage}
          {alert.retryCount > 0 && ` (${alert.retryCount} retries)`}
        </div>
      )}

      {alert.sentAt && (
        <div className="mt-2 text-xs text-gray-400">
          Sent: {formatDate(alert.sentAt)}
          {alert.deliveredAt &&
            ` | Delivered: ${formatDate(alert.deliveredAt)}`}
          {alert.acknowledgedAt &&
            ` | Acknowledged: ${formatDate(alert.acknowledgedAt)}`}
        </div>
      )}
    </div>
  );
}

function SnoozedStatus({
  snoozedUntil,
  formatDate,
}: {
  snoozedUntil?: number;
  formatDate: (timestamp: number) => string;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (!snoozedUntil || snoozedUntil <= now) {
    return null;
  }

  return (
    <div className="mt-2 text-sm text-amber-600">
      Snoozed until {formatDate(snoozedUntil)}
    </div>
  );
}
