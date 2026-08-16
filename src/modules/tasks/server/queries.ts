import { getPrisma } from "@/infrastructure/database/prisma";

export type TaskFilters = {
  status?: "DRAFT" | "IN_PROGRESS" | "FINAL_APPROVED";
  sprintId?: string;
  projectId?: string;
};

export async function getTaskFormContext(seasonId: string, employeeId: string) {
  const [season, practices] = await Promise.all([
    getPrisma().season.findUnique({
      where: { id: seasonId },
      select: {
        id: true,
        name: true,
        status: true,
        sprints: {
          orderBy: { sequenceNumber: "asc" },
          select: { id: true, name: true, status: true },
        },
        projects: {
          where: { status: "ACTIVE" },
          orderBy: [{ scope: "asc" }, { name: "asc" }],
          select: { id: true, name: true, scope: true },
        },
        planVersions: {
          where: { status: "PUBLISHED" },
          orderBy: { version: "desc" },
          take: 1,
          select: { id: true, version: true },
        },
      },
    }),
    getPrisma().workPractice.findMany({
      where: { ownerId: employeeId, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, description: true, active: true },
    }),
  ]);

  if (!season || !season.planVersions[0]) return null;
  return { ...season, publishedPlan: season.planVersions[0], practices };
}

export async function listSeasonTasks(seasonId: string, filters: TaskFilters = {}) {
  return getPrisma().task.findMany({
    where: {
      seasonId,
      ...(filters.status ? { approvalStatus: filters.status } : {}),
      ...(filters.sprintId ? { sprintId: filters.sprintId } : {}),
      ...(filters.projectId ? { projectId: filters.projectId } : {}),
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      externalCode: true,
      title: true,
      assignmentSource: true,
      approvalStatus: true,
      finalizedAt: true,
      updatedAt: true,
      sprint: { select: { id: true, name: true } },
      project: { select: { id: true, name: true, scope: true } },
      _count: { select: { practices: true, evidence: true, agreementMatches: true } },
    },
  });
}

export async function getTaskDetails(seasonId: string, taskId: string) {
  return getPrisma().task.findFirst({
    where: { id: taskId, seasonId },
    select: {
      id: true,
      seasonId: true,
      sprintId: true,
      projectId: true,
      seasonPlanVersionId: true,
      externalCode: true,
      title: true,
      description: true,
      assignmentSource: true,
      sourceType: true,
      approvalStatus: true,
      finalizedAt: true,
      createdAt: true,
      updatedAt: true,
      sprint: { select: { name: true } },
      project: { select: { name: true, scope: true } },
      practices: {
        orderBy: { createdAt: "asc" },
        select: {
          workPracticeId: true,
          status: true,
          practiceNameSnapshot: true,
          workPractice: { select: { active: true, description: true } },
        },
      },
      evidence: {
        orderBy: { createdAt: "asc" },
        select: { id: true, type: true, title: true, url: true },
      },
      agreementMatches: {
        where: { status: { not: "REJECTED" } },
        orderBy: { matchedPracticeCount: "desc" },
        select: {
          id: true,
          status: true,
          confidence: true,
          matchedPracticeCount: true,
          agreementRevision: {
            select: { id: true, title: true, agreementType: true },
          },
        },
      },
    },
  });
}

export async function getTaskEditContext(seasonId: string, taskId: string, employeeId: string) {
  const [formContext, task] = await Promise.all([
    getTaskFormContext(seasonId, employeeId),
    getTaskDetails(seasonId, taskId),
  ]);
  if (!formContext || !task) return null;

  const selectedIds = new Set(task.practices.map((practice) => practice.workPracticeId));
  const inactiveSelected = await getPrisma().workPractice.findMany({
    where: { ownerId: employeeId, active: false, id: { in: [...selectedIds] } },
    select: { id: true, name: true, description: true, active: true },
  });

  return {
    formContext: { ...formContext, practices: [...formContext.practices, ...inactiveSelected] },
    task,
  };
}
