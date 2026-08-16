import { describe, expect, it } from "vitest";
import { classifyPerformance, type PerformanceThresholds } from "./classification";

const thresholds: PerformanceThresholds = {
  meetsExpectationsMinCoreAchievement: 80,
  minimumAlignedExecution: 80,
  bonusRequiredForExceeds: 60,
  additionalContributionThreshold: 15,
  minimumAdditionalTaskCount: 2,
};

function classify(overrides: Partial<Parameters<typeof classifyPerformance>[0]> = {}) {
  return classifyPerformance({
    coreAchievement: 90,
    alignedExecution: 90,
    bonusAchievement: null,
    additionalContribution: 0,
    additionalTaskCount: 0,
    thresholds,
    ...overrides,
  });
}

describe("classifyPerformance", () => {
  it("returns not enough data when core opportunity is missing", () => {
    expect(classify({ coreAchievement: null }).level).toBeNull();
  });

  it("classifies core below threshold as partially achieved", () => {
    expect(classify({ coreAchievement: 79 }).level).toBe("PARTIALLY_ACHIEVED");
  });

  it("does not let high bonus override weak core", () => {
    expect(classify({ coreAchievement: 65, bonusAchievement: 100 }).level).toBe("PARTIALLY_ACHIEVED");
  });

  it("treats 100 percent core alone as meets expectations", () => {
    expect(classify({ coreAchievement: 100 }).level).toBe("MEETS_EXPECTATIONS");
  });

  it("requires core plus meaningful bonus for exceeds", () => {
    expect(classify({ bonusAchievement: 60 }).level).toBe("EXCEEDS_EXPECTATIONS");
  });

  it("requires both percentage and task count for additional exceeds", () => {
    expect(classify({ additionalContribution: 20, additionalTaskCount: 1 }).level).toBe("MEETS_EXPECTATIONS");
    expect(classify({ additionalContribution: 20, additionalTaskCount: 2 }).level).toBe("EXCEEDS_EXPECTATIONS");
  });
});
