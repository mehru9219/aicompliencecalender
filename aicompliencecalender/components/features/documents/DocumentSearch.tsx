"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { DocumentCategorySelector } from "./DocumentCategorySelector";
import type { DocumentCategory } from "@/types/document";

interface DocumentSearchProps {
  orgId: Id<"organizations">;
  onResultsChange?: (results: unknown[]) => void;
  defaultCategory?: DocumentCategory;
  defaultDeadlineId?: Id<"deadlines">;
}

interface SearchFilters {
  query: string;
  category?: DocumentCategory;
  deadlineId?: Id<"deadlines">;
  dateFrom?: number;
  dateTo?: number;
}

export function DocumentSearch({
  orgId,
  onResultsChange,
  defaultCategory,
  defaultDeadlineId,
}: DocumentSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    category: defaultCategory,
    deadlineId: defaultDeadlineId,
  });
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(filters.query);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.query]);

  // Execute search when we have a query
  const searchResults = useQuery(
    api.documents.search,
    debouncedQuery.length >= 2
      ? {
          orgId,
          query: debouncedQuery,
          category: filters.category,
          deadlineId: filters.deadlineId,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
        }
      : "skip",
  );

  // List documents when no search query
  const listResults = useQuery(
    api.documents.list,
    debouncedQuery.length < 2
      ? {
          orgId,
          category: filters.category,
          deadlineId: filters.deadlineId,
          limit: 50,
        }
      : "skip",
  );

  const results = debouncedQuery.length >= 2 ? searchResults : listResults;

  // Notify parent of results
  useEffect(() => {
    if (results && onResultsChange) {
      onResultsChange(results);
    }
  }, [results, onResultsChange]);

  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFilters((prev) => ({ ...prev, query: e.target.value }));
    },
    [],
  );

  const handleCategoryChange = useCallback(
    (value: DocumentCategory | DocumentCategory[]) => {
      const category = Array.isArray(value) ? value[0] : value;
      setFilters((prev) => ({ ...prev, category }));
    },
    [],
  );

  const handleDateFromChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const date = e.target.value
        ? new Date(e.target.value).getTime()
        : undefined;
      setFilters((prev) => ({ ...prev, dateFrom: date }));
    },
    [],
  );

  const handleDateToChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const date = e.target.value
        ? new Date(e.target.value).getTime()
        : undefined;
      setFilters((prev) => ({ ...prev, dateTo: date }));
    },
    [],
  );

  const clearFilters = useCallback(() => {
    setFilters({
      query: "",
      category: undefined,
      deadlineId: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    });
    setShowDateFilter(false);
  }, []);

  const hasActiveFilters =
    filters.query ||
    filters.category ||
    filters.deadlineId ||
    filters.dateFrom ||
    filters.dateTo;

  const resultCount = results?.length ?? 0;

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          value={filters.query}
          onChange={handleQueryChange}
          placeholder="Search documents..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        {filters.query && (
          <button
            onClick={() => setFilters((prev) => ({ ...prev, query: "" }))}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Category filter */}
        <DocumentCategorySelector
          value={filters.category}
          onChange={handleCategoryChange}
          placeholder="All categories"
          className="w-48"
        />

        {/* Date filter toggle */}
        <button
          onClick={() => setShowDateFilter(!showDateFilter)}
          className={`px-3 py-2 text-sm border rounded-md ${
            showDateFilter || filters.dateFrom || filters.dateTo
              ? "border-blue-500 text-blue-600 bg-blue-50"
              : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          <span className="flex items-center gap-1">
            <CalendarIcon className="h-4 w-4" />
            Date range
          </span>
        </button>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md"
          >
            Clear all
          </button>
        )}

        {/* Results count */}
        <div className="ml-auto text-sm text-gray-500">
          {resultCount} {resultCount === 1 ? "document" : "documents"}
        </div>
      </div>

      {/* Date range picker */}
      {showDateFilter && (
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">From:</label>
            <input
              type="date"
              value={
                filters.dateFrom
                  ? new Date(filters.dateFrom).toISOString().split("T")[0]
                  : ""
              }
              onChange={handleDateFromChange}
              className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">To:</label>
            <input
              type="date"
              value={
                filters.dateTo
                  ? new Date(filters.dateTo).toISOString().split("T")[0]
                  : ""
              }
              onChange={handleDateToChange}
              className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
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
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
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
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
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
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}
