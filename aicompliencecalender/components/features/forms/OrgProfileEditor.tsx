"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Loader2,
  Plus,
  Trash2,
  Building2,
  MapPin,
  Phone,
  Mail,
  FileText,
  Users,
} from "lucide-react";
import {
  ADDRESS_TYPES,
  PHONE_TYPES,
  EMAIL_TYPES,
  LICENSE_TYPES,
} from "@/types/profile";

// Form-specific type definition
interface FormValues {
  legalName: string;
  dbaNames: string[];
  ein: string;
  addresses: Array<{
    type: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  }>;
  phones: Array<{
    type: string;
    number: string;
  }>;
  emails: Array<{
    type: string;
    address: string;
  }>;
  website?: string;
  licenseNumbers: Array<{
    type: string;
    number: string;
    state?: string;
    expiry?: number;
  }>;
  npiNumber?: string;
  officers: Array<{
    name: string;
    title: string;
    email: string;
  }>;
  incorporationDate?: number;
}

interface OrgProfileEditorProps {
  orgId: Id<"organizations">;
  onSave?: () => void;
}

export function OrgProfileEditor({ orgId, onSave }: OrgProfileEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  const profile = useQuery(api.profiles.get, { orgId });
  const upsertProfile = useMutation(api.profiles.upsert);

  const form = useForm<FormValues>({
    defaultValues: {
      legalName: "",
      dbaNames: [],
      ein: "",
      addresses: [
        {
          type: "primary",
          street: "",
          city: "",
          state: "",
          zip: "",
          country: "USA",
        },
      ],
      phones: [{ type: "main", number: "" }],
      emails: [{ type: "primary", address: "" }],
      website: "",
      licenseNumbers: [],
      npiNumber: "",
      officers: [],
    },
  });

  const {
    fields: dbaFields,
    append: appendDba,
    remove: removeDba,
  } = useFieldArray({
    control: form.control,
    name: "dbaNames" as never,
  });

  const {
    fields: addressFields,
    append: appendAddress,
    remove: removeAddress,
  } = useFieldArray({
    control: form.control,
    name: "addresses",
  });

  const {
    fields: phoneFields,
    append: appendPhone,
    remove: removePhone,
  } = useFieldArray({
    control: form.control,
    name: "phones",
  });

  const {
    fields: emailFields,
    append: appendEmail,
    remove: removeEmail,
  } = useFieldArray({
    control: form.control,
    name: "emails",
  });

  const {
    fields: licenseFields,
    append: appendLicense,
    remove: removeLicense,
  } = useFieldArray({
    control: form.control,
    name: "licenseNumbers",
  });

  const {
    fields: officerFields,
    append: appendOfficer,
    remove: removeOfficer,
  } = useFieldArray({
    control: form.control,
    name: "officers",
  });

  // Load existing profile data
  useEffect(() => {
    if (profile) {
      form.reset({
        legalName: profile.legalName,
        dbaNames: profile.dbaNames,
        ein: profile.ein,
        addresses:
          profile.addresses.length > 0
            ? profile.addresses
            : [
                {
                  type: "primary",
                  street: "",
                  city: "",
                  state: "",
                  zip: "",
                  country: "USA",
                },
              ],
        phones:
          profile.phones.length > 0
            ? profile.phones
            : [{ type: "main", number: "" }],
        emails:
          profile.emails.length > 0
            ? profile.emails
            : [{ type: "primary", address: "" }],
        website: profile.website ?? "",
        licenseNumbers: profile.licenseNumbers,
        npiNumber: profile.npiNumber ?? "",
        officers: profile.officers,
        incorporationDate: profile.incorporationDate,
      });
    }
  }, [profile, form]);

  // Auto-save on blur
  const handleAutoSave = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    const values = form.getValues();
    setSaveStatus("saving");

    try {
      await upsertProfile({
        orgId,
        ...values,
        dbaNames: values.dbaNames ?? [],
        addresses: values.addresses ?? [],
        phones: values.phones ?? [],
        emails: values.emails ?? [],
        licenseNumbers: values.licenseNumbers ?? [],
        officers: values.officers ?? [],
        website: values.website || undefined,
        npiNumber: values.npiNumber || undefined,
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
    }
  };

  const handleSubmit = async (values: FormValues) => {
    setIsSaving(true);
    try {
      await upsertProfile({
        orgId,
        ...values,
        dbaNames: values.dbaNames ?? [],
        addresses: values.addresses ?? [],
        phones: values.phones ?? [],
        emails: values.emails ?? [],
        licenseNumbers: values.licenseNumbers ?? [],
        officers: values.officers ?? [],
        website: values.website || undefined,
        npiNumber: values.npiNumber || undefined,
      });
      onSave?.();
    } finally {
      setIsSaving(false);
    }
  };

  if (profile === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Save Status Indicator */}
        {saveStatus !== "idle" && (
          <div
            className={`text-sm px-3 py-1 rounded-md inline-block ${
              saveStatus === "saving"
                ? "bg-blue-50 text-blue-700"
                : saveStatus === "saved"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
            }`}
          >
            {saveStatus === "saving" && "Saving..."}
            {saveStatus === "saved" && "Saved!"}
            {saveStatus === "error" && "Error saving"}
          </div>
        )}

        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Business Information
            </CardTitle>
            <CardDescription>
              Basic information about your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="legalName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Legal Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter legal business name"
                      {...field}
                      onBlur={() => {
                        field.onBlur();
                        handleAutoSave();
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel className="mb-2 block">DBA Names</FormLabel>
              {dbaFields.map((field, index) => (
                <div key={field.id} className="flex gap-2 mb-2">
                  <Input
                    {...form.register(`dbaNames.${index}` as const)}
                    placeholder="Doing Business As name"
                    onBlur={handleAutoSave}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDba(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendDba("")}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add DBA
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="ein"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>EIN (Tax ID) *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="XX-XXXXXXX"
                        {...field}
                        onBlur={() => {
                          field.onBlur();
                          handleAutoSave();
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com"
                        {...field}
                        onBlur={() => {
                          field.onBlur();
                          handleAutoSave();
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Addresses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Addresses
            </CardTitle>
            <CardDescription>
              Business locations and mailing addresses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {addressFields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <FormField
                    control={form.control}
                    name={`addresses.${index}.type`}
                    render={({ field }) => (
                      <FormItem className="w-40">
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(ADDRESS_TYPES).map(
                              ([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  {addressFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAddress(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name={`addresses.${index}.street`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="123 Main St"
                          onBlur={handleAutoSave}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-3 sm:grid-cols-4">
                  <FormField
                    control={form.control}
                    name={`addresses.${index}.city`}
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>City *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="City"
                            onBlur={handleAutoSave}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`addresses.${index}.state`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="CA"
                            onBlur={handleAutoSave}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`addresses.${index}.zip`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="12345"
                            onBlur={handleAutoSave}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendAddress({
                  type: "mailing",
                  street: "",
                  city: "",
                  state: "",
                  zip: "",
                  country: "USA",
                })
              }
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Address
            </Button>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </CardTitle>
            <CardDescription>Phone numbers and email addresses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Phones */}
            <div>
              <FormLabel className="mb-2 block">Phone Numbers</FormLabel>
              {phoneFields.map((field, index) => (
                <div key={field.id} className="flex gap-2 mb-2">
                  <FormField
                    control={form.control}
                    name={`phones.${index}.type`}
                    render={({ field }) => (
                      <FormItem className="w-32">
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(PHONE_TYPES).map(
                              ([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`phones.${index}.number`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="(555) 123-4567"
                            onBlur={handleAutoSave}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {phoneFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePhone(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendPhone({ type: "main", number: "" })}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Phone
              </Button>
            </div>

            {/* Emails */}
            <div>
              <FormLabel className="mb-2 block flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Addresses
              </FormLabel>
              {emailFields.map((field, index) => (
                <div key={field.id} className="flex gap-2 mb-2">
                  <FormField
                    control={form.control}
                    name={`emails.${index}.type`}
                    render={({ field }) => (
                      <FormItem className="w-32">
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(EMAIL_TYPES).map(
                              ([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`emails.${index}.address`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="email@example.com"
                            type="email"
                            onBlur={handleAutoSave}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {emailFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEmail(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendEmail({ type: "primary", address: "" })}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Email
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Licenses & Certifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Licenses & Certifications
            </CardTitle>
            <CardDescription>
              Business licenses, professional certifications, and regulatory IDs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="npiNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NPI Number (Healthcare)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="10-digit NPI"
                      maxLength={10}
                      onBlur={() => {
                        field.onBlur();
                        handleAutoSave();
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel className="mb-2 block">License Numbers</FormLabel>
              {licenseFields.map((field, index) => (
                <div
                  key={field.id}
                  className="border rounded-lg p-3 mb-2 space-y-2"
                >
                  <div className="flex gap-2">
                    <FormField
                      control={form.control}
                      name={`licenseNumbers.${index}.type`}
                      render={({ field }) => (
                        <FormItem className="w-40">
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="License Type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(LICENSE_TYPES).map(
                                ([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`licenseNumbers.${index}.number`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="License number"
                              onBlur={handleAutoSave}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`licenseNumbers.${index}.state`}
                      render={({ field }) => (
                        <FormItem className="w-24">
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="State"
                              onBlur={handleAutoSave}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLicense(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendLicense({ type: "business", number: "", state: "" })
                }
              >
                <Plus className="h-4 w-4 mr-1" />
                Add License
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Officers & Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Officers & Contacts
            </CardTitle>
            <CardDescription>
              Key personnel and authorized representatives
            </CardDescription>
          </CardHeader>
          <CardContent>
            {officerFields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-3 mb-2">
                <div className="flex gap-2 items-start">
                  <div className="flex-1 grid gap-2 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name={`officers.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Full name"
                              onBlur={handleAutoSave}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`officers.${index}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Title (e.g., CEO)"
                              onBlur={handleAutoSave}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`officers.${index}.email`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Email"
                              type="email"
                              onBlur={handleAutoSave}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOfficer(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendOfficer({ name: "", title: "", email: "" })}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Officer
            </Button>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Profile
          </Button>
        </div>
      </form>
    </Form>
  );
}
