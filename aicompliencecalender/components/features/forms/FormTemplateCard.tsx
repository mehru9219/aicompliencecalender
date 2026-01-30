"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  MoreVertical,
  Play,
  Edit,
  Trash2,
  Download,
  Copy,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";

interface FormTemplateCardProps {
  template: {
    _id: Id<"form_templates">;
    name: string;
    industry: string;
    timesUsed: number;
    createdAt: number;
    fieldMappings: Array<{
      fieldName: string;
      fieldType: string;
      profileKey: string;
    }>;
  };
  onQuickFill?: (templateId: Id<"form_templates">) => void;
  onEditMappings?: (templateId: Id<"form_templates">) => void;
  onDelete?: (templateId: Id<"form_templates">) => void;
  onDownloadOriginal?: (templateId: Id<"form_templates">) => void;
  onDuplicate?: (templateId: Id<"form_templates">) => void;
  className?: string;
}

const industryColors: Record<string, string> = {
  healthcare: "bg-blue-100 text-blue-800",
  finance: "bg-green-100 text-green-800",
  legal: "bg-purple-100 text-purple-800",
  construction: "bg-orange-100 text-orange-800",
  retail: "bg-pink-100 text-pink-800",
  technology: "bg-cyan-100 text-cyan-800",
  manufacturing: "bg-yellow-100 text-yellow-800",
  other: "bg-gray-100 text-gray-800",
};

export function FormTemplateCard({
  template,
  onQuickFill,
  onEditMappings,
  onDelete,
  onDownloadOriginal,
  onDuplicate,
  className,
}: FormTemplateCardProps) {
  const industryColor =
    industryColors[template.industry.toLowerCase()] || industryColors.other;

  const formattedDate = new Date(template.createdAt).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-muted p-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <h3
                className="font-medium text-sm truncate"
                title={template.name}
              >
                {template.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="secondary"
                  className={cn("text-xs", industryColor)}
                >
                  {template.industry}
                </Badge>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEditMappings && (
                <DropdownMenuItem onClick={() => onEditMappings(template._id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Mappings
                </DropdownMenuItem>
              )}
              {onDownloadOriginal && (
                <DropdownMenuItem
                  onClick={() => onDownloadOriginal(template._id)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Original
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(template._id)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(template._id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-2">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Fields</p>
            <p className="font-medium">{template.fieldMappings.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Times Used</p>
            <div className="flex items-center gap-1">
              <Hash className="h-3 w-3 text-muted-foreground" />
              <p className="font-medium">{template.timesUsed}</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Created {formattedDate}
        </p>
      </CardContent>

      <CardFooter className="pt-2">
        {onQuickFill && (
          <Button
            onClick={() => onQuickFill(template._id)}
            className="w-full"
            size="sm"
          >
            <Play className="h-4 w-4 mr-2" />
            Quick Fill
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

/**
 * Grid container for FormTemplateCards.
 */
export function FormTemplateGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Empty state for when there are no templates.
 */
export function FormTemplateEmptyState({
  onUpload,
}: {
  onUpload?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-medium mb-1">No form templates yet</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
        Upload a compliance form to analyze it and save as a template for quick
        filling later.
      </p>
      {onUpload && (
        <Button onClick={onUpload}>
          <FileText className="h-4 w-4 mr-2" />
          Upload First Form
        </Button>
      )}
    </div>
  );
}
