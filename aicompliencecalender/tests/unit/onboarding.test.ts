import { describe, it, expect } from "vitest";
import {
  ONBOARDING_STEPS,
  CHECKLIST_ITEMS,
  INDUSTRIES,
  getRequiredSteps,
  getCompletedStepCount,
  isOnboardingComplete,
  getNextIncompleteStep,
  type OnboardingSteps,
} from "../../types/onboarding";

describe("Onboarding Types", () => {
  describe("ONBOARDING_STEPS constant", () => {
    it("has correct number of steps", () => {
      expect(ONBOARDING_STEPS).toHaveLength(5);
    });

    it("has all required properties for each step", () => {
      ONBOARDING_STEPS.forEach((step) => {
        expect(step).toHaveProperty("id");
        expect(step).toHaveProperty("title");
        expect(step).toHaveProperty("description");
        expect(step).toHaveProperty("required");
      });
    });

    it("has steps in correct order", () => {
      const stepIds = ONBOARDING_STEPS.map((s) => s.id);
      expect(stepIds).toEqual([
        "org_setup",
        "template_imported",
        "alerts_configured",
        "first_deadline",
        "team_invited",
      ]);
    });

    it("marks org_setup, alerts_configured, first_deadline as required", () => {
      const requiredStepIds = ONBOARDING_STEPS.filter((s) => s.required).map(
        (s) => s.id,
      );
      expect(requiredStepIds).toContain("org_setup");
      expect(requiredStepIds).toContain("alerts_configured");
      expect(requiredStepIds).toContain("first_deadline");
    });

    it("marks template_imported, team_invited as optional", () => {
      const optionalStepIds = ONBOARDING_STEPS.filter((s) => !s.required).map(
        (s) => s.id,
      );
      expect(optionalStepIds).toContain("template_imported");
      expect(optionalStepIds).toContain("team_invited");
    });
  });

  describe("CHECKLIST_ITEMS constant", () => {
    it("has correct number of items", () => {
      expect(CHECKLIST_ITEMS).toHaveLength(4);
    });

    it("each item has id, label, and href", () => {
      CHECKLIST_ITEMS.forEach((item) => {
        expect(item).toHaveProperty("id");
        expect(item).toHaveProperty("label");
        expect(item).toHaveProperty("href");
        expect(typeof item.href).toBe("string");
        expect(item.href.startsWith("/")).toBe(true);
      });
    });

    it("has valid hrefs for navigation", () => {
      const hrefs = CHECKLIST_ITEMS.map((i) => i.href);
      expect(hrefs).toContain("/deadlines/new");
      expect(hrefs).toContain("/settings/alerts");
      expect(hrefs).toContain("/settings/team");
      expect(hrefs).toContain("/deadlines");
    });
  });

  describe("INDUSTRIES constant", () => {
    it("has multiple industry options", () => {
      expect(INDUSTRIES.length).toBeGreaterThan(5);
    });

    it("each industry has value and label", () => {
      INDUSTRIES.forEach((industry) => {
        expect(industry).toHaveProperty("value");
        expect(industry).toHaveProperty("label");
        expect(typeof industry.value).toBe("string");
        expect(typeof industry.label).toBe("string");
      });
    });

    it("includes healthcare, legal, and financial industries", () => {
      const values = INDUSTRIES.map((i) => i.value);
      expect(values).toContain("healthcare_medical");
      expect(values).toContain("healthcare_dental");
      expect(values).toContain("legal");
      expect(values).toContain("financial_services");
    });

    it("has 'other' as fallback option", () => {
      const values = INDUSTRIES.map((i) => i.value);
      expect(values).toContain("other");
    });
  });
});

describe("getRequiredSteps", () => {
  it("returns only required step IDs", () => {
    const required = getRequiredSteps();
    expect(required).toContain("org_setup");
    expect(required).toContain("alerts_configured");
    expect(required).toContain("first_deadline");
  });

  it("does not include optional steps", () => {
    const required = getRequiredSteps();
    expect(required).not.toContain("template_imported");
    expect(required).not.toContain("team_invited");
    expect(required).not.toContain("account_created");
    expect(required).not.toContain("first_completion");
  });

  it("returns array with correct length", () => {
    const required = getRequiredSteps();
    expect(required).toHaveLength(3);
  });
});

