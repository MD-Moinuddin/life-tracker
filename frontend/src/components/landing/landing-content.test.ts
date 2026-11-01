import { describe, expect, it } from "vitest";
import contentSource from "./landing-content.ts?raw";
import { JOB_COLORS } from "../../lib/job-color";
import {
  FEATURES,
  LANDING_CTA,
  LANDING_FEATURES,
  LANDING_SECTION_IDS,
  LANDING_SECTION_LINKS,
  MINI_JOB_SPOTLIGHT,
  PHONE_SHOWCASE,
  PREVIEW,
  miniJobMessage,
} from "./landing-content";

const euro = (amount: string) => `€${amount}`;

describe("LANDING_CTA", () => {
  it("has non-empty, distinct labels", () => {
    const labels: string[] = Object.values(LANDING_CTA);

    expect(labels.every((label) => label !== "")).toBe(true);
    expect(new Set(labels).size).toBe(labels.length);
  });
});

describe("LANDING_FEATURES", () => {
  it("has six distinctly named features", () => {
    expect(LANDING_FEATURES).toHaveLength(6);
    expect(new Set(LANDING_FEATURES.map((f) => f.title)).size).toBe(6);
    expect(FEATURES.title).not.toBe("");
  });

  it("points every feature at a colour that exists", () => {
    for (const feature of LANDING_FEATURES) {
      expect(JOB_COLORS[feature.colorIndex]).toBeDefined();
    }
  });
});

describe("paid vacation copy", () => {
  it("replaces the list or week view feature with the vacation balance", () => {
    const titles = LANDING_FEATURES.map((f) => f.title);
    const vacation = LANDING_FEATURES.find(
      (f) => f.title === "Paid vacation balance",
    );

    expect(titles).not.toContain("List or week view");
    expect(vacation?.description).toBe(
      "Track your paid leave, see the hours you have left, and book a week or two with the pay shown.",
    );
    expect(vacation?.icon).toBe("sun");
    expect(vacation?.colorIndex).toBe(2);
  });

  it("keeps the list and the week view in the phone feature", () => {
    const phone = LANDING_FEATURES.find(
      (f) => f.title === "Made for your phone",
    );

    expect(phone?.description).toBe(
      "A list or a week view, a bottom tab bar and a floating button, so you can log a shift in seconds.",
    );
  });

  it("has an example vacation balance in the preview", () => {
    expect(PREVIEW.vacation).toEqual({
      label: "Paid vacation",
      left: "12h",
      of: "80h",
    });
  });

  it("claims no legal entitlement", () => {
    const source = contentSource.toLowerCase();

    for (const word of ["entitled by law", "legal", "guarantee"]) {
      expect(source).not.toContain(word);
    }
  });
});

describe("LANDING_SECTION_LINKS", () => {
  it("links to the ids the sections use", () => {
    expect(LANDING_SECTION_LINKS.map((link) => link.id)).toEqual([
      LANDING_SECTION_IDS.howItWorks,
      LANDING_SECTION_IDS.features,
    ]);
  });
});

describe("MINI_JOB_SPOTLIGHT", () => {
  it("starts inside the slider's range and under the limit", () => {
    const { min, max, initial, limit, step } = MINI_JOB_SPOTLIGHT;

    expect(initial).toBeGreaterThanOrEqual(min);
    expect(initial).toBeLessThanOrEqual(max);
    expect(initial).toBeLessThan(limit);
    expect(limit).toBeLessThan(max);
    expect((limit - min) % step).toBe(0);
  });
});

describe("miniJobMessage", () => {
  it("says how much is left under the limit", () => {
    expect(miniJobMessage(420, 540, euro)).toBe(
      "€120.00 left before the limit of €540.00",
    );
  });

  it("says how far over the limit, and that plans can change", () => {
    expect(miniJobMessage(600, 540, euro)).toBe(
      "Over the limit by €60.00. You can still change your plans.",
    );
  });

  it("counts exactly at the limit as still under it", () => {
    expect(miniJobMessage(540, 540, euro)).toBe(
      "€0.00 left before the limit of €540.00",
    );
  });
});

describe("PHONE_SHOWCASE", () => {
  it("marks one of its tabs as the active one", () => {
    expect(PHONE_SHOWCASE.tabs).toContain(PHONE_SHOWCASE.activeTab);
  });

  it("points every example shift at a colour that exists", () => {
    for (const shift of PHONE_SHOWCASE.shifts) {
      expect(JOB_COLORS[shift.colorIndex]).toBeDefined();
    }
  });
});
