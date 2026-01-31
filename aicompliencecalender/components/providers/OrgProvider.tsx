"use client";

import { createContext, useContext, ReactNode } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import type { Id } from "@/convex/_generated/dataModel";

interface OrgContextValue {
  orgId: Id<"organizations"> | null;
  isLoading: boolean;
}

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({ children }: { children: ReactNode }) {
  const { orgId, isLoading } = useOrganization();

  return (
    <OrgContext.Provider value={{ orgId, isLoading }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrgContext(): OrgContextValue {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error("useOrgContext must be used within OrgProvider");
  }
  return context;
}

/**
 * Hook that returns orgId or throws if not available.
 * Use in components that require an org to function.
 */
export function useRequiredOrgId(): Id<"organizations"> {
  const { orgId, isLoading } = useOrgContext();
  
  if (isLoading) {
    throw new Error("Organization is still loading");
  }
  
  if (!orgId) {
    throw new Error("No organization selected");
  }
  
  return orgId;
}
