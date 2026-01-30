"use client";

import type { AlertStatus, AlertUrgency } from "@/types/alert";

interface AlertStatusBadgeProps {
  status: AlertStatus;
  urgency?: AlertUrgency;
}

const statusStyles: Record<AlertStatus, string> = {
  scheduled: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  delivered: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  acknowledged: "bg-purple-100 text-purple-800",
};

const statusLabels: Record<AlertStatus, string> = {
  scheduled: "Scheduled",
  sent: "Sent",
  delivered: "Delivered",
  failed: "Failed",
  acknowledged: "Acknowledged",
};

const urgencyStyles: Record<AlertUrgency, string> = {
  early: "bg-blue-500 text-white",
  medium: "bg-yellow-500 text-black",
  high: "bg-orange-500 text-white",
  critical: "bg-red-600 text-white",
};

export function AlertStatusBadge({ status, urgency }: AlertStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}
    >
      {urgency && (
        <span
          className={`w-2 h-2 rounded-full ${urgencyStyles[urgency].split(" ")[0]}`}
        />
      )}
      {statusLabels[status]}
    </span>
  );
}

interface UrgencyBadgeProps {
  urgency: AlertUrgency;
}

export function UrgencyBadge({ urgency }: UrgencyBadgeProps) {
  const labels: Record<AlertUrgency, string> = {
    early: "Early",
    medium: "Medium",
    high: "High",
    critical: "Critical",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${urgencyStyles[urgency]}`}
    >
      {labels[urgency]}
    </span>
  );
}
