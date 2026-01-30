/**
 * Audit report generation actions.
 */

import { action, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Id } from "./_generated/dataModel";

// Types for internal data
interface Deadline {
  _id: Id<"deadlines">;
  title: string;
  description?: string;
  dueDate: number;
  category: string;
  completedAt?: number;
  completedBy?: string;
  importance?: string;
}

interface Document {
  _id: Id<"documents">;
  fileName: string;
  fileType: string;
  category: string;
  uploadedAt: number;
}

interface AlertLog {
  alertId: Id<"alerts">;
  scheduledFor: number;
  channel: string;
  status: string;
  sentAt?: number;
}

interface ActivityLog {
  action: string;
  timestamp: number;
  userId: string;
  targetTitle?: string;
}

/**
 * Generate an audit report PDF for a specific compliance area.
 */
export const generateAuditReport = action({
  args: {
    orgId: v.id("organizations"),
    complianceArea: v.string(),
    dateRange: v.object({ from: v.number(), to: v.number() }),
  },
  returns: v.string(), // URL to the generated PDF
  handler: async (ctx, args) => {
    // Get organization info
    const org = await ctx.runQuery(internal.auditReports.getOrgInfo, {
      orgId: args.orgId,
    });

    if (!org) {
      throw new Error("Organization not found");
    }

    // Get deadlines for the compliance area
    const deadlines: Deadline[] = await ctx.runQuery(
      internal.auditReports.getDeadlinesByCategory,
      {
        orgId: args.orgId,
        category: args.complianceArea,
        dateRange: args.dateRange,
      },
    );

    // Get related documents
    const documents: Document[] = await ctx.runQuery(
      internal.auditReports.getDocumentsByCategory,
      {
        orgId: args.orgId,
        category: args.complianceArea,
      },
    );

    // Get alert history
    const alertLog: AlertLog[] = await ctx.runQuery(
      internal.auditReports.getAlertLogForDeadlines,
      {
        deadlineIds: deadlines.map((d) => d._id),
      },
    );

    // Get activity history
    const activityLog: ActivityLog[] = await ctx.runQuery(
      internal.auditReports.getActivityForDeadlines,
      {
        orgId: args.orgId,
        dateRange: args.dateRange,
      },
    );

    // Generate the PDF
    const pdfBytes = await generatePdfDocument({
      org,
      complianceArea: args.complianceArea,
      dateRange: args.dateRange,
      deadlines,
      documents,
      alertLog,
      activityLog,
    });

    // Store the PDF - convert to Blob
    const blob = new Blob([new Uint8Array(pdfBytes)], {
      type: "application/pdf",
    });
    const storageId = await ctx.storage.store(blob);
    const url = await ctx.storage.getUrl(storageId);

    if (!url) {
      throw new Error("Failed to generate PDF URL");
    }

    return url;
  },
});

