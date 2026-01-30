/**
 * Deadline Alert Email Template
 * Renders urgency-aware emails for deadline notifications
 */

import type { AlertUrgency } from "@/types/alert";

export interface DeadlineAlertEmailProps {
  deadlineTitle: string;
  dueDate: string; // formatted date string
  daysRemaining: number;
  urgency: AlertUrgency;
  deadlineUrl: string;
  organizationName: string;
  category?: string;
  description?: string;
}

const urgencyConfig: Record<
  AlertUrgency,
  { bgColor: string; textColor: string; label: string; emoji: string }
> = {
  critical: {
    bgColor: "#DC2626",
    textColor: "#ffffff",
    label: "OVERDUE",
    emoji: "⚠️",
  },
  high: {
    bgColor: "#F59E0B",
    textColor: "#000000",
    label: "DUE SOON",
    emoji: "🔴",
  },
  medium: {
    bgColor: "#3B82F6",
    textColor: "#ffffff",
    label: "UPCOMING",
    emoji: "🟡",
  },
  early: {
    bgColor: "#6B7280",
    textColor: "#ffffff",
    label: "REMINDER",
    emoji: "📅",
  },
};

/**
 * Generate the subject line based on urgency
 */
export function getEmailSubject(
  urgency: AlertUrgency,
  deadlineTitle: string,
  daysRemaining: number,
): string {
  switch (urgency) {
    case "critical":
      return `⚠️ OVERDUE: ${deadlineTitle} - Action Required`;
    case "high":
      return `🔴 Due Tomorrow: ${deadlineTitle}`;
    case "medium":
      return `🟡 Due in ${daysRemaining} days: ${deadlineTitle}`;
    case "early":
    default:
      return `📅 Reminder: ${deadlineTitle} due in ${daysRemaining} days`;
  }
}

/**
 * Render the deadline alert email to HTML
 */
export function renderDeadlineAlertEmail(
  props: DeadlineAlertEmailProps,
): string {
  const {
    deadlineTitle,
    dueDate,
    daysRemaining,
    urgency,
    deadlineUrl,
    organizationName,
    category,
    description,
  } = props;

  const config = urgencyConfig[urgency];
  const daysText =
    daysRemaining === 0
      ? "Due today"
      : daysRemaining < 0
        ? `${Math.abs(daysRemaining)} days overdue`
        : daysRemaining === 1
          ? "Due tomorrow"
          : `Due in ${daysRemaining} days`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.emoji} ${deadlineTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">

          <!-- Urgency Banner -->
          <tr>
            <td style="background-color: ${config.bgColor}; padding: 16px 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="color: ${config.textColor}; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                    ${config.emoji} ${config.label}
                  </td>
                  <td style="color: ${config.textColor}; font-size: 14px; text-align: right;">
                    ${daysText}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 24px;">
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #111827;">
                ${deadlineTitle}
              </h1>

              ${description ? `<p style="margin: 0 0 24px 0; font-size: 16px; color: #6b7280; line-height: 1.5;">${description}</p>` : ""}

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 16px; background-color: #f9fafb; border-radius: 6px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding-right: 32px;">
                          <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Due Date</div>
                          <div style="font-size: 16px; font-weight: 600; color: #111827;">${dueDate}</div>
                        </td>
                        ${
                          category
                            ? `
                        <td>
                          <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Category</div>
                          <div style="font-size: 16px; font-weight: 600; color: #111827;">${category}</div>
                        </td>
                        `
                            : ""
                        }
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="border-radius: 6px; background-color: #2563eb;">
                    <a href="${deadlineUrl}" target="_blank" style="display: inline-block; padding: 12px 24px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none;">
                      View Deadline
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 14px; color: #6b7280; text-align: center;">
                This alert was sent by AI Compliance Calendar for ${organizationName}.
              </p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #9ca3af; text-align: center;">
                <a href="${deadlineUrl.replace(/\/deadlines\/.*/, "/settings/alerts")}" style="color: #6b7280;">Manage alert preferences</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of the email
 */
export function renderDeadlineAlertPlainText(
  props: DeadlineAlertEmailProps,
): string {
  const {
    deadlineTitle,
    dueDate,
    daysRemaining,
    urgency,
    deadlineUrl,
    organizationName,
    category,
    description,
  } = props;

  const config = urgencyConfig[urgency];
  const daysText =
    daysRemaining === 0
      ? "Due today"
      : daysRemaining < 0
        ? `${Math.abs(daysRemaining)} days overdue`
        : daysRemaining === 1
          ? "Due tomorrow"
          : `Due in ${daysRemaining} days`;

  const lines = [
    `${config.emoji} ${config.label}: ${deadlineTitle}`,
    "",
    daysText,
    "",
    `Due Date: ${dueDate}`,
  ];

  if (category) {
    lines.push(`Category: ${category}`);
  }

  if (description) {
    lines.push("", description);
  }

  lines.push(
    "",
    "---",
    "",
    `View deadline: ${deadlineUrl}`,
    "",
    `This alert was sent by AI Compliance Calendar for ${organizationName}.`,
  );

  return lines.join("\n");
}
