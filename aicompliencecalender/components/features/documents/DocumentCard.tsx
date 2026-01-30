"use client";

import { formatDistanceToNow } from "date-fns";
import type { Id } from "@/convex/_generated/dataModel";
import {
  DOCUMENT_CATEGORIES,
  formatFileSize,
  type DocumentCategory,
} from "@/types/document";

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

interface DocumentCardProps {
  document: Document;
  onClick?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
}

export function DocumentCard({
  document,
  onClick,
  onDownload,
  onDelete,
}: DocumentCardProps) {
  const categoryLabel =
    DOCUMENT_CATEGORIES[document.category] ?? document.category;

  return (
    <div
      className="group bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* File icon */}
        <div className="flex-shrink-0">
          <FileIcon fileType={document.fileType} />
        </div>

        {/* Content */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {document.fileName}
            </h3>
            {document.version > 1 && (
              <span className="flex-shrink-0 text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                v{document.version}
              </span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
              {categoryLabel}
            </span>
            <span>{formatFileSize(document.fileSize)}</span>
          </div>

          <p className="mt-2 text-xs text-gray-400">
            Uploaded{" "}
            {formatDistanceToNow(document.uploadedAt, { addSuffix: true })}
          </p>

          {/* Preview text snippet */}
          {document.extractedText && (
            <p className="mt-2 text-xs text-gray-500 line-clamp-2">
              {document.extractedText.slice(0, 150)}
              {document.extractedText.length > 150 ? "..." : ""}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1">
            {onDownload && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload();
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                title="Download"
              >
                <DownloadIcon />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                title="Delete"
              >
                <TrashIcon />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FileIcon({ fileType }: { fileType: string }) {
  const getIconColor = () => {
    switch (fileType.toLowerCase()) {
      case "pdf":
        return "text-red-500";
      case "docx":
        return "text-blue-500";
      case "xlsx":
        return "text-green-500";
      case "jpg":
      case "jpeg":
      case "png":
        return "text-purple-500";
      default:
        return "text-gray-500";
    }
  };

  // Use different icon for images
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(fileType.toLowerCase())) {
    return (
      <svg
        className={`h-10 w-10 ${getIconColor()}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    );
  }

  return (
    <svg
      className={`h-10 w-10 ${getIconColor()}`}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
        clipRule="evenodd"
      />
    </svg>
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

function TrashIcon() {
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
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}
