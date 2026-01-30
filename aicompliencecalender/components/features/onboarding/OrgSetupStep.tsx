"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Building2, ArrowRight, Loader2 } from "lucide-react";
import { INDUSTRIES } from "@/types/onboarding";

interface OrgSetupStepProps {
  orgId: Id<"organizations">;
  onComplete: () => void;
}

export function OrgSetupStep({ orgId, onComplete }: OrgSetupStepProps) {
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const markStepComplete = useMutation(api.onboarding.markStepComplete);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!businessName.trim()) {
      newErrors.businessName = "Business name is required";
    }
    if (!industry) {
      newErrors.industry = "Please select your industry";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Note: In production, we'd also update the organization record
      // For now, just mark the step complete
      await markStepComplete({ orgId, step: "org_setup" });
      onComplete();
    } catch (error) {
      console.error("Failed to save organization setup:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
          <Building2 className="size-6 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold">
          Tell us about your organization
        </h2>
        <p className="text-muted-foreground mt-1">
          We&apos;ll use this to personalize your compliance experience
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="businessName">
            Business Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="businessName"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g., ABC Medical Clinic"
            aria-invalid={!!errors.businessName}
          />
          {errors.businessName && (
            <p className="text-sm text-red-500">{errors.businessName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry">
            Industry <span className="text-red-500">*</span>
          </Label>
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger id="industry" aria-invalid={!!errors.industry}>
              <SelectValue placeholder="Select your industry" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((ind) => (
                <SelectItem key={ind.value} value={ind.value}>
                  {ind.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.industry && (
            <p className="text-sm text-red-500">{errors.industry}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">
            Business Address{" "}
            <span className="text-muted-foreground text-sm">(Optional)</span>
          </Label>
          <Textarea
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St, City, State 12345"
            rows={2}
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            Continue
            <ArrowRight className="size-4 ml-2" />
          </>
        )}
      </Button>
    </form>
  );
}
