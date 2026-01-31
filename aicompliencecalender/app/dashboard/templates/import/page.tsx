"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TemplateImportWizard } from "@/components/features/templates";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useOrgContext } from "@/components/providers/OrgProvider";

function TemplateImportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { orgId, isLoading: orgLoading } = useOrgContext();
  const slug = searchParams.get("slug");

  const template = useQuery(api.templates.getBySlug, {
    slug: slug || "",
  });

  // Loading org
  if (orgLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No org selected
  if (!orgId) {
    return (
      <div className="container py-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No Organization Selected</h3>
          <p className="text-muted-foreground max-w-md mt-1">
            Please select an organization to import templates.
          </p>
        </div>
      </div>
    );
  }

  // No slug provided
  if (!slug) {
    return (
      <div className="container py-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No Template Selected</h3>
          <p className="text-muted-foreground max-w-md mt-1">
            Please select a template from the library to import.
          </p>
          <Link href="/dashboard/templates">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Browse Templates
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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
            The template you&apos;re trying to import doesn&apos;t exist or has
            been removed.
          </p>
          <Link href="/dashboard/templates">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Browse Templates
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleComplete = () => {
    router.push("/dashboard/deadlines");
  };

  return (
    <div className="container py-6 max-w-3xl">
      {/* Back Button */}
      <Link
        href={`/dashboard/templates/${slug}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Template Details
      </Link>

      <TemplateImportWizard
        templateId={template._id}
        templateName={template.name}
        templateVersion={template.version}
        deadlines={template.deadlines}
        regulatoryReferences={template.regulatoryReferences}
        orgId={orgId}
        onComplete={handleComplete}
      />
    </div>
  );
}

export default function TemplateImportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <TemplateImportContent />
    </Suspense>
  );
}
