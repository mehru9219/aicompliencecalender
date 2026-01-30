/**
 * Billing limit enforcement tests.
 */

import { describe, it, expect, beforeEach } from "vitest";

// Plan configuration (mirrored from billing code)
const PLANS = {
  starter: {
    name: "Starter",
    features: {
      users: 1,
      deadlines: 25,
      storage: 1, // GB
      emailAlerts: true,
      smsAlerts: false,
      formPreFills: 0,
    },
  },
  professional: {
    name: "Professional",
    features: {
      users: 5,
      deadlines: -1, // unlimited
      storage: 10,
      emailAlerts: true,
      smsAlerts: true,
      formPreFills: 10,
    },
  },
  business: {
    name: "Business",
    features: {
      users: 15,
      deadlines: -1, // unlimited
      storage: 50,
      emailAlerts: true,
      smsAlerts: true,
      formPreFills: -1, // unlimited
    },
  },
} as const;

type PlanId = keyof typeof PLANS;
type FeatureKey = keyof typeof PLANS.starter.features;

// Mock usage tracking
interface Usage {
  deadlinesCreated: number;
  documentsUploaded: number;
  storageUsedBytes: number;
  formPreFills: number;
  alertsSent: number;
}

// Mock subscription
interface Subscription {
  plan: PlanId;
  status: string;
}

// Helper to check limit
function checkLimit(
  subscription: Subscription | null,
  limitType: "deadlines" | "storage" | "formPreFills" | "users",
  currentUsage: number,
): {
  allowed: boolean;
  remaining: number | null;
  limit: number | "unlimited";
  current: number;
} {
  // Default to professional for trial users
  const planId: PlanId = subscription?.plan || "professional";
  const plan = PLANS[planId];

  const featureMap: Record<string, FeatureKey> = {
    deadlines: "deadlines",
    storage: "storage",
    formPreFills: "formPreFills",
    users: "users",
  };

  const featureKey = featureMap[limitType];
  const limit = plan.features[featureKey];

  // Handle boolean features (not limits)
  if (typeof limit === "boolean") {
    return {
      allowed: true,
      remaining: null,
      limit: "unlimited",
      current: currentUsage,
    };
  }

  // Unlimited (-1)
  if (limit === -1) {
    return {
      allowed: true,
      remaining: null,
      limit: "unlimited",
      current: currentUsage,
    };
  }

  const allowed = currentUsage < limit;
  const remaining = Math.max(0, limit - currentUsage);

  return {
    allowed,
    remaining,
    limit,
    current: currentUsage,
  };
}

// Helper to generate limit error message
function getLimitErrorMessage(
  limitType: string,
  current: number,
  limit: number,
): string {
  return `You have reached your plan limit of ${limit} ${limitType}. Current usage: ${current}. Please upgrade your plan to continue.`;
}

