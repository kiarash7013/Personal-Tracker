import type { ClassificationResult, PerformanceThresholds } from "./classification";

export type PerformanceReasonCode =
  | "LIMITED_ALIGNMENT"
  | "EXECUTION_GAP"
  | "MIXED_ALIGNMENT_EXECUTION"
  | "STRONG_EXECUTION"
  | "STRONG_ALIGNMENT"
  | "BONUS_ACHIEVEMENT"
  | "ADDITIONAL_CONTRIBUTION"
  | "LIMITED_OPPORTUNITY";

export type ReasoningInput = {
  classification: ClassificationResult;
  workAlignment: number | null;
  alignedExecution: number | null;
  coreOpportunityCoverage: number;
  thresholds: PerformanceThresholds & {
    lowAlignmentThreshold: number;
    strongMetricThreshold: number;
    minimumObservableProjectWeight: number;
  };
};

export type PerformanceReasonResult = {
  primaryReason: PerformanceReasonCode;
  supportingReasons: PerformanceReasonCode[];
};

export function generatePerformanceReasons(input: ReasoningInput): PerformanceReasonResult {
  const { thresholds } = input;
  const limitedOpportunity = input.coreOpportunityCoverage < thresholds.minimumObservableProjectWeight;
  const limitedAlignment = input.workAlignment !== null && input.workAlignment < thresholds.lowAlignmentThreshold;
  const executionGap = input.alignedExecution !== null && input.alignedExecution < thresholds.minimumAlignedExecution;
  const strongAlignment = input.workAlignment !== null && input.workAlignment >= thresholds.strongMetricThreshold;
  const strongExecution = input.alignedExecution !== null && input.alignedExecution >= thresholds.strongMetricThreshold;

  let primaryReason: PerformanceReasonCode;
  if (input.classification.status === "NOT_ENOUGH_DATA" || limitedOpportunity) {
    primaryReason = "LIMITED_OPPORTUNITY";
  } else if (input.classification.level === "PARTIALLY_ACHIEVED") {
    primaryReason = limitedAlignment && executionGap
      ? "MIXED_ALIGNMENT_EXECUTION"
      : limitedAlignment
        ? "LIMITED_ALIGNMENT"
        : "EXECUTION_GAP";
  } else if (input.classification.meaningfulBonus) {
    primaryReason = "BONUS_ACHIEVEMENT";
  } else if (input.classification.meaningfulAdditionalContribution) {
    primaryReason = "ADDITIONAL_CONTRIBUTION";
  } else {
    primaryReason = strongExecution ? "STRONG_EXECUTION" : "STRONG_ALIGNMENT";
  }

  const candidates: PerformanceReasonCode[] = [
    ...(limitedOpportunity ? ["LIMITED_OPPORTUNITY" as const] : []),
    ...(limitedAlignment ? ["LIMITED_ALIGNMENT" as const] : []),
    ...(executionGap ? ["EXECUTION_GAP" as const] : []),
    ...(strongExecution ? ["STRONG_EXECUTION" as const] : []),
    ...(strongAlignment ? ["STRONG_ALIGNMENT" as const] : []),
    ...(input.classification.meaningfulBonus ? ["BONUS_ACHIEVEMENT" as const] : []),
    ...(input.classification.meaningfulAdditionalContribution ? ["ADDITIONAL_CONTRIBUTION" as const] : []),
  ];

  return {
    primaryReason,
    supportingReasons: [...new Set(candidates)].filter((reason) => reason !== primaryReason),
  };
}
