"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Bell,
  Mail,
  Smartphone,
  CheckCircle,
  Loader2,
  ArrowRight,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertSetupStepProps {
  orgId: Id<"organizations">;
  onComplete: () => void;
}

type AlertChannel = "email" | "email_sms";

export function AlertSetupStep({ orgId, onComplete }: AlertSetupStepProps) {
  const [channel, setChannel] = useState<AlertChannel>("email");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [testSent, setTestSent] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const markStepComplete = useMutation(api.onboarding.markStepComplete);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const cleaned = value.replace(/\D/g, "");
    // Format as (XXX) XXX-XXXX
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6)
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const isPhoneValid = () => {
    if (channel === "email") return true;
    const cleaned = phoneNumber.replace(/\D/g, "");
    return cleaned.length === 10;
  };

  const handleSendTest = async () => {
    if (channel === "email_sms" && !isPhoneValid()) {
      setTestError("Please enter a valid 10-digit phone number");
      return;
    }

    setIsSending(true);
    setTestError(null);

    try {
      // In production, call api.alerts.sendTestAlert
      // For now, simulate the test
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setTestSent(true);
    } catch {
      setTestError("Failed to send test alert. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleContinue = async () => {
    setIsSubmitting(true);
    try {
      // In production, save alert preferences
      await markStepComplete({ orgId, step: "alerts_configured" });
      onComplete();
    } catch (error) {
      console.error("Failed to save alert preferences:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 mb-4">
          <Bell className="size-6 text-amber-600" />
        </div>
        <h2 className="text-xl font-semibold">How should we alert you?</h2>
        <p className="text-muted-foreground mt-1">
          Choose how you want to receive deadline reminders
        </p>
      </div>

      <RadioGroup
        value={channel}
        onValueChange={(v: string) => setChannel(v as AlertChannel)}
        className="space-y-3"
      >
        <label
          className={cn(
            "flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all",
            channel === "email"
              ? "border-primary bg-primary/5"
              : "hover:border-muted-foreground/50",
          )}
        >
          <RadioGroupItem value="email" />
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 rounded-lg bg-blue-100">
              <Mail className="size-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">Email only</p>
              <p className="text-sm text-muted-foreground">
                Receive all reminders via email
              </p>
            </div>
          </div>
        </label>

        <label
          className={cn(
            "flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all",
            channel === "email_sms"
              ? "border-primary bg-primary/5"
              : "hover:border-muted-foreground/50",
          )}
        >
          <RadioGroupItem value="email_sms" id="channel-email-sms" />
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 rounded-lg bg-green-100">
              <Smartphone className="size-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium">Email + SMS</p>
              <p className="text-sm text-muted-foreground">
                Get SMS for urgent alerts (7 days or less)
              </p>
            </div>
          </div>
        </label>
      </RadioGroup>

      {/* Phone Number Input */}
      {channel === "email_sms" && (
        <div className="space-y-2 pl-8">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder="(555) 555-5555"
            maxLength={14}
          />
          <p className="text-xs text-muted-foreground">
            US phone numbers only. Standard messaging rates may apply.
          </p>
        </div>
      )}

      {/* Test Alert */}
      <div className="pt-4 border-t">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Verify delivery works</p>
            <p className="text-sm text-muted-foreground">
              We&apos;ll send a test alert to confirm you receive it
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleSendTest}
            disabled={
              isSending ||
              testSent ||
              (channel === "email_sms" && !isPhoneValid())
            }
          >
            {isSending ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : testSent ? (
              <>
                <CheckCircle className="size-4 mr-2 text-green-500" />
                Sent
              </>
            ) : (
              <>
                <Send className="size-4 mr-2" />
                Send Test Alert
              </>
            )}
          </Button>
        </div>

        {testError && (
          <Alert variant="destructive" className="mt-3">
            <AlertDescription>{testError}</AlertDescription>
          </Alert>
        )}

        {testSent && (
          <Alert className="mt-3 border-green-200 bg-green-50">
            <CheckCircle className="size-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Test alert sent! Check your{" "}
              {channel === "email_sms" ? "email and phone" : "email"}.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Button
        onClick={handleContinue}
        disabled={!testSent || isSubmitting}
        className="w-full"
      >
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

      {!testSent && (
        <p className="text-xs text-center text-muted-foreground">
          You need to send and verify a test alert before continuing
        </p>
      )}
    </div>
  );
}