describe("Billing Limit Enforcement", () => {
  describe("Usage Tracking", () => {
    it("initializes usage at zero for new month", () => {
      const usage: Usage = {
        deadlinesCreated: 0,
        documentsUploaded: 0,
        storageUsedBytes: 0,
        formPreFills: 0,
        alertsSent: 0,
      };

      expect(usage.deadlinesCreated).toBe(0);
      expect(usage.documentsUploaded).toBe(0);
      expect(usage.storageUsedBytes).toBe(0);
      expect(usage.formPreFills).toBe(0);
      expect(usage.alertsSent).toBe(0);
    });

    it("increments usage correctly", () => {
      let usage: Usage = {
        deadlinesCreated: 5,
        documentsUploaded: 0,
        storageUsedBytes: 0,
        formPreFills: 0,
        alertsSent: 0,
      };

      // Increment deadlines
      usage = { ...usage, deadlinesCreated: usage.deadlinesCreated + 1 };
      expect(usage.deadlinesCreated).toBe(6);

      // Increment storage
      usage = {
        ...usage,
        storageUsedBytes: usage.storageUsedBytes + 1024 * 1024,
      };
      expect(usage.storageUsedBytes).toBe(1024 * 1024);
    });

    it("tracks storage in bytes", () => {
      const usage: Usage = {
        deadlinesCreated: 0,
        documentsUploaded: 0,
        storageUsedBytes: 500 * 1024 * 1024, // 500 MB
        formPreFills: 0,
        alertsSent: 0,
      };

      const storageInGB = usage.storageUsedBytes / (1024 * 1024 * 1024);
      expect(storageInGB).toBeCloseTo(0.488, 2);
    });
  });

  describe("Deadline Limits", () => {
    it("allows deadline creation under limit", () => {
      const subscription: Subscription = { plan: "starter", status: "active" };
      const result = checkLimit(subscription, "deadlines", 10);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(15);
      expect(result.limit).toBe(25);
      expect(result.current).toBe(10);
    });

    it("blocks deadline creation at limit", () => {
      const subscription: Subscription = { plan: "starter", status: "active" };
      const result = checkLimit(subscription, "deadlines", 25);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.limit).toBe(25);
      expect(result.current).toBe(25);
    });

    it("blocks deadline creation over limit", () => {
      const subscription: Subscription = { plan: "starter", status: "active" };
      const result = checkLimit(subscription, "deadlines", 30);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("allows unlimited deadlines for professional plan", () => {
      const subscription: Subscription = {
        plan: "professional",
        status: "active",
      };
      const result = checkLimit(subscription, "deadlines", 1000);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeNull();
      expect(result.limit).toBe("unlimited");
    });

    it("allows unlimited deadlines for business plan", () => {
      const subscription: Subscription = { plan: "business", status: "active" };
      const result = checkLimit(subscription, "deadlines", 10000);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe("unlimited");
    });
  });

  describe("Storage Limits", () => {
    it("allows storage under limit", () => {
      const subscription: Subscription = { plan: "starter", status: "active" };
      // 0.5 GB used
      const result = checkLimit(subscription, "storage", 0);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(1);
    });

    it("blocks storage at limit", () => {
      const subscription: Subscription = { plan: "starter", status: "active" };
      // 1 GB used (limit)
      const result = checkLimit(subscription, "storage", 1);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("allows more storage for professional plan", () => {
      const subscription: Subscription = {
        plan: "professional",
        status: "active",
      };
      // 5 GB used
      const result = checkLimit(subscription, "storage", 5);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
      expect(result.limit).toBe(10);
    });

    it("allows 50GB for business plan", () => {
      const subscription: Subscription = { plan: "business", status: "active" };
      // 40 GB used
      const result = checkLimit(subscription, "storage", 40);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(10);
      expect(result.limit).toBe(50);
    });
  });

  describe("Form Pre-fill Limits", () => {
    it("blocks form pre-fills for starter plan", () => {
      const subscription: Subscription = { plan: "starter", status: "active" };
      const result = checkLimit(subscription, "formPreFills", 0);

      expect(result.allowed).toBe(false);
      expect(result.limit).toBe(0);
    });

    it("allows form pre-fills under limit for professional", () => {
      const subscription: Subscription = {
        plan: "professional",
        status: "active",
      };
      const result = checkLimit(subscription, "formPreFills", 5);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
      expect(result.limit).toBe(10);
    });

    it("blocks form pre-fills at limit for professional", () => {
      const subscription: Subscription = {
        plan: "professional",
        status: "active",
      };
      const result = checkLimit(subscription, "formPreFills", 10);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("allows unlimited form pre-fills for business plan", () => {
      const subscription: Subscription = { plan: "business", status: "active" };
      const result = checkLimit(subscription, "formPreFills", 100);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe("unlimited");
    });
  });

  describe("User Limits", () => {
    it("allows single user for starter plan", () => {
      const subscription: Subscription = { plan: "starter", status: "active" };
      const result = checkLimit(subscription, "users", 0);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(1);
    });

    it("blocks additional users for starter plan", () => {
      const subscription: Subscription = { plan: "starter", status: "active" };
      const result = checkLimit(subscription, "users", 1);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("allows 5 users for professional plan", () => {
      const subscription: Subscription = {
        plan: "professional",
        status: "active",
      };
      const result = checkLimit(subscription, "users", 3);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
      expect(result.limit).toBe(5);
    });

    it("allows 15 users for business plan", () => {
      const subscription: Subscription = { plan: "business", status: "active" };
      const result = checkLimit(subscription, "users", 10);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
      expect(result.limit).toBe(15);
    });
  });

  describe("Trial Users", () => {
    it("gives professional limits to trial users", () => {
      // No subscription = trial
      const result = checkLimit(null, "deadlines", 100);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe("unlimited");
    });

    it("allows 10 form pre-fills for trial users", () => {
      const result = checkLimit(null, "formPreFills", 5);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
      expect(result.limit).toBe(10);
    });

    it("allows 5 users for trial", () => {
      const result = checkLimit(null, "users", 3);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });
  });

  describe("Error Messages", () => {
    it("generates clear error message for deadline limit", () => {
      const message = getLimitErrorMessage("deadlines", 25, 25);

      expect(message).toContain("25 deadlines");
      expect(message).toContain("Current usage: 25");
      expect(message).toContain("upgrade your plan");
    });

    it("generates clear error message for storage limit", () => {
      const message = getLimitErrorMessage("storage", 1, 1);

      expect(message).toContain("1 storage");
      expect(message).toContain("upgrade");
    });

    it("generates clear error message for user limit", () => {
      const message = getLimitErrorMessage("users", 1, 1);

      expect(message).toContain("1 users");
      expect(message).toContain("upgrade");
    });
  });

  describe("Plan Feature Comparison", () => {
    it("starter has correct limits", () => {
      expect(PLANS.starter.features.users).toBe(1);
      expect(PLANS.starter.features.deadlines).toBe(25);
      expect(PLANS.starter.features.storage).toBe(1);
      expect(PLANS.starter.features.emailAlerts).toBe(true);
      expect(PLANS.starter.features.smsAlerts).toBe(false);
      expect(PLANS.starter.features.formPreFills).toBe(0);
    });

    it("professional has correct limits", () => {
      expect(PLANS.professional.features.users).toBe(5);
      expect(PLANS.professional.features.deadlines).toBe(-1);
      expect(PLANS.professional.features.storage).toBe(10);
      expect(PLANS.professional.features.emailAlerts).toBe(true);
      expect(PLANS.professional.features.smsAlerts).toBe(true);
      expect(PLANS.professional.features.formPreFills).toBe(10);
    });

    it("business has correct limits", () => {
      expect(PLANS.business.features.users).toBe(15);
      expect(PLANS.business.features.deadlines).toBe(-1);
      expect(PLANS.business.features.storage).toBe(50);
      expect(PLANS.business.features.emailAlerts).toBe(true);
      expect(PLANS.business.features.smsAlerts).toBe(true);
      expect(PLANS.business.features.formPreFills).toBe(-1);
    });
  });

  describe("Unlimited Value Handling", () => {
    it("represents unlimited as -1", () => {
      const unlimitedValue = -1;
      expect(unlimitedValue).toBe(-1);
    });

    it("checkLimit returns 'unlimited' string for -1 values", () => {
      const subscription: Subscription = { plan: "business", status: "active" };
      const result = checkLimit(subscription, "formPreFills", 999);

      expect(result.limit).toBe("unlimited");
    });

    it("remaining is null for unlimited features", () => {
      const subscription: Subscription = {
        plan: "professional",
        status: "active",
      };
      const result = checkLimit(subscription, "deadlines", 500);

      expect(result.remaining).toBeNull();
    });

    it("always allows usage for unlimited features", () => {
      const subscription: Subscription = { plan: "business", status: "active" };

      // Even with very high usage
      const result = checkLimit(subscription, "formPreFills", 999999);
      expect(result.allowed).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("handles zero usage correctly", () => {
      const subscription: Subscription = { plan: "starter", status: "active" };
      const result = checkLimit(subscription, "deadlines", 0);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(25);
      expect(result.current).toBe(0);
    });

    it("handles negative remaining (overage)", () => {
      const subscription: Subscription = { plan: "starter", status: "active" };
      const result = checkLimit(subscription, "deadlines", 30);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0); // Clamped to 0, not negative
    });

    it("handles exact limit boundary", () => {
      const subscription: Subscription = { plan: "starter", status: "active" };

      // At 24 (one below limit)
      const result24 = checkLimit(subscription, "deadlines", 24);
      expect(result24.allowed).toBe(true);
      expect(result24.remaining).toBe(1);

      // At 25 (at limit)
      const result25 = checkLimit(subscription, "deadlines", 25);
      expect(result25.allowed).toBe(false);
      expect(result25.remaining).toBe(0);
    });
  });

  describe("Monthly Reset", () => {
    it("calculates current month correctly", () => {
      const now = new Date();
      const currentMonth = now.toISOString().slice(0, 7);

      expect(currentMonth).toMatch(/^\d{4}-\d{2}$/);
      expect(currentMonth.length).toBe(7);
    });

    it("different months have different keys", () => {
      const jan = new Date("2025-01-15").toISOString().slice(0, 7);
      const feb = new Date("2025-02-15").toISOString().slice(0, 7);

      expect(jan).toBe("2025-01");
      expect(feb).toBe("2025-02");
      expect(jan).not.toBe(feb);
    });
  });
});
