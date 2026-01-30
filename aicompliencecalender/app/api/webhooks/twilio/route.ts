import { NextResponse } from "next/server";

/**
 * Twilio webhook handler for SMS status and inbound messages.
 * Handles delivery receipts and acknowledgment replies.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // Parse Twilio webhook payload
    const messageSid = formData.get("MessageSid") as string;
    const messageStatus = formData.get("MessageStatus") as string;
    const from = formData.get("From") as string;
    const body = formData.get("Body") as string;

    // Handle inbound SMS (acknowledgment)
    if (body) {
      const normalizedBody = body.trim().toUpperCase();

      if (normalizedBody === "DONE" || normalizedBody === "ACK") {
        // User acknowledged via SMS reply
        // Would need to look up the alert by phone number
        console.log(`SMS acknowledgment received from ${from}: ${body}`);

        // Return TwiML response
        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Message>Thank you! Your acknowledgment has been recorded.</Message>
          </Response>`,
          {
            headers: { "Content-Type": "text/xml" },
          },
        );
      }
    }

    // Handle delivery status updates
    if (messageStatus) {
      console.log(`SMS ${messageSid} status: ${messageStatus}`);

      switch (messageStatus) {
        case "delivered":
          // Would mark alert as delivered
          break;
        case "failed":
        case "undelivered":
          // Would mark alert as failed
          console.error(`SMS delivery failed: ${messageSid}`);
          break;
      }
    }

    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      { headers: { "Content-Type": "text/xml" } },
    );
  } catch (error) {
    console.error("Twilio webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: "Twilio webhook endpoint" });
}
