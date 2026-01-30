"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { X, Filter, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { CalendarFilters as FilterType } from "@/lib/calendar/transformer";

interface CalendarFiltersProps {
  categories: string[];
  assignees: string[];
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
}

export function CalendarFilters({
  categories,
  assignees,
  filters,
  onFiltersChange,
}: CalendarFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Update URL params when filters change
  const updateUrlParams = useCallback(
    (newFilters: FilterType) => {
      const params = new URLSearchParams(searchParams.toString());

      // Categories
      if (newFilters.categories && newFilters.categories.length > 0) {
        params.set("categories", newFilters.categories.join(","));
      } else {
        params.delete("categories");
      }

      // Assigned to
      if (newFilters.assignedTo) {
        params.set("assignedTo", newFilters.assignedTo);
      } else {
        params.delete("assignedTo");
      }

      // Show completed
      if (newFilters.showCompleted === false) {
        params.set("showCompleted", "false");
      } else {
        params.delete("showCompleted");
      }

      // Search query
      if (newFilters.searchQuery) {
        params.set("q", newFilters.searchQuery);
      } else {
        params.delete("q");
      }

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const handleCategoryToggle = useCallback(
    (category: string) => {
      const currentCategories = filters.categories || [];
      const newCategories = currentCategories.includes(category)
        ? currentCategories.filter((c) => c !== category)
        : [...currentCategories, category];

      const newFilters = { ...filters, categories: newCategories };
      onFiltersChange(newFilters);
      updateUrlParams(newFilters);
    },
    [filters, onFiltersChange, updateUrlParams],
  );

  const handleAssigneeChange = useCallback(
    (value: string) => {
      const newFilters = {
        ...filters,
        assignedTo: value === "all" ? null : value,
      };
      onFiltersChange(newFilters);
      updateUrlParams(newFilters);
    },
    [filters, onFiltersChange, updateUrlParams],
  );

  const handleShowCompletedChange = useCallback(
    (checked: boolean) => {
      const newFilters = { ...filters, showCompleted: checked };
      onFiltersChange(newFilters);
      updateUrlParams(newFilters);
    },
    [filters, onFiltersChange, updateUrlParams],
  );

  const handleClearAll = useCallback(() => {
    const newFilters: FilterType = {
      categories: [],
      assignedTo: null,
      showCompleted: true,
      searchQuery: "",
    };
    onFiltersChange(newFilters);
    updateUrlParams(newFilters);
  }, [onFiltersChange, updateUrlParams]);

  const hasActiveFilters =
    (filters.categories && filters.categories.length > 0) ||
    filters.assignedTo ||
    filters.showCompleted === false;

  const activeFilterCount =
    (filters.categories?.length || 0) +
    (filters.assignedTo ? 1 : 0) +
    (filters.showCompleted === false ? 1 : 0);

  return (
    <div
      className="flex items-center gap-2 flex-wrap"
      role="group"
      aria-label="Calendar filters"
    >
      {/* Category Multi-select */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            aria-label="Filter by category"
          >
            <Filter className="size-3.5" />
            Categories
            {filters.categories && filters.categories.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {filters.categories.length}
              </Badge>
            )}
            <ChevronDown className="size-3.5 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3" align="start">
          <div className="space-y-2">
            <p className="text-sm font-medium">Filter by Category</p>
            <div className="space-y-2">
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No categories available
                </p>
              ) : (
                categories.map((category) => (
                  <div key={category} className="flex items-center gap-2">
                    <Checkbox
                      id={`category-${category}`}
                      checked={filters.categories?.includes(category) || false}
                      onCheckedChange={() => handleCategoryToggle(category)}
                    />
                    <Label
                      htmlFor={`category-${category}`}
                      className="text-sm font-normal cursor-pointer capitalize"
                    >
                      {category}
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Assigned To Filter */}
      <Select
        value={filters.assignedTo || "all"}
        onValueChange={handleAssigneeChange}
      >
        <SelectTrigger
          size="sm"
          className="h-8 w-auto min-w-[120px]"
          aria-label="Filter by assignee"
        >
          <SelectValue placeholder="Assigned to" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All members</SelectItem>
          {assignees.map((assignee) => (
            <SelectItem key={assignee} value={assignee}>
              {assignee}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Show Completed Toggle */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="show-completed"
          checked={filters.showCompleted !== false}
          onCheckedChange={(checked) =>
            handleShowCompletedChange(checked as boolean)
          }
        />
        <Label
          htmlFor="show-completed"
          className="text-sm font-normal cursor-pointer whitespace-nowrap"
        >
          Show completed
        </Label>
      </div>

      {/* Clear All Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 text-muted-foreground"
          onClick={handleClearAll}
          aria-label={`Clear all filters (${activeFilterCount} active)`}
        >
          <X className="size-3.5" />
          Clear ({activeFilterCount})
        </Button>
      )}
    </div>
  );
}
