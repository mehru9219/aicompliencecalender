"use client";

import { useCallback, useState } from "react";
import {
  Download,
  Copy,
  Calendar,
  Apple,
  Check,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  generateWebcalUrl,
  generateGoogleCalendarUrl,
} from "@/lib/calendar/ical";

interface CalendarExportMenuProps {
  orgId: string;
}

export function CalendarExportMenu({ orgId }: CalendarExportMenuProps) {
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [instructionType, setInstructionType] = useState<
    "google" | "apple" | null
  >(null);
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const feedUrl = `${baseUrl}/api/calendar/${orgId}/feed.ics`;
  const webcalUrl = generateWebcalUrl(baseUrl, orgId);
  const googleUrl = generateGoogleCalendarUrl(baseUrl, orgId);

  const handleDownload = useCallback(() => {
    window.open(feedUrl, "_blank");
    toast.success("Download started", {
      description: "Your calendar file is being downloaded",
    });
  }, [feedUrl]);

  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      toast.success("URL copied", {
        description: "Subscription URL copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy", {
        description: "Please copy the URL manually",
      });
    }
  }, [feedUrl]);

  const handleGoogleCalendar = useCallback(() => {
    setInstructionType("google");
    setInstructionsOpen(true);
  }, []);

  const handleAppleCalendar = useCallback(() => {
    // Open webcal URL which triggers Apple Calendar
    window.open(webcalUrl, "_blank");
    setInstructionType("apple");
    setInstructionsOpen(true);
  }, [webcalUrl]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <Download className="size-4" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Export Calendar</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleDownload}>
            <Download className="size-4 mr-2" />
            Download .ics file
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleCopyUrl}>
            {copied ? (
              <Check className="size-4 mr-2 text-green-500" />
            ) : (
              <Copy className="size-4 mr-2" />
            )}
            Copy subscription URL
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
            Subscribe in app
          </DropdownMenuLabel>

          <DropdownMenuItem onClick={handleGoogleCalendar}>
            <Calendar className="size-4 mr-2" />
            Add to Google Calendar
            <ExternalLink className="size-3 ml-auto opacity-50" />
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleAppleCalendar}>
            <Apple className="size-4 mr-2" />
            Add to Apple Calendar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Instructions Dialog */}
      <Dialog open={instructionsOpen} onOpenChange={setInstructionsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {instructionType === "google"
                ? "Add to Google Calendar"
                : "Add to Apple Calendar"}
            </DialogTitle>
            <DialogDescription>
              Follow these steps to subscribe to your compliance calendar
            </DialogDescription>
          </DialogHeader>

          {instructionType === "google" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Option 1: Direct link</p>
                <Button asChild className="w-full">
                  <a href={googleUrl} target="_blank" rel="noopener noreferrer">
                    Open in Google Calendar
                    <ExternalLink className="size-4 ml-2" />
                  </a>
                </Button>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Option 2: Manual subscription
                </p>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Open Google Calendar</li>
                  <li>Click the + next to &quot;Other calendars&quot;</li>
                  <li>Select &quot;From URL&quot;</li>
                  <li>Paste this URL:</li>
                </ol>
                <div className="flex gap-2">
                  <code className="flex-1 p-2 bg-muted rounded text-xs break-all">
                    {feedUrl}
                  </code>
                  <Button variant="outline" size="icon" onClick={handleCopyUrl}>
                    {copied ? (
                      <Check className="size-4 text-green-500" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {instructionType === "apple" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                A calendar subscription prompt should have appeared. If not:
              </p>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Open the Calendar app on your Mac or iPhone</li>
                <li>
                  Go to File → New Calendar Subscription (Mac) or add account
                  (iOS)
                </li>
                <li>Paste this URL:</li>
              </ol>
              <div className="flex gap-2">
                <code className="flex-1 p-2 bg-muted rounded text-xs break-all">
                  {webcalUrl}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={async () => {
                    await navigator.clipboard.writeText(webcalUrl);
                    toast.success("URL copied");
                  }}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                The calendar will update automatically every 15 minutes.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
