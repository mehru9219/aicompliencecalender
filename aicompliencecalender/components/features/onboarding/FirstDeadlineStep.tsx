"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { format, addDays } from "date-fns";

interface FirstDeadlineStepProps {
  orgId: Id<"organizations">;
  industry?: string;
  onComplete: () => void;
}

const CATEGORIES = [
  { value: "licenses", label: "Licenses & Permits" },
  { value: "certifications", label: "Certifications" },
  { value: "training", label: "Training & Education" },
  { value: "insurance", label: "Insurance" },
  { value: "reporting", label: "Reporting & Filing" },
  { value: "inspections", label: "Inspections & Audits" },
  { value: "other", label: "Other" },
];

// Industry-specific suggestions
const SUGGESTIONS: Record<string, { title: string; category: string }[]> = {
  healthcare_medical: [
    { title: "Medical License Renewal", category: "licenses" },
    { title: "DEA Registration Renewal", category: "licenses" },
    { title: "HIPAA Compliance Training", category: "training" },
    { title: "Malpractice Insurance Renewal", category: "insurance" },
  ],
  healthcare_dental: [
    { title: "Dental License Renewal", category: "licenses" },
    { title: "X-Ray Equipment Inspection", category: "inspections" },
    { title: "OSHA Compliance Training", category: "training" },
  ],
  legal: [
    { title: "Bar Membership Renewal", category: "licenses" },
    { title: "CLE Credit Deadline", category: "training" },
    { title: "Professional Liability Insurance", category: "insurance" },
  ],
  financial_services: [
    { title: "SEC Quarterly Filing", category: "reporting" },
    { title: "Compliance Training", category: "training" },
    { title: "E&O Insurance Renewal", category: "insurance" },
  ],
  default: [
    { title: "Business License Renewal", category: "licenses" },
    { title: "Insurance Policy Renewal", category: "insurance" },
    { title: "Annual Report Filing", category: "reporting" },
  ],
};

export function FirstDeadlineStep({
  orgId,
  industry,
  onComplete,
}: FirstDeadlineStepProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const markStepComplete = useMutation(api.onboarding.markStepComplete);
  const createDeadline = useMutation(api.deadlines.create);

  const suggestions = industry
    ? SUGGESTIONS[industry] || SUGGESTIONS.default
    : SUGGESTIONS.default;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!category) {
      newErrors.category = "Please select a category";
    }
    if (!dueDate) {
      newErrors.dueDate = "Due date is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSuggestion = (suggestion: {
    title: string;
    category: string;
  }) => {
    setTitle(suggestion.title);
    setCategory(suggestion.category);
    // Set due date to 90 days from now as default
    setDueDate(format(addDays(new Date(), 90), "yyyy-MM-dd"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await createDeadline({
        orgId,
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        dueDate: new Date(dueDate).getTime(),
        createdBy: "temp-user",
      });
      await markStepComplete({ orgId, step: "first_deadline" });
      onComplete();
    } catch (error) {
      console.error("Failed to create deadline:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
          <Calendar className="size-6 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold">Create your first deadline</h2>
        <p className="text-muted-foreground mt-1">
          Add a compliance deadline to start tracking
        </p>
      </div>

      {/* Quick Suggestions */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="size-4" />
          <span>Quick suggestions for your industry</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, i) => (
            <Button
              key={i}
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handleSuggestion(suggestion)}
            >
              {suggestion.title}
            </Button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">
            Deadline Title <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Annual License Renewal"
            aria-invalid={!!errors.title}
          />
          {errors.title && (
            <p className="text-sm text-red-500">{errors.title}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">
              Category <span className="text-red-500">*</span>
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category" aria-invalid={!!errors.category}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-red-500">{errors.category}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">
              Due Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={format(new Date(), "yyyy-MM-dd")}
              aria-invalid={!!errors.dueDate}
            />
            {errors.dueDate && (
              <p className="text-sm text-red-500">{errors.dueDate}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">
            Description{" "}
            <span className="text-muted-foreground text-sm">(Optional)</span>
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add any notes or requirements..."
            rows={2}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              Create Deadline
              <ArrowRight className="size-4 ml-2" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
