/**
 * Plan comparison table component for detailed feature comparison.
 */

"use client";

import { PLANS, type BillingCycle } from "@/lib/billing/plans";
import { Check, X, Minus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface PlanComparisonTableProps {
  billingCycle: BillingCycle;
  currentPlanId?: string;
}

type FeatureValue = boolean | number | string | undefined;

interface FeatureRow {
  label: string;
  getValue: (features: typeof PLANS.starter.features) => FeatureValue;
  format?: (value: FeatureValue) => string;
}

const featureRows: FeatureRow[] = [
  {
    label: "Team Members",
    getValue: (f) => f.users,
    format: (v) => (v === -1 ? "Unlimited" : `${v}`),
  },
  {
    label: "Deadlines per Month",
    getValue: (f) => f.deadlines,
    format: (v) => (v === -1 ? "Unlimited" : `${v}`),
  },
  {
    label: "Document Storage",
    getValue: (f) => f.storage,
    format: (v) => `${v}GB`,
  },
  {
    label: "Email Alerts",
    getValue: (f) => f.emailAlerts,
  },
  {
    label: "SMS Alerts",
    getValue: (f) => f.smsAlerts,
  },
  {
    label: "AI Form Pre-fills",
    getValue: (f) => f.formPreFills,
    format: (v) => {
      if (v === 0) return "Not included";
      if (v === -1) return "Unlimited";
      return `${v}/month`;
    },
  },
  {
    label: "Custom Branding",
    getValue: (f) => f.customBranding,
  },
  {
    label: "Priority Support",
    getValue: (f) => f.prioritySupport,
  },
  {
    label: "API Access",
    getValue: (f) => f.apiAccess,
  },
];

const renderValue = (
  value: FeatureValue,
  format?: (v: FeatureValue) => string,
) => {
  if (value === undefined || value === false) {
    return <X className="h-5 w-5 text-muted-foreground mx-auto" />;
  }

  if (typeof value === "boolean" && value) {
    return <Check className="h-5 w-5 text-green-600 mx-auto" />;
  }

  if (typeof value === "number" && value === 0) {
    return <Minus className="h-5 w-5 text-muted-foreground mx-auto" />;
  }

  const formatted = format ? format(value) : String(value);
  return <span className="font-medium">{formatted}</span>;
};

export function PlanComparisonTable({
  billingCycle,
  currentPlanId,
}: PlanComparisonTableProps) {
  const plans = Object.entries(PLANS);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Feature</TableHead>
            {plans.map(([id, plan]) => (
              <TableHead key={id} className="text-center min-w-[140px]">
                <div className="space-y-1">
                  <span className="font-semibold">{plan.name}</span>
                  {currentPlanId === id && (
                    <Badge variant="secondary" className="ml-2">
                      Current
                    </Badge>
                  )}
                  <div className="text-sm font-normal text-muted-foreground">
                    $
                    {billingCycle === "monthly"
                      ? plan.monthlyPrice
                      : Math.round(plan.yearlyPrice / 12)}
                    /mo
                  </div>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {featureRows.map((row) => (
            <TableRow key={row.label}>
              <TableCell className="font-medium">{row.label}</TableCell>
              {plans.map(([id, plan]) => (
                <TableCell key={id} className="text-center">
                  {renderValue(row.getValue(plan.features), row.format)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
