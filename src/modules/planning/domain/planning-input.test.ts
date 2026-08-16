import { describe, expect, it } from "vitest";
import {
  agreementInputSchema,
  calculateAgreementContribution,
  calculateProjectWeightSummary,
  projectInputSchema,
} from "./planning-input";

describe("planning input", () => {
  it("accepts a valid project weight", () => {
    expect(projectInputSchema.parse({ name: "پیشخوان", description: "", weight: "60" }).weight)
      .toBe(60);
  });

  it("rejects project weights outside the official range", () => {
    expect(projectInputSchema.safeParse({ name: "پیشخوان", description: "", weight: "0" }).success)
      .toBe(false);
    expect(projectInputSchema.safeParse({ name: "پیشخوان", description: "", weight: "101" }).success)
      .toBe(false);
  });

  it("requires at least one unique practice for an agreement", () => {
    const practiceId = "e3b57400-0ec6-4ad2-84d2-478e20a2c58f";
    const parsed = agreementInputSchema.parse({
      title: "تحلیل کامل",
      description: "",
      agreementType: "CORE",
      practiceIds: [practiceId, practiceId],
    });

    expect(parsed.practiceIds).toEqual([practiceId]);
    expect(agreementInputSchema.safeParse({ ...parsed, practiceIds: [] }).success).toBe(false);
  });
});

describe("planning calculations", () => {
  it("validates exact 100 percent project weights", () => {
    expect(calculateProjectWeightSummary([60, 40])).toEqual({ total: 100, remaining: 0, valid: true });
    expect(calculateProjectWeightSummary([60, 30])).toEqual({ total: 90, remaining: 10, valid: false });
    expect(calculateProjectWeightSummary([60, 50])).toEqual({ total: 110, remaining: -10, valid: false });
  });

  it("calculates core contribution from mapping count and excludes bonus", () => {
    expect(calculateAgreementContribution("CORE", 4, 10)).toBe(40);
    expect(calculateAgreementContribution("BONUS", 4, 10)).toBeNull();
    expect(calculateAgreementContribution("CORE", 0, 0)).toBeNull();
  });
});
