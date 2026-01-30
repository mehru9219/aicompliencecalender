"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  formatFileSize,
  DOCUMENT_CATEGORIES,
  type DocumentCategory,
} from "@/types/document";

interface DocumentPreviewProps {
  documentId: Id<"documents">;
  userId: string;
  onClose?: () => void;
  onDownload?: (url: string, fileName: string) => void;
}

export function DocumentPreview({
  documentId,
  userId,
  onClose,
  onDownload,
}: DocumentPreviewProps) {
  const [zoom, setZoom] = useState(100);
  const [error, setError] = useState<string | null>(null);

  const document = useQuery(api.documents.getWithUrl, { documentId });
  const logAccess = useMutation(api.documents.logAccess);

  // Log view access on mount
  // Note: In a real app, you'd use useEffect with proper dependency tracking

  if (!document) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const handleDownload = async () => {
    if (document.downloadUrl) {
      await logAccess({
        documentId,
        userId,
        action: "download",
      });
      onDownload?.(document.downloadUrl, document.fileName);

      // Trigger download
      const link = window.document.createElement("a");
      link.href = document.downloadUrl;
      link.download = document.fileName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
  };

  const handlePrint = () => {
    if (document.downloadUrl) {
      const printWindow = window.open(document.downloadUrl, "_blank");
      printWindow?.print();
    }
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 25, 200));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 25, 50));
  const handleZoomReset = () => setZoom(100);

  const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(
    document.fileType.toLowerCase(),
  );
  const isPdf = document.fileType.toLowerCase() === "pdf";
  const categoryLabel =
    DOCUMENT_CATEGORIES[document.category as DocumentCategory];

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-lg font-medium text-gray-900 truncate">
            {document.fileName}
          </h2>
          <span className="flex-shrink-0 text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
            {categoryLabel}
          </span>
          {document.version > 1 && (
            <span className="flex-shrink-0 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
              v{document.version}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            >
              <XIcon />
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{formatFileSize(document.fileSize)}</span>
          <span className="text-gray-300">|</span>
          <span>{document.fileType.toUpperCase()}</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Zoom controls (for images) */}
          {isImage && (
            <>
              <button
                onClick={handleZoomOut}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                title="Zoom out"
              >
                <MinusIcon />
              </button>
              <button
                onClick={handleZoomReset}
                className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
              >
                {zoom}%
              </button>
              <button
                onClick={handleZoomIn}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                title="Zoom in"
              >
                <PlusIcon />
              </button>
              <div className="w-px h-6 bg-gray-200 mx-2" />
            </>
          )}

          <button
            onClick={handlePrint}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            title="Print"
          >
            <PrintIcon />
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            title="Download"
          >
            <DownloadIcon />
          </button>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-grow overflow-auto bg-gray-100 p-4">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <ErrorIcon className="h-12 w-12 mb-3" />
            <p>Failed to load preview</p>
            <p className="text-sm text-gray-400 mt-1">{error}</p>
          </div>
        ) : isImage ? (
          <div className="flex items-center justify-center min-h-full">
            <img
              src={document.downloadUrl || undefined}
              alt={document.fileName}
              className="max-w-full h-auto shadow-lg rounded"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "center",
              }}
              onError={() => setError("Failed to load image")}
            />
          </div>
        ) : isPdf ? (
          <div className="h-full">
            <iframe
              src={`${document.downloadUrl}#toolbar=0`}
              className="w-full h-full rounded shadow-lg"
              title={document.fileName}
              onError={() => setError("Failed to load PDF")}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <FileIcon className="h-16 w-16 mb-4" fileType={document.fileType} />
            <p className="text-lg font-medium">{document.fileName}</p>
            <p className="text-sm text-gray-400 mt-2">
              Preview not available for {document.fileType.toUpperCase()} files
            </p>
            <button
              onClick={handleDownload}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Download to view
            </button>
          </div>
        )}
      </div>

      {/* Extracted text (collapsible) */}
      {document.extractedText && (
        <details className="border-t border-gray-200">
          <summary className="px-4 py-2 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50">
            Extracted Text
          </summary>
          <div className="px-4 py-3 bg-gray-50 max-h-48 overflow-auto">
            <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">
              {document.extractedText}
            </pre>
          </div>
        </details>
      )}
    </div>
  );
}

function XIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function MinusIcon() {
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
        d="M20 12H4"
      />
    </svg>
  );
}

function PlusIcon() {
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
        d="M12 4v16m8-8H4"
      />
    </svg>
  );
}

function PrintIcon() {
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
        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
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

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

function FileIcon({
  className,
  fileType,
}: {
  className?: string;
  fileType: string;
}) {
  const getIconColor = () => {
    switch (fileType.toLowerCase()) {
      case "pdf":
        return "text-red-400";
      case "docx":
        return "text-blue-400";
      case "xlsx":
        return "text-green-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <svg
      className={`${className} ${getIconColor()}`}
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