describe("getCompletedStepCount", () => {
  it("returns 0 for all false steps", () => {
    const steps: OnboardingSteps = {
      account_created: false,
      org_setup: false,
      template_imported: false,
      alerts_configured: false,
      first_deadline: false,
      team_invited: false,
      first_completion: false,
    };
    expect(getCompletedStepCount(steps)).toBe(0);
  });

  it("returns total count for all true steps", () => {
    const steps: OnboardingSteps = {
      account_created: true,
      org_setup: true,
      template_imported: true,
      alerts_configured: true,
      first_deadline: true,
      team_invited: true,
      first_completion: true,
    };
    expect(getCompletedStepCount(steps)).toBe(7);
  });

  it("returns correct count for partial completion", () => {
    const steps: OnboardingSteps = {
      account_created: true,
      org_setup: true,
      template_imported: false,
      alerts_configured: true,
      first_deadline: false,
      team_invited: false,
      first_completion: false,
    };
    expect(getCompletedStepCount(steps)).toBe(3);
  });

  it("counts only boolean true values", () => {
    const steps: OnboardingSteps = {
      account_created: true,
      org_setup: false,
      template_imported: true,
      alerts_configured: false,
      first_deadline: true,
      team_invited: false,
      first_completion: true,
    };
    expect(getCompletedStepCount(steps)).toBe(4);
  });
});

describe("isOnboardingComplete", () => {
  it("returns false when no steps are complete", () => {
    const steps: OnboardingSteps = {
      account_created: true,
      org_setup: false,
      template_imported: false,
      alerts_configured: false,
      first_deadline: false,
      team_invited: false,
      first_completion: false,
    };
    expect(isOnboardingComplete(steps)).toBe(false);
  });

  it("returns false when only optional steps are complete", () => {
    const steps: OnboardingSteps = {
      account_created: true,
      org_setup: false,
      template_imported: true,
      alerts_configured: false,
      first_deadline: false,
      team_invited: true,
      first_completion: true,
    };
    expect(isOnboardingComplete(steps)).toBe(false);
  });

  it("returns false when some required steps are missing", () => {
    const steps: OnboardingSteps = {
      account_created: true,
      org_setup: true,
      template_imported: true,
      alerts_configured: true,
      first_deadline: false, // missing required
      team_invited: true,
      first_completion: true,
    };
    expect(isOnboardingComplete(steps)).toBe(false);
  });

  it("returns true when all required steps are complete", () => {
    const steps: OnboardingSteps = {
      account_created: true,
      org_setup: true,
      template_imported: false,
      alerts_configured: true,
      first_deadline: true,
      team_invited: false,
      first_completion: false,
    };
    expect(isOnboardingComplete(steps)).toBe(true);
  });

  it("returns true when all steps are complete", () => {
    const steps: OnboardingSteps = {
      account_created: true,
      org_setup: true,
      template_imported: true,
      alerts_configured: true,
      first_deadline: true,
      team_invited: true,
      first_completion: true,
    };
    expect(isOnboardingComplete(steps)).toBe(true);
  });
});

describe("getNextIncompleteStep", () => {
  it("returns first step when none are complete", () => {
    const steps: OnboardingSteps = {
      account_created: true,
      org_setup: false,
      template_imported: false,
      alerts_configured: false,
      first_deadline: false,
      team_invited: false,
      first_completion: false,
    };
    const next = getNextIncompleteStep(steps);
    expect(next).not.toBeNull();
    expect(next?.id).toBe("org_setup");
  });

  it("returns second step when first is complete", () => {
    const steps: OnboardingSteps = {
      account_created: true,
      org_setup: true,
      template_imported: false,
      alerts_configured: false,
      first_deadline: false,
      team_invited: false,
      first_completion: false,
    };
    const next = getNextIncompleteStep(steps);
    expect(next).not.toBeNull();
    expect(next?.id).toBe("template_imported");
  });

  it("skips completed steps correctly", () => {
    const steps: OnboardingSteps = {
      account_created: true,
      org_setup: true,
      template_imported: true,
      alerts_configured: true,
      first_deadline: false,
      team_invited: false,
      first_completion: false,
    };
    const next = getNextIncompleteStep(steps);
    expect(next).not.toBeNull();
    expect(next?.id).toBe("first_deadline");
  });

  it("returns last incomplete step", () => {
    const steps: OnboardingSteps = {
      account_created: true,
      org_setup: true,
      template_imported: true,
      alerts_configured: true,
      first_deadline: true,
      team_invited: false,
      first_completion: false,
    };
    const next = getNextIncompleteStep(steps);
    expect(next).not.toBeNull();
    expect(next?.id).toBe("team_invited");
  });

  it("returns null when all wizard steps are complete", () => {
    const steps: OnboardingSteps = {
      account_created: true,
      org_setup: true,
      template_imported: true,
      alerts_configured: true,
      first_deadline: true,
      team_invited: true,
      first_completion: true,
    };
    const next = getNextIncompleteStep(steps);
    expect(next).toBeNull();
  });

  it("returns step with all properties", () => {
    const steps: OnboardingSteps = {
      account_created: true,
      org_setup: false,
      template_imported: false,
      alerts_configured: false,
      first_deadline: false,
      team_invited: false,
      first_completion: false,
    };
    const next = getNextIncompleteStep(steps);
    expect(next).not.toBeNull();
    expect(next?.title).toBe("Set Up Organization");
    expect(next?.description).toBeDefined();
    expect(next?.required).toBe(true);
  });
});

