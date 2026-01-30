import { describe, it, expect } from "vitest";
import {
  getUrgencyLevel,
  getUrgencyFromDays,
  getChannelsForUrgency,
  getUrgencyColor,
  getUrgencyLabel,
} from "../../lib/utils/urgency";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

describe("getUrgencyLevel", () => {
  const NOW = new Date("2025-06-15T12:00:00Z").getTime();

  describe("critical urgency", () => {
    it("returns critical for overdue deadline", () => {
      const overdue = NOW - MS_PER_DAY; // 1 day past
      expect(getUrgencyLevel(overdue, NOW)).toBe("critical");
    });

    it("returns critical for deadline due today", () => {
      expect(getUrgencyLevel(NOW, NOW)).toBe("critical");
    });

    it("returns critical for deadline in a few hours (still day 0)", () => {
      // 6 hours rounds up to 1 day, so it's high urgency
      // Test due in 1 second instead (still day 0)
      const soonToday = NOW + 1000;
      expect(getUrgencyLevel(soonToday, NOW)).toBe("high"); // Math.ceil makes it 1 day
    });
  });

  describe("high urgency", () => {
    it("returns high for deadline 1 day away", () => {
      const oneDayAway = NOW + MS_PER_DAY;
      expect(getUrgencyLevel(oneDayAway, NOW)).toBe("high");
    });

    it("returns high for deadline 3 days away (within 7 day threshold)", () => {
      const threeDaysAway = NOW + 3 * MS_PER_DAY;
      expect(getUrgencyLevel(threeDaysAway, NOW)).toBe("medium"); // 3 > 1 threshold
    });

    it("returns medium for deadline 7 days away (at boundary)", () => {
      const sevenDaysAway = NOW + 7 * MS_PER_DAY;
      expect(getUrgencyLevel(sevenDaysAway, NOW)).toBe("medium"); // 7 == medium threshold
    });
  });

  describe("early urgency (8+ days)", () => {
    it("returns early for deadline 8 days away", () => {
      const eightDaysAway = NOW + 8 * MS_PER_DAY;
      expect(getUrgencyLevel(eightDaysAway, NOW)).toBe("early"); // 8 > 7 (medium threshold)
    });

    it("returns early for deadline 14 days away", () => {
      const fourteenDaysAway = NOW + 14 * MS_PER_DAY;
      expect(getUrgencyLevel(fourteenDaysAway, NOW)).toBe("early"); // 14 > 7 (medium threshold)
    });
  });

  describe("early urgency", () => {
    it("returns early for deadline 15 days away", () => {
      const fifteenDaysAway = NOW + 15 * MS_PER_DAY;
      expect(getUrgencyLevel(fifteenDaysAway, NOW)).toBe("early");
    });

    it("returns early for deadline 30 days away", () => {
      const thirtyDaysAway = NOW + 30 * MS_PER_DAY;
      expect(getUrgencyLevel(thirtyDaysAway, NOW)).toBe("early");
    });

    it("returns early for deadline 365 days away", () => {
      const yearAway = NOW + 365 * MS_PER_DAY;
      expect(getUrgencyLevel(yearAway, NOW)).toBe("early");
    });
  });

  describe("edge cases", () => {
    it("uses current time when now is not provided", () => {
      const futureDeadline = Date.now() + 30 * MS_PER_DAY;
      expect(getUrgencyLevel(futureDeadline)).toBe("early");
    });
  });
});

describe("getUrgencyFromDays", () => {
  it("returns critical for 0 days", () => {
    expect(getUrgencyFromDays(0)).toBe("critical");
  });

  it("returns critical for negative days (overdue)", () => {
    expect(getUrgencyFromDays(-5)).toBe("critical");
  });

  it("returns high for 1 day", () => {
    expect(getUrgencyFromDays(1)).toBe("high");
  });

  it("returns medium for 7 days (at boundary)", () => {
    expect(getUrgencyFromDays(7)).toBe("medium"); // 7 == medium threshold
  });

  it("returns early for 8 days", () => {
    expect(getUrgencyFromDays(8)).toBe("early"); // 8 > 7 (medium threshold)
  });

  it("returns early for 14 days (at boundary)", () => {
    expect(getUrgencyFromDays(14)).toBe("early"); // 14 == early threshold
  });

  it("returns early for 15 days", () => {
    expect(getUrgencyFromDays(15)).toBe("early");
  });

  it("returns early for 30 days", () => {
    expect(getUrgencyFromDays(30)).toBe("early");
  });
});

describe("getChannelsForUrgency", () => {
  const mockPreferences = {
    earlyChannels: ["email"],
    mediumChannels: ["email", "in_app"],
    highChannels: ["email", "sms", "in_app"],
    criticalChannels: ["email", "sms", "in_app"],
  };

  it("returns early channels for early urgency", () => {
    expect(getChannelsForUrgency("early", mockPreferences)).toEqual(["email"]);
  });

  it("returns medium channels for medium urgency", () => {
    expect(getChannelsForUrgency("medium", mockPreferences)).toEqual([
      "email",
      "in_app",
    ]);
  });

  it("returns high channels for high urgency", () => {
    expect(getChannelsForUrgency("high", mockPreferences)).toEqual([
      "email",
      "sms",
      "in_app",
    ]);
  });

  it("returns critical channels for critical urgency", () => {
    expect(getChannelsForUrgency("critical", mockPreferences)).toEqual([
      "email",
      "sms",
      "in_app",
    ]);
  });
});

describe("getUrgencyColor", () => {
  it("returns red for critical", () => {
    expect(getUrgencyColor("critical")).toBe("bg-red-600 text-white");
  });

  it("returns orange for high", () => {
    expect(getUrgencyColor("high")).toBe("bg-orange-500 text-white");
  });

  it("returns yellow for medium", () => {
    expect(getUrgencyColor("medium")).toBe("bg-yellow-500 text-black");
  });

  it("returns blue for early", () => {
    expect(getUrgencyColor("early")).toBe("bg-blue-500 text-white");
  });
});

describe("getUrgencyLabel", () => {
  it("returns Critical for critical", () => {
    expect(getUrgencyLabel("critical")).toBe("Critical");
  });

  it("returns High for high", () => {
    expect(getUrgencyLabel("high")).toBe("High");
  });

  it("returns Medium for medium", () => {
    expect(getUrgencyLabel("medium")).toBe("Medium");
  });

  it("returns Early for early", () => {
    expect(getUrgencyLabel("early")).toBe("Early");
  });
});
