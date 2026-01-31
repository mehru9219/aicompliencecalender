"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Calendar,
  Download,
  Edit,
  FileText,
  History,
  Trash2,
  Tag,
  User,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  DocumentPreview,
  DocumentVersionHistory,
  DocumentCategorySelector,
} from "@/components/features/documents";
import {
  DOCUMENT_CATEGORIES,
  formatFileSize,
  type DocumentCategory,
} from "@/types/document";

const TEMP_USER_ID = "temp-user";

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editCategory, setEditCategory] = useState<
    DocumentCategory | undefined
  >();

  const documentId = params.id as Id<"documents">;

  const document = useQuery(api.documents.getWithUrl, { documentId });
  const accessLog = useQuery(api.documents.getAccessLog, {
    documentId,
    limit: 20,
  });

  const updateDocument = useMutation(api.documents.updateDocument);
  const softDelete = useMutation(api.documents.softDelete);
  const logAccess = useMutation(api.documents.logAccess);

  const handleCategoryUpdate = async () => {
    if (editCategory) {
      await updateDocument({
        documentId,
        category: editCategory,
        userId: TEMP_USER_ID,
      });
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    await softDelete({ documentId, userId: TEMP_USER_ID });
    router.push("/dashboard/documents");
  };

  const handleDownload = async () => {
    if (document?.downloadUrl) {
      await logAccess({
        documentId,
        userId: TEMP_USER_ID,
        action: "download",
      });

      const link = window.document.createElement("a");
      link.href = document.downloadUrl;
      link.download = document.fileName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
  };

  if (document === undefined) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (document === null) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-gray-400" />
        <h2 className="mt-4 text-xl font-semibold">Document not found</h2>
        <p className="mt-2 text-gray-500">
          This document may have been deleted or you don&apos;t have access.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link href="/dashboard/documents">Back to Documents</Link>
        </Button>
      </div>
    );
  }

  const categoryLabel =
    DOCUMENT_CATEGORIES[document.category as DocumentCategory];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Breadcrumb and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/documents">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <span className="text-gray-300">/</span>
          <h1 className="text-xl font-semibold truncate max-w-md">
            {document.fileName}
          </h1>
          {document.version > 1 && (
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
              v{document.version}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
          <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Document</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete &quot;{document.fileName}
                  &quot;? The document will be moved to trash and can be
                  restored within 30 days.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleting(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preview area */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardContent className="p-0 h-[600px]">
              <DocumentPreview documentId={documentId} userId={TEMP_USER_ID} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Document info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Document Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Tag className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Category:</span>
                {isEditing ? (
                  <div className="flex-grow flex items-center gap-2">
                    <DocumentCategorySelector
                      value={
                        editCategory ?? (document.category as DocumentCategory)
                      }
                      onChange={(val) =>
                        setEditCategory(val as DocumentCategory)
                      }
                      className="flex-grow"
                    />
                    <Button size="sm" onClick={handleCategoryUpdate}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="font-medium">{categoryLabel}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto h-6 w-6 p-0"
                      onClick={() => {
                        setEditCategory(document.category as DocumentCategory);
                        setIsEditing(true);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Type:</span>
                <span className="font-medium">
                  {document.fileType.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Size:</span>
                <span className="font-medium">
                  {formatFileSize(document.fileSize)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Uploaded:</span>
                <span className="font-medium">
                  {format(document.uploadedAt, "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">By:</span>
                <span className="font-medium">{document.uploadedBy}</span>
              </div>
            </CardContent>
          </Card>

          {/* Version history */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" />
                Version History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentVersionHistory
                documentId={documentId}
                onDownload={async (versionId) => {
                  await logAccess({
                    documentId: versionId,
                    userId: TEMP_USER_ID,
                    action: "download",
                  });
                }}
              />
            </CardContent>
          </Card>

          {/* Access log */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {accessLog === undefined ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : accessLog.length === 0 ? (
                <p className="text-sm text-gray-500">No activity recorded</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-auto">
                  {accessLog.map(
                    (log: {
                      _id: string;
                      userId: string;
                      action: string;
                      timestamp: number;
                    }) => (
                      <div key={log._id} className="text-xs text-gray-600">
                        <span className="font-medium">{log.userId}</span>{" "}
                        <span className="text-gray-400">{log.action}</span>{" "}
                        <span className="text-gray-400">
                          {formatDistanceToNow(log.timestamp, {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
