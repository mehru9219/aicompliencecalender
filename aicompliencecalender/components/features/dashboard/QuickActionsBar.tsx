"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Upload, Calendar, FileText } from "lucide-react";
import Link from "next/link";

interface QuickActionsBarProps {
  className?: string;
  canEdit?: boolean;
}

export function QuickActionsBar({
  className,
  canEdit = true,
}: QuickActionsBarProps) {
  if (!canEdit) {
    return null;
  }

  return (
    <Card className={className}>
      <CardContent className="py-4">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/deadlines/new">
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              New Deadline
            </Button>
          </Link>
          <Link href="/documents?action=upload">
            <Button variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Document
            </Button>
          </Link>
          <Link href="/calendar">
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              View Calendar
            </Button>
          </Link>
          <Link href="/templates">
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Browse Templates
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
