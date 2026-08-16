import {
  calculateAdditionalContribution,
  calculateAlignedExecution,
  calculateBonusAchievement,
  calculateCoreAchievement,
  calculateWorkAlignment,
  DEFAULT_ASSIGNED_SOURCES,
  type AgreementInput,
  type ProjectInput,
  type TaskInput,
} from "../../../domain/calculations";

export type DashboardCalculationInput = {
  projects: ProjectInput[];
  agreements: AgreementInput[];
  tasks: TaskInput[];
};

export function calculateDashboardMetrics(
  input: DashboardCalculationInput,
  options: { includeSelfInitiatedInAlignment?: boolean } = {},
) {
  return {
    coreAchievement: calculateCoreAchievement(input),
    workAlignment: calculateWorkAlignment({
      ...input,
      assignedSources: options.includeSelfInitiatedInAlignment
        ? [...DEFAULT_ASSIGNED_SOURCES, "SELF_INITIATED"]
        : DEFAULT_ASSIGNED_SOURCES,
    }),
    alignedExecution: calculateAlignedExecution(input),
    bonusAchievement: calculateBonusAchievement(input),
    additionalContribution: calculateAdditionalContribution(input),
  };
}

export function calculateSeasonElapsed(startDate: Date, endDate: Date, now = new Date()) {
  const start = startDate.getTime();
  const end = endDate.getTime();
  if (end <= start) return 0;
  return Math.min(100, Math.max(0, ((now.getTime() - start) / (end - start)) * 100));
}
