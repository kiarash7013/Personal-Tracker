import { describe, expect, it } from "vitest";
import { calculateSprintTrend, summarizeSprintTrend } from "./sprint-trend";

describe("sprint trend", () => {
  it("calculates cumulative metrics through each sprint", () => {
    const points = calculateSprintTrend({
      projects: [
        { id: "agreed", scope: "AGREED", weight: 100 },
        { id: "outside", scope: "ADDITIONAL", weight: null },
      ],
      agreements: [{ id: "a1", projectId: "agreed", type: "CORE", expectedPracticeIds: ["analysis"] }],
      sprints: [{ id: "s1", name: "اسپرینت ۱", sequenceNumber: 1 }, { id: "s2", name: "اسپرینت ۲", sequenceNumber: 2 }],
      tasks: [
        { id: "t1", sprintId: "s1", projectId: "agreed", approvalStatus: "FINAL_APPROVED", assignmentSource: "MANAGER_ASSIGNED", practices: [{ practiceId: "analysis", status: "DONE" }] },
        { id: "t2", sprintId: "s2", projectId: "outside", approvalStatus: "FINAL_APPROVED", assignmentSource: "MANAGER_ASSIGNED", practices: [] },
      ],
    });
    expect(points[0]?.workAlignment).toBe(100);
    expect(points[1]?.workAlignment).toBe(50);
    expect(points[1]?.coreAchievement).toBe(100);
  });

  it("generates the stable core and declining alignment summary", () => {
    expect(summarizeSprintTrend([
      { sprintId: "s1", name: "۱", sequenceNumber: 1, coreAchievement: 93, workAlignment: 80, alignedExecution: 94 },
      { sprintId: "s2", name: "۲", sequenceNumber: 2, coreAchievement: 92, workAlignment: 60, alignedExecution: 94 },
    ])).toContain("هم‌راستایی");
  });
});
