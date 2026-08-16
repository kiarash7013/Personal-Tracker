import type { AgreementInput, ProjectInput, TaskInput } from "../../../domain/calculations";
import { calculateDashboardMetrics } from "./dashboard-metrics";

export type SprintTrendInput = {
  projects: ProjectInput[];
  agreements: AgreementInput[];
  tasks: Array<TaskInput & { sprintId: string }>;
  sprints: Array<{ id: string; name: string; sequenceNumber: number }>;
  includeSelfInitiatedInAlignment?: boolean;
};

export type SprintTrendPoint = {
  sprintId: string;
  name: string;
  sequenceNumber: number;
  coreAchievement: number | null;
  workAlignment: number | null;
  alignedExecution: number | null;
};

export function calculateSprintTrend(input: SprintTrendInput): SprintTrendPoint[] {
  const ordered = [...input.sprints].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  const includedSprintIds = new Set<string>();
  return ordered.map((sprint) => {
    includedSprintIds.add(sprint.id);
    const metrics = calculateDashboardMetrics(
      {
        projects: input.projects,
        agreements: input.agreements,
        tasks: input.tasks.filter((task) => includedSprintIds.has(task.sprintId)),
      },
      { includeSelfInitiatedInAlignment: input.includeSelfInitiatedInAlignment },
    );
    return {
      sprintId: sprint.id,
      name: sprint.name,
      sequenceNumber: sprint.sequenceNumber,
      coreAchievement: metrics.coreAchievement.value,
      workAlignment: metrics.workAlignment.value,
      alignedExecution: metrics.alignedExecution.value,
    };
  });
}

export function summarizeSprintTrend(points: SprintTrendPoint[]) {
  const observable = points.filter(
    (point) => point.coreAchievement !== null || point.workAlignment !== null || point.alignedExecution !== null,
  );
  if (observable.length < 2) return "برای تحلیل روند، حداقل دو اسپرینت دارای داده لازم است.";
  const first = observable[0];
  const last = observable.at(-1)!;
  const coreStableHigh = first.coreAchievement !== null && last.coreAchievement !== null
    && first.coreAchievement >= 80 && last.coreAchievement >= 80
    && Math.abs(last.coreAchievement - first.coreAchievement) <= 5;
  const alignmentDeclined = first.workAlignment !== null && last.workAlignment !== null
    && last.workAlignment <= first.workAlignment - 10;
  if (coreStableHigh && alignmentDeclined) {
    return "نرخ تحقق توافق‌ها در سطح بالایی باقی مانده است، در حالی که هم‌راستایی کارهای تخصیص‌یافته در طول اسپرینت‌ها کاهش یافته است.";
  }
  if (alignmentDeclined) return "هم‌راستایی کارهای تخصیص‌یافته در اسپرینت‌های اخیر کاهش یافته است؛ اجرای کارهای هم‌راستا باید جداگانه تفسیر شود.";
  if (first.alignedExecution !== null && last.alignedExecution !== null && last.alignedExecution >= first.alignedExecution + 10) {
    return "اجرای مولفه‌های مورد انتظار در کارهای هم‌راستا طی اسپرینت‌ها بهبود یافته است.";
  }
  return "KPIهای تجمعی دوره در اسپرینت‌های ثبت‌شده تغییر شدید و پایدار نشان نمی‌دهند.";
}
