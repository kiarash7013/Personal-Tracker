import { assertUniqueIds, calculatedRatio, noOpportunity } from "./helpers";
import type { AdditionalContributionResult, ProjectInput, TaskInput } from "./types";

export function calculateAdditionalContribution(input: {
  readonly projects: readonly ProjectInput[];
  readonly tasks: readonly TaskInput[];
}): AdditionalContributionResult {
  const { projects, tasks } = input;
  assertUniqueIds(projects, (project) => project.id, "projects");
  assertUniqueIds(tasks, (task) => task.id, "tasks");

  const additionalProjectIds = new Set(
    projects
      .filter((project) => project.scope === "ADDITIONAL")
      .map((project) => project.id),
  );
  const includedTaskIds: string[] = [];
  const exclusions: AdditionalContributionResult["exclusions"][number][] = [];
  let finalizedTasks = 0;
  let additionalTasks = 0;
  let assignedAdditionalTaskCount = 0;
  let selfInitiatedAdditionalTaskCount = 0;

  for (const task of tasks) {
    if (task.approvalStatus !== "FINAL_APPROVED") {
      exclusions.push({ entityId: task.id, reason: "NOT_FINAL_APPROVED" });
      continue;
    }

    finalizedTasks += 1;
    includedTaskIds.push(task.id);

    if (additionalProjectIds.has(task.projectId)) {
      additionalTasks += 1;
      if (task.assignmentSource === "SELF_INITIATED") {
        selfInitiatedAdditionalTaskCount += 1;
      } else {
        assignedAdditionalTaskCount += 1;
      }
    } else {
      exclusions.push({ entityId: task.id, reason: "PROJECT_INSIDE_AGREED_SCOPE" });
    }
  }

  const ratio =
    finalizedTasks === 0
      ? noOpportunity(exclusions)
      : calculatedRatio(additionalTasks, finalizedTasks, includedTaskIds, exclusions);

  return {
    ...ratio,
    assignedAdditionalTaskCount,
    selfInitiatedAdditionalTaskCount,
  };
}
