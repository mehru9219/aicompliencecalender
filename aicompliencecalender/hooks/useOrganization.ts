/**
 * Hook for accessing the current organization context.
 */

"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import type { Id } from "@/convex/_generated/dataModel";

interface Organization {
  _id: Id<"organizations">;
  name: string;
  industry: string;
  ownerId: string;
  createdAt: number;
}

interface UseOrganizationResult {
  currentOrg: Organization | null;
  isLoading: boolean;
  error: Error | null;
}

export function useOrganization(): UseOrganizationResult {
  const { userId } = useAuth();

  // For now, get the first organization the user belongs to
  // In a real app, this would be based on a context/URL parameter
  const orgs = useQuery(
    api.organizations.listByUser,
    userId ? { userId } : "skip",
  );

  const isLoading = orgs === undefined;
  const currentOrg = orgs?.[0] ?? null;

  return {
    currentOrg,
    isLoading,
    error: null,
  };
}
