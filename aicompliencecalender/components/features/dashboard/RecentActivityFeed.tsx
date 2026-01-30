"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Activity,
  CheckCircle,
  FileUp,
  Bell,
  Trash2,
  Edit,
  Download,
  Settings,
  UserPlus,
  UserMinus,
  UserCog,
  CreditCard,
  Crown,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

type ActionType =
  | "deadline_created"
  | "deadline_completed"
  | "deadline_updated"
  | "deadline_deleted"
  | "document_uploaded"
  | "document_deleted"
  | "alert_sent"
  | "alert_acknowledged"
  | "template_imported"
  | "settings_updated"
  | "user_invited"
  | "user_removed"
  | "user_role_changed"
  | "org_settings_changed"
  | "subscription_changed"
  | "ownership_transferred"
  | "user_joined"
  | "role_changed"
  | "invitation_revoked";

interface ActivityItem {
  _id: string;
  action: ActionType;
  targetType: string;
  targetId?: string;
  targetTitle?: string;
  timestamp: number;
  userId: string;
}

interface RecentActivityFeedProps {
  activities: ActivityItem[];
  className?: string;
}

const actionConfig: Record<
  ActionType,
  { icon: typeof Activity; label: string; color: string }
> = {
  deadline_created: {
    icon: Activity,
    label: "Created deadline",
    color: "text-blue-500",
  },
  deadline_completed: {
    icon: CheckCircle,
    label: "Completed deadline",
    color: "text-green-500",
  },
  deadline_updated: {
    icon: Edit,
    label: "Updated deadline",
    color: "text-amber-500",
  },
  deadline_deleted: {
    icon: Trash2,
    label: "Deleted deadline",
    color: "text-red-500",
  },
  document_uploaded: {
    icon: FileUp,
    label: "Uploaded document",
    color: "text-purple-500",
  },
  document_deleted: {
    icon: Trash2,
    label: "Deleted document",
    color: "text-red-500",
  },
  alert_sent: {
    icon: Bell,
    label: "Alert sent",
    color: "text-amber-500",
  },
  alert_acknowledged: {
    icon: CheckCircle,
    label: "Alert acknowledged",
    color: "text-green-500",
  },
  template_imported: {
    icon: Download,
    label: "Imported template",
    color: "text-blue-500",
  },
  settings_updated: {
    icon: Settings,
    label: "Updated settings",
    color: "text-muted-foreground",
  },
  user_invited: {
    icon: UserPlus,
    label: "Invited user",
    color: "text-blue-500",
  },
  user_removed: {
    icon: UserMinus,
    label: "Removed user",
    color: "text-red-500",
  },
  user_role_changed: {
    icon: UserCog,
    label: "Changed user role",
    color: "text-amber-500",
  },
  org_settings_changed: {
    icon: Settings,
    label: "Updated organization settings",
    color: "text-muted-foreground",
  },
  subscription_changed: {
    icon: CreditCard,
    label: "Changed subscription",
    color: "text-purple-500",
  },
  ownership_transferred: {
    icon: Crown,
    label: "Transferred ownership",
    color: "text-amber-500",
  },
  user_joined: {
    icon: UserPlus,
    label: "User joined",
    color: "text-green-500",
  },
  role_changed: {
    icon: UserCog,
    label: "Role changed",
    color: "text-amber-500",
  },
  invitation_revoked: {
    icon: UserMinus,
    label: "Invitation revoked",
    color: "text-red-500",
  },
};

function getActivityLink(activity: ActivityItem): string | null {
  if (!activity.targetId) return null;

  switch (activity.targetType) {
    case "deadline":
      return `/deadlines/${activity.targetId}`;
    case "document":
      return `/documents/${activity.targetId}`;
    default:
      return null;
  }
}

export function RecentActivityFeed({
  activities,
  className,
}: RecentActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            No recent activity to display.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => {
          const config = actionConfig[activity.action];
          const Icon = config.icon;
          const link = getActivityLink(activity);

          const content = (
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${config.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{config.label}</span>
                  {activity.targetTitle && (
                    <>
                      {": "}
                      <span
                        className={
                          link ? "hover:underline text-primary" : undefined
                        }
                      >
                        {activity.targetTitle}
                      </span>
                    </>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </p>
              </div>
            </div>
          );

          return link ? (
            <Link
              key={activity._id}
              href={link}
              className="block hover:bg-accent rounded-md p-2 -m-2"
            >
              {content}
            </Link>
          ) : (
            <div key={activity._id} className="p-2 -m-2">
              {content}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
