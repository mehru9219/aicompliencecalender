"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type RecurrenceType =
  | "weekly"
  | "monthly"
  | "quarterly"
  | "semi_annual"
  | "annual"
  | "custom";

interface RecurrencePattern {
  type: RecurrenceType;
  interval?: number;
  endDate?: number;
  baseDate?: "due_date" | "completion_date";
}

interface RecurrenceSelectorProps {
  value?: RecurrencePattern;
  onChange: (value: RecurrencePattern | undefined) => void;
}

const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  semi_annual: "Semi-Annual",
  annual: "Annual",
  custom: "Custom",
};

export function RecurrenceSelector({
  value,
  onChange,
}: RecurrenceSelectorProps) {
  const [enabled, setEnabled] = useState(!!value);

  const handleToggle = () => {
    if (enabled) {
      onChange(undefined);
      setEnabled(false);
    } else {
      onChange({ type: "monthly", baseDate: "due_date" });
      setEnabled(true);
    }
  };

  const handleTypeChange = (type: RecurrenceType) => {
    onChange({ ...value, type, interval: type === "custom" ? 30 : undefined });
  };

  const handleIntervalChange = (interval: number) => {
    onChange({ ...value!, interval });
  };

  const handleEndDateChange = (date: Date | undefined) => {
    onChange({ ...value!, endDate: date?.getTime() });
  };

  const handleBaseDateChange = (baseDate: "due_date" | "completion_date") => {
    onChange({ ...value!, baseDate });
  };

  const getPreviewText = () => {
    if (!value) return "";
    let text = `Repeats ${RECURRENCE_LABELS[value.type].toLowerCase()}`;
    if (value.type === "custom" && value.interval) {
      text = `Repeats every ${value.interval} days`;
    }
    if (value.endDate) {
      text += ` until ${new Date(value.endDate).toLocaleDateString()}`;
    }
    return text;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={enabled ? "default" : "outline"}
          size="sm"
          onClick={handleToggle}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {enabled ? "Recurring" : "One-time"}
        </Button>
        {enabled && (
          <span className="text-sm text-muted-foreground">
            {getPreviewText()}
          </span>
        )}
      </div>

      {enabled && value && (
        <div className="grid gap-4 sm:grid-cols-2 p-4 border rounded-lg bg-muted/50">
          <div className="space-y-2">
            <Label htmlFor="recurrence-type">Frequency</Label>
            <Select value={value.type} onValueChange={handleTypeChange}>
              <SelectTrigger id="recurrence-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(RECURRENCE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {value.type === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="interval">Interval (days)</Label>
              <Input
                id="interval"
                type="number"
                min={1}
                value={value.interval || 30}
                onChange={(e) =>
                  handleIntervalChange(parseInt(e.target.value) || 30)
                }
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="base-date">Calculate from</Label>
            <Select
              value={value.baseDate || "due_date"}
              onValueChange={(v) =>
                handleBaseDateChange(v as "due_date" | "completion_date")
              }
            >
              <SelectTrigger id="base-date">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="due_date">Due date</SelectItem>
                <SelectItem value="completion_date">Completion date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>End date (optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !value.endDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {value.endDate
                    ? new Date(value.endDate).toLocaleDateString()
                    : "No end date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={value.endDate ? new Date(value.endDate) : undefined}
                  onSelect={handleEndDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}
    </div>
  );
}
