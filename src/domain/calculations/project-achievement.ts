import { calculateAgreementAchievement } from "./agreement-achievement";
import { calculateAgreementContribution } from "./contribution";
import { CALCULATION_VERSION, type AgreementInput, type AgreementType, type ProjectAchievementResult, type ProjectInput, type TaskInput } from "./types";

export function calculateProjectAchievement(input: {
  readonly project: ProjectInput;
  readonly agreements: readonly AgreementInput[];
  readonly tasks: readonly TaskInput[];
  readonly agreementType?: AgreementType;
}): ProjectAchievementResult {
  const { project, agreements, tasks, agreementType = "CORE" } = input;
  const contributions = calculateAgreementContribution({ project, agreements, agreementType });

  if (contributions.status === "NO_OPPORTUNITY") {
    return {
      status: "NO_OPPORTUNITY",
      value: null,
      numerator: 0,
      denominator: 0,
      includedEntityIds: [],
      exclusions: [],
      calculationVersion: CALCULATION_VERSION,
      projectId: project.id,
      opportunityCoverage: 0,
      agreements: [],
    };
  }

  let weightedAchievement = 0;
  let observedContribution = 0;
  const includedAgreementIds: string[] = [];
  const exclusions: ProjectAchievementResult["exclusions"][number][] = [];
  const details = contributions.contributions.map((contribution) => {
    const agreement = agreements.find((candidate) => candidate.id === contribution.agreementId)!;
    const achievement = calculateAgreementAchievement({ agreement, tasks });

    if (achievement.status === "CALCULATED" && achievement.value !== null) {
      observedContribution += contribution.share;
      weightedAchievement += contribution.share * achievement.value;
      includedAgreementIds.push(agreement.id);
    } else {
      exclusions.push({ entityId: agreement.id, reason: "NO_APPLICABLE_INSTANCE" });
    }

    return {
      agreementId: agreement.id,
      contributionShare: contribution.share,
      achievement: achievement.value,
      applicableInstances: achievement.denominator,
    };
  });

  if (observedContribution === 0) {
    return {
      status: "NO_OPPORTUNITY",
      value: null,
      numerator: 0,
      denominator: 0,
      includedEntityIds: [],
      exclusions,
      calculationVersion: CALCULATION_VERSION,
      projectId: project.id,
      opportunityCoverage: 0,
      agreements: details,
    };
  }

  return {
    status: "CALCULATED",
    value: weightedAchievement / observedContribution,
    numerator: weightedAchievement,
    denominator: observedContribution,
    includedEntityIds: includedAgreementIds,
    exclusions,
    calculationVersion: CALCULATION_VERSION,
    projectId: project.id,
    opportunityCoverage: observedContribution,
    agreements: details,
  };
}
