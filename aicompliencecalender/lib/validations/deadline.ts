import { z } from "zod";

/** Recurrence type enum */
export const recurrenceTypeSchema = z.enum([
  "weekly",
  "monthly",
  "quarterly",
  "semi_annual",
  "annual",
  "custom",
]);

/** Recurrence base date enum */
export const recurrenceBaseDateSchema = z.enum(["due_date", "completion_date"]);

/** Recurrence pattern schema */
export const recurrenceSchema = z
  .object({
    type: recurrenceTypeSchema,
    interval: z.number().int().positive().optional(),
    endDate: z.number().positive().optional(),
    baseDate: recurrenceBaseDateSchema.optional().default("due_date"),
  })
  .refine(
    (data) => {
      if (data.type === "custom" && !data.interval) {
        return false;
      }
      return true;
    },
    { message: "Custom recurrence requires interval in days" },
  );

/** Deadline category enum */
export const deadlineCategorySchema = z.enum([
  "license",
  "certification",
  "training",
  "audit",
  "filing",
  "insurance",
  "other",
]);

/** Create deadline input schema */
export const createDeadlineSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be under 200 characters"),
  description: z
    .string()
    .max(2000, "Description must be under 2000 characters")
    .optional(),
  dueDate: z.number().positive("Due date is required"),
  category: deadlineCategorySchema,
  recurrence: recurrenceSchema.optional(),
  assignedTo: z.string().optional(),
});

/** Update deadline input schema */
export const updateDeadlineSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be under 200 characters")
    .optional(),
  description: z
    .string()
    .max(2000, "Description must be under 2000 characters")
    .nullish(),
  dueDate: z.number().positive().optional(),
  category: deadlineCategorySchema.optional(),
  recurrence: recurrenceSchema.nullish(),
  assignedTo: z.string().nullish(),
});

/** Filter schema for listing deadlines */
export const deadlineFiltersSchema = z.object({
  status: z
    .array(z.enum(["upcoming", "due_soon", "overdue", "completed"]))
    .optional(),
  category: z.array(deadlineCategorySchema).optional(),
  assignedTo: z.string().optional(),
  fromDate: z.number().optional(),
  toDate: z.number().optional(),
  includeDeleted: z.boolean().optional().default(false),
});

export type CreateDeadlineInput = z.infer<typeof createDeadlineSchema>;
export type UpdateDeadlineInput = z.infer<typeof updateDeadlineSchema>;
export type DeadlineFilters = z.infer<typeof deadlineFiltersSchema>;
export type RecurrencePattern = z.infer<typeof recurrenceSchema>;
