"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TemplateDeadlineList,
  RegulatoryReferenceLinks,
} from "@/components/features/templates";
import {
  ArrowLeft,
  Calendar,
  Building2,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const template = useQuery(api.templates.getBySlug, { slug });

  // Loading state
  if (template === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not found state
  if (template === null) {
    return (
      <div className="container py-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Template Not Found</h3>
          <p className="text-muted-foreground max-w-md mt-1">
            The template you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <Link href="/templates">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Templates
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const criticalCount = template.deadlines.filter(
    (d: { importance: string }) => d.importance === "critical",
  ).length;

  return (
    <div className="container py-6 space-y-6">
      {/* Back Button */}
      <Link
        href="/templates"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Templates
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">
              {template.name}
            </h1>
            <Badge variant="secondary">v{template.version}</Badge>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>{template.industry}</span>
            {template.subIndustry && (
              <>
                <span>/</span>
                <span>{template.subIndustry}</span>
              </>
            )}
          </div>
          <p className="text-muted-foreground max-w-2xl">
            {template.description}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="lg"
            onClick={() => router.push(`/templates/import?slug=${slug}`)}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Import Template
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">
                  {template.deadlines.length}
                </p>
                <p className="text-sm text-muted-foreground">
                  Compliance Deadlines
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{criticalCount}</p>
                <p className="text-sm text-muted-foreground">
                  Critical Deadlines
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {template.documentCategories.length}
                </p>
                <p className="text-sm text-muted-foreground">
                  Document Categories
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deadlines */}
      <Card>
        <CardHeader>
          <CardTitle>Included Deadlines</CardTitle>
          <p className="text-sm text-muted-foreground">
            These compliance deadlines will be added to your calendar when you
            import this template.
          </p>
        </CardHeader>
        <CardContent>
          <TemplateDeadlineList deadlines={template.deadlines} />
        </CardContent>
      </Card>

      {/* Document Categories */}
      {template.documentCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Document Categories</CardTitle>
            <p className="text-sm text-muted-foreground">
              Recommended document categories for organizing your compliance
              documentation.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {template.documentCategories.map((category: string) => (
                <Badge key={category} variant="outline">
                  {category.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Regulatory References */}
      {template.regulatoryReferences.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Regulatory References</CardTitle>
            <p className="text-sm text-muted-foreground">
              Official resources and documentation for this compliance domain.
            </p>
          </CardHeader>
          <CardContent>
            <RegulatoryReferenceLinks
              references={template.regulatoryReferences}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
