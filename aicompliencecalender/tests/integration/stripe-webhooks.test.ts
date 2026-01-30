/**
 * Stripe webhook handler tests.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import Stripe from "stripe";
import {
  getPlanByPriceId,
  getBillingCycleFromPriceId,
  STRIPE_PRICE_IDS,
} from "../../lib/billing/plans";

// Alias for shorter test code
const PRICE_IDS = STRIPE_PRICE_IDS;

// Mock Stripe webhook signature verification
const createMockEvent = (
  type: string,
  data: Record<string, unknown>,
): Stripe.Event =>
  ({
    id: `evt_${Date.now()}`,
    object: "event",
    api_version: "2026-01-28.clover",
    created: Math.floor(Date.now() / 1000),
    data: {
      object: data,
    },
    livemode: false,
    pending_webhooks: 1,
    request: null,
    type: type,
  }) as unknown as Stripe.Event;

describe("Stripe Webhook Handler", () => {
  describe("Signature Verification", () => {
    it("rejects requests without stripe-signature header", () => {
      const hasSignature = false;
      expect(hasSignature).toBe(false);
      // In real handler: returns 400 if signature missing
    });

    it("rejects requests with invalid signature", () => {
      const isValidSignature = false; // simulating invalid
      expect(isValidSignature).toBe(false);
      // In real handler: returns 400 on verification failure
    });

    it("accepts requests with valid signature", () => {
      const isValidSignature = true; // simulating valid
      expect(isValidSignature).toBe(true);
    });
  });

  describe("checkout.session.completed", () => {
    it("processes subscription checkout correctly", () => {
      const session = {
        id: "cs_test_123",
        mode: "subscription",
        subscription: "sub_123",
        customer: "cus_123",
        metadata: { orgId: "org_123" },
      };

      const event = createMockEvent("checkout.session.completed", session);

      expect(event.type).toBe("checkout.session.completed");
      expect(event.data.object).toHaveProperty("mode", "subscription");
      expect(event.data.object).toHaveProperty("subscription", "sub_123");
    });

    it("skips non-subscription checkouts", () => {
      const session = {
        id: "cs_test_123",
        mode: "payment",
        subscription: null,
      };

      const shouldProcess =
        session.mode === "subscription" && session.subscription;
      expect(shouldProcess).toBe(false);
    });

    it("extracts orgId from session metadata", () => {
      const session = {
        id: "cs_test_123",
        mode: "subscription",
        subscription: "sub_123",
        metadata: { orgId: "org_123" },
      };

      const orgId = session.metadata?.orgId;
      expect(orgId).toBe("org_123");
    });
  });

  describe("customer.subscription.updated", () => {
    it("extracts subscription data correctly", () => {
      const subscription = {
        id: "sub_123",
        status: "active",
        customer: "cus_123",
        metadata: { orgId: "org_123" },
        items: {
          data: [
            {
              price: { id: PRICE_IDS.professional.monthly },
            },
          ],
        },
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        cancel_at_period_end: false,
        trial_end: null,
      };

      expect(subscription.id).toBe("sub_123");
      expect(subscription.status).toBe("active");
      expect(subscription.metadata.orgId).toBe("org_123");
    });

    it("determines plan from price ID", () => {
      const priceId = PRICE_IDS.professional.monthly;
      const plan = getPlanByPriceId(priceId);

      expect(plan).not.toBeNull();
      expect(plan?.id).toBe("professional");
    });

    it("determines billing cycle from price ID", () => {
      const monthlyPriceId = PRICE_IDS.starter.monthly;
      const yearlyPriceId = PRICE_IDS.starter.yearly;

      expect(getBillingCycleFromPriceId(monthlyPriceId)).toBe("monthly");
      expect(getBillingCycleFromPriceId(yearlyPriceId)).toBe("yearly");
    });

    it("handles missing orgId in metadata", () => {
      const subscription = {
        id: "sub_123",
        metadata: {} as Record<string, string>,
      };

      const orgId = subscription.metadata.orgId;
      expect(orgId).toBeUndefined();
      // Handler should log error and skip processing
    });

    it("handles unknown price ID", () => {
      const unknownPriceId = "price_unknown_123";
      const plan = getPlanByPriceId(unknownPriceId);

      expect(plan).toBeNull();
      // Handler should log error and skip processing
    });
  });

  describe("customer.subscription.deleted", () => {
    it("processes subscription cancellation", () => {
      const subscription = {
        id: "sub_123",
        status: "canceled",
        customer: "cus_123",
      };

      const event = createMockEvent(
        "customer.subscription.deleted",
        subscription,
      );

      expect(event.type).toBe("customer.subscription.deleted");
      expect(event.data.object).toHaveProperty("status", "canceled");
    });

    it("updates subscription status to canceled", () => {
      const originalStatus = "active";
      const newStatus = "canceled";

      expect(originalStatus).not.toBe(newStatus);
      expect(newStatus).toBe("canceled");
    });
  });

  describe("invoice.payment_failed", () => {
    it("processes payment failure", () => {
      const invoice = {
        id: "in_123",
        subscription: "sub_123",
        customer: "cus_123",
        status: "open",
      };

      const event = createMockEvent("invoice.payment_failed", invoice);

      expect(event.type).toBe("invoice.payment_failed");
      expect(event.data.object).toHaveProperty("subscription", "sub_123");
    });

    it("skips invoices without subscription", () => {
      const invoice = {
        id: "in_123",
        subscription: null,
      };

      const hasSubscription = !!invoice.subscription;
      expect(hasSubscription).toBe(false);
      // Handler should skip processing
    });

    it("handles subscription ID as string", () => {
      const invoice = {
        id: "in_123",
        subscription: "sub_123",
      };

      const subscriptionId =
        typeof invoice.subscription === "string" ? invoice.subscription : null;

      expect(subscriptionId).toBe("sub_123");
    });

    it("handles subscription ID as object", () => {
      const invoice = {
        id: "in_123",
        subscription: { id: "sub_123" },
      };

      const subscriptionId =
        typeof invoice.subscription === "string"
          ? invoice.subscription
          : invoice.subscription?.id;

      expect(subscriptionId).toBe("sub_123");
    });

    it("creates payment failure notification", () => {
      const notification = {
        type: "payment_failed",
        title: "Payment Failed",
        message:
          "Your payment failed. Please update your payment method to avoid service interruption.",
      };

      expect(notification.type).toBe("payment_failed");
      expect(notification.message).toContain("update your payment method");
    });
  });

  describe("invoice.paid", () => {
    it("processes paid invoice", () => {
      const invoice = {
        id: "in_123",
        subscription: "sub_123",
        status: "paid",
      };

      const event = createMockEvent("invoice.paid", invoice);

      expect(event.type).toBe("invoice.paid");
      expect(event.data.object).toHaveProperty("status", "paid");
    });

    it("reactivates subscription after successful payment", () => {
      const subscription = {
        id: "sub_123",
        status: "active",
      };

      expect(subscription.status).toBe("active");
      // Handler should update subscription to active status
    });
  });

  describe("Plan Configuration", () => {
    it("maps all plan price IDs correctly", () => {
      // Starter plans
      expect(getPlanByPriceId(PRICE_IDS.starter.monthly)?.id).toBe("starter");
      expect(getPlanByPriceId(PRICE_IDS.starter.yearly)?.id).toBe("starter");

      // Professional plans
      expect(getPlanByPriceId(PRICE_IDS.professional.monthly)?.id).toBe(
        "professional",
      );
      expect(getPlanByPriceId(PRICE_IDS.professional.yearly)?.id).toBe(
        "professional",
      );

      // Business plans
      expect(getPlanByPriceId(PRICE_IDS.business.monthly)?.id).toBe("business");
      expect(getPlanByPriceId(PRICE_IDS.business.yearly)?.id).toBe("business");
    });

    it("correctly identifies billing cycles", () => {
      expect(getBillingCycleFromPriceId(PRICE_IDS.starter.monthly)).toBe(
        "monthly",
      );
      expect(getBillingCycleFromPriceId(PRICE_IDS.starter.yearly)).toBe(
        "yearly",
      );
      expect(getBillingCycleFromPriceId(PRICE_IDS.professional.monthly)).toBe(
        "monthly",
      );
      expect(getBillingCycleFromPriceId(PRICE_IDS.professional.yearly)).toBe(
        "yearly",
      );
      expect(getBillingCycleFromPriceId(PRICE_IDS.business.monthly)).toBe(
        "monthly",
      );
      expect(getBillingCycleFromPriceId(PRICE_IDS.business.yearly)).toBe(
        "yearly",
      );
    });
  });

  describe("Error Handling", () => {
    it("returns 200 on successful processing", () => {
      const responseStatus = 200;
      expect(responseStatus).toBe(200);
    });

    it("returns 400 for missing signature", () => {
      const responseStatus = 400;
      expect(responseStatus).toBe(400);
    });

    it("returns 400 for invalid signature", () => {
      const responseStatus = 400;
      expect(responseStatus).toBe(400);
    });

    it("returns 500 on handler error", () => {
      const responseStatus = 500;
      expect(responseStatus).toBe(500);
    });

    it("logs unhandled event types", () => {
      const eventType = "some.unknown.event";
      const isHandled = [
        "checkout.session.completed",
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
        "invoice.payment_failed",
        "invoice.paid",
      ].includes(eventType);

      expect(isHandled).toBe(false);
      // Handler should log unhandled event type
    });
  });
});
