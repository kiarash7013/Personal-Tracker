import { CALCULATION_VERSION, type MetricStatus, type PerformanceLevel } from "./types";

export type PerformanceThresholds = {
  meetsExpectationsMinCoreAchievement: number;
  minimumAlignedExecution: number;
  bonusRequiredForExceeds: number;
  additionalContributionThreshold: number;
  minimumAdditionalTaskCount: number;
};

export type ClassificationInput = {
  coreAchievement: number | null;
  alignedExecution: number | null;
  bonusAchievement: number | null;
  additionalContribution: number | null;
  additionalTaskCount: number;
  thresholds: PerformanceThresholds;
};

export type ClassificationResult = {
  status: MetricStatus;
  level: PerformanceLevel | null;
  coreMeetsExpectations: boolean;
  meaningfulBonus: boolean;
  meaningfulAdditionalContribution: boolean;
  calculationVersion: typeof CALCULATION_VERSION;
};

export function classifyPerformance(input: ClassificationInput): ClassificationResult {
  const { thresholds } = input;
  if (input.coreAchievement === null || input.alignedExecution === null) {
    return {
      status: "NOT_ENOUGH_DATA",
      level: null,
      coreMeetsExpectations: false,
      meaningfulBonus: false,
      meaningfulAdditionalContribution: false,
      calculationVersion: CALCULATION_VERSION,
    };
  }

  const coreMeetsExpectations =
    input.coreAchievement >= thresholds.meetsExpectationsMinCoreAchievement
    && input.alignedExecution >= thresholds.minimumAlignedExecution;
  const meaningfulBonus =
    input.bonusAchievement !== null
    && input.bonusAchievement >= thresholds.bonusRequiredForExceeds;
  const meaningfulAdditionalContribution =
    input.additionalContribution !== null
    && input.additionalContribution >= thresholds.additionalContributionThreshold
    && input.additionalTaskCount >= thresholds.minimumAdditionalTaskCount;

  const level: PerformanceLevel = !coreMeetsExpectations
    ? "PARTIALLY_ACHIEVED"
    : meaningfulBonus || meaningfulAdditionalContribution
      ? "EXCEEDS_EXPECTATIONS"
      : "MEETS_EXPECTATIONS";

  return {
    status: "CALCULATED",
    level,
    coreMeetsExpectations,
    meaningfulBonus,
    meaningfulAdditionalContribution,
    calculationVersion: CALCULATION_VERSION,
  };
}
