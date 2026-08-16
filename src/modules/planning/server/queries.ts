import { getPrisma } from "@/infrastructure/database/prisma";
import {
  calculateAgreementContribution,
  calculateProjectWeightSummary,
} from "../domain/planning-input";

export async function getSeasonPlanning(seasonId: string) {
  const season = await getPrisma().season.findUnique({
    where: { id: seasonId },
    select: {
      id: true,
      name: true,
      status: true,
      employeeId: true,
      planVersions: {
        where: { status: { in: ["DRAFT", "PUBLISHED"] } },
        orderBy: { version: "desc" },
        take: 1,
        select: {
          id: true,
          status: true,
          version: true,
          projectPlans: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              projectId: true,
              nameSnapshot: true,
              descriptionSnapshot: true,
              weight: true,
              agreementRevisions: {
                orderBy: { createdAt: "asc" },
                select: {
                  id: true,
                  agreementId: true,
                  title: true,
                  description: true,
                  agreementType: true,
                  expectedPractices: {
                    orderBy: { createdAt: "asc" },
                    select: {
                      workPracticeId: true,
                      practiceNameSnapshot: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!season || !season.planVersions[0]) {
    return null;
  }

  const plan = season.planVersions[0];
  const weights = plan.projectPlans.map((project) => Number(project.weight));
  const weightSummary = calculateProjectWeightSummary(weights);

  return {
    id: season.id,
    name: season.name,
    status: season.status,
    employeeId: season.employeeId,
    plan: {
      id: plan.id,
      status: plan.status,
      version: plan.version,
      projects: plan.projectPlans.map((project) => {
        const totalCorePractices = project.agreementRevisions
          .filter((agreement) => agreement.agreementType === "CORE")
          .reduce((sum, agreement) => sum + agreement.expectedPractices.length, 0);

        return {
          ...project,
          weight: Number(project.weight),
          agreements: project.agreementRevisions.map((agreement) => ({
            ...agreement,
            contribution: calculateAgreementContribution(
              agreement.agreementType,
              agreement.expectedPractices.length,
              totalCorePractices,
            ),
          })),
        };
      }),
    },
    weightSummary,
  };
}

export async function getProjectForEdit(seasonId: string, projectId: string) {
  return getPrisma().projectPlan.findFirst({
    where: {
      projectId,
      project: { seasonId, status: "ACTIVE" },
      seasonPlanVersion: { seasonId, status: "DRAFT" },
    },
    select: {
      projectId: true,
      nameSnapshot: true,
      descriptionSnapshot: true,
      weight: true,
    },
  });
}

export async function listWorkPractices(ownerId: string, includeInactive = true) {
  return getPrisma().workPractice.findMany({
    where: { ownerId, ...(includeInactive ? {} : { active: true }) },
    orderBy: [{ active: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      active: true,
      _count: { select: { agreements: true, taskPractices: true } },
    },
  });
}

export async function getWorkPracticeForEdit(ownerId: string, practiceId: string) {
  return getPrisma().workPractice.findFirst({
    where: { id: practiceId, ownerId },
    select: { id: true, name: true, description: true, active: true },
  });
}

export async function getAgreementForEdit(
  seasonId: string,
  projectId: string,
  agreementId: string,
) {
  return getPrisma().agreementRevision.findFirst({
    where: {
      agreementId,
      agreement: { projectId, project: { seasonId } },
      seasonPlanVersion: { seasonId, status: "DRAFT" },
    },
    select: {
      agreementId: true,
      title: true,
      description: true,
      agreementType: true,
      expectedPractices: { select: { workPracticeId: true } },
    },
  });
}
