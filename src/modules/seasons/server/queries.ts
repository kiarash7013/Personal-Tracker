import { getPrisma } from "@/infrastructure/database/prisma";
import { evaluateActivationReadiness } from "../domain/activation-readiness";

export async function listAccessibleSeasons(userId: string) {
  return getPrisma().season.findMany({
    where: {
      OR: [
        { employeeId: userId },
        { members: { some: { userId } } },
      ],
    },
    orderBy: [{ status: "asc" }, { startDate: "desc" }],
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      status: true,
      employeeId: true,
      members: {
        where: { userId },
        select: { role: true },
        take: 1,
      },
      _count: { select: { projects: true, sprints: true, tasks: true } },
    },
  });
}

export async function listManagerCandidates(currentUserId: string) {
  return getPrisma().user.findMany({
    where: { active: true, id: { not: currentUserId } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });
}

export async function getSeasonDetails(seasonId: string) {
  const season = await getPrisma().season.findUnique({
    where: { id: seasonId },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      status: true,
      employeeId: true,
      lockVersion: true,
      employee: { select: { name: true, email: true } },
      members: {
        orderBy: { role: "asc" },
        select: {
          userId: true,
          role: true,
          user: { select: { name: true, email: true } },
        },
      },
      planVersions: {
        orderBy: { version: "desc" },
        take: 1,
        select: {
          id: true,
          version: true,
          status: true,
          projectPlans: {
            select: {
              id: true,
              weight: true,
              agreementRevisions: {
                where: { agreementType: "CORE" },
                select: { _count: { select: { expectedPractices: true } } },
              },
            },
          },
        },
      },
      _count: { select: { projects: true, sprints: true, tasks: true } },
    },
  });

  if (!season) {
    return null;
  }

  const plan = season.planVersions[0];
  const activationReadiness = evaluateActivationReadiness(
    (plan?.projectPlans ?? []).map((project) => ({
      weight: Number(project.weight),
      coreAgreements: project.agreementRevisions.map((agreement) => ({
        practiceCount: agreement._count.expectedPractices,
      })),
    })),
  );

  return { ...season, activationReadiness };
}

export function getSeasonRole(
  season: { employeeId: string; members: Array<{ role: "EMPLOYEE" | "MANAGER" }> },
  userId: string,
) {
  return season.employeeId === userId ? "EMPLOYEE" : (season.members[0]?.role ?? null);
}
