import { describe, expect, it } from "vitest";
import { isSprintInsideSeason, sprintInputSchema } from "./sprint-input";

describe("sprint input", () => {
  it("accepts a valid sprint with an arbitrary positive sequence", () => {
    const result = sprintInputSchema.parse({
      name: "اسپرینت ۵",
      sequenceNumber: "5",
      startDate: "2026-09-01",
      endDate: "2026-09-28",
      status: "PLANNED",
    });
    expect(result.sequenceNumber).toBe(5);
  });

  it("rejects an inverted date range", () => {
    expect(sprintInputSchema.safeParse({
      name: "اسپرینت ۱",
      sequenceNumber: 1,
      startDate: "2026-07-20",
      endDate: "2026-07-01",
      status: "PLANNED",
    }).success).toBe(false);
  });

  it("checks that sprint dates stay inside the season", () => {
    const season = { startDate: new Date("2026-06-22T00:00:00.000Z"), endDate: new Date("2026-10-22T00:00:00.000Z") };
    expect(isSprintInsideSeason({ startDate: "2026-07-01", endDate: "2026-07-28" }, season)).toBe(true);
    expect(isSprintInsideSeason({ startDate: "2026-06-01", endDate: "2026-07-01" }, season)).toBe(false);
  });
});
