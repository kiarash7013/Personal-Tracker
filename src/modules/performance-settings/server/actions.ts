"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPrisma } from "@/infrastructure/database/prisma";
import { requireSeasonCapability } from "@/modules/authentication/server/season-access";
import type { SettingsFormState } from "../application/settings-form-state";
import { performanceSettingsSchema, type PerformanceSettingsInput } from "../domain/performance-settings";

function readSettings(formData: FormData): PerformanceSettingsInput {
  return {
    meetsExpectationsMinCoreAchievement: String(formData.get("meetsExpectationsMinCoreAchievement") ?? ""),
    minimumAlignedExecution: String(formData.get("minimumAlignedExecution") ?? ""),
    bonusRequiredForExceeds: String(formData.get("bonusRequiredForExceeds") ?? ""),
    additionalContributionThreshold: String(formData.get("additionalContributionThreshold") ?? ""),
    lowAlignmentThreshold: String(formData.get("lowAlignmentThreshold") ?? ""),
    strongMetricThreshold: String(formData.get("strongMetricThreshold") ?? ""),
    minimumAdditionalTaskCount: String(formData.get("minimumAdditionalTaskCount") ?? ""),
    minimumObservableProjectWeight: String(formData.get("minimumObservableProjectWeight") ?? ""),
    includeSelfInitiatedInAlignment: formData.get("includeSelfInitiatedInAlignment") === "on",
  };
}

export async function updatePerformanceSettingsAction(
  seasonId: string,
  _previousState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const { user } = await requireSeasonCapability(seasonId, "season:manage-settings");
  const raw = readSettings(formData);
  const parsed = performanceSettingsSchema.safeParse(raw);
  if (!parsed.success) return { status: "validation-error", fieldErrors: parsed.error.flatten().fieldErrors, values: raw };

  try {
    await getPrisma().$transaction(async (transaction) => {
      const latest = await transaction.performanceSettingVersion.findFirst({
        where: { seasonId },
        orderBy: { version: "desc" },
        select: { version: true },
      });
      const created = await transaction.performanceSettingVersion.create({
        data: { seasonId, version: (latest?.version ?? 0) + 1, effectiveAt: new Date(), ...parsed.data },
        select: { id: true, version: true },
      });
      await transaction.auditLog.create({
        data: {
          seasonId,
          actorId: user.id,
          entityType: "PerformanceSettings",
          entityId: created.id,
          action: "UPDATED",
          after: { version: created.version, ...parsed.data },
        },
      });
    });
  } catch (error) {
    console.error("Updating performance settings failed.", error);
    return { status: "system-error", message: "ذخیره تنظیمات انجام نشد.", values: parsed.data };
  }
  revalidatePath(`/seasons/${seasonId}/dashboard`);
  revalidatePath(`/seasons/${seasonId}/manager-dashboard`);
  revalidatePath(`/seasons/${seasonId}/settings/performance`);
  redirect(`/seasons/${seasonId}/settings/performance?updated=1`);
}
