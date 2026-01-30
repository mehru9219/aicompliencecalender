"use client";

import { ExternalLink, BookOpen } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { RegulatoryReference } from "@/types/template";

interface RegulatoryReferenceLinksProps {
  references: RegulatoryReference[];
  compact?: boolean;
}

export function RegulatoryReferenceLinks({
  references,
  compact = false,
}: RegulatoryReferenceLinksProps) {
  if (references.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <TooltipProvider>
        <div className="flex flex-wrap gap-2">
          {references.map((ref, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>{ref.name}</span>
                </a>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p>{ref.description}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <BookOpen className="h-4 w-4 text-muted-foreground" />
        <span>Regulatory References</span>
      </div>
      <div className="space-y-2">
        {references.map((ref, index) => (
          <div key={index} className="group">
            <a
              href={ref.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
            >
              <ExternalLink className="h-4 w-4 mt-0.5 text-blue-600 shrink-0" />
              <div className="min-w-0">
                <span className="text-sm font-medium text-blue-600 group-hover:underline">
                  {ref.name}
                </span>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {ref.description}
                </p>
              </div>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
