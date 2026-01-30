"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { TemplateDeadline } from "@/types/template";
import {
  calculateDefaultDueDate,
  formatAnchorType,
} from "@/lib/utils/template-dates";

interface DateCustomizerProps {
  deadline: TemplateDeadline;
  value?: number;
  onChange: (date: number) => void;
}

export function DateCustomizer({
  deadline,
  value,
  onChange,
}: DateCustomizerProps) {
  // Calculate suggested date for fixed_date anchors
  const suggestedDate = useMemo(
    () => calculateDefaultDueDate(deadline),
    [deadline],
  );

  // Compute initial date value
  const getInitialDate = (): Date | undefined => {
    if (value) return new Date(value);
    if (suggestedDate && deadline.anchorType === "fixed_date") {
      return new Date(suggestedDate);
    }
    return undefined;
  };

  const [date, setDate] = useState<Date | undefined>(getInitialDate);
  const [isOpen, setIsOpen] = useState(false);
  const hasNotifiedParent = useRef(false);

  // Notify parent of default date only once on mount
  useEffect(() => {
    if (
      !hasNotifiedParent.current &&
      !value &&
      suggestedDate &&
      deadline.anchorType === "fixed_date"
    ) {
      hasNotifiedParent.current = true;
      // Use setTimeout to avoid synchronous state update in effect
      setTimeout(() => onChange(suggestedDate), 0);
    }
  }, []);

  const handleDateSelect = (selected: Date | undefined) => {
    if (selected) {
      // Set to end of day
      selected.setHours(23, 59, 59, 999);
      setDate(selected);
      onChange(selected.getTime());
      setIsOpen(false);
    }
  };

  const isDateInPast = date && date < new Date();
  const requiresInput = deadline.anchorType !== "fixed_date";

  const getDateHint = (): string => {
    switch (deadline.anchorType) {
      case "fixed_date":
        return `Default: ${deadline.defaultMonth ? format(new Date(2024, deadline.defaultMonth - 1, deadline.defaultDay || 1), "MMMM d") : "Not set"}`;
      case "anniversary":
        return "Set based on your license/registration issue date";
      case "custom":
        return "Set based on your organization's specific circumstances";
      default:
        return "";
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <Label className="text-base font-medium">{deadline.title}</Label>
          <p className="text-sm text-muted-foreground">
            {deadline.description}
          </p>
        </div>
        <Badge variant="outline">{formatAnchorType(deadline.anchorType)}</Badge>
      </div>

      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">{getDateHint()}</div>

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground",
                isDateInPast && "border-amber-500",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "MMMM d, yyyy") : "Select due date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              initialFocus
              disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
            />
          </PopoverContent>
        </Popover>

        {isDateInPast && (
          <div className="flex items-center gap-2 text-sm text-amber-600">
            <AlertCircle className="h-4 w-4" />
            <span>Date is in the past. Consider selecting a future date.</span>
          </div>
        )}

        {requiresInput && !date && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>This deadline requires you to set a specific date.</span>
          </div>
        )}
      </div>
    </div>
  );
}
