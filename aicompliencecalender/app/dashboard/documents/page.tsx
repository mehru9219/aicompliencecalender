"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Grid, List, AlertCircle } from "lucide-react";
import {
  DocumentCard,
  DocumentUploader,
  DocumentSearch,
  DocumentPreview,
} from "@/components/features/documents";
import type { DocumentCategory } from "@/types/document";
import { useOrgContext } from "@/components/providers/OrgProvider";

interface Document {
  _id: Id<"documents">;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: DocumentCategory;
  version: number;
  uploadedAt: number;
  uploadedBy: string;
  extractedText?: string;
  downloadUrl?: string;
}

export default function DocumentsPage() {
  const { orgId, isLoading: orgLoading } = useOrgContext();
  const { userId } = useAuth();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [previewDocId, setPreviewDocId] = useState<Id<"documents"> | null>(
    null,
  );
  const [searchResults, setSearchResults] = useState<Document[]>([]);

  // Fallback list query (when search isn't active)
  const documents = useQuery(
    api.documents.list,
    orgId ? { orgId, limit: 50 } : "skip"
  );

  const softDelete = useMutation(api.documents.softDelete);
  const logAccess = useMutation(api.documents.logAccess);

  const displayDocuments =
    searchResults.length > 0 ? searchResults : (documents ?? []);

  const handleResultsChange = useCallback((results: unknown[]) => {
    setSearchResults(results as Document[]);
  }, []);

  const handleDownload = useCallback(
    async (doc: Document) => {
      if (!userId) return;
      await logAccess({
        documentId: doc._id,
        userId,
        action: "download",
      });

      // Get document with URL and trigger download
      const docWithUrl = await fetch(`/api/documents/${doc._id}/url`);
      if (docWithUrl.ok) {
        const { downloadUrl } = await docWithUrl.json();
        const link = window.document.createElement("a");
        link.href = downloadUrl;
        link.download = doc.fileName;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      }
    },
    [logAccess, userId],
  );

  const handleDelete = useCallback(
    async (doc: Document) => {
      if (!userId) return;
      if (
        window.confirm(`Are you sure you want to delete "${doc.fileName}"?`)
      ) {
        await softDelete({
          documentId: doc._id,
          userId,
        });
      }
    },
    [softDelete, userId],
  );

  const handleUploadComplete = useCallback(() => {
    setUploadDialogOpen(false);
  }, []);

  if (orgLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-32 bg-gray-100 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!orgId || !userId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No Organization Selected</h2>
        <p className="text-muted-foreground">
          Please select an organization to view documents.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Documents</h2>
          <p className="text-muted-foreground">
            Manage your compliance documents
          </p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <DocumentUploader
              orgId={orgId}
              userId={userId}
              onUploadComplete={handleUploadComplete}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and filters */}
      <DocumentSearch
        orgId={orgId}
        onResultsChange={handleResultsChange}
      />

      {/* View mode toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant={viewMode === "grid" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setViewMode("grid")}
        >
          <Grid className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === "list" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setViewMode("list")}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>

      {/* Document grid/list */}
      {documents === undefined ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-32 bg-gray-100 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : displayDocuments.length === 0 ? (
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="mt-4 text-muted-foreground">No documents found</p>
          <Button
            onClick={() => setUploadDialogOpen(true)}
            className="mt-4"
            variant="outline"
          >
            Upload your first document
          </Button>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-3"
          }
        >
          {displayDocuments.map((doc: Document) => (
            <DocumentCard
              key={doc._id}
              document={doc}
              onClick={() => setPreviewDocId(doc._id)}
              onDownload={() => handleDownload(doc)}
              onDelete={() => handleDelete(doc)}
            />
          ))}
        </div>
      )}

      {/* Preview dialog */}
      <Dialog open={!!previewDocId} onOpenChange={() => setPreviewDocId(null)}>
        <DialogContent className="max-w-4xl h-[80vh]">
          {previewDocId && (
            <DocumentPreview
              documentId={previewDocId}
              userId={userId}
              onClose={() => setPreviewDocId(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
