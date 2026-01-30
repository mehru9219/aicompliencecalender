/**
 * Trial expiry warning email template.
 */

import * as React from "react";

interface TrialWarningEmailProps {
  userName: string;
  orgName: string;
  daysRemaining: number;
  upgradeUrl: string;
}

export function TrialWarningEmail({
  userName,
  orgName,
  daysRemaining,
  upgradeUrl,
}: TrialWarningEmailProps) {
  const urgencyColor =
    daysRemaining <= 1 ? "#dc2626" : daysRemaining <= 3 ? "#f59e0b" : "#3b82f6";
  const urgencyText =
    daysRemaining === 0
      ? "expires today"
      : daysRemaining === 1
        ? "expires tomorrow"
        : `expires in ${daysRemaining} days`;

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Your trial {urgencyText}</title>
      </head>
      <body
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          backgroundColor: "#f4f4f5",
          margin: 0,
          padding: "40px 20px",
        }}
      >
        <table
          cellPadding="0"
          cellSpacing="0"
          style={{
            maxWidth: "560px",
            margin: "0 auto",
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* Header */}
          <tr>
            <td
              style={{
                backgroundColor: urgencyColor,
                padding: "24px 32px",
                textAlign: "center",
              }}
            >
              <h1
                style={{
                  color: "#ffffff",
                  fontSize: "24px",
                  fontWeight: "600",
                  margin: 0,
                }}
              >
                ⏰ Your Trial{" "}
                {urgencyText.charAt(0).toUpperCase() + urgencyText.slice(1)}
              </h1>
            </td>
          </tr>

          {/* Content */}
          <tr>
            <td style={{ padding: "32px" }}>
              <p
                style={{
                  color: "#18181b",
                  fontSize: "16px",
                  lineHeight: "24px",
                  margin: "0 0 16px",
                }}
              >
                Hi {userName},
              </p>

              <p
                style={{
                  color: "#3f3f46",
                  fontSize: "16px",
                  lineHeight: "24px",
                  margin: "0 0 24px",
                }}
              >
                Your free trial for <strong>{orgName}</strong> on Compliance
                Calendar {urgencyText}.
                {daysRemaining <= 3
                  ? " Don't lose access to your compliance tracking!"
                  : " Upgrade now to continue tracking your compliance deadlines."}
              </p>

              {/* Features reminder */}
              <div
                style={{
                  backgroundColor: "#f4f4f5",
                  borderRadius: "8px",
                  padding: "20px",
                  marginBottom: "24px",
                }}
              >
                <p
                  style={{
                    color: "#18181b",
                    fontSize: "14px",
                    fontWeight: "600",
                    margin: "0 0 12px",
                  }}
                >
                  With a paid plan, you&apos;ll keep:
                </p>
                <ul
                  style={{
                    color: "#3f3f46",
                    fontSize: "14px",
                    lineHeight: "22px",
                    margin: 0,
                    paddingLeft: "20px",
                  }}
                >
                  <li>All your compliance deadlines and documents</li>
                  <li>Email and SMS alert reminders</li>
                  <li>AI-powered form pre-fill</li>
                  <li>Team collaboration features</li>
                </ul>
              </div>

              {/* CTA Button */}
              <table cellPadding="0" cellSpacing="0" style={{ width: "100%" }}>
                <tr>
                  <td style={{ textAlign: "center", paddingBottom: "24px" }}>
                    <a
                      href={upgradeUrl}
                      style={{
                        display: "inline-block",
                        backgroundColor: "#2563eb",
                        color: "#ffffff",
                        fontSize: "16px",
                        fontWeight: "600",
                        textDecoration: "none",
                        padding: "14px 32px",
                        borderRadius: "8px",
                      }}
                    >
                      Upgrade Now →
                    </a>
                  </td>
                </tr>
              </table>

              <p
                style={{
                  color: "#71717a",
                  fontSize: "14px",
                  lineHeight: "22px",
                  margin: 0,
                  textAlign: "center",
                }}
              >
                Questions? Reply to this email and we&apos;ll help you out.
              </p>
            </td>
          </tr>

          {/* Footer */}
          <tr>
            <td
              style={{
                backgroundColor: "#f4f4f5",
                padding: "20px 32px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  color: "#71717a",
                  fontSize: "12px",
                  lineHeight: "18px",
                  margin: 0,
                }}
              >
                Compliance Calendar • Never miss a deadline
                <br />
                <a
                  href={`${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications`}
                  style={{ color: "#71717a" }}
                >
                  Manage email preferences
                </a>
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
}

export default TrialWarningEmail;
