import { NextResponse } from "next/server";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * Resend webhook handler for email delivery events.
 * Events: email.sent, email.delivered, email.bounced, email.complained
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Verify webhook signature in production
    // const signature = request.headers.get("svix-signature");
    // TODO: Verify signature using svix library

    const { type, data } = payload;

    // Extract alert ID from tags if present
    const alertIdTag = data?.tags?.find(
      (t: { name: string; value: string }) => t.name === "alert_id",
    );
    const alertId = alertIdTag?.value as Id<"alerts"> | undefined;

    if (!alertId) {
      // Not an alert email, ignore
      return NextResponse.json({ received: true });
    }

    switch (type) {
      case "email.delivered":
        // Mark alert as delivered
        // Note: This would need an internal mutation exposed via HTTP action
        // For now, we log and acknowledge
        console.log(`Email delivered for alert ${alertId}`);
        break;

      case "email.bounced":
      case "email.complained":
        console.error(`Email ${type} for alert ${alertId}:`, data);
        break;

      default:
        console.log(`Unhandled Resend event: ${type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Resend webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: "Resend webhook endpoint" });
}
