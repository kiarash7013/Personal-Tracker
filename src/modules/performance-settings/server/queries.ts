import { getPrisma } from "@/infrastructure/database/prisma";
import { DEFAULT_PERFORMANCE_SETTINGS } from "../domain/performance-settings";

export async function getPerformanceSettings(seasonId: string) {
  const settings = await getPrisma().performanceSettingVersion.findFirst({
    where: { seasonId },
    orderBy: { version: "desc" },
  });
  if (!settings) return { id: null, version: 0, effectiveAt: null, ...DEFAULT_PERFORMANCE_SETTINGS };
  return {
    id: settings.id,
    version: settings.version,
    effectiveAt: settings.effectiveAt,
    meetsExpectationsMinCoreAchievement: Number(settings.meetsExpectationsMinCoreAchievement),
    minimumAlignedExecution: Number(settings.minimumAlignedExecution),
    bonusRequiredForExceeds: Number(settings.bonusRequiredForExceeds),
    additionalContributionThreshold: Number(settings.additionalContributionThreshold),
    lowAlignmentThreshold: Number(settings.lowAlignmentThreshold),
    strongMetricThreshold: Number(settings.strongMetricThreshold),
    minimumAdditionalTaskCount: settings.minimumAdditionalTaskCount,
    minimumObservableProjectWeight: Number(settings.minimumObservableProjectWeight),
    includeSelfInitiatedInAlignment: settings.includeSelfInitiatedInAlignment,
  };
}
