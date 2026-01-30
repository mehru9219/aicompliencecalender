"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ROLE_INFO, type Role, ROLES } from "@/lib/permissions";

interface RoleSelectorProps {
  value: Role;
  onChange: (role: Role) => void;
  disabled?: boolean;
  excludeOwner?: boolean;
  maxRole?: Role;
  className?: string;
}

const roleVariants: Record<Role, "default" | "secondary" | "outline"> = {
  owner: "default",
  admin: "default",
  manager: "secondary",
  member: "outline",
  viewer: "outline",
};

export function RoleSelector({
  value,
  onChange,
  disabled = false,
  excludeOwner = true,
  maxRole,
  className,
}: RoleSelectorProps) {
  // Filter available roles based on constraints
  const availableRoles = ROLES.filter((role) => {
    if (excludeOwner && role === "owner") return false;
    if (maxRole) {
      const maxIndex = ROLES.indexOf(maxRole);
      const roleIndex = ROLES.indexOf(role);
      // Can only assign roles below maxRole
      return roleIndex > maxIndex;
    }
    return true;
  });

  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as Role)}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue>
          <Badge variant={roleVariants[value]}>{ROLE_INFO[value].label}</Badge>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {availableRoles.map((role) => (
          <SelectItem key={role} value={role}>
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">{ROLE_INFO[role].label}</span>
              <span className="text-xs text-muted-foreground">
                {ROLE_INFO[role].description}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  return (
    <Badge variant={roleVariants[role]} className="capitalize">
      {ROLE_INFO[role].label}
    </Badge>
  );
}
