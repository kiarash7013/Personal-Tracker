import { CALCULATION_VERSION, type AgreementAchievementResult, type AgreementInput, type TaskInput } from "./types";
import { assertUniqueIds, calculatedRatio, noOpportunity } from "./helpers";

function instanceId(taskId: string, practiceId: string): string {
  return `${taskId}:${practiceId}`;
}

export function calculateAgreementAchievement(input: {
  readonly agreement: AgreementInput;
  readonly tasks: readonly TaskInput[];
}): AgreementAchievementResult {
  const { agreement, tasks } = input;
  assertUniqueIds(tasks, (task) => task.id, "tasks");
  assertUniqueIds(
    agreement.expectedPracticeIds,
    (practiceId) => practiceId,
    `agreement(${agreement.id}).expectedPracticeIds`,
  );

  const expectedPracticeIds = new Set(agreement.expectedPracticeIds);
  const includedEntityIds: string[] = [];
  const applicableTaskIds = new Set<string>();
  const exclusions: AgreementAchievementResult["exclusions"][number][] = [];
  let achieved = 0;
  let applicable = 0;

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
    if (task.projectId !== agreement.projectId) {
      exclusions.push({ entityId: task.id, reason: "DIFFERENT_PROJECT" });
      continue;
    }

    let matchedExpectedPractice = false;
    for (const practice of task.practices) {
      if (!expectedPracticeIds.has(practice.practiceId)) {
        exclusions.push({
          entityId: instanceId(task.id, practice.practiceId),
          reason: "PRACTICE_NOT_EXPECTED",
        });
        continue;
      }

      matchedExpectedPractice = true;
      if (practice.status === "NOT_APPLICABLE") {
        exclusions.push({
          entityId: instanceId(task.id, practice.practiceId),
          reason: "NOT_APPLICABLE",
        });
        continue;
      }

      applicable += 1;
      applicableTaskIds.add(task.id);
      includedEntityIds.push(instanceId(task.id, practice.practiceId));
      if (practice.status === "DONE") {
        achieved += 1;
      }
    }

    if (!matchedExpectedPractice) {
      exclusions.push({ entityId: task.id, reason: "NO_EXPECTED_PRACTICE_MATCH" });
    }
  }

  const ratio =
    applicable === 0
      ? noOpportunity(exclusions)
      : calculatedRatio(achieved, applicable, includedEntityIds, exclusions);

  return {
    ...ratio,
    agreementId: agreement.id,
    applicableTaskIds: [...applicableTaskIds],
    calculationVersion: CALCULATION_VERSION,
  };
}
