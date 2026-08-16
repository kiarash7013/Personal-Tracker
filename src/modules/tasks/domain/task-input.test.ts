import { describe, expect, it } from "vitest";
import { suggestAgreementMatches, taskInputSchema } from "./task-input";

const baseTask = {
  sprintId: "00000000-0000-4000-8000-000000000001",
  projectId: "00000000-0000-4000-8000-000000000002",
  externalCode: "CXS-345",
  title: "افزودن مشتری",
  description: "",
  assignmentSource: "MANAGER_ASSIGNED" as const,
  approvalStatus: "DRAFT" as const,
  practices: [],
  evidence: [],
};

describe("task input", () => {
  it("allows a draft task without practices", () => {
    expect(taskInputSchema.safeParse(baseTask).success).toBe(true);
  });

  it("rejects a final task without practice results", () => {
    expect(taskInputSchema.safeParse({ ...baseTask, approvalStatus: "FINAL_APPROVED" }).success).toBe(false);
  });

  it("accepts N/A as an explicit final practice result", () => {
    expect(taskInputSchema.safeParse({
      ...baseTask,
      approvalStatus: "FINAL_APPROVED",
      practices: [{ workPracticeId: "00000000-0000-4000-8000-000000000003", status: "NOT_APPLICABLE" }],
    }).success).toBe(true);
  });

  it("rejects unsafe evidence URL schemes", () => {
    expect(taskInputSchema.safeParse({
      ...baseTask,
      evidence: [{ type: "OTHER_URL", title: "لینک نامعتبر", url: "javascript:alert(1)" }],
    }).success).toBe(false);
  });

  it("suggests multiple same-project agreements without duplicating task practices", () => {
    const matches = suggestAgreementMatches(["analysis", "flow"], [
      { id: "a1", expectedPracticeIds: ["analysis", "flow", "docs"] },
      { id: "a2", expectedPracticeIds: ["analysis", "prototype"] },
      { id: "a3", expectedPracticeIds: ["research"] },
    ]);
    expect(matches).toEqual([
      { agreementRevisionId: "a1", matchedPracticeCount: 2, confidence: 2 / 3 },
      { agreementRevisionId: "a2", matchedPracticeCount: 1, confidence: 1 / 2 },
    ]);
  });
});
