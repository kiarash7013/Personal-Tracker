import { describe, expect, it } from "vitest";
import {
  calculateAdditionalContribution,
  calculateAgreementAchievement,
  calculateAgreementContribution,
  calculateAlignedExecution,
  calculateBonusAchievement,
  calculateCoreAchievement,
  calculateProjectAchievement,
  calculateWorkAlignment,
  DomainCalculationError,
  validateProjectWeights,
  type AgreementInput,
  type ProjectInput,
  type TaskInput,
  type TaskPracticeInput,
} from "./index";

function project(
  id: string,
  weight: number | null,
  scope: ProjectInput["scope"] = "AGREED",
): ProjectInput {
  return { id, weight, scope };
}

function agreement(
  id: string,
  projectId: string,
  expectedPracticeIds: readonly string[],
  type: AgreementInput["type"] = "CORE",
): AgreementInput {
  return { id, projectId, expectedPracticeIds, type };
}

function practice(
  practiceId: string,
  status: TaskPracticeInput["status"] = "DONE",
): TaskPracticeInput {
  return { practiceId, status };
}

function task(
  id: string,
  projectId: string,
  practices: readonly TaskPracticeInput[] = [],
  overrides: Partial<Pick<TaskInput, "approvalStatus" | "assignmentSource">> = {},
): TaskInput {
  return {
    id,
    projectId,
    practices,
    approvalStatus: overrides.approvalStatus ?? "FINAL_APPROVED",
    assignmentSource: overrides.assignmentSource ?? "MANAGER_ASSIGNED",
  };
}

describe("validateProjectWeights", () => {
  it("accepts exactly 100 percent across agreed projects", () => {
    const result = validateProjectWeights([
      project("p1", 60),
      project("p2", 40),
      project("p3", null, "ADDITIONAL"),
    ]);

    expect(result).toEqual({ valid: true, totalWeight: 100, errors: [] });
  });

  it("reports missing, unexpected and incorrect total weights together", () => {
    const result = validateProjectWeights([
      project("p1", 70),
      project("p2", null),
      project("p3", 20, "ADDITIONAL"),
    ]);

    expect(result.valid).toBe(false);
    expect(result.totalWeight).toBe(70);
    expect(result.errors.map((error) => error.code)).toEqual([
      "MISSING_WEIGHT",
      "UNEXPECTED_ADDITIONAL_WEIGHT",
      "TOTAL_NOT_100",
    ]);
  });
});

describe("calculateAgreementContribution", () => {
  it("derives shares from core mappings and excludes bonus mappings", () => {
    const result = calculateAgreementContribution({
      project: project("p1", 60),
      agreements: [
        agreement("a1", "p1", ["p1", "p2", "p3", "p4"]),
        agreement("a2", "p1", ["p5"]),
        agreement("a3", "p1", ["p6", "p7"]),
        agreement("a4", "p1", ["p8", "p9", "p10"]),
        agreement("bonus", "p1", ["pb"], "BONUS"),
      ],
    });

    expect(result.totalMappings).toBe(10);
    expect(result.contributions.map(({ agreementId, share, seasonContribution }) => ({
      agreementId,
      share,
      seasonContribution,
    }))).toEqual([
      { agreementId: "a1", share: 40, seasonContribution: 24 },
      { agreementId: "a2", share: 10, seasonContribution: 6 },
      { agreementId: "a3", share: 20, seasonContribution: 12 },
      { agreementId: "a4", share: 30, seasonContribution: 18 },
    ]);
  });
});

