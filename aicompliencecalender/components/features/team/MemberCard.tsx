"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { format } from "date-fns";
import {
  MoreHorizontal,
  Shield,
  UserMinus,
  Crown,
  Calendar,
  ClipboardList,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RoleBadge, RoleSelector } from "./RoleSelector";
import { RemoveMemberDialog } from "./RemoveMemberDialog";
import { canManageRole, type Role } from "@/lib/permissions";

interface Member {
  userId: string;
  email: string | null;
  name: string | null;
  role: string;
  joinedAt: number;
  deadlineCount: number;
  isCurrentUser: boolean;
}

interface MemberCardProps {
  member: Member;
  orgId: Id<"organizations">;
  currentUserRole: Role;
  onRoleChange?: () => void;
  onRemove?: () => void;
}

export function MemberCard({
  member,
  orgId,
  currentUserRole,
  onRoleChange,
  onRemove,
}: MemberCardProps) {
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  const updateRole = useMutation(api.team.updateRole);

  const memberRole = member.role as Role;
  const canManage = canManageRole(currentUserRole, memberRole);
  const isOwner = memberRole === "owner";
  const isSelf = member.isCurrentUser;

  const handleRoleChange = async (newRole: Role) => {
    setIsUpdatingRole(true);
    try {
      await updateRole({
        orgId,
        memberId: member.userId,
        newRole: newRole as "admin" | "manager" | "member" | "viewer",
      });
      onRoleChange?.();
    } catch (error) {
      console.error("Failed to update role:", error);
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "?";
  };

  return (
    <>
      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-4">
          <Avatar className="size-10">
            <AvatarImage src={undefined} />
            <AvatarFallback>
              {getInitials(member.name, member.email)}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {member.name || member.email || member.userId}
              </span>
              {isSelf && (
                <span className="text-xs text-muted-foreground">(you)</span>
              )}
              {isOwner && <Crown className="size-4 text-amber-500" />}
            </div>
            {member.email && member.name && (
              <p className="text-sm text-muted-foreground">{member.email}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                Joined {format(new Date(member.joinedAt), "MMM d, yyyy")}
              </span>
              <span className="flex items-center gap-1">
                <ClipboardList className="size-3" />
                {member.deadlineCount} deadline
                {member.deadlineCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Role badge or selector */}
          {canManage && !isOwner && !isSelf ? (
            <RoleSelector
              value={memberRole}
              onChange={handleRoleChange}
              disabled={isUpdatingRole}
              excludeOwner
              maxRole={currentUserRole}
              className="w-32"
            />
          ) : (
            <RoleBadge role={memberRole} />
          )}

          {/* Actions menu */}
          {canManage && !isOwner && !isSelf && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Member actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled>
                  <Shield className="size-4 mr-2" />
                  View permissions
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setShowRemoveDialog(true)}
                >
                  <UserMinus className="size-4 mr-2" />
                  Remove from team
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <RemoveMemberDialog
        open={showRemoveDialog}
        onOpenChange={setShowRemoveDialog}
        orgId={orgId}
        member={member}
        onRemoved={onRemove}
      />
    </>
  );
}
