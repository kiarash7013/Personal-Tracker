import { describe, expect, it } from "vitest";
import { calculateDashboardMetrics, calculateSeasonElapsed } from "./dashboard-metrics";

describe("employee dashboard metrics", () => {
  it("keeps alignment, execution and additional work separate", () => {
    const result = calculateDashboardMetrics({
      projects: [
        { id: "agreed", scope: "AGREED", weight: 100 },
        { id: "additional", scope: "ADDITIONAL", weight: null },
      ],
      agreements: [
        { id: "core", projectId: "agreed", type: "CORE", expectedPracticeIds: ["analysis"] },
      ],
      tasks: [
        {
          id: "aligned",
          projectId: "agreed",
          approvalStatus: "FINAL_APPROVED",
          assignmentSource: "MANAGER_ASSIGNED",
          practices: [{ practiceId: "analysis", status: "DONE" }],
        },
        {
          id: "outside",
          projectId: "additional",
          approvalStatus: "FINAL_APPROVED",
          assignmentSource: "MANAGER_ASSIGNED",
          practices: [{ practiceId: "analysis", status: "DONE" }],
        },
      ],
    });

    expect(result.coreAchievement.value).toBe(100);
    expect(result.workAlignment.value).toBe(50);
    expect(result.alignedExecution.value).toBe(100);
    expect(result.additionalContribution.value).toBe(50);
  });

  it("clamps elapsed season time between zero and one hundred", () => {
    const start = new Date("2026-01-01T00:00:00.000Z");
    const end = new Date("2026-01-11T00:00:00.000Z");
    expect(calculateSeasonElapsed(start, end, new Date("2025-12-01T00:00:00.000Z"))).toBe(0);
    expect(calculateSeasonElapsed(start, end, new Date("2026-01-06T00:00:00.000Z"))).toBe(50);
    expect(calculateSeasonElapsed(start, end, new Date("2026-02-01T00:00:00.000Z"))).toBe(100);
  });
});
