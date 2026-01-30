"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Calendar,
  Building2,
  FileText,
} from "lucide-react";
import type { TemplateDeadline } from "@/types/template";
import { describeDeadlineTiming } from "@/lib/utils/template-dates";

interface TemplateDeadlineListProps {
  deadlines: TemplateDeadline[];
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

export function TemplateDeadlineList({
  deadlines,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
}: TemplateDeadlineListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const toggleSelection = (id: string) => {
    if (!onSelectionChange) return;

    const newSelected = selectedIds.includes(id)
      ? selectedIds.filter((i) => i !== id)
      : [...selectedIds, id];
    onSelectionChange(newSelected);
  };

  const selectAll = () => {
    if (!onSelectionChange) return;
    onSelectionChange(deadlines.map((d) => d.id));
  };

  const selectNone = () => {
    if (!onSelectionChange) return;
    onSelectionChange([]);
  };

  const importanceBadgeVariant = (
    importance: TemplateDeadline["importance"],
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (importance) {
      case "critical":
        return "destructive";
      case "high":
        return "default";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
    }
  };

  return (
    <div className="space-y-3">
      {selectable && (
        <div className="flex items-center gap-2 pb-2 border-b">
          <Button variant="ghost" size="sm" onClick={selectAll}>
            Select All
          </Button>
          <Button variant="ghost" size="sm" onClick={selectNone}>
            Select None
          </Button>
          <span className="text-sm text-muted-foreground ml-auto">
            {selectedIds.length} of {deadlines.length} selected
          </span>
        </div>
      )}

      <div className="space-y-2">
        {deadlines.map((deadline) => {
          const isExpanded = expandedIds.has(deadline.id);
          const isSelected = selectedIds.includes(deadline.id);

          return (
            <div
              key={deadline.id}
              className="border rounded-lg overflow-hidden"
            >
              <div className="flex items-center gap-3 p-3 bg-background">
                {selectable && (
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelection(deadline.id)}
                    aria-label={`Select ${deadline.title}`}
                  />
                )}

                <Collapsible open={isExpanded} className="flex-1">
                  <CollapsibleTrigger
                    onClick={() => toggleExpanded(deadline.id)}
                    className="flex items-center gap-2 w-full text-left"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">
                          {deadline.title}
                        </span>
                        <Badge
                          variant={importanceBadgeVariant(deadline.importance)}
                          className="text-xs"
                        >
                          {deadline.importance}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {deadline.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {describeDeadlineTiming(deadline)}
                      </p>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="pt-3 pb-1">
                    <div className="space-y-3 pl-6 text-sm">
                      <p className="text-muted-foreground">
                        {deadline.description}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {deadline.penaltyRange && (
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                            <div>
                              <span className="font-medium">Penalties:</span>
                              <p className="text-muted-foreground">
                                {deadline.penaltyRange}
                              </p>
                            </div>
                          </div>
                        )}

                        {deadline.regulatoryBody && (
                          <div className="flex items-start gap-2">
                            <Building2 className="h-4 w-4 text-blue-500 mt-0.5" />
                            <div>
                              <span className="font-medium">
                                Regulatory Body:
                              </span>
                              <p className="text-muted-foreground">
                                {deadline.regulatoryBody}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 text-green-500 mt-0.5" />
                          <div>
                            <span className="font-medium">Alert Schedule:</span>
                            <p className="text-muted-foreground">
                              {deadline.defaultAlertDays.join(", ")} days before
                            </p>
                          </div>
                        </div>

                        {deadline.notes && (
                          <div className="flex items-start gap-2 md:col-span-2">
                            <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                            <div>
                              <span className="font-medium">Notes:</span>
                              <p className="text-muted-foreground">
                                {deadline.notes}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
