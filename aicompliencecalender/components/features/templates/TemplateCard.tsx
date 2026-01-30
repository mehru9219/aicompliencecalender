"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Building2 } from "lucide-react";
import Link from "next/link";

interface TemplateCardProps {
  slug: string;
  name: string;
  industry: string;
  subIndustry?: string;
  description: string;
  version: string;
  deadlineCount: number;
  isImported?: boolean;
  importedVersion?: string;
  onImport?: () => void;
}

export function TemplateCard({
  slug,
  name,
  industry,
  subIndustry,
  description,
  version,
  deadlineCount,
  isImported,
  importedVersion,
  onImport,
}: TemplateCardProps) {
  const hasUpdate =
    isImported && importedVersion && importedVersion !== version;

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-1">{name}</CardTitle>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              <span>{industry}</span>
              {subIndustry && (
                <>
                  <span>/</span>
                  <span>{subIndustry}</span>
                </>
              )}
            </div>
          </div>
          <Badge variant="secondary" className="shrink-0">
            v{version}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
          {description}
        </p>

        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {deadlineCount} compliance deadline
              {deadlineCount !== 1 ? "s" : ""}
            </span>
          </div>

          {isImported && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Imported (v{importedVersion})
              </Badge>
              {hasUpdate && (
                <Badge variant="default" className="text-xs bg-amber-500">
                  Update Available
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <Link href={`/templates/${slug}`} className="flex-1">
              <Button variant="outline" className="w-full" size="sm">
                View Details
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            {!isImported && onImport && (
              <Button onClick={onImport} size="sm">
                Import
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
