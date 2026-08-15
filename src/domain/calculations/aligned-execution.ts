import { assertUniqueIds, calculatedRatio, noOpportunity } from "./helpers";
import type { AgreementInput, ProjectInput, RatioMetricResult, TaskInput } from "./types";

function instanceId(taskId: string, practiceId: string): string {
  return `${taskId}:${practiceId}`;
}

export function calculateAlignedExecution(input: {
  readonly projects: readonly ProjectInput[];
  readonly agreements: readonly AgreementInput[];
  readonly tasks: readonly TaskInput[];
}): RatioMetricResult {
  const { projects, agreements, tasks } = input;
  assertUniqueIds(projects, (project) => project.id, "projects");
  assertUniqueIds(agreements, (agreement) => agreement.id, "agreements");
  assertUniqueIds(tasks, (task) => task.id, "tasks");

  const agreedProjectIds = new Set(
    projects.filter((project) => project.scope === "AGREED").map((project) => project.id),
  );
  const expectedPracticesByProject = new Map<string, Set<string>>();

  for (const agreement of agreements) {
    if (agreement.type !== "CORE" || !agreedProjectIds.has(agreement.projectId)) {
      continue;
    }
    assertUniqueIds(
      agreement.expectedPracticeIds,
      (practiceId) => practiceId,
      `agreement(${agreement.id}).expectedPracticeIds`,
    );
    const practices = expectedPracticesByProject.get(agreement.projectId) ?? new Set<string>();
    for (const practiceId of agreement.expectedPracticeIds) {
      practices.add(practiceId);
    }
    expectedPracticesByProject.set(agreement.projectId, practices);
  }

  let achieved = 0;
  let applicable = 0;
  const includedInstanceIds: string[] = [];
  const exclusions: RatioMetricResult["exclusions"][number][] = [];

  for (const task of tasks) {
    assertUniqueIds(
      task.practices,
      (practice) => practice.practiceId,
      `task(${task.id}).practices`,
    );

    if (task.approvalStatus !== "FINAL_APPROVED") {
      exclusions.push({ entityId: task.id, reason: "NOT_FINAL_APPROVED" });
      continue;
    }
    if (!agreedProjectIds.has(task.projectId)) {
      exclusions.push({ entityId: task.id, reason: "PROJECT_OUTSIDE_AGREED_SCOPE" });
      continue;
    }

    const expectedPractices = expectedPracticesByProject.get(task.projectId) ?? new Set();
    let matchedExpectedPractice = false;

    for (const practice of task.practices) {
      const id = instanceId(task.id, practice.practiceId);
      if (!expectedPractices.has(practice.practiceId)) {
        exclusions.push({ entityId: id, reason: "PRACTICE_NOT_EXPECTED" });
        continue;
      }

      matchedExpectedPractice = true;
      if (practice.status === "NOT_APPLICABLE") {
        exclusions.push({ entityId: id, reason: "NOT_APPLICABLE" });
        continue;
      }

      applicable += 1;
      includedInstanceIds.push(id);
      if (practice.status === "DONE") {
        achieved += 1;
      }
    }

    if (!matchedExpectedPractice) {
      exclusions.push({ entityId: task.id, reason: "NO_EXPECTED_PRACTICE_MATCH" });
    }
  }

  return applicable === 0
    ? noOpportunity(exclusions)
    : calculatedRatio(achieved, applicable, includedInstanceIds, exclusions);
}
