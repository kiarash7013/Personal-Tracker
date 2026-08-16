import { describe, expect, it } from "vitest";
import { evaluateActivationReadiness } from "./activation-readiness";
import { seasonInputSchema } from "./season-input";

describe("season setup domain", () => {
  it("accepts a valid evaluation period and optional manager", () => {
    const result = seasonInputSchema.safeParse({
      name: "تابستان ۱۴۰۵",
      startDate: "2026-06-22",
      endDate: "2026-10-22",
      managerId: "",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a reversed or excessively long period", () => {
    const reversed = seasonInputSchema.safeParse({
      name: "دوره تست",
      startDate: "2026-10-22",
      endDate: "2026-06-22",
      managerId: "",
    });
    const tooLong = seasonInputSchema.safeParse({
      name: "دوره تست",
      startDate: "2026-01-01",
      endDate: "2027-02-01",
      managerId: "",
    });

    expect(reversed.success).toBe(false);
    expect(tooLong.success).toBe(false);
  });

  it("requires a complete 100-percent plan before activation", () => {
    const result = evaluateActivationReadiness([
      { weight: 60, coreAgreements: [{ practiceCount: 2 }] },
      { weight: 30, coreAgreements: [] },
    ]);

    expect(result.ready).toBe(false);
    expect(result.totalWeight).toBe(90);
    expect(result.issues).toEqual([
      "PROJECT_WEIGHT_TOTAL",
      "PROJECT_WITHOUT_CORE_AGREEMENT",
    ]);
  });

  it("accepts projects with complete core agreement mappings", () => {
    const result = evaluateActivationReadiness([
      { weight: 60, coreAgreements: [{ practiceCount: 3 }] },
      { weight: 40, coreAgreements: [{ practiceCount: 1 }] },
    ]);

    expect(result).toEqual({ ready: true, issues: [], totalWeight: 100 });
  });
});