describe("calculateAgreementAchievement", () => {
  it("counts DONE and NOT_DONE, but excludes N/A, drafts and unrelated projects", () => {
    const result = calculateAgreementAchievement({
      agreement: agreement("a1", "p1", ["analysis", "flow", "docs"]),
      tasks: [
        task("t1", "p1", [
          practice("analysis"),
          practice("flow", "NOT_DONE"),
          practice("docs", "NOT_APPLICABLE"),
          practice("handoff"),
        ]),
        task("t2", "p1", [practice("analysis")]),
        task("draft", "p1", [practice("analysis")], { approvalStatus: "DRAFT" }),
        task("other-project", "p2", [practice("analysis")]),
      ],
    });

    expect(result.status).toBe("CALCULATED");
    expect(result.numerator).toBe(2);
    expect(result.denominator).toBe(3);
    expect(result.value).toBeCloseTo(66.6667, 3);
    expect(result.applicableTaskIds).toEqual(["t1", "t2"]);
    expect(result.exclusions).toContainEqual({
      entityId: "t1:docs",
      reason: "NOT_APPLICABLE",
    });
  });

  it("returns NO_OPPORTUNITY when every expected instance is N/A", () => {
    const result = calculateAgreementAchievement({
      agreement: agreement("a1", "p1", ["analysis"]),
      tasks: [task("t1", "p1", [practice("analysis", "NOT_APPLICABLE")])],
    });

    expect(result.status).toBe("NO_OPPORTUNITY");
    expect(result.value).toBeNull();
    expect(result.denominator).toBe(0);
  });
});

describe("project and portfolio achievement", () => {
  it("renormalizes observed agreement contribution without treating no opportunity as zero", () => {
    const result = calculateProjectAchievement({
      project: project("p1", 100),
      agreements: [
        agreement("a1", "p1", ["p1", "p2", "p3", "p4"]),
        agreement("a2", "p1", ["p5"]),
      ],
      tasks: [task("t1", "p1", [practice("p5")])],
    });

    expect(result.value).toBe(100);
    expect(result.opportunityCoverage).toBe(20);
    expect(result.agreements).toContainEqual({
      agreementId: "a1",
      contributionShare: 80,
      achievement: null,
      applicableInstances: 0,
    });
  });

  it("applies official project weights after agreement contribution", () => {
    const projects = [project("p1", 60), project("p2", 40)];
    const agreements = [
      agreement("p1-a1", "p1", ["analysis", "flow"]),
      agreement("p1-a2", "p1", ["docs"]),
      agreement("p2-a1", "p2", ["handoff"]),
    ];
    const tasks = [
      task("p1-t1", "p1", [practice("analysis"), practice("flow")]),
      task("p1-t2", "p1", [practice("analysis"), practice("flow")]),
      task("p1-t3", "p1", [practice("analysis"), practice("flow", "NOT_DONE")]),
      task("p1-t4", "p1", [practice("docs")]),
      task("p2-t1", "p2", [practice("handoff")]),
    ];

    const result = calculateCoreAchievement({ projects, agreements, tasks });

    expect(result.projects[0]?.achievement).toBeCloseTo(88.8889, 3);
    expect(result.projects[1]?.achievement).toBe(100);
    expect(result.value).toBeCloseTo(93.3333, 3);
    expect(result.opportunityCoverage).toBe(100);
  });

  it("calculates bonus separately and does not penalize projects without bonus opportunity", () => {
    const result = calculateBonusAchievement({
      projects: [project("p1", 60), project("p2", 40)],
      agreements: [
        agreement("core", "p1", ["analysis"]),
        agreement("bonus", "p1", ["prototype"], "BONUS"),
      ],
      tasks: [task("t1", "p1", [practice("prototype")])],
    });

    expect(result.value).toBe(100);
    expect(result.opportunityCoverage).toBe(60);
    expect(result.projects[1]?.achievement).toBeNull();
  });

  it("rejects portfolio calculations with invalid official weights", () => {
    expect(() =>
      calculateCoreAchievement({
        projects: [project("p1", 70), project("p2", 20)],
        agreements: [],
        tasks: [],
      }),
    ).toThrowError(DomainCalculationError);
  });

  it("returns NO_OPPORTUNITY for an agreed project without finalized work", () => {
    const result = calculateCoreAchievement({
      projects: [project("p1", 100)],
      agreements: [agreement("a1", "p1", ["analysis"])],
      tasks: [],
    });

    expect(result.status).toBe("NO_OPPORTUNITY");
    expect(result.value).toBeNull();
    expect(result.opportunityCoverage).toBe(0);
  });
});

