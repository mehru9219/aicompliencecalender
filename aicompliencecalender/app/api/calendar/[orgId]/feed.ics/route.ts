import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { generateICalFeed, generateICalFilename } from "@/lib/calendar/ical";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Cache for 15 minutes
const CACHE_MAX_AGE = 60 * 15;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await params;

    // TODO: Add authentication/API key validation
    // For now, we validate the orgId format
    if (!orgId || orgId.length < 10) {
      return NextResponse.json(
        { error: "Invalid organization ID" },
        { status: 400 },
      );
    }

    // Parse query params for optional filtering
    const searchParams = request.nextUrl.searchParams;
    const includeCompleted = searchParams.get("includeCompleted") !== "false";

    // Fetch deadlines from Convex
    const deadlines = await convex.query(api.calendar.listForCalendar, {
      orgId: orgId as Id<"organizations">,
      includeCompleted,
    });

    // Generate iCal content
    const icalContent = generateICalFeed(deadlines, {
      calendarName: "Compliance Deadlines",
      organizationName: "AI Compliance Calendar",
    });

    // Generate filename
    const filename = generateICalFilename();

    // Return iCal response with proper headers
    return new NextResponse(icalContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": `public, max-age=${CACHE_MAX_AGE}, stale-while-revalidate=${CACHE_MAX_AGE * 2}`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Error generating iCal feed:", error);
    return NextResponse.json(
      { error: "Failed to generate calendar feed" },
      { status: 500 },
    );
  }
}
