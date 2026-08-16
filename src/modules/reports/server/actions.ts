"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CALCULATION_VERSION } from "@/domain/calculations";
import { getPrisma } from "@/infrastructure/database/prisma";
import { requireSeasonCapability } from "@/modules/authentication/server/season-access";
import { getEmployeeDashboardInTransaction } from "@/modules/dashboard/server/queries";
import type { ReportActionState } from "../application/report-action-state";

function revalidateSeason(seasonId: string) {
  revalidatePath("/");
  revalidatePath("/seasons");
  revalidatePath(`/seasons/${seasonId}`);
  revalidatePath(`/seasons/${seasonId}/dashboard`);
  revalidatePath(`/seasons/${seasonId}/manager-dashboard`);
  revalidatePath(`/seasons/${seasonId}/report`);
}

export async function closeSeasonAction(
  seasonId: string,
  _previousState: ReportActionState,
  _formData: FormData,
): Promise<ReportActionState> {
  void _previousState;
  void _formData;
  const { user } = await requireSeasonCapability(seasonId, "season:close");
  try {
    await getPrisma().$transaction(async (transaction) => {
      const closedAt = new Date();
      const closed = await transaction.season.updateMany({
        where: { id: seasonId, status: "ACTIVE" },
        data: { status: "CLOSED", closedAt, lockVersion: { increment: 1 } },
      });
      if (closed.count !== 1) throw new Error("SEASON_NOT_ACTIVE");

      const dashboard = await getEmployeeDashboardInTransaction(transaction, seasonId, user.id);
      if (!dashboard) throw new Error("DASHBOARD_NOT_AVAILABLE");
      const latestSnapshot = await transaction.performanceSnapshot.findFirst({
        where: { seasonId, scope: "SEASON", sprintId: null },
        orderBy: { revision: "desc" },
        select: { revision: true },
      });
      const metricStatus = dashboard.classification.status === "NOT_ENOUGH_DATA"
        ? "NOT_ENOUGH_DATA"
        : dashboard.metrics.coreAchievement.status;
      const snapshot = await transaction.performanceSnapshot.create({
        data: {
          seasonId,
          scope: "SEASON",
          revision: (latestSnapshot?.revision ?? 0) + 1,
          asOf: closedAt,
          calculationVersion: CALCULATION_VERSION,
          inputHash: dashboard.inputHash,
          metricStatus,
          performanceLevel: dashboard.classification.level,
          primaryReason: dashboard.reasoning.primaryReason,
          supportingReasons: dashboard.reasoning.supportingReasons,
          coreAchievement: dashboard.metrics.coreAchievement.value,
          coreOpportunityCoverage: dashboard.metrics.coreAchievement.opportunityCoverage,
          workAlignment: dashboard.metrics.workAlignment.value,
          alignedExecution: dashboard.metrics.alignedExecution.value,
          bonusAchievement: dashboard.metrics.bonusAchievement.value,
          additionalContribution: dashboard.metrics.additionalContribution.value,
          seasonElapsed: dashboard.season.elapsed,
          details: {
            create: [
              {
                metricKey: "WORK_ALIGNMENT",
                entityType: "Season",
                entityId: seasonId,
                labelSnapshot: "هم‌راستایی کارها",
                numerator: dashboard.metrics.workAlignment.numerator,
                denominator: dashboard.metrics.workAlignment.denominator,
                value: dashboard.metrics.workAlignment.value,
              },
              {
                metricKey: "ALIGNED_EXECUTION",
                entityType: "Season",
                entityId: seasonId,
                labelSnapshot: "اجرای هم‌راستا",
                numerator: dashboard.metrics.alignedExecution.numerator,
                denominator: dashboard.metrics.alignedExecution.denominator,
                value: dashboard.metrics.alignedExecution.value,
              },
              ...dashboard.projectSummaries
                .filter((project) => project.scope === "AGREED")
                .map((project) => ({
                  metricKey: "PROJECT_CORE_ACHIEVEMENT",
                  entityType: "Project",
                  entityId: project.id,
                  labelSnapshot: project.name,
                  value: project.coreAchievement,
                  weight: project.weight,
                  contribution: project.coreAchievement === null || project.weight === null
                    ? null
                    : (project.coreAchievement * project.weight) / 100,
                  metadata: {
                    opportunityCoverage: project.opportunityCoverage,
                    finalizedTaskCount: project.finalizedTaskCount,
                  },
                })),
              ...dashboard.trend.flatMap((point) => [
                {
                  metricKey: "SPRINT_CORE_TREND",
                  entityType: "Sprint",
                  entityId: point.sprintId,
                  labelSnapshot: point.name,
                  value: point.coreAchievement,
                  metadata: { sequenceNumber: point.sequenceNumber },
                },
                {
                  metricKey: "SPRINT_ALIGNMENT_TREND",
                  entityType: "Sprint",
                  entityId: point.sprintId,
                  labelSnapshot: point.name,
                  value: point.workAlignment,
                  metadata: { sequenceNumber: point.sequenceNumber },
                },
                {
                  metricKey: "SPRINT_EXECUTION_TREND",
                  entityType: "Sprint",
                  entityId: point.sprintId,
                  labelSnapshot: point.name,
                  value: point.alignedExecution,
                  metadata: { sequenceNumber: point.sequenceNumber },
                },
              ]),
            ],
          },
        },
        select: { id: true, revision: true },
      });
      await transaction.auditLog.create({
        data: {
          seasonId,
          actorId: user.id,
          entityType: "Season",
          entityId: seasonId,
          action: "CLOSED",
          before: { status: "ACTIVE" },
          after: { status: "CLOSED", snapshotId: snapshot.id, snapshotRevision: snapshot.revision },
        },
      });
      await transaction.auditLog.create({
        data: {
          seasonId,
          actorId: user.id,
          entityType: "PerformanceSnapshot",
          entityId: snapshot.id,
          action: "SNAPSHOT_CREATED",
          after: { revision: snapshot.revision, inputHash: dashboard.inputHash, calculationVersion: CALCULATION_VERSION },
        },
      });
    }, { isolationLevel: "Serializable", maxWait: 10_000, timeout: 30_000 });
  } catch (error) {
    if (error instanceof Error && error.message === "SEASON_NOT_ACTIVE") {
      return { status: "conflict", message: "دوره دیگر در وضعیت فعال نیست." };
    }
    console.error("Closing season failed.", error);
    return { status: "system-error", message: "بستن دوره و ساخت Snapshot انجام نشد." };
  }
  revalidateSeason(seasonId);
  redirect(`/seasons/${seasonId}/report?closed=1`);
}

export async function reopenSeasonAction(
  seasonId: string,
  _previousState: ReportActionState,
  _formData: FormData,
): Promise<ReportActionState> {
  void _previousState;
  void _formData;
  const { user } = await requireSeasonCapability(seasonId, "season:reopen");
  try {
    await getPrisma().$transaction(async (transaction) => {
      const reopened = await transaction.season.updateMany({
        where: { id: seasonId, status: "CLOSED" },
        data: { status: "ACTIVE", reopenedAt: new Date(), lockVersion: { increment: 1 } },
      });
      if (reopened.count !== 1) throw new Error("SEASON_NOT_CLOSED");
      await transaction.auditLog.create({
        data: {
          seasonId,
          actorId: user.id,
          entityType: "Season",
          entityId: seasonId,
          action: "REOPENED",
          before: { status: "CLOSED" },
          after: { status: "ACTIVE" },
        },
      });
    });
  } catch (error) {
    console.error("Reopening season failed.", error);
    return { status: "system-error", message: "بازگشایی دوره انجام نشد." };
  }
  revalidateSeason(seasonId);
  redirect(`/seasons/${seasonId}/report?reopened=1`);
}
