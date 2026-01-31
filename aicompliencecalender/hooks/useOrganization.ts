/**
 * Hook for accessing the current organization context.
 * Integrates Clerk Organizations with Convex.
 */

"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth, useOrganization as useClerkOrg } from "@clerk/nextjs";
import type { Id } from "@/convex/_generated/dataModel";

interface Organization {
  _id: Id<"organizations">;
  name: string;
  industry: string;
  ownerId: string;
  createdAt: number;
}

interface UseOrganizationResult {
  orgId: Id<"organizations"> | null;
  currentOrg: Organization | null;
  isLoading: boolean;
  error: Error | null;
}

export function useOrganization(): UseOrganizationResult {
  const { userId } = useAuth();
  const { organization: clerkOrg, isLoaded: clerkLoaded } = useClerkOrg();
  const [isSyncing, setIsSyncing] = useState(false);

  const syncFromClerk = useMutation(api.organizations.syncFromClerk);

  // Query Convex org by Clerk org ID
  const convexOrgId = useQuery(
    api.organizations.getByClerkId,
    clerkOrg?.id ? { clerkOrgId: clerkOrg.id } : "skip"
  );

  // Fallback: get user's orgs if no Clerk org selected
  const userOrgs = useQuery(
    api.organizations.listByUser,
    !clerkOrg && userId ? { userId } : "skip"
  );

  // Sync Clerk org to Convex if needed
  useEffect(() => {
    async function syncOrg() {
      if (!clerkOrg || !userId || convexOrgId !== null || isSyncing) return;

      // convexOrgId is undefined (loading) or null (not found)
      if (convexOrgId === undefined) return; // Still loading

      // Org not found in Convex, create it
      setIsSyncing(true);
      try {
        await syncFromClerk({
          clerkOrgId: clerkOrg.id,
          name: clerkOrg.name,
          userId,
        });
      } catch (err) {
        console.error("Failed to sync org:", err);
      } finally {
        setIsSyncing(false);
      }
    }
    syncOrg();
  }, [clerkOrg, userId, convexOrgId, isSyncing, syncFromClerk]);

  // Determine loading state
  const isLoading = !clerkLoaded || convexOrgId === undefined || isSyncing;

  // Get the org ID - prefer Clerk org, fallback to first user org
  const orgId = convexOrgId ?? userOrgs?.[0]?._id ?? null;
  const currentOrg = userOrgs?.[0] ?? null;

  return {
    orgId,
    currentOrg,
    isLoading,
    error: null,
  };
}