describe("Onboarding Progress Logic", () => {
  describe("Progress calculation", () => {
    it("calculates percentage correctly", () => {
      const steps: OnboardingSteps = {
        account_created: true,
        org_setup: true,
        template_imported: false,
        alerts_configured: true,
        first_deadline: false,
        team_invited: false,
        first_completion: false,
      };
      const completed = getCompletedStepCount(steps);
      const total = Object.keys(steps).length;
      const percentage = Math.round((completed / total) * 100);
      expect(percentage).toBe(43); // 3/7 = 42.8... rounded to 43
    });
  });

  describe("Reminder eligibility", () => {
    it("24h reminder window is 24-48 hours", () => {
      const lastActivityAt = Date.now() - 24 * 60 * 60 * 1000;
      const hoursSinceActivity =
        (Date.now() - lastActivityAt) / (1000 * 60 * 60);
      expect(hoursSinceActivity >= 24 && hoursSinceActivity < 48).toBe(true);
    });

    it("7d reminder window is 168-192 hours", () => {
      const lastActivityAt = Date.now() - 168 * 60 * 60 * 1000;
      const hoursSinceActivity =
        (Date.now() - lastActivityAt) / (1000 * 60 * 60);
      expect(hoursSinceActivity >= 168 && hoursSinceActivity < 192).toBe(true);
    });

    it("too early for 24h reminder", () => {
      const lastActivityAt = Date.now() - 12 * 60 * 60 * 1000;
      const hoursSinceActivity =
        (Date.now() - lastActivityAt) / (1000 * 60 * 60);
      expect(hoursSinceActivity >= 24).toBe(false);
    });

    it("too late for 7d reminder", () => {
      const lastActivityAt = Date.now() - 200 * 60 * 60 * 1000;
      const hoursSinceActivity =
        (Date.now() - lastActivityAt) / (1000 * 60 * 60);
      expect(hoursSinceActivity < 192).toBe(false);
    });
  });

  describe("Step completion tracking", () => {
    it("tracks individual step completion", () => {
      const steps: OnboardingSteps = {
        account_created: true,
        org_setup: false,
        template_imported: false,
        alerts_configured: false,
        first_deadline: false,
        team_invited: false,
        first_completion: false,
      };

      // Mark step complete
      const updatedSteps = { ...steps, org_setup: true };

      expect(steps.org_setup).toBe(false);
      expect(updatedSteps.org_setup).toBe(true);
      expect(getCompletedStepCount(updatedSteps)).toBe(
        getCompletedStepCount(steps) + 1,
      );
    });

    it("preserves other steps when updating one", () => {
      const steps: OnboardingSteps = {
        account_created: true,
        org_setup: true,
        template_imported: false,
        alerts_configured: false,
        first_deadline: false,
        team_invited: false,
        first_completion: false,
      };

      const updatedSteps = { ...steps, alerts_configured: true };

      expect(updatedSteps.account_created).toBe(true);
      expect(updatedSteps.org_setup).toBe(true);
      expect(updatedSteps.template_imported).toBe(false);
      expect(updatedSteps.alerts_configured).toBe(true);
    });
  });
});

describe("Edge Cases", () => {
  it("handles minimum viable completion", () => {
    // Only required steps complete, nothing else
    const minimalSteps: OnboardingSteps = {
      account_created: false,
      org_setup: true,
      template_imported: false,
      alerts_configured: true,
      first_deadline: true,
      team_invited: false,
      first_completion: false,
    };
    expect(isOnboardingComplete(minimalSteps)).toBe(true);
    expect(getCompletedStepCount(minimalSteps)).toBe(3);
  });

  it("handles wizard steps separate from checklist tracking", () => {
    // Wizard complete, but first_completion not yet done
    const steps: OnboardingSteps = {
      account_created: true,
      org_setup: true,
      template_imported: true,
      alerts_configured: true,
      first_deadline: true,
      team_invited: true,
      first_completion: false,
    };

    // Wizard should be considered complete
    expect(isOnboardingComplete(steps)).toBe(true);

    // But checklist still has items
    const nextIncomplete = CHECKLIST_ITEMS.find((item) => !steps[item.id]);
    expect(nextIncomplete).toBeDefined();
    expect(nextIncomplete?.id).toBe("first_completion");
  });
});
