import { getPrisma } from "@/infrastructure/database/prisma";

export function getLatestSeasonSnapshot(seasonId: string) {
  return getPrisma().performanceSnapshot.findFirst({
    where: { seasonId, scope: "SEASON", sprintId: null },
    orderBy: { revision: "desc" },
    include: { details: { orderBy: [{ metricKey: "asc" }, { createdAt: "asc" }] } },
  });
}

export async function getWorkPracticeReport(seasonId: string) {
  const instances = await getPrisma().taskPractice.findMany({
    where: { task: { seasonId, approvalStatus: "FINAL_APPROVED" } },
    select: {
      workPracticeId: true,
      practiceNameSnapshot: true,
      status: true,
      taskId: true,
    },
  });
  const grouped = new Map<string, { id: string; name: string; done: number; applicable: number; taskIds: Set<string> }>();
  for (const instance of instances) {
    const current = grouped.get(instance.workPracticeId) ?? {
      id: instance.workPracticeId,
      name: instance.practiceNameSnapshot,
      done: 0,
      applicable: 0,
      taskIds: new Set<string>(),
    };
    current.taskIds.add(instance.taskId);
    if (instance.status !== "NOT_APPLICABLE") {
      current.applicable += 1;
      if (instance.status === "DONE") current.done += 1;
    }
    grouped.set(instance.workPracticeId, current);
  }
  return [...grouped.values()].map((item) => ({
    id: item.id,
    name: item.name,
    done: item.done,
    applicable: item.applicable,
    achievement: item.applicable ? (item.done / item.applicable) * 100 : null,
    taskCount: item.taskIds.size,
  })).sort((a, b) => a.name.localeCompare(b.name, "fa"));
}
