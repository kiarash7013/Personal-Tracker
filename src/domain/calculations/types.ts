export const CALCULATION_VERSION = "1.0.0";

export type MetricStatus = "CALCULATED" | "NO_OPPORTUNITY" | "NOT_ENOUGH_DATA";
export type ProjectScope = "AGREED" | "ADDITIONAL";
export type AgreementType = "CORE" | "BONUS";
export type ApprovalStatus = "DRAFT" | "IN_PROGRESS" | "FINAL_APPROVED";
export type PracticeStatus = "DONE" | "NOT_DONE" | "NOT_APPLICABLE";
export type AssignmentSource =
  | "MANAGER_ASSIGNED"
  | "CUSTOMER_REQUEST"
  | "STAKEHOLDER_REQUEST"
  | "SELF_INITIATED"
  | "OTHER";
export type PerformanceLevel =
  | "PARTIALLY_ACHIEVED"
  | "MEETS_EXPECTATIONS"
  | "EXCEEDS_EXPECTATIONS";

export type ExclusionReason =
  | "NOT_FINAL_APPROVED"
  | "SELF_INITIATED_EXCLUDED"
  | "PROJECT_OUTSIDE_AGREED_SCOPE"
  | "PROJECT_INSIDE_AGREED_SCOPE"
  | "DIFFERENT_PROJECT"
  | "PRACTICE_NOT_EXPECTED"
  | "NOT_APPLICABLE"
  | "NO_APPLICABLE_INSTANCE"
  | "NO_EXPECTED_PRACTICE_MATCH";

export interface CalculationExclusion {
  readonly entityId: string;
  readonly reason: ExclusionReason;
}

export interface ProjectInput {
  readonly id: string;
  readonly scope: ProjectScope;
  readonly weight: number | null;
}

export interface AgreementInput {
  readonly id: string;
  readonly projectId: string;
  readonly type: AgreementType;
  readonly expectedPracticeIds: readonly string[];
}

export interface TaskPracticeInput {
  readonly practiceId: string;
  readonly status: PracticeStatus;
}

export interface TaskInput {
  readonly id: string;
  readonly projectId: string;
  readonly approvalStatus: ApprovalStatus;
  readonly assignmentSource: AssignmentSource;
  readonly practices: readonly TaskPracticeInput[];
}

export interface RatioMetricResult {
  readonly status: MetricStatus;
  readonly value: number | null;
  readonly numerator: number;
  readonly denominator: number;
  readonly includedEntityIds: readonly string[];
  readonly exclusions: readonly CalculationExclusion[];
  readonly calculationVersion: typeof CALCULATION_VERSION;
}

export interface AgreementContributionDetail {
  readonly agreementId: string;
  readonly mappingCount: number;
  readonly share: number;
  readonly seasonContribution: number;
}

export interface AgreementContributionResult {
  readonly status: MetricStatus;
  readonly totalMappings: number;
  readonly contributions: readonly AgreementContributionDetail[];
  readonly calculationVersion: typeof CALCULATION_VERSION;
}

export interface AgreementAchievementResult extends RatioMetricResult {
  readonly agreementId: string;
  readonly applicableTaskIds: readonly string[];
}

export interface ProjectAgreementDetail {
  readonly agreementId: string;
  readonly contributionShare: number;
  readonly achievement: number | null;
  readonly applicableInstances: number;
}

export interface ProjectAchievementResult extends RatioMetricResult {
  readonly projectId: string;
  readonly opportunityCoverage: number;
  readonly agreements: readonly ProjectAgreementDetail[];
}

export interface PortfolioProjectDetail {
  readonly projectId: string;
  readonly officialWeight: number;
  readonly achievement: number | null;
  readonly opportunityCoverage: number;
}

export interface PortfolioAchievementResult extends RatioMetricResult {
  readonly opportunityCoverage: number;
  readonly projects: readonly PortfolioProjectDetail[];
}

export interface AdditionalContributionResult extends RatioMetricResult {
  readonly assignedAdditionalTaskCount: number;
  readonly selfInitiatedAdditionalTaskCount: number;
}
