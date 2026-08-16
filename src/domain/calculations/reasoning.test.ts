import { describe, expect, it } from "vitest";
import { classifyPerformance } from "./classification";
import { generatePerformanceReasons } from "./reasoning";

const thresholds = {
  meetsExpectationsMinCoreAchievement: 80,
  minimumAlignedExecution: 80,
  bonusRequiredForExceeds: 60,
  additionalContributionThreshold: 15,
  minimumAdditionalTaskCount: 2,
  lowAlignmentThreshold: 60,
  strongMetricThreshold: 85,
  minimumObservableProjectWeight: 30,
};

function reason(metrics: { core: number | null; alignment: number | null; execution: number | null; bonus?: number | null; additional?: number | null; additionalTasks?: number; coverage?: number }) {
  const classification = classifyPerformance({
    coreAchievement: metrics.core,
    alignedExecution: metrics.execution,
    bonusAchievement: metrics.bonus ?? null,
    additionalContribution: metrics.additional ?? 0,
    additionalTaskCount: metrics.additionalTasks ?? 0,
    thresholds,
  });
  return generatePerformanceReasons({
    classification,
    workAlignment: metrics.alignment,
    alignedExecution: metrics.execution,
    coreOpportunityCoverage: metrics.coverage ?? 100,
    thresholds,
  });
}

describe("generatePerformanceReasons", () => {
  it("detects limited alignment with strong execution", () => {
    const result = reason({ core: 58, alignment: 48, execution: 94 });
    expect(result.primaryReason).toBe("LIMITED_ALIGNMENT");
    expect(result.supportingReasons).toContain("STRONG_EXECUTION");
  });

  it("detects an execution gap under strong alignment", () => {
    const result = reason({ core: 61, alignment: 92, execution: 61 });
    expect(result.primaryReason).toBe("EXECUTION_GAP");
    expect(result.supportingReasons).toContain("STRONG_ALIGNMENT");
  });

  it("detects mixed alignment and execution", () => {
    expect(reason({ core: 70, alignment: 55, execution: 70 }).primaryReason)
      .toBe("MIXED_ALIGNMENT_EXECUTION");
  });

  it("uses bonus as the primary exceeds reason", () => {
    expect(reason({ core: 94, alignment: 86, execution: 94, bonus: 100 }).primaryReason)
      .toBe("BONUS_ACHIEVEMENT");
  });

  it("reports limited opportunity when data coverage is low", () => {
    expect(reason({ core: null, alignment: null, execution: null, coverage: 0 }).primaryReason)
      .toBe("LIMITED_OPPORTUNITY");
  });
});
