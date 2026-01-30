"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Edit,
  RotateCcw,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FieldMapping {
  value: string;
  source: string;
  confidence: string;
}

interface FieldMappingEditorProps {
  fields: Array<{ name: string; type: string; options?: string[] }>;
  mappings: Record<string, FieldMapping>;
  unmatchedFields: string[];
  onMappingsChange: (mappings: Record<string, FieldMapping>) => void;
  className?: string;
}

// Profile field options for manual mapping
const PROFILE_FIELDS = [
  { key: "legalName", label: "Legal Name" },
  { key: "ein", label: "EIN" },
  { key: "addresses[0].street", label: "Street Address" },
  { key: "addresses[0].city", label: "City" },
  { key: "addresses[0].state", label: "State" },
  { key: "addresses[0].zip", label: "ZIP Code" },
  { key: "addresses[0].country", label: "Country" },
  { key: "phones[0].number", label: "Phone" },
  { key: "emails[0].address", label: "Email" },
  { key: "website", label: "Website" },
  { key: "npiNumber", label: "NPI Number" },
  { key: "licenseNumbers[0].number", label: "License Number" },
  { key: "officers[0].name", label: "Officer Name" },
  { key: "officers[0].title", label: "Officer Title" },
  { key: "_manual", label: "Manual Entry" },
];

export function FieldMappingEditor({
  fields,
  mappings,
  unmatchedFields,
  onMappingsChange,
  className,
}: FieldMappingEditorProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editSource, setEditSource] = useState("");
  const [showUnmapped, setShowUnmapped] = useState(true);
  const [showMapped, setShowMapped] = useState(true);

  // Separate mapped and unmapped fields
  const { mappedFields, unmappedFields } = useMemo(() => {
    const mapped: typeof fields = [];
    const unmapped: typeof fields = [];

    for (const field of fields) {
      if (field.name in mappings) {
        mapped.push(field);
      } else {
        unmapped.push(field);
      }
    }

    return { mappedFields: mapped, unmappedFields: unmapped };
  }, [fields, mappings]);

  const startEditing = useCallback(
    (fieldName: string) => {
      const mapping = mappings[fieldName];
      setEditingField(fieldName);
      setEditValue(mapping?.value || "");
      setEditSource(mapping?.source || "_manual");
    },
    [mappings],
  );

  const cancelEditing = useCallback(() => {
    setEditingField(null);
    setEditValue("");
    setEditSource("");
  }, []);

  const saveEdit = useCallback(() => {
    if (!editingField) return;

    const newMappings = { ...mappings };

    if (editValue.trim()) {
      newMappings[editingField] = {
        value: editValue.trim(),
        source: editSource === "_manual" ? "manual" : editSource,
        confidence: editSource === "_manual" ? "high" : "manual",
      };
    } else {
      delete newMappings[editingField];
    }

    onMappingsChange(newMappings);
    cancelEditing();
  }, [
    editingField,
    editValue,
    editSource,
    mappings,
    onMappingsChange,
    cancelEditing,
  ]);

  const clearMapping = useCallback(
    (fieldName: string) => {
      const newMappings = { ...mappings };
      delete newMappings[fieldName];
      onMappingsChange(newMappings);
    },
    [mappings, onMappingsChange],
  );

  const resetToDetected = useCallback(() => {
    // This would need the original AI-detected mappings to be passed in
    // For now, we just clear manual entries
    onMappingsChange(mappings);
  }, [mappings, onMappingsChange]);

  const clearAll = useCallback(() => {
    onMappingsChange({});
  }, [onMappingsChange]);

  const renderFieldRow = (
    field: { name: string; type: string; options?: string[] },
    mapping?: FieldMapping,
  ) => {
    const isEditing = editingField === field.name;

    return (
      <div
        key={field.name}
        className={cn(
          "p-3 rounded-lg border",
          mapping ? "bg-green-50/50" : "bg-muted/30",
        )}
      >
        {isEditing ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-medium">{field.name}</Label>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={saveEdit}>
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
                <Button size="icon" variant="ghost" onClick={cancelEditing}>
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Source</Label>
                <Select value={editSource} onValueChange={setEditSource}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROFILE_FIELDS.map((pf) => (
                      <SelectItem key={pf.key} value={pf.key}>
                        {pf.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Value</Label>
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="Enter value"
                  className="h-9"
                />
              </div>
            </div>

            {field.type === "dropdown" && field.options && (
              <div>
                <Label className="text-xs text-muted-foreground">Options</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {field.options.map((opt) => (
                    <Badge
                      key={opt}
                      variant="outline"
                      className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => setEditValue(opt)}
                    >
                      {opt}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{field.name}</span>
                <Badge variant="outline" className="text-xs">
                  {field.type}
                </Badge>
              </div>
              {mapping && (
                <div className="mt-1 flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">→</span>
                  <span className="font-medium truncate">{mapping.value}</span>
                  <span className="text-xs text-muted-foreground">
                    ({mapping.source})
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => startEditing(field.name)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              {mapping && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => clearMapping(field.name)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Field Mappings</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetToDetected}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll}>
            <Trash2 className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {/* Mapped Fields */}
            <div>
              <button
                className="flex items-center gap-2 text-sm font-medium mb-2 hover:text-primary"
                onClick={() => setShowMapped(!showMapped)}
              >
                {showMapped ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
                Mapped Fields ({mappedFields.length})
              </button>
              {showMapped && (
                <div className="space-y-2">
                  {mappedFields.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No fields mapped yet
                    </p>
                  ) : (
                    mappedFields.map((field) =>
                      renderFieldRow(field, mappings[field.name]),
                    )
                  )}
                </div>
              )}
            </div>

            {/* Unmapped Fields */}
            <div>
              <button
                className="flex items-center gap-2 text-sm font-medium mb-2 hover:text-primary"
                onClick={() => setShowUnmapped(!showUnmapped)}
              >
                {showUnmapped ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
                Unmapped Fields ({unmappedFields.length})
              </button>
              {showUnmapped && (
                <div className="space-y-2">
                  {unmappedFields.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      All fields are mapped
                    </p>
                  ) : (
                    unmappedFields.map((field) => renderFieldRow(field))
                  )}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="border-t pt-4">
        <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
          <span>
            {mappedFields.length} of {fields.length} fields mapped
          </span>
          <span>
            {Math.round((mappedFields.length / fields.length) * 100) || 0}%
            coverage
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
