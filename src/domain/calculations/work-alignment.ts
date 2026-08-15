import { assertUniqueIds, calculatedRatio, noOpportunity } from "./helpers";
import type { AssignmentSource, ProjectInput, RatioMetricResult, TaskInput } from "./types";

export const DEFAULT_ASSIGNED_SOURCES: readonly AssignmentSource[] = [
  "MANAGER_ASSIGNED",
  "CUSTOMER_REQUEST",
  "STAKEHOLDER_REQUEST",
  "OTHER",
];

export function calculateWorkAlignment(input: {
  readonly projects: readonly ProjectInput[];
  readonly tasks: readonly TaskInput[];
  readonly assignedSources?: readonly AssignmentSource[];
}): RatioMetricResult {
  const { projects, tasks, assignedSources = DEFAULT_ASSIGNED_SOURCES } = input;
  assertUniqueIds(projects, (project) => project.id, "projects");
  assertUniqueIds(tasks, (task) => task.id, "tasks");

  const projectScopes = new Map(projects.map((project) => [project.id, project.scope]));
  const assignedSourceSet = new Set(assignedSources);
  const includedTaskIds: string[] = [];
  const exclusions: RatioMetricResult["exclusions"][number][] = [];
  let assignedFinalizedTasks = 0;
  let alignedFinalizedTasks = 0;

  for (const task of tasks) {
    if (task.approvalStatus !== "FINAL_APPROVED") {
      exclusions.push({ entityId: task.id, reason: "NOT_FINAL_APPROVED" });
      continue;
    }

    if (!assignedSourceSet.has(task.assignmentSource)) {
      exclusions.push({ entityId: task.id, reason: "SELF_INITIATED_EXCLUDED" });
      continue;
    }

    assignedFinalizedTasks += 1;
    includedTaskIds.push(task.id);
    if (projectScopes.get(task.projectId) === "AGREED") {
      alignedFinalizedTasks += 1;
    } else {
      exclusions.push({ entityId: task.id, reason: "PROJECT_OUTSIDE_AGREED_SCOPE" });
    }
  }

  return assignedFinalizedTasks === 0
    ? noOpportunity(exclusions)
    : calculatedRatio(
        alignedFinalizedTasks,
        assignedFinalizedTasks,
        includedTaskIds,
        exclusions,
      );
}
