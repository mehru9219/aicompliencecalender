"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  ALERT_CHANNELS,
  ALERT_URGENCIES,
  DEFAULT_ALERT_PREFERENCES,
} from "@/types/alert";
import type { AlertChannel, AlertUrgency } from "@/types/alert";

interface AlertPreferencesFormProps {
  orgId: Id<"organizations">;
  userId?: string;
  onSave?: () => void;
}

const CHANNEL_OPTIONS: AlertChannel[] = ["email", "sms", "in_app"];
const URGENCY_LEVELS: AlertUrgency[] = ["early", "medium", "high", "critical"];
const DEFAULT_ALERT_DAYS = [30, 14, 7, 3, 1, 0];

export function AlertPreferencesForm({
  orgId,
  userId,
  onSave,
}: AlertPreferencesFormProps) {
  const existingPrefs = useQuery(api.alerts.getPreferences, { orgId, userId });
  const savePreferences = useMutation(api.alerts.savePreferences);

  const [channels, setChannels] = useState<Record<AlertUrgency, string[]>>({
    early: DEFAULT_ALERT_PREFERENCES.earlyChannels,
    medium: DEFAULT_ALERT_PREFERENCES.mediumChannels,
    high: DEFAULT_ALERT_PREFERENCES.highChannels,
    critical: DEFAULT_ALERT_PREFERENCES.criticalChannels,
  });

  const [alertDays, setAlertDays] = useState<number[]>(DEFAULT_ALERT_DAYS);
  const [escalationEnabled, setEscalationEnabled] = useState(true);
  const [escalationContacts, setEscalationContacts] = useState<string[]>([]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emailOverride, setEmailOverride] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (existingPrefs) {
      setChannels({
        early: existingPrefs.earlyChannels,
        medium: existingPrefs.mediumChannels,
        high: existingPrefs.highChannels,
        critical: existingPrefs.criticalChannels,
      });
      setAlertDays(existingPrefs.alertDays);
      setEscalationEnabled(existingPrefs.escalationEnabled);
      setEscalationContacts(existingPrefs.escalationContacts);
      setPhoneNumber(existingPrefs.phoneNumber ?? "");
      setEmailOverride(existingPrefs.emailOverride ?? "");
    }
  }, [existingPrefs]);

  const toggleChannel = (urgency: AlertUrgency, channel: string) => {
    setChannels((prev) => {
      const current = prev[urgency];
      const updated = current.includes(channel)
        ? current.filter((c) => c !== channel)
        : [...current, channel];
      return { ...prev, [urgency]: updated };
    });
  };

  const toggleAlertDay = (day: number) => {
    setAlertDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day].sort((a, b) => b - a),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await savePreferences({
        orgId,
        userId,
        earlyChannels: channels.early,
        mediumChannels: channels.medium,
        highChannels: channels.high,
        criticalChannels: channels.critical,
        alertDays,
        escalationEnabled,
        escalationContacts,
        phoneNumber: phoneNumber || undefined,
        emailOverride: emailOverride || undefined,
      });
      onSave?.();
    } catch (error) {
      console.error("Failed to save preferences:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Channel Preferences by Urgency */}
      <div>
        <h3 className="text-lg font-medium text-foreground mb-4">
          Notification Channels by Urgency
        </h3>
        <div className="space-y-4">
          {URGENCY_LEVELS.map((urgency) => (
            <div
              key={urgency}
              className="border border-border rounded-lg p-4"
            >
              <div className="font-medium text-foreground mb-2">
                {ALERT_URGENCIES[urgency]}
              </div>
              <div className="flex flex-wrap gap-2">
                {CHANNEL_OPTIONS.map((channel) => (
                  <label key={channel} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={channels[urgency].includes(channel)}
                      onChange={() => toggleChannel(urgency, channel)}
                      className="rounded border-input text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-muted-foreground">
                      {ALERT_CHANNELS[channel]}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alert Days */}
      <div>
        <h3 className="text-lg font-medium text-foreground mb-4">
          Alert Schedule (Days Before Deadline)
        </h3>
        <div className="flex flex-wrap gap-2">
          {[30, 14, 7, 3, 1, 0].map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleAlertDay(day)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                alertDays.includes(day)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {day === 0 ? "Due Date" : `${day} days`}
            </button>
          ))}
        </div>
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Phone Number (for SMS)
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1234567890"
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Email Override (optional)
          </label>
          <input
            type="email"
            value={emailOverride}
            onChange={(e) => setEmailOverride(e.target.value)}
            placeholder="alerts@example.com"
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Escalation */}
      <div>
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="escalation"
            checked={escalationEnabled}
            onChange={(e) => setEscalationEnabled(e.target.checked)}
            className="rounded border-input text-primary focus:ring-primary"
          />
          <label
            htmlFor="escalation"
            className="ml-2 text-sm font-medium text-foreground"
          >
            Enable escalation for failed alerts
          </label>
        </div>
        {escalationEnabled && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Escalation Contacts (user IDs, one per line)
            </label>
            <textarea
              value={escalationContacts.join("\n")}
              onChange={(e) =>
                setEscalationContacts(
                  e.target.value.split("\n").filter((s) => s.trim()),
                )
              }
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="user_id_1&#10;user_id_2"
            />
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </form>
  );
}
