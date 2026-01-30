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
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Plus,
  X,
  Send,
  Loader2,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
// Role type for invitations (excludes "owner")
type InviteRole = "admin" | "manager" | "member" | "viewer";

interface TeamInviteStepProps {
  orgId: Id<"organizations">;
  onComplete: () => void;
  onSkip: () => void;
}

interface PendingInvite {
  email: string;
  role: InviteRole;
  sent?: boolean;
  error?: string;
}

const ROLES: { value: InviteRole; label: string; description: string }[] = [
  {
    value: "admin",
    label: "Admin",
    description: "Full access, can manage team",
  },
  {
    value: "manager",
    label: "Manager",
    description: "Manage deadlines and documents",
  },
  {
    value: "member",
    label: "Member",
    description: "Complete assigned deadlines",
  },
  {
    value: "viewer",
    label: "Viewer",
    description: "View only access",
  },
];

export function TeamInviteStep({
  orgId,
  onComplete,
  onSkip,
}: TeamInviteStepProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("member");
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markStepComplete = useMutation(api.onboarding.markStepComplete);
  const inviteMember = useMutation(api.team.invite);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleAddInvite = () => {
    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (invites.some((i) => i.email.toLowerCase() === email.toLowerCase())) {
      setError("This email is already in the list");
      return;
    }

    setInvites([...invites, { email: email.trim(), role }]);
    setEmail("");
    setError(null);
  };

  const handleRemoveInvite = (emailToRemove: string) => {
    setInvites(invites.filter((i) => i.email !== emailToRemove));
  };

  const handleSendInvites = async () => {
    if (invites.length === 0) {
      // No invites, just complete
      await markStepComplete({ orgId, step: "team_invited" });
      onComplete();
      return;
    }

    setIsSending(true);
    const updatedInvites = [...invites];

    for (let i = 0; i < updatedInvites.length; i++) {
      const invite = updatedInvites[i];
      if (invite.sent) continue;

      try {
        await inviteMember({
          orgId,
          email: invite.email,
          role: invite.role,
        });
        updatedInvites[i] = { ...invite, sent: true };
      } catch {
        updatedInvites[i] = {
          ...invite,
          error: "Failed to send invite",
        };
      }
      setInvites([...updatedInvites]);
    }

    await markStepComplete({ orgId, step: "team_invited" });
    setIsSending(false);
    onComplete();
  };

  const handleSkip = async () => {
    await markStepComplete({ orgId, step: "team_invited" });
    onSkip();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddInvite();
    }
  };

  const allSent = invites.length > 0 && invites.every((i) => i.sent);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 mb-4">
          <Users className="size-6 text-indigo-600" />
        </div>
        <h2 className="text-xl font-semibold">Invite your team</h2>
        <p className="text-muted-foreground mt-1">
          Add team members to collaborate on compliance tasks
        </p>
        <Badge variant="secondary" className="mt-2">
          Optional step
        </Badge>
      </div>

      {/* Add Invite Form */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <Label htmlFor="email" className="sr-only">
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="colleague@company.com"
            />
          </div>
          <div className="w-32">
            <Label htmlFor="role" className="sr-only">
              Role
            </Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as InviteRole)}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    <span className="font-medium">{r.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={handleAddInvite}
          >
            <Plus className="size-4" />
          </Button>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      {/* Pending Invites List */}
      {invites.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            Pending invites ({invites.length})
          </Label>
          <div className="divide-y rounded-lg border">
            {invites.map((invite) => (
              <div
                key={invite.email}
                className="flex items-center justify-between p-3"
              >
                <div className="flex items-center gap-3">
                  {invite.sent ? (
                    <CheckCircle className="size-4 text-green-500" />
                  ) : invite.error ? (
                    <X className="size-4 text-red-500" />
                  ) : null}
                  <div>
                    <p className="text-sm font-medium">{invite.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {ROLES.find((r) => r.value === invite.role)?.label}
                    </p>
                  </div>
                </div>
                {!invite.sent && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleRemoveInvite(invite.email)}
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={handleSkip} className="flex-1">
          Skip for now
        </Button>
        <Button
          onClick={handleSendInvites}
          disabled={isSending}
          className="flex-1"
        >
          {isSending ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : allSent ? (
            <>
              Continue
              <ArrowRight className="size-4 ml-2" />
            </>
          ) : invites.length > 0 ? (
            <>
              <Send className="size-4 mr-2" />
              Send {invites.length} Invite{invites.length > 1 ? "s" : ""}
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="size-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