// Internal query to get organization info
export const getOrgInfo = internalQuery({
  args: { orgId: v.id("organizations") },
  returns: v.union(
    v.object({
      _id: v.id("organizations"),
      name: v.string(),
      industry: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, { orgId }) => {
    const org = await ctx.db.get(orgId);
    if (!org) return null;
    return {
      _id: org._id,
      name: org.name,
      industry: org.industry,
    };
  },
});

// Internal query to get deadlines by category
export const getDeadlinesByCategory = internalQuery({
  args: {
    orgId: v.id("organizations"),
    category: v.string(),
    dateRange: v.object({ from: v.number(), to: v.number() }),
  },
  returns: v.array(
    v.object({
      _id: v.id("deadlines"),
      title: v.string(),
      description: v.optional(v.string()),
      dueDate: v.number(),
      category: v.string(),
      completedAt: v.optional(v.number()),
      completedBy: v.optional(v.string()),
      importance: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, { orgId, category, dateRange }) => {
    const deadlines = await ctx.db
      .query("deadlines")
      .withIndex("by_org_category", (q) =>
        q.eq("orgId", orgId).eq("category", category),
      )
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    return deadlines
      .filter((d) => d.dueDate >= dateRange.from && d.dueDate <= dateRange.to)
      .map((d) => ({
        _id: d._id,
        title: d.title,
        description: d.description,
        dueDate: d.dueDate,
        category: d.category,
        completedAt: d.completedAt,
        completedBy: d.completedBy,
        importance: d.importance,
      }));
  },
});

// Internal query to get documents by category
export const getDocumentsByCategory = internalQuery({
  args: {
    orgId: v.id("organizations"),
    category: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("documents"),
      fileName: v.string(),
      fileType: v.string(),
      category: v.string(),
      uploadedAt: v.number(),
    }),
  ),
  handler: async (ctx, { orgId, category }) => {
    // Map compliance areas to document categories
    const categoryMap: Record<string, string> = {
      licenses: "licenses",
      certifications: "certifications",
      training: "training_records",
      training_records: "training_records",
      audit: "audit_reports",
      audit_reports: "audit_reports",
      policies: "policies",
      insurance: "insurance",
      contracts: "contracts",
    };

    const docCategory = categoryMap[category.toLowerCase()] || "other";

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_org_category", (q) =>
        q
          .eq("orgId", orgId)
          .eq(
            "category",
            docCategory as
              | "licenses"
              | "certifications"
              | "training_records"
              | "audit_reports"
              | "policies"
              | "insurance"
              | "contracts"
              | "other",
          ),
      )
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    return documents.map((d) => ({
      _id: d._id,
      fileName: d.fileName,
      fileType: d.fileType,
      category: d.category,
      uploadedAt: d.uploadedAt,
    }));
  },
});

// Internal query to get alert log for deadlines
export const getAlertLogForDeadlines = internalQuery({
  args: {
    deadlineIds: v.array(v.id("deadlines")),
  },
  returns: v.array(
    v.object({
      alertId: v.id("alerts"),
      scheduledFor: v.number(),
      channel: v.string(),
      status: v.string(),
      sentAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, { deadlineIds }) => {
    if (deadlineIds.length === 0) return [];

    const alertLogs: {
      alertId: Id<"alerts">;
      scheduledFor: number;
      channel: string;
      status: string;
      sentAt?: number;
    }[] = [];

    for (const deadlineId of deadlineIds) {
      const alerts = await ctx.db
        .query("alerts")
        .withIndex("by_deadline", (q) => q.eq("deadlineId", deadlineId))
        .collect();

      for (const alert of alerts) {
        alertLogs.push({
          alertId: alert._id,
          scheduledFor: alert.scheduledFor,
          channel: alert.channel,
          status: alert.status,
          sentAt: alert.sentAt,
        });
      }
    }

    return alertLogs.sort((a, b) => a.scheduledFor - b.scheduledFor);
  },
});

// Internal query to get activity log
export const getActivityForDeadlines = internalQuery({
  args: {
    orgId: v.id("organizations"),
    dateRange: v.object({ from: v.number(), to: v.number() }),
  },
  returns: v.array(
    v.object({
      action: v.string(),
      timestamp: v.number(),
      userId: v.string(),
      targetTitle: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, { orgId, dateRange }) => {
    const activities = await ctx.db
      .query("activity_log")
      .withIndex("by_org_timestamp", (q) => q.eq("orgId", orgId))
      .collect();

    return activities
      .filter(
        (a) => a.timestamp >= dateRange.from && a.timestamp <= dateRange.to,
      )
      .filter((a) => a.targetType === "deadline")
      .map((a) => ({
        action: a.action,
        timestamp: a.timestamp,
        userId: a.userId,
        targetTitle: a.targetTitle,
      }))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 100);
  },
});

// PDF generation function using pdf-lib
async function generatePdfDocument(data: {
  org: { name: string; industry: string };
  complianceArea: string;
  dateRange: { from: number; to: number };
  deadlines: Deadline[];
  documents: Document[];
  alertLog: AlertLog[];
  activityLog: ActivityLog[];
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595; // A4
  const pageHeight = 842;
  const margin = 50;
  const lineHeight = 16;

  // Helper function to add a new page
  const addPage = () => {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    return page;
  };

  // Helper function to format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Helper function to draw text with wrapping
  const drawText = (
    page: ReturnType<typeof pdfDoc.addPage>,
    text: string,
    x: number,
    y: number,
    options: {
      size?: number;
      font?: typeof font;
      color?: ReturnType<typeof rgb>;
      maxWidth?: number;
    } = {},
  ) => {
    const size = options.size || 10;
    const textFont = options.font || font;
    const color = options.color || rgb(0, 0, 0);

    page.drawText(text, {
      x,
      y,
      size,
      font: textFont,
      color,
    });
  };

  // === COVER PAGE ===
  let page = addPage();
  let yPos = pageHeight - 150;

  drawText(page, "COMPLIANCE AUDIT REPORT", margin, yPos, {
    size: 24,
    font: boldFont,
    color: rgb(0.1, 0.2, 0.4),
  });

  yPos -= 40;
  drawText(page, data.complianceArea.toUpperCase(), margin, yPos, {
    size: 18,
    font: boldFont,
    color: rgb(0.3, 0.3, 0.3),
  });

  yPos -= 60;
  drawText(page, `Organization: ${data.org.name}`, margin, yPos, {
    size: 12,
    font: font,
  });

  yPos -= 20;
  drawText(page, `Industry: ${data.org.industry}`, margin, yPos, {
    size: 12,
    font: font,
  });

  yPos -= 20;
  drawText(
    page,
    `Report Period: ${formatDate(data.dateRange.from)} - ${formatDate(data.dateRange.to)}`,
    margin,
    yPos,
    { size: 12, font: font },
  );

  yPos -= 20;
  drawText(page, `Generated: ${formatDate(Date.now())}`, margin, yPos, {
    size: 12,
    font: font,
  });

  // === TABLE OF CONTENTS ===
  page = addPage();
  yPos = pageHeight - 80;

  drawText(page, "Table of Contents", margin, yPos, {
    size: 16,
    font: boldFont,
  });

  yPos -= 40;
  const tocItems = [
    "1. Executive Summary",
    "2. Deadline Compliance History",
    "3. Documentation Inventory",
    "4. Alert Delivery Log",
    "5. Activity Timeline",
  ];

  for (const item of tocItems) {
    drawText(page, item, margin + 20, yPos, { size: 12 });
    yPos -= lineHeight * 1.5;
  }

  // === EXECUTIVE SUMMARY ===
  page = addPage();
  yPos = pageHeight - 80;

  drawText(page, "1. Executive Summary", margin, yPos, {
    size: 14,
    font: boldFont,
    color: rgb(0.1, 0.2, 0.4),
  });

  yPos -= 40;

  // Calculate stats
  const totalDeadlines = data.deadlines.length;
  const completedOnTime = data.deadlines.filter(
    (d) => d.completedAt && d.completedAt <= d.dueDate,
  ).length;
  const completedLate = data.deadlines.filter(
    (d) => d.completedAt && d.completedAt > d.dueDate,
  ).length;
  const pending = data.deadlines.filter((d) => !d.completedAt).length;
  const onTimeRate =
    totalDeadlines > 0
      ? Math.round((completedOnTime / totalDeadlines) * 100)
      : 0;

  const stats = [
    `Total Requirements: ${totalDeadlines}`,
    `Completed On-Time: ${completedOnTime}`,
    `Completed Late: ${completedLate}`,
    `Pending: ${pending}`,
    `On-Time Compliance Rate: ${onTimeRate}%`,
    `Documents on File: ${data.documents.length}`,
    `Alerts Sent: ${data.alertLog.filter((a) => a.status === "sent" || a.status === "delivered").length}`,
  ];

  for (const stat of stats) {
    drawText(page, stat, margin + 20, yPos, { size: 11 });
    yPos -= lineHeight * 1.2;
  }

  // === DEADLINE COMPLIANCE HISTORY ===
  page = addPage();
  yPos = pageHeight - 80;

  drawText(page, "2. Deadline Compliance History", margin, yPos, {
    size: 14,
    font: boldFont,
    color: rgb(0.1, 0.2, 0.4),
  });

  yPos -= 30;

  // Table headers
  drawText(page, "Title", margin, yPos, { size: 10, font: boldFont });
  drawText(page, "Due Date", margin + 200, yPos, { size: 10, font: boldFont });
  drawText(page, "Completed", margin + 300, yPos, { size: 10, font: boldFont });
  drawText(page, "Status", margin + 400, yPos, { size: 10, font: boldFont });

  yPos -= 5;
  page.drawLine({
    start: { x: margin, y: yPos },
    end: { x: pageWidth - margin, y: yPos },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });

  yPos -= lineHeight;

  for (const deadline of data.deadlines.slice(0, 30)) {
    // Limit to 30 items per page
    if (yPos < margin + 50) {
      page = addPage();
      yPos = pageHeight - 80;
    }

    const title =
      deadline.title.length > 30
        ? deadline.title.substring(0, 27) + "..."
        : deadline.title;
    const dueDate = formatDate(deadline.dueDate);
    const completedDate = deadline.completedAt
      ? formatDate(deadline.completedAt)
      : "Pending";
    const status = deadline.completedAt
      ? deadline.completedAt <= deadline.dueDate
        ? "On Time"
        : "Late"
      : new Date(deadline.dueDate) < new Date()
        ? "Overdue"
        : "Upcoming";

    drawText(page, title, margin, yPos, { size: 9 });
    drawText(page, dueDate, margin + 200, yPos, { size: 9 });
    drawText(page, completedDate, margin + 300, yPos, { size: 9 });
    drawText(page, status, margin + 400, yPos, {
      size: 9,
      color:
        status === "On Time"
          ? rgb(0, 0.5, 0)
          : status === "Late" || status === "Overdue"
            ? rgb(0.8, 0, 0)
            : rgb(0.3, 0.3, 0.3),
    });

    yPos -= lineHeight;
  }

  // === DOCUMENTATION INVENTORY ===
  page = addPage();
  yPos = pageHeight - 80;

  drawText(page, "3. Documentation Inventory", margin, yPos, {
    size: 14,
    font: boldFont,
    color: rgb(0.1, 0.2, 0.4),
  });

  yPos -= 30;

  if (data.documents.length === 0) {
    drawText(
      page,
      "No documents found for this compliance area.",
      margin + 20,
      yPos,
      { size: 11, color: rgb(0.5, 0.5, 0.5) },
    );
  } else {
    drawText(page, "File Name", margin, yPos, { size: 10, font: boldFont });
    drawText(page, "Type", margin + 250, yPos, { size: 10, font: boldFont });
    drawText(page, "Uploaded", margin + 350, yPos, {
      size: 10,
      font: boldFont,
    });

    yPos -= 5;
    page.drawLine({
      start: { x: margin, y: yPos },
      end: { x: pageWidth - margin, y: yPos },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });

    yPos -= lineHeight;

    for (const doc of data.documents.slice(0, 25)) {
      if (yPos < margin + 50) {
        page = addPage();
        yPos = pageHeight - 80;
      }

      const fileName =
        doc.fileName.length > 40
          ? doc.fileName.substring(0, 37) + "..."
          : doc.fileName;

      drawText(page, fileName, margin, yPos, { size: 9 });
      drawText(page, doc.fileType, margin + 250, yPos, { size: 9 });
      drawText(page, formatDate(doc.uploadedAt), margin + 350, yPos, {
        size: 9,
      });

      yPos -= lineHeight;
    }
  }

  // === ALERT DELIVERY LOG ===
  page = addPage();
  yPos = pageHeight - 80;

  drawText(page, "4. Alert Delivery Log", margin, yPos, {
    size: 14,
    font: boldFont,
    color: rgb(0.1, 0.2, 0.4),
  });

  yPos -= 30;

  if (data.alertLog.length === 0) {
    drawText(page, "No alerts found for this period.", margin + 20, yPos, {
      size: 11,
      color: rgb(0.5, 0.5, 0.5),
    });
  } else {
    drawText(page, "Scheduled", margin, yPos, { size: 10, font: boldFont });
    drawText(page, "Channel", margin + 150, yPos, { size: 10, font: boldFont });
    drawText(page, "Status", margin + 250, yPos, { size: 10, font: boldFont });
    drawText(page, "Sent At", margin + 350, yPos, { size: 10, font: boldFont });

    yPos -= 5;
    page.drawLine({
      start: { x: margin, y: yPos },
      end: { x: pageWidth - margin, y: yPos },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });

    yPos -= lineHeight;

    for (const alert of data.alertLog.slice(0, 30)) {
      if (yPos < margin + 50) {
        page = addPage();
        yPos = pageHeight - 80;
      }

      drawText(page, formatDate(alert.scheduledFor), margin, yPos, { size: 9 });
      drawText(page, alert.channel, margin + 150, yPos, { size: 9 });
      drawText(page, alert.status, margin + 250, yPos, {
        size: 9,
        color:
          alert.status === "delivered"
            ? rgb(0, 0.5, 0)
            : alert.status === "failed"
              ? rgb(0.8, 0, 0)
              : rgb(0.3, 0.3, 0.3),
      });
      drawText(
        page,
        alert.sentAt ? formatDate(alert.sentAt) : "-",
        margin + 350,
        yPos,
        { size: 9 },
      );

      yPos -= lineHeight;
    }
  }

  // === ACTIVITY TIMELINE ===
  page = addPage();
  yPos = pageHeight - 80;

  drawText(page, "5. Activity Timeline", margin, yPos, {
    size: 14,
    font: boldFont,
    color: rgb(0.1, 0.2, 0.4),
  });

  yPos -= 30;

  if (data.activityLog.length === 0) {
    drawText(page, "No activity recorded for this period.", margin + 20, yPos, {
      size: 11,
      color: rgb(0.5, 0.5, 0.5),
    });
  } else {
    for (const activity of data.activityLog.slice(0, 40)) {
      if (yPos < margin + 50) {
        page = addPage();
        yPos = pageHeight - 80;
      }

      const actionText = activity.action.replace(/_/g, " ");
      const targetText = activity.targetTitle || "";
      const timestamp = new Date(activity.timestamp).toLocaleString("en-US", {
        dateStyle: "short",
        timeStyle: "short",
      });

      drawText(
        page,
        `${timestamp} - ${actionText}: ${targetText}`,
        margin,
        yPos,
        {
          size: 9,
        },
      );

      yPos -= lineHeight;
    }
  }

  // === FOOTER ON ALL PAGES ===
  const pages = pdfDoc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const currentPage = pages[i];
    currentPage.drawText(`Page ${i + 1} of ${pages.length}`, {
      x: pageWidth / 2 - 30,
      y: 30,
      size: 9,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });

    currentPage.drawText("Confidential - Generated by AI Compliance Calendar", {
      x: margin,
      y: 30,
      size: 8,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  return await pdfDoc.save();
}
