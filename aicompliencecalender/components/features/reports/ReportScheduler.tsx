/**
 * Component for scheduling automatic report delivery.
 */

"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Clock, Mail, Plus, X } from "lucide-react";
import { toast } from "sonner";

interface ReportSchedulerProps {
  reportId: Id<"saved_reports">;
  currentSchedule?: {
    frequency: string;
    recipients: string[];
    dayOfWeek?: number;
    dayOfMonth?: number;
    hour?: number;
  };
  onScheduleUpdate?: () => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${i.toString().padStart(2, "0")}:00`,
}));

export function ReportScheduler({
  reportId,
  currentSchedule,
  onScheduleUpdate,
}: ReportSchedulerProps) {
  const [open, setOpen] = useState(false);
  const [frequency, setFrequency] = useState<string>(
    currentSchedule?.frequency || "weekly",
  );
  const [recipients, setRecipients] = useState<string[]>(
    currentSchedule?.recipients || [],
  );
  const [newEmail, setNewEmail] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState<number>(
    currentSchedule?.dayOfWeek ?? 1,
  );
  const [dayOfMonth, setDayOfMonth] = useState<number>(
    currentSchedule?.dayOfMonth ?? 1,
  );
  const [hour, setHour] = useState<number>(currentSchedule?.hour ?? 9);

  const updateSchedule = useMutation(api.reports.updateReportSchedule);

  const addRecipient = () => {
    if (!newEmail.trim()) return;
    if (!newEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (recipients.includes(newEmail.trim())) {
      toast.error("Email already added");
      return;
    }
    setRecipients([...recipients, newEmail.trim()]);
    setNewEmail("");
  };

  const removeRecipient = (email: string) => {
    setRecipients(recipients.filter((r) => r !== email));
  };

  const handleSave = async () => {
    if (recipients.length === 0) {
      toast.error("Please add at least one recipient");
      return;
    }

    try {
      await updateSchedule({
        reportId,
        schedule: {
          frequency: frequency as "daily" | "weekly" | "monthly",
          recipients,
          dayOfWeek: frequency === "weekly" ? dayOfWeek : undefined,
          dayOfMonth: frequency === "monthly" ? dayOfMonth : undefined,
          hour,
        },
      });
      toast.success("Schedule updated successfully");
      setOpen(false);
      onScheduleUpdate?.();
    } catch {
      toast.error("Failed to update schedule");
    }
  };

  const handleRemoveSchedule = async () => {
    try {
      await updateSchedule({
        reportId,
        schedule: undefined,
      });
      toast.success("Schedule removed");
      setOpen(false);
      onScheduleUpdate?.();
    } catch {
      toast.error("Failed to remove schedule");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Clock className="mr-2 h-4 w-4" />
          {currentSchedule ? "Edit Schedule" : "Schedule"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Schedule Report
          </DialogTitle>
          <DialogDescription>
            Configure automatic report delivery to your team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Frequency */}
          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Day of Week (for weekly) */}
          {frequency === "weekly" && (
            <div className="space-y-2">
              <Label>Day of Week</Label>
              <Select
                value={dayOfWeek.toString()}
                onValueChange={(val) => setDayOfWeek(parseInt(val))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Day of Month (for monthly) */}
          {frequency === "monthly" && (
            <div className="space-y-2">
              <Label>Day of Month</Label>
              <Select
                value={dayOfMonth.toString()}
                onValueChange={(val) => setDayOfMonth(parseInt(val))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Time */}
          <div className="space-y-2">
            <Label>Time (UTC)</Label>
            <Select
              value={hour.toString()}
              onValueChange={(val) => setHour(parseInt(val))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOURS.map((h) => (
                  <SelectItem key={h.value} value={h.value.toString()}>
                    {h.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recipients */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Recipients
            </Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="email@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addRecipient();
                  }
                }}
              />
              <Button type="button" size="icon" onClick={addRecipient}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {recipients.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {recipients.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => removeRecipient(email)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          {currentSchedule && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemoveSchedule}
            >
              Remove Schedule
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Schedule</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
