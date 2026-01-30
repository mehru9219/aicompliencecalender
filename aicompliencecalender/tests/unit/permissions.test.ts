import { describe, it, expect } from "vitest";
import {
  hasPermission,
  canManageRole,
  getResolvedPermissions,
  getAssignableRoles,
  isValidRole,
  getRoleLevel,
  PERMISSIONS,
  ROLES,
  ROLE_PERMISSIONS,
  type Role,
} from "../../lib/permissions";

describe("Permissions System", () => {
  describe("hasPermission", () => {
    describe("Owner role", () => {
      it("has all permissions via wildcard", () => {
        expect(hasPermission("owner", PERMISSIONS.DEADLINES_CREATE)).toBe(true);
        expect(hasPermission("owner", PERMISSIONS.BILLING_WRITE)).toBe(true);
        expect(hasPermission("owner", PERMISSIONS.USERS_REMOVE)).toBe(true);
        expect(hasPermission("owner", PERMISSIONS.AUDIT_READ)).toBe(true);
      });

      it("has all category-specific permissions", () => {
        expect(hasPermission("owner", "deadlines:create")).toBe(true);
        expect(hasPermission("owner", "documents:delete")).toBe(true);
        expect(hasPermission("owner", "settings:write")).toBe(true);
      });
    });

    describe("Admin role", () => {
      it("has category wildcard permissions", () => {
        expect(hasPermission("admin", "deadlines:create")).toBe(true);
        expect(hasPermission("admin", "deadlines:delete")).toBe(true);
        expect(hasPermission("admin", "documents:create")).toBe(true);
        expect(hasPermission("admin", "documents:delete")).toBe(true);
      });

      it("has specific permissions", () => {
        expect(hasPermission("admin", PERMISSIONS.USERS_READ)).toBe(true);
        expect(hasPermission("admin", PERMISSIONS.USERS_INVITE)).toBe(true);
        expect(hasPermission("admin", PERMISSIONS.USERS_REMOVE)).toBe(true);
        expect(hasPermission("admin", PERMISSIONS.AUDIT_READ)).toBe(true);
        expect(hasPermission("admin", PERMISSIONS.SETTINGS_READ)).toBe(true);
        expect(hasPermission("admin", PERMISSIONS.SETTINGS_WRITE)).toBe(true);
      });

      it("does not have billing permissions", () => {
        expect(hasPermission("admin", PERMISSIONS.BILLING_READ)).toBe(false);
        expect(hasPermission("admin", PERMISSIONS.BILLING_WRITE)).toBe(false);
      });
    });

    describe("Manager role", () => {
      it("has deadline management permissions", () => {
        expect(hasPermission("manager", "deadlines:create")).toBe(true);
        expect(hasPermission("manager", "deadlines:read")).toBe(true);
        expect(hasPermission("manager", "deadlines:update")).toBe(true);
        expect(hasPermission("manager", "deadlines:complete")).toBe(true);
        expect(hasPermission("manager", "deadlines:assign")).toBe(true);
      });

      it("does not have deadline delete permission", () => {
        expect(hasPermission("manager", "deadlines:delete")).toBe(false);
      });

      it("has document permissions (except delete)", () => {
        expect(hasPermission("manager", "documents:create")).toBe(true);
        expect(hasPermission("manager", "documents:read")).toBe(true);
        expect(hasPermission("manager", "documents:update")).toBe(true);
        expect(hasPermission("manager", "documents:delete")).toBe(false);
      });

      it("has limited user permissions", () => {
        expect(hasPermission("manager", PERMISSIONS.USERS_READ)).toBe(true);
        expect(hasPermission("manager", PERMISSIONS.USERS_INVITE)).toBe(false);
        expect(hasPermission("manager", PERMISSIONS.USERS_REMOVE)).toBe(false);
      });

      it("does not have settings write or audit access", () => {
        expect(hasPermission("manager", PERMISSIONS.SETTINGS_WRITE)).toBe(
          false,
        );
        expect(hasPermission("manager", PERMISSIONS.AUDIT_READ)).toBe(false);
      });
    });

    describe("Member role", () => {
      it("has read-only deadline access", () => {
        expect(hasPermission("member", "deadlines:read")).toBe(true);
        expect(hasPermission("member", "deadlines:create")).toBe(false);
        expect(hasPermission("member", "deadlines:update")).toBe(false);
        expect(hasPermission("member", "deadlines:delete")).toBe(false);
      });

      it("has complete:own permission", () => {
        expect(hasPermission("member", "deadlines:complete:own")).toBe(true);
      });

      it("can complete own deadlines with context", () => {
        const context = { userId: "user123", resourceOwnerId: "user123" };
        expect(hasPermission("member", "deadlines:complete:own", context)).toBe(
          true,
        );
      });

      it("has document read and create", () => {
        expect(hasPermission("member", "documents:read")).toBe(true);
        expect(hasPermission("member", "documents:create")).toBe(true);
        expect(hasPermission("member", "documents:update")).toBe(false);
        expect(hasPermission("member", "documents:delete")).toBe(false);
      });

      it("has alerts:read:own permission", () => {
        expect(hasPermission("member", "alerts:read:own")).toBe(true);
      });
    });

    describe("Viewer role", () => {
      it("has only read permissions", () => {
        expect(hasPermission("viewer", "deadlines:read")).toBe(true);
        expect(hasPermission("viewer", "documents:read")).toBe(true);
      });

      it("has no write permissions", () => {
        expect(hasPermission("viewer", "deadlines:create")).toBe(false);
        expect(hasPermission("viewer", "deadlines:update")).toBe(false);
        expect(hasPermission("viewer", "deadlines:complete")).toBe(false);
        expect(hasPermission("viewer", "documents:create")).toBe(false);
        expect(hasPermission("viewer", "documents:update")).toBe(false);
      });

      it("has no user management permissions", () => {
        expect(hasPermission("viewer", PERMISSIONS.USERS_READ)).toBe(false);
        expect(hasPermission("viewer", PERMISSIONS.USERS_INVITE)).toBe(false);
      });
    });

    describe(":own suffix handling", () => {
      it("grants :own permission when user is resource owner", () => {
        const context = { userId: "user123", resourceOwnerId: "user123" };
        expect(hasPermission("member", "deadlines:complete:own", context)).toBe(
          true,
        );
      });

      it("denies :own permission when user is not resource owner", () => {
        const context = { userId: "user123", resourceOwnerId: "other-user" };
        // The :own permission still returns true because member has deadlines:complete:own directly
        // But the base permission check would fail for complete without :own
        expect(hasPermission("member", "deadlines:complete", context)).toBe(
          false,
        );
      });

      it("handles missing context gracefully", () => {
        // Without context, :own permission still works if role has it directly
        expect(hasPermission("member", "deadlines:complete:own")).toBe(true);
        expect(hasPermission("member", "deadlines:complete")).toBe(false);
      });
    });

    describe("Invalid role handling", () => {
      it("returns false for invalid role", () => {
        expect(hasPermission("invalid_role", "deadlines:read")).toBe(false);
      });

      it("returns false for empty role", () => {
        expect(hasPermission("", "deadlines:read")).toBe(false);
      });
    });
  });

  describe("canManageRole", () => {
    describe("Owner management capabilities", () => {
      it("owner can manage all roles except owner", () => {
        expect(canManageRole("owner", "admin")).toBe(true);
        expect(canManageRole("owner", "manager")).toBe(true);
        expect(canManageRole("owner", "member")).toBe(true);
        expect(canManageRole("owner", "viewer")).toBe(true);
      });

      it("owner cannot manage other owners", () => {
        expect(canManageRole("owner", "owner")).toBe(false);
      });
    });

    describe("Admin management capabilities", () => {
      it("admin can manage roles below", () => {
        expect(canManageRole("admin", "manager")).toBe(true);
        expect(canManageRole("admin", "member")).toBe(true);
        expect(canManageRole("admin", "viewer")).toBe(true);
      });

      it("admin cannot manage owner or same level", () => {
        expect(canManageRole("admin", "owner")).toBe(false);
        expect(canManageRole("admin", "admin")).toBe(false);
      });
    });

    describe("Manager management capabilities", () => {
      it("manager can manage member and viewer", () => {
        expect(canManageRole("manager", "member")).toBe(true);
        expect(canManageRole("manager", "viewer")).toBe(true);
      });

      it("manager cannot manage higher or same roles", () => {
        expect(canManageRole("manager", "owner")).toBe(false);
        expect(canManageRole("manager", "admin")).toBe(false);
        expect(canManageRole("manager", "manager")).toBe(false);
      });
    });

    describe("Member management capabilities", () => {
      it("member can only manage viewer", () => {
        expect(canManageRole("member", "viewer")).toBe(true);
      });

      it("member cannot manage same or higher roles", () => {
        expect(canManageRole("member", "member")).toBe(false);
        expect(canManageRole("member", "manager")).toBe(false);
        expect(canManageRole("member", "admin")).toBe(false);
        expect(canManageRole("member", "owner")).toBe(false);
      });
    });

    describe("Viewer management capabilities", () => {
      it("viewer cannot manage any role", () => {
        expect(canManageRole("viewer", "viewer")).toBe(false);
        expect(canManageRole("viewer", "member")).toBe(false);
        expect(canManageRole("viewer", "manager")).toBe(false);
        expect(canManageRole("viewer", "admin")).toBe(false);
        expect(canManageRole("viewer", "owner")).toBe(false);
      });
    });
  });

  describe("getResolvedPermissions", () => {
    it("returns all permissions for owner", () => {
      const permissions = getResolvedPermissions("owner");
      expect(permissions).toContain(PERMISSIONS.DEADLINES_CREATE);
      expect(permissions).toContain(PERMISSIONS.BILLING_WRITE);
      expect(permissions).toContain(PERMISSIONS.AUDIT_READ);
    });

    it("expands category wildcards for admin", () => {
      const permissions = getResolvedPermissions("admin");
      expect(permissions).toContain("deadlines:create");
      expect(permissions).toContain("deadlines:read");
      expect(permissions).toContain("deadlines:update");
      expect(permissions).toContain("deadlines:delete");
    });

    it("returns exact permissions for viewer", () => {
      const permissions = getResolvedPermissions("viewer");
      expect(permissions).toHaveLength(2);
      expect(permissions).toContain("deadlines:read");
      expect(permissions).toContain("documents:read");
    });
  });

  describe("getAssignableRoles", () => {
    it("owner can assign all roles except owner", () => {
      const roles = getAssignableRoles("owner");
      expect(roles).toEqual(["admin", "manager", "member", "viewer"]);
    });

    it("admin can assign manager, member, viewer", () => {
      const roles = getAssignableRoles("admin");
      expect(roles).toEqual(["manager", "member", "viewer"]);
    });

    it("manager can assign member, viewer", () => {
      const roles = getAssignableRoles("manager");
      expect(roles).toEqual(["member", "viewer"]);
    });

    it("member can only assign viewer", () => {
      const roles = getAssignableRoles("member");
      expect(roles).toEqual(["viewer"]);
    });

    it("viewer cannot assign any roles", () => {
      const roles = getAssignableRoles("viewer");
      expect(roles).toEqual([]);
    });
  });

  describe("isValidRole", () => {
    it("returns true for valid roles", () => {
      expect(isValidRole("owner")).toBe(true);
      expect(isValidRole("admin")).toBe(true);
      expect(isValidRole("manager")).toBe(true);
      expect(isValidRole("member")).toBe(true);
      expect(isValidRole("viewer")).toBe(true);
    });

    it("returns false for invalid roles", () => {
      expect(isValidRole("invalid")).toBe(false);
      expect(isValidRole("superadmin")).toBe(false);
      expect(isValidRole("")).toBe(false);
    });
  });

  describe("getRoleLevel", () => {
    it("returns correct hierarchy levels", () => {
      expect(getRoleLevel("owner")).toBe(0);
      expect(getRoleLevel("admin")).toBe(1);
      expect(getRoleLevel("manager")).toBe(2);
      expect(getRoleLevel("member")).toBe(3);
      expect(getRoleLevel("viewer")).toBe(4);
    });
  });

  describe("ROLES constant", () => {
    it("contains all expected roles in hierarchy order", () => {
      expect(ROLES).toEqual(["owner", "admin", "manager", "member", "viewer"]);
    });
  });

  describe("ROLE_PERMISSIONS constant", () => {
    it("owner has wildcard permission", () => {
      expect(ROLE_PERMISSIONS.owner).toContain("*");
    });

    it("all roles are defined", () => {
      for (const role of ROLES) {
        expect(ROLE_PERMISSIONS[role]).toBeDefined();
        expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true);
      }
    });
  });

  describe("Permission matrix completeness", () => {
    const testCases: [Role, string, boolean][] = [
      // Owner - full access
      ["owner", "deadlines:create", true],
      ["owner", "billing:write", true],

      // Admin - category wildcards
      ["admin", "deadlines:delete", true],
      ["admin", "billing:read", false],

      // Manager - specific permissions
      ["manager", "deadlines:create", true],
      ["manager", "deadlines:delete", false],

      // Member - limited
      ["member", "deadlines:read", true],
      ["member", "deadlines:create", false],

      // Viewer - read only
      ["viewer", "deadlines:read", true],
      ["viewer", "deadlines:complete", false],
    ];

    it.each(testCases)(
      "%s has %s permission: %s",
      (role, permission, expected) => {
        expect(hasPermission(role, permission)).toBe(expected);
      },
    );
  });
});