describe("alignment, execution and additional contribution", () => {
  it("separates finalized assigned work from self-initiated work", () => {
    const projects = [project("agreed", 100), project("additional", null, "ADDITIONAL")];
    const tasks = [
      ...Array.from({ length: 12 }, (_, index) => task(`aligned-${index}`, "agreed")),
      ...Array.from({ length: 8 }, (_, index) => task(`outside-${index}`, "additional")),
      ...Array.from({ length: 5 }, (_, index) =>
        task(`self-${index}`, "additional", [], { assignmentSource: "SELF_INITIATED" }),
      ),
      task("draft", "agreed", [], { approvalStatus: "DRAFT" }),
    ];

    const result = calculateWorkAlignment({ projects, tasks });

    expect(result.numerator).toBe(12);
    expect(result.denominator).toBe(20);
    expect(result.value).toBe(60);
  });

  it("deduplicates a practice shared by multiple core agreements", () => {
    const result = calculateAlignedExecution({
      projects: [project("p1", 100)],
      agreements: [
        agreement("a1", "p1", ["analysis"]),
        agreement("a2", "p1", ["analysis", "docs"]),
      ],
      tasks: [
        task("t1", "p1", [practice("analysis"), practice("docs", "NOT_DONE")]),
      ],
    });

    expect(result.numerator).toBe(1);
    expect(result.denominator).toBe(2);
    expect(result.value).toBe(50);
    expect(result.includedEntityIds).toEqual(["t1:analysis", "t1:docs"]);
  });

  it("reports additional work without adding it to core", () => {
    const projects = [project("agreed", 100), project("additional", null, "ADDITIONAL")];
    const tasks = [
      ...Array.from({ length: 12 }, (_, index) => task(`core-${index}`, "agreed")),
      ...Array.from({ length: 6 }, (_, index) => task(`assigned-${index}`, "additional")),
      ...Array.from({ length: 2 }, (_, index) =>
        task(`self-${index}`, "additional", [], { assignmentSource: "SELF_INITIATED" }),
      ),
      task("draft-additional", "additional", [], { approvalStatus: "IN_PROGRESS" }),
    ];

    const result = calculateAdditionalContribution({ projects, tasks });

    expect(result.numerator).toBe(8);
    expect(result.denominator).toBe(20);
    expect(result.value).toBe(40);
    expect(result.assignedAdditionalTaskCount).toBe(6);
    expect(result.selfInitiatedAdditionalTaskCount).toBe(2);
  });

  it("returns NO_OPPORTUNITY for a season without finalized tasks", () => {
    const projects = [project("p1", 100)];
    const tasks = [task("draft", "p1", [], { approvalStatus: "DRAFT" })];

    expect(calculateWorkAlignment({ projects, tasks }).status).toBe("NO_OPPORTUNITY");
    expect(calculateAdditionalContribution({ projects, tasks }).status).toBe(
      "NO_OPPORTUNITY",
    );
  });

  it("keeps a final task aligned even when it has no agreement practice match", () => {
    const projects = [project("p1", 100)];
    const tasks = [task("t1", "p1", [practice("unmapped")])];
    const agreements = [agreement("a1", "p1", ["analysis"])];

    expect(calculateWorkAlignment({ projects, tasks }).value).toBe(100);
    const execution = calculateAlignedExecution({ projects, agreements, tasks });
    expect(execution.status).toBe("NO_OPPORTUNITY");
    expect(execution.exclusions).toContainEqual({
      entityId: "t1",
      reason: "NO_EXPECTED_PRACTICE_MATCH",
    });
  });

  it("excludes all N/A instances from aligned execution denominator", () => {
    const result = calculateAlignedExecution({
      projects: [project("p1", 100)],
      agreements: [agreement("a1", "p1", ["analysis"])],
      tasks: [task("t1", "p1", [practice("analysis", "NOT_APPLICABLE")])],
    });

    expect(result.status).toBe("NO_OPPORTUNITY");
    expect(result.denominator).toBe(0);
  });
});
