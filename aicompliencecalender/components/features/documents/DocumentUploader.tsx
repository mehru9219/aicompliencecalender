"use client";

import { useState, useCallback, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  DOCUMENT_CATEGORIES,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  formatFileSize,
  getFileType,
  isAllowedFileType,
  type DocumentCategory,
} from "@/types/document";

interface DocumentUploaderProps {
  orgId: Id<"organizations">;
  userId: string;
  deadlineIds?: Id<"deadlines">[];
  onUploadComplete?: (documentId: Id<"documents">) => void;
  onError?: (error: string) => void;
}

interface FileUploadState {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
  documentId?: Id<"documents">;
}

export function DocumentUploader({
  orgId,
  userId,
  deadlineIds,
  onUploadComplete,
  onError,
}: DocumentUploaderProps) {
  const [files, setFiles] = useState<FileUploadState[]>([]);
  const [category, setCategory] = useState<DocumentCategory>("other");
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const saveDocument = useMutation(api.documents.saveDocument);

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}`;
    }

    // Check file type
    const fileType = getFileType(file.name);
    if (!isAllowedFileType(fileType)) {
      return `Invalid file type. Allowed: ${ALLOWED_FILE_TYPES.join(", ")}`;
    }

    return null;
  }, []);

  const uploadFile = useCallback(
    async (fileState: FileUploadState, index: number) => {
      const { file } = fileState;

      try {
        // Update status to uploading
        setFiles((prev) =>
          prev.map((f, i) =>
            i === index
              ? { ...f, status: "uploading" as const, progress: 10 }
              : f,
          ),
        );

        // Get upload URL
        const uploadUrl = await generateUploadUrl({ orgId });

        setFiles((prev) =>
          prev.map((f, i) => (i === index ? { ...f, progress: 30 } : f)),
        );

        // Upload file to Convex storage
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const { storageId } = await response.json();

        setFiles((prev) =>
          prev.map((f, i) => (i === index ? { ...f, progress: 70 } : f)),
        );

        // Save document metadata
        const fileType = getFileType(file.name);
        const documentId = await saveDocument({
          orgId,
          storageId,
          fileName: file.name,
          fileType,
          fileSize: file.size,
          category,
          deadlineIds,
          uploadedBy: userId,
        });

        setFiles((prev) =>
          prev.map((f, i) =>
            i === index
              ? { ...f, status: "success" as const, progress: 100, documentId }
              : f,
          ),
        );

        onUploadComplete?.(documentId);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";

        setFiles((prev) =>
          prev.map((f, i) =>
            i === index
              ? { ...f, status: "error" as const, error: errorMessage }
              : f,
          ),
        );

        onError?.(errorMessage);
      }
    },
    [
      orgId,
      userId,
      category,
      deadlineIds,
      generateUploadUrl,
      saveDocument,
      onUploadComplete,
      onError,
    ],
  );

  const handleFiles = useCallback(
    (newFiles: FileList | null) => {
      if (!newFiles) return;

      const fileArray = Array.from(newFiles);
      const validatedFiles: FileUploadState[] = [];

      for (const file of fileArray) {
        const error = validateFile(file);
        validatedFiles.push({
          file,
          progress: 0,
          status: error ? "error" : "pending",
          error: error ?? undefined,
        });
      }

      setFiles((prev) => [...prev, ...validatedFiles]);

      // Start uploading valid files
      const startIndex = files.length;
      validatedFiles.forEach((fileState, i) => {
        if (fileState.status === "pending") {
          uploadFile(fileState, startIndex + i);
        }
      });
    },
    [files.length, validateFile, uploadFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragActive(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      // Reset input so same file can be selected again
      e.target.value = "";
    },
    [handleFiles],
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const retryFile = useCallback(
    (index: number) => {
      const fileState = files[index];
      if (fileState && fileState.status === "error") {
        const error = validateFile(fileState.file);
        if (!error) {
          setFiles((prev) =>
            prev.map((f, i) =>
              i === index
                ? { ...f, status: "pending" as const, error: undefined }
                : f,
            ),
          );
          uploadFile(
            { ...fileState, status: "pending", error: undefined },
            index,
          );
        }
      }
    },
    [files, validateFile, uploadFile],
  );

  return (
    <div className="space-y-4">
      {/* Category selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as DocumentCategory)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {Object.entries(DOCUMENT_CATEGORIES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Drop zone */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_FILE_TYPES.map((t) => `.${t}`).join(",")}
          onChange={handleInputChange}
          className="hidden"
        />

        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>

        <p className="mt-2 text-sm text-gray-600">
          <span className="font-medium text-blue-600">Click to upload</span> or
          drag and drop
        </p>
        <p className="mt-1 text-xs text-gray-500">
          {ALLOWED_FILE_TYPES.map((t) => t.toUpperCase()).join(", ")} up to{" "}
          {formatFileSize(MAX_FILE_SIZE)}
        </p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((fileState, index) => (
            <div
              key={`${fileState.file.name}-${index}`}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-shrink-0">
                <FileIcon fileType={getFileType(fileState.file.name)} />
              </div>

              <div className="flex-grow min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {fileState.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(fileState.file.size)}
                </p>

                {fileState.status === "uploading" && (
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${fileState.progress}%` }}
                    />
                  </div>
                )}

                {fileState.status === "error" && (
                  <p className="mt-1 text-xs text-red-600">{fileState.error}</p>
                )}
              </div>

              <div className="flex-shrink-0">
                {fileState.status === "success" && (
                  <svg
                    className="h-5 w-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}

                {fileState.status === "error" && (
                  <button
                    onClick={() => retryFile(index)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Retry
                  </button>
                )}

                {fileState.status !== "uploading" && (
                  <button
                    onClick={() => removeFile(index)}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FileIcon({ fileType }: { fileType: string }) {
  const getIconColor = () => {
    switch (fileType) {
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

  return (
    <svg
      className={`h-8 w-8 ${getIconColor()}`}
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
