import { getPrisma } from "@/infrastructure/database/prisma";
import { calculateDashboardMetrics, calculateSeasonElapsed } from "../application/dashboard-metrics";

export async function getEmployeeDashboard(seasonId: string, employeeId: string) {
  const season = await getPrisma().season.findFirst({
    where: { id: seasonId, employeeId },
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
      sprints: {
        orderBy: { sequenceNumber: "asc" },
        select: { id: true, name: true, sequenceNumber: true, status: true, startDate: true, endDate: true },
      },
      projects: {
        where: { status: "ACTIVE", scope: "ADDITIONAL" },
        select: { id: true, name: true, scope: true },
      },
      planVersions: {
        where: { status: "PUBLISHED" },
        orderBy: { version: "desc" },
        take: 1,
        select: {
          id: true,
          projectPlans: {
            select: {
              projectId: true,
              nameSnapshot: true,
              weight: true,
              agreementRevisions: {
                select: {
                  id: true,
                  title: true,
                  agreementType: true,
                  expectedPractices: { select: { workPracticeId: true } },
                },
              },
            },
          },
        },
      },
      tasks: {
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          externalCode: true,
          title: true,
          projectId: true,
          sprintId: true,
          approvalStatus: true,
          assignmentSource: true,
          updatedAt: true,
          project: { select: { name: true, scope: true } },
          sprint: { select: { name: true } },
          practices: { select: { workPracticeId: true, status: true } },
          evidence: { select: { id: true } },
        },
      },
    },
  });

  const plan = season?.planVersions[0];
  if (!season || !plan) return null;

  const projects = [
    ...plan.projectPlans.map((project) => ({
      id: project.projectId,
      name: project.nameSnapshot,
      scope: "AGREED" as const,
      weight: Number(project.weight),
    })),
    ...season.projects.map((project) => ({
      id: project.id,
      name: project.name,
      scope: "ADDITIONAL" as const,
      weight: null,
    })),
  ];
  const agreements = plan.projectPlans.flatMap((project) =>
    project.agreementRevisions.map((agreement) => ({
      id: agreement.id,
      title: agreement.title,
      projectId: project.projectId,
      type: agreement.agreementType,
      expectedPracticeIds: agreement.expectedPractices.map((practice) => practice.workPracticeId),
    })),
  );
  const calculationTasks = season.tasks.map((task) => ({
    id: task.id,
    projectId: task.projectId,
    approvalStatus: task.approvalStatus,
    assignmentSource: task.assignmentSource,
    practices: task.practices.map((practice) => ({
      practiceId: practice.workPracticeId,
      status: practice.status,
    })),
  }));

  const metrics = calculateDashboardMetrics({ projects, agreements, tasks: calculationTasks });
  const now = new Date();
  const currentSprint = season.sprints.find((sprint) => sprint.status === "ACTIVE")
    ?? season.sprints.find((sprint) => sprint.startDate <= now && sprint.endDate >= now)
    ?? null;
  const draftTasks = season.tasks.filter((task) => task.approvalStatus !== "FINAL_APPROVED");
  const missingEvidenceTasks = season.tasks.filter(
    (task) => task.approvalStatus === "FINAL_APPROVED" && task.evidence.length === 0,
  );

  return {
    season: {
      id: season.id,
      name: season.name,
      status: season.status,
      startDate: season.startDate,
      endDate: season.endDate,
      elapsed: calculateSeasonElapsed(season.startDate, season.endDate),
    },
    currentSprint,
    metrics,
    counts: {
      finalized: season.tasks.length - draftTasks.length,
      draft: draftTasks.length,
      missingEvidence: missingEvidenceTasks.length,
      additional: season.tasks.filter((task) => task.project.scope === "ADDITIONAL").length,
    },
    draftTasks: draftTasks.slice(0, 5),
    missingEvidenceTasks: missingEvidenceTasks.slice(0, 5),
    recentTasks: season.tasks.slice(0, 6),
    projects,
    agreements,
  };
}
