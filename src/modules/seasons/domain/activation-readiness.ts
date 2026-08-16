export const activationIssueCodes = [
  "NO_AGREED_PROJECTS",
  "PROJECT_WEIGHT_TOTAL",
  "PROJECT_WITHOUT_CORE_AGREEMENT",
  "CORE_AGREEMENT_WITHOUT_PRACTICE",
] as const;

export type ActivationIssueCode = (typeof activationIssueCodes)[number];

export type ActivationProject = {
  weight: number;
  coreAgreements: Array<{ practiceCount: number }>;
};

export type ActivationReadiness = {
  ready: boolean;
  issues: ActivationIssueCode[];
  totalWeight: number;
};

export function evaluateActivationReadiness(
  projects: ActivationProject[],
): ActivationReadiness {
  const issues = new Set<ActivationIssueCode>();
  const totalWeight = projects.reduce((sum, project) => sum + project.weight, 0);

  if (projects.length === 0) {
    issues.add("NO_AGREED_PROJECTS");
  }

  if (Math.abs(totalWeight - 100) > 0.0001) {
    issues.add("PROJECT_WEIGHT_TOTAL");
  }

  for (const project of projects) {
    if (project.coreAgreements.length === 0) {
      issues.add("PROJECT_WITHOUT_CORE_AGREEMENT");
    }

    if (project.coreAgreements.some((agreement) => agreement.practiceCount === 0)) {
      issues.add("CORE_AGREEMENT_WITHOUT_PRACTICE");
    }
  }

  return {
    ready: issues.size === 0,
    issues: [...issues],
    totalWeight,
  };
}
