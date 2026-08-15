import { DomainCalculationError } from "./errors";
import { calculateProjectAchievement } from "./project-achievement";
import { validateProjectWeights } from "./project-weights";
import { CALCULATION_VERSION, type AgreementInput, type AgreementType, type PortfolioAchievementResult, type ProjectInput, type TaskInput } from "./types";

function calculatePortfolioAchievement(input: {
  readonly projects: readonly ProjectInput[];
  readonly agreements: readonly AgreementInput[];
  readonly tasks: readonly TaskInput[];
  readonly agreementType: AgreementType;
}): PortfolioAchievementResult {
  const { projects, agreements, tasks, agreementType } = input;
  const weightValidation = validateProjectWeights(projects);
  if (!weightValidation.valid) {
    throw new DomainCalculationError(
      "INVALID_PROJECT_WEIGHTS",
      `Official project weights are invalid: ${weightValidation.errors.map((error) => error.code).join(", ")}`,
    );
  }

  const agreedProjects = projects.filter((project) => project.scope === "AGREED");
  let observedWeight = 0;
  let weightedAchievement = 0;
  const includedProjectIds: string[] = [];
  const exclusions: PortfolioAchievementResult["exclusions"][number][] = [];

  const projectDetails = agreedProjects.map((project) => {
    const result = calculateProjectAchievement({
      project,
      agreements,
      tasks,
      agreementType,
    });
    const officialWeight = project.weight!;

    if (result.status === "CALCULATED" && result.value !== null) {
      observedWeight += officialWeight;
      weightedAchievement += officialWeight * result.value;
      includedProjectIds.push(project.id);
    } else {
      exclusions.push({ entityId: project.id, reason: "NO_APPLICABLE_INSTANCE" });
    }

    return {
      projectId: project.id,
      officialWeight,
      achievement: result.value,
      opportunityCoverage: result.opportunityCoverage,
    };
  });

  if (observedWeight === 0) {
    return {
      status: "NO_OPPORTUNITY",
      value: null,
      numerator: 0,
      denominator: 0,
      includedEntityIds: [],
      exclusions,
      calculationVersion: CALCULATION_VERSION,
      opportunityCoverage: 0,
      projects: projectDetails,
    };
  }

  return {
    status: "CALCULATED",
    value: weightedAchievement / observedWeight,
    numerator: weightedAchievement,
    denominator: observedWeight,
    includedEntityIds: includedProjectIds,
    exclusions,
    calculationVersion: CALCULATION_VERSION,
    opportunityCoverage: observedWeight,
    projects: projectDetails,
  };
}

export function calculateCoreAchievement(input: {
  readonly projects: readonly ProjectInput[];
  readonly agreements: readonly AgreementInput[];
  readonly tasks: readonly TaskInput[];
}): PortfolioAchievementResult {
  return calculatePortfolioAchievement({ ...input, agreementType: "CORE" });
}

export function calculateBonusAchievement(input: {
  readonly projects: readonly ProjectInput[];
  readonly agreements: readonly AgreementInput[];
  readonly tasks: readonly TaskInput[];
}): PortfolioAchievementResult {
  return calculatePortfolioAchievement({ ...input, agreementType: "BONUS" });
}
