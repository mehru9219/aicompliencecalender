"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Filter, X } from "lucide-react";

const STATUSES = [
  { value: "overdue", label: "Overdue" },
  { value: "due_soon", label: "Due Soon" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
];

const CATEGORIES = [
  { value: "license", label: "License" },
  { value: "certification", label: "Certification" },
  { value: "training", label: "Training" },
  { value: "audit", label: "Audit" },
  { value: "filing", label: "Filing" },
  { value: "insurance", label: "Insurance" },
  { value: "other", label: "Other" },
];

interface DeadlineFiltersProps {
  status: string[];
  category: string[];
  onStatusChange: (status: string[]) => void;
  onCategoryChange: (category: string[]) => void;
  onClear: () => void;
}

export function DeadlineFilters({
  status,
  category,
  onStatusChange,
  onCategoryChange,
  onClear,
}: DeadlineFiltersProps) {
  const activeCount = status.length + category.length;

  const toggleStatus = (value: string) => {
    if (status.includes(value)) {
      onStatusChange(status.filter((s) => s !== value));
    } else {
      onStatusChange([...status, value]);
    }
  };

  const toggleCategory = (value: string) => {
    if (category.includes(value)) {
      onCategoryChange(category.filter((c) => c !== value));
    } else {
      onCategoryChange([...category, value]);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {activeCount > 0 && (
              <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                {activeCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="start">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <div className="mt-2 space-y-2">
                {STATUSES.map((s) => (
                  <div key={s.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`status-${s.value}`}
                      checked={status.includes(s.value)}
                      onCheckedChange={() => toggleStatus(s.value)}
                    />
                    <label
                      htmlFor={`status-${s.value}`}
                      className="text-sm cursor-pointer"
                    >
                      {s.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Category</Label>
              <div className="mt-2 space-y-2">
                {CATEGORIES.map((c) => (
                  <div key={c.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`category-${c.value}`}
                      checked={category.includes(c.value)}
                      onCheckedChange={() => toggleCategory(c.value)}
                    />
                    <label
                      htmlFor={`category-${c.value}`}
                      className="text-sm cursor-pointer"
                    >
                      {c.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {activeCount > 0 && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
