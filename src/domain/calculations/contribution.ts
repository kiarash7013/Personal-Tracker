import { DomainCalculationError } from "./errors";
import { assertFiniteNumber, assertUniqueIds } from "./helpers";
import {
  CALCULATION_VERSION,
  type AgreementContributionResult,
  type AgreementInput,
  type AgreementType,
  type ProjectInput,
} from "./types";

export function calculateAgreementContribution(input: {
  readonly project: ProjectInput;
  readonly agreements: readonly AgreementInput[];
  readonly agreementType?: AgreementType;
}): AgreementContributionResult {
  const { project, agreements, agreementType = "CORE" } = input;
  assertUniqueIds(agreements, (agreement) => agreement.id, "agreements");

  if (project.scope !== "AGREED" || project.weight === null) {
    throw new DomainCalculationError(
      "PROJECT_HAS_NO_OFFICIAL_WEIGHT",
      "Agreement contribution requires an AGREED project with an official weight",
    );
  }
  const officialProjectWeight = project.weight;
  assertFiniteNumber(officialProjectWeight, `project(${project.id}).weight`);
  if (officialProjectWeight <= 0 || officialProjectWeight > 100) {
    throw new DomainCalculationError(
      "INVALID_PROJECT_WEIGHT",
      "Official project weight must be greater than zero and at most 100",
    );
  }

  const selectedAgreements = agreements.filter(
    (agreement) => agreement.projectId === project.id && agreement.type === agreementType,
  );

  for (const agreement of selectedAgreements) {
    assertUniqueIds(
      agreement.expectedPracticeIds,
      (practiceId) => practiceId,
      `agreement(${agreement.id}).expectedPracticeIds`,
    );
  }

  const totalMappings = selectedAgreements.reduce(
    (total, agreement) => total + agreement.expectedPracticeIds.length,
    0,
  );

  if (totalMappings === 0) {
    return {
      status: "NO_OPPORTUNITY",
      totalMappings: 0,
      contributions: [],
      calculationVersion: CALCULATION_VERSION,
    };
  }

  return {
    status: "CALCULATED",
    totalMappings,
    contributions: selectedAgreements
      .filter((agreement) => agreement.expectedPracticeIds.length > 0)
      .map((agreement) => {
        const share = (agreement.expectedPracticeIds.length / totalMappings) * 100;
        return {
          agreementId: agreement.id,
          mappingCount: agreement.expectedPracticeIds.length,
          share,
          seasonContribution: (officialProjectWeight * share) / 100,
        };
      }),
    calculationVersion: CALCULATION_VERSION,
  };
}
