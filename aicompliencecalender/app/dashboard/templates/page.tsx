"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TemplateCard } from "@/components/features/templates";
import { Search, Loader2, LayoutGrid, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function TemplatesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");

  const templates = useQuery(api.templates.list, {
    industry: selectedIndustry === "all" ? undefined : selectedIndustry,
  });

  const industries = useQuery(api.templates.getIndustries, {});

  const filteredTemplates = templates?.filter(
    (t: { name: string; description: string }) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()),
  );

  const isLoading = templates === undefined;

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Industry Templates
          </h1>
          <p className="text-muted-foreground">
            Pre-built compliance templates for regulated industries
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href="mailto:support@example.com?subject=Template Request">
            <Mail className="mr-2 h-4 w-4" />
            Request Template
          </a>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Industries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {industries?.map((ind: { industry: string; count: number }) => (
              <SelectItem key={ind.industry} value={ind.industry}>
                {ind.industry} ({ind.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredTemplates?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <LayoutGrid className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No templates found</h3>
          <p className="text-muted-foreground max-w-md mt-1">
            {search || selectedIndustry !== "all"
              ? "Try adjusting your search or filter criteria."
              : "No templates are available yet. Check back soon!"}
          </p>
          {(search || selectedIndustry !== "all") && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearch("");
                setSelectedIndustry("all");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* Template Grid */}
      {!isLoading && filteredTemplates && filteredTemplates.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map(
            (template: NonNullable<typeof templates>[number]) => (
              <TemplateCard
                key={template._id}
                slug={template.slug}
                name={template.name}
                industry={template.industry}
                subIndustry={template.subIndustry}
                description={template.description}
                version={template.version}
                deadlineCount={template.deadlineCount}
                onImport={() =>
                  router.push(`/templates/import?slug=${template.slug}`)
                }
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}
