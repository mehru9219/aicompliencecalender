"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Eye, FileText, History, ChevronLeft } from "lucide-react";
import Link from "next/link";

// TODO: Get from auth context
const MOCK_ORG_ID = "placeholder" as Id<"organizations">;

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ValuesDialog({ values }: { values: Record<string, unknown> }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Values Used</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-2">
            {Object.entries(values).map(([key, value]) => (
              <div key={key} className="p-2 rounded bg-muted">
                <p className="text-xs text-muted-foreground">{key}</p>
                <p className="text-sm font-medium truncate">
                  {String(value) || "(empty)"}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default function FormHistoryPage() {
  const fills = useQuery(api.forms.listFills, { orgId: MOCK_ORG_ID });
  const templates = useQuery(api.forms.listTemplates, { orgId: undefined });

  // Create template name lookup
  const templateNames = templates?.reduce(
    (acc: Record<string, string>, t: { _id: string; name: string }) => {
      acc[t._id] = t.name;
      return acc;
    },
    {} as Record<string, string>,
  );

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/forms">
            <Button variant="ghost" size="sm" className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back to Library
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <History className="h-6 w-6" />
              Fill History
            </h1>
            <p className="text-muted-foreground text-sm">
              View past form fills and download filled documents
            </p>
          </div>
        </div>
      </div>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Recent Fills
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fills === undefined ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : fills.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-1">No fills yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Fill your first form to see it here
              </p>
              <Link href="/forms/fill">
                <Button>
                  <FileText className="h-4 w-4 mr-2" />
                  Fill a Form
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Filled At</TableHead>
                  <TableHead>Filled By</TableHead>
                  <TableHead>Values</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fills.map((fill: NonNullable<typeof fills>[number]) => (
                  <TableRow key={fill._id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {templateNames?.[fill.templateId] ||
                            "Unknown Template"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(fill.filledAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{fill.filledBy}</Badge>
                    </TableCell>
                    <TableCell>
                      <ValuesDialog
                        values={fill.valuesUsed as Record<string, unknown>}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <DownloadButton storageId={fill.filledStorageId} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DownloadButton({ storageId }: { storageId: Id<"_storage"> }) {
  const url = useQuery(api.forms.getFilledFormUrl, { storageId });

  return (
    <Button variant="outline" size="sm" disabled={!url} asChild={!!url}>
      {url ? (
        <a href={url} download target="_blank" rel="noopener">
          <Download className="h-4 w-4 mr-1" />
          Download
        </a>
      ) : (
        <>
          <Download className="h-4 w-4 mr-1" />
          Download
        </>
      )}
    </Button>
  );
}
