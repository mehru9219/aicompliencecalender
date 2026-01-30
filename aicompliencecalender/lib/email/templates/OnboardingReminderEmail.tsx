/**
 * Onboarding reminder email template.
 * Uses React Email for rendering.
 */

import * as React from "react";

interface OnboardingReminderEmailProps {
  userName: string;
  orgName: string;
  nextStepTitle: string;
  completedSteps: number;
  totalSteps: number;
  reminderType: "24h" | "7d";
  continueUrl: string;
}

// Simple inline styles for email compatibility
const styles = {
  container: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    maxWidth: "600px",
    margin: "0 auto",
    padding: "40px 20px",
    backgroundColor: "#ffffff",
  },
  header: {
    textAlign: "center" as const,
    marginBottom: "32px",
  },
  logo: {
    fontSize: "24px",
    fontWeight: 700,
    color: "#1a1a1a",
    marginBottom: "8px",
  },
  greeting: {
    fontSize: "18px",
    color: "#1a1a1a",
    marginBottom: "16px",
  },
  body: {
    fontSize: "16px",
    lineHeight: 1.6,
    color: "#4a4a4a",
    marginBottom: "24px",
  },
  progressContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
    padding: "20px",
    marginBottom: "24px",
    textAlign: "center" as const,
  },
  progressBar: {
    height: "8px",
    backgroundColor: "#e0e0e0",
    borderRadius: "4px",
    overflow: "hidden",
    marginBottom: "12px",
  },
  progressFill: (percentage: number) => ({
    height: "100%",
    width: `${percentage}%`,
    backgroundColor: "#22c55e",
    borderRadius: "4px",
  }),
  progressText: {
    fontSize: "14px",
    color: "#6b7280",
  },
  nextStep: {
    backgroundColor: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "24px",
  },
  nextStepLabel: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#3b82f6",
    textTransform: "uppercase" as const,
    marginBottom: "4px",
  },
  nextStepTitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#1e40af",
  },
  button: {
    display: "inline-block",
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    padding: "14px 28px",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: "16px",
  },
  buttonContainer: {
    textAlign: "center" as const,
    marginBottom: "32px",
  },
  footer: {
    borderTop: "1px solid #e5e7eb",
    paddingTop: "24px",
    fontSize: "14px",
    color: "#9ca3af",
    textAlign: "center" as const,
  },
  footerLink: {
    color: "#6b7280",
    textDecoration: "underline",
  },
};

export function OnboardingReminderEmail({
  userName,
  orgName,
  nextStepTitle,
  completedSteps,
  totalSteps,
  reminderType,
  continueUrl,
}: OnboardingReminderEmailProps) {
  const percentage = Math.round((completedSteps / totalSteps) * 100);

  const subject =
    reminderType === "24h"
      ? `Complete your ${orgName} compliance setup`
      : `Your compliance calendar is waiting`;

  const bodyText =
    reminderType === "24h"
      ? `You're making great progress setting up ${orgName}'s compliance calendar. Let's finish what we started!`
      : `We noticed you haven't completed your compliance setup for ${orgName}. Your calendar is ready and waiting - just a few more steps to go.`;

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{subject}</title>
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: "#f4f4f5" }}>
        <div style={styles.container}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.logo}>Compliance Calendar</div>
          </div>

          {/* Greeting */}
          <p style={styles.greeting}>Hi {userName},</p>

          {/* Body text */}
          <p style={styles.body}>{bodyText}</p>

          {/* Progress indicator */}
          <div style={styles.progressContainer}>
            <div style={styles.progressBar}>
              <div style={styles.progressFill(percentage)} />
            </div>
            <p style={styles.progressText}>
              You&apos;ve completed {completedSteps} of {totalSteps} steps
            </p>
          </div>

          {/* Next step */}
          <div style={styles.nextStep}>
            <p style={styles.nextStepLabel}>Your next step</p>
            <p style={styles.nextStepTitle}>{nextStepTitle}</p>
          </div>

          {/* CTA Button */}
          <div style={styles.buttonContainer}>
            <a href={continueUrl} style={styles.button}>
              Continue Setup
            </a>
          </div>

          {/* Footer */}
          <div style={styles.footer}>
            <p>
              This email was sent because you started setting up a compliance
              calendar for {orgName}. If you don&apos;t want to receive these
              reminders, you can{" "}
              <a href={`${continueUrl}/unsubscribe`} style={styles.footerLink}>
                unsubscribe
              </a>
              .
            </p>
            <p style={{ marginTop: "16px" }}>
              &copy; {new Date().getFullYear()} Compliance Calendar. All rights
              reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}

// Plain text version for email clients that don't support HTML
export function getPlainTextVersion({
  userName,
  orgName,
  nextStepTitle,
  completedSteps,
  totalSteps,
  reminderType,
  continueUrl,
}: OnboardingReminderEmailProps): string {
  const progress = `${completedSteps}/${totalSteps} steps complete`;

  if (reminderType === "24h") {
    return `
Hi ${userName},

You're making great progress setting up ${orgName}'s compliance calendar. Let's finish what we started!

Progress: ${progress}

Your next step: ${nextStepTitle}

Continue setup: ${continueUrl}

---
This email was sent because you started setting up a compliance calendar for ${orgName}.
    `.trim();
  }

  return `
Hi ${userName},

We noticed you haven't completed your compliance setup for ${orgName}. Your calendar is ready and waiting - just a few more steps to go.

Progress: ${progress}

Your next step: ${nextStepTitle}

Continue setup: ${continueUrl}

---
This email was sent because you started setting up a compliance calendar for ${orgName}.
  `.trim();
}

// Export subject line generator
export function getSubjectLine(
  orgName: string,
  reminderType: "24h" | "7d",
): string {
  return reminderType === "24h"
    ? `Complete your ${orgName} compliance setup`
    : `Your compliance calendar is waiting`;
}
