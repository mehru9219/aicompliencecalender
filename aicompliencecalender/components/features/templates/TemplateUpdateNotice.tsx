"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpCircle, X, Plus, Minus, Pencil } from "lucide-react";
import type { TemplateVersionChange } from "@/types/template";

interface TemplateUpdateNoticeProps {
  templateName: string;
  oldVersion: string;
  newVersion: string;
  changes: TemplateVersionChange[];
  onReview?: () => void;
  onDismiss?: () => void;
}

export function TemplateUpdateNotice({
  templateName,
  oldVersion,
  newVersion,
  changes,
  onReview,
  onDismiss,
}: TemplateUpdateNoticeProps) {
  const added = changes.filter((c) => c.type === "added");
  const removed = changes.filter((c) => c.type === "removed");
  const modified = changes.filter((c) => c.type === "modified");

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <ArrowUpCircle className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg">Template Update Available</CardTitle>
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium">{templateName}</span> has been updated
          from <Badge variant="secondary">v{oldVersion}</Badge> to{" "}
          <Badge variant="default">v{newVersion}</Badge>
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {changes.length > 0 && (
          <div className="space-y-3">
            <span className="text-sm font-medium">Changes in this update:</span>

            {added.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm text-green-700">
                  <Plus className="h-3.5 w-3.5" />
                  <span className="font-medium">
                    {added.length} new deadline{added.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <ul className="ml-5 text-sm text-muted-foreground list-disc space-y-0.5">
                  {added.map((c) => (
                    <li key={c.deadlineId}>{c.deadlineTitle}</li>
                  ))}
                </ul>
              </div>
            )}

            {removed.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm text-red-700">
                  <Minus className="h-3.5 w-3.5" />
                  <span className="font-medium">
                    {removed.length} removed deadline
                    {removed.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <ul className="ml-5 text-sm text-muted-foreground list-disc space-y-0.5">
                  {removed.map((c) => (
                    <li key={c.deadlineId}>{c.deadlineTitle}</li>
                  ))}
                </ul>
              </div>
            )}

            {modified.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm text-blue-700">
                  <Pencil className="h-3.5 w-3.5" />
                  <span className="font-medium">
                    {modified.length} modified deadline
                    {modified.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <ul className="ml-5 text-sm text-muted-foreground list-disc space-y-0.5">
                  {modified.map((c) => (
                    <li key={c.deadlineId}>
                      {c.deadlineTitle}
                      {c.details && c.details.length > 0 && (
                        <span className="text-xs text-gray-500">
                          {" "}
                          ({c.details.slice(0, 2).join(", ")}
                          {c.details.length > 2 && "..."})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          {onReview && (
            <Button onClick={onReview} size="sm">
              Review Changes
            </Button>
          )}
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
