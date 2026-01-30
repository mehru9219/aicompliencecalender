"use client";

import { useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormTemplateCard,
  FormTemplateGrid,
  FormTemplateEmptyState,
} from "@/components/features/forms";
import { FileText, Plus, Search } from "lucide-react";

const INDUSTRIES = [
  { value: "all", label: "All Industries" },
  { value: "healthcare", label: "Healthcare" },
  { value: "finance", label: "Finance" },
  { value: "legal", label: "Legal" },
  { value: "construction", label: "Construction" },
  { value: "retail", label: "Retail" },
  { value: "technology", label: "Technology" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "other", label: "Other" },
];

export default function FormsLibraryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");

  // Fetch templates - temporarily pass undefined for orgId to get all templates
  const templates = useQuery(api.forms.listTemplates, {
    orgId: undefined,
    industry: industryFilter !== "all" ? industryFilter : undefined,
  });

  // Filter templates by search query
  const filteredTemplates = templates?.filter((t: { name: string }) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleQuickFill = useCallback(
    (templateId: Id<"form_templates">) => {
      router.push(`/forms/fill?template=${templateId}`);
    },
    [router],
  );

  const handleEditMappings = useCallback(
    (templateId: Id<"form_templates">) => {
      router.push(`/forms/fill?template=${templateId}&edit=true`);
    },
    [router],
  );

  const handleDelete = useCallback((templateId: Id<"form_templates">) => {
    // TODO: Implement delete mutation with confirmation dialog
    console.log("Delete template:", templateId);
  }, []);

  const handleUpload = useCallback(() => {
    router.push("/forms/fill");
  }, [router]);

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Form Templates
          </h1>
          <p className="text-muted-foreground text-sm">
            Upload compliance forms and save as templates for quick pre-filling
          </p>
        </div>
        <Button onClick={handleUpload}>
          <Plus className="h-4 w-4 mr-2" />
          Upload New Form
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={industryFilter} onValueChange={setIndustryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by industry" />
          </SelectTrigger>
          <SelectContent>
            {INDUSTRIES.map((ind) => (
              <SelectItem key={ind.value} value={ind.value}>
                {ind.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      {templates === undefined ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredTemplates && filteredTemplates.length > 0 ? (
        <FormTemplateGrid>
          {filteredTemplates.map(
            (template: NonNullable<typeof templates>[number]) => (
              <FormTemplateCard
                key={template._id}
                template={template}
                onQuickFill={handleQuickFill}
                onEditMappings={handleEditMappings}
                onDelete={handleDelete}
              />
            ),
          )}
        </FormTemplateGrid>
      ) : (
        <FormTemplateEmptyState onUpload={handleUpload} />
      )}

      {/* Results count */}
      {filteredTemplates && filteredTemplates.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {filteredTemplates.length} template
          {filteredTemplates.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
