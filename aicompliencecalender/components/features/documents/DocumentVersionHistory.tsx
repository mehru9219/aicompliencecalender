"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatDistanceToNow, format } from "date-fns";
import { formatFileSize } from "@/types/document";

interface DocumentVersionHistoryProps {
  documentId: Id<"documents">;
  onVersionSelect?: (documentId: Id<"documents">) => void;
  onDownload?: (documentId: Id<"documents">) => void;
}

interface DocumentVersion {
  _id: Id<"documents">;
  fileName: string;
  fileSize: number;
  version: number;
  uploadedAt: number;
  uploadedBy: string;
}

export function DocumentVersionHistory({
  documentId,
  onVersionSelect,
  onDownload,
}: DocumentVersionHistoryProps) {
  const versions = useQuery(api.documents.getVersionHistory, { documentId });

  if (!versions) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-lg" />
        ))}
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        No version history available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        Version History
      </h3>
      <div className="space-y-2">
        {(versions as DocumentVersion[]).map((version, index) => {
          const isCurrent = index === 0;
          return (
            <div
              key={version._id}
              className={`p-3 rounded-lg border ${
                isCurrent
                  ? "border-blue-200 bg-blue-50"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      Version {version.version}
                    </span>
                    {isCurrent && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 space-y-0.5">
                    <p>
                      {format(version.uploadedAt, "MMM d, yyyy 'at' h:mm a")}
                      <span className="text-gray-400">
                        {" "}
                        (
                        {formatDistanceToNow(version.uploadedAt, {
                          addSuffix: true,
                        })}
                        )
                      </span>
                    </p>
                    <p>
                      <span className="text-gray-400">By:</span>{" "}
                      {version.uploadedBy}
                    </p>
                    <p>
                      <span className="text-gray-400">Size:</span>{" "}
                      {formatFileSize(version.fileSize)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {onDownload && (
                    <button
                      onClick={() => onDownload(version._id)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                      title="Download this version"
                    >
                      <DownloadIcon />
                    </button>
                  )}
                  {!isCurrent && onVersionSelect && (
                    <button
                      onClick={() => onVersionSelect(version._id)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="View this version"
                    >
                      <EyeIcon />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}
