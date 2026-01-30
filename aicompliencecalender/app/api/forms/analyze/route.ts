import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * POST /api/forms/analyze
 * Analyze a PDF form to extract fields and match to org profile.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orgId, storageId, fileName } = body;

    if (!orgId || !storageId || !fileName) {
      return NextResponse.json(
        { error: "Missing required fields: orgId, storageId, fileName" },
        { status: 400 },
      );
    }

    // Call the Convex action to analyze the form
    const result = await convex.action(api.forms.analyzeForm, {
      orgId: orgId as Id<"organizations">,
      storageId: storageId as Id<"_storage">,
      fileName,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Form analysis error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Analysis failed",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: "Form analysis endpoint" });
}
