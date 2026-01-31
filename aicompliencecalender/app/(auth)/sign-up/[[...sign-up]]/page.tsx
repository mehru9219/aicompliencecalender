"use client";

import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

export default function SignUpPage() {
  const { resolvedTheme } = useTheme();

  return (
    <SignUp
      appearance={{
        baseTheme: resolvedTheme === "dark" ? dark : undefined,
        variables: {
          colorPrimary: "oklch(0.4341 0.0392 41.9938)",
          colorBackground: resolvedTheme === "dark" ? "oklch(0.2134 0 0)" : "oklch(0.9911 0 0)",
          colorText: resolvedTheme === "dark" ? "oklch(0.9491 0 0)" : "oklch(0.2435 0 0)",
          colorInputBackground: resolvedTheme === "dark" ? "oklch(0.1776 0 0)" : "oklch(0.9821 0 0)",
          colorInputText: resolvedTheme === "dark" ? "oklch(0.9491 0 0)" : "oklch(0.2435 0 0)",
          borderRadius: "0.75rem",
          fontFamily: "inherit",
        },
        elements: {
          rootBox: "w-full",
          card: "shadow-xl border border-border rounded-2xl bg-card",
          headerTitle: "text-foreground font-bold",
          headerSubtitle: "text-muted-foreground",
          socialButtonsBlockButton:
            "border-border bg-background hover:bg-muted text-foreground",
          socialButtonsBlockButtonText: "text-foreground font-medium",
          dividerLine: "bg-border",
          dividerText: "text-muted-foreground",
          formFieldLabel: "text-foreground font-medium",
          formFieldInput:
            "border-input bg-background text-foreground focus:ring-primary focus:border-primary",
          formButtonPrimary:
            "bg-primary hover:bg-primary/90 text-primary-foreground font-medium",
          footerActionLink: "text-primary hover:text-primary/80 font-medium",
          footerActionText: "text-muted-foreground",
          identityPreviewEditButton: "text-primary hover:text-primary/80",
          formFieldAction: "text-primary hover:text-primary/80",
          alertText: "text-destructive",
          formFieldInputShowPasswordButton: "text-muted-foreground hover:text-foreground",
        },
      }}
      fallbackRedirectUrl="/dashboard"
      signInUrl="/sign-in"
    />
  );
}
