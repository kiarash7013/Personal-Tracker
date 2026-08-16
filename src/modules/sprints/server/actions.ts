"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPrisma } from "@/infrastructure/database/prisma";
import { requireSeasonCapability } from "@/modules/authentication/server/season-access";
import type { SprintFormState } from "../application/sprint-form-state";
import {
  isSprintInsideSeason,
  parseSprintDate,
  sprintInputSchema,
  type SprintInput,
} from "../domain/sprint-input";

function readSprintForm(formData: FormData): SprintInput {
  return {
    name: String(formData.get("name") ?? ""),
    sequenceNumber: String(formData.get("sequenceNumber") ?? ""),
    startDate: String(formData.get("startDate") ?? ""),
    endDate: String(formData.get("endDate") ?? ""),
    status: String(formData.get("status") ?? "") as SprintInput["status"],
  };
}

function isUniqueConflict(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
}

async function validateSeasonAndActiveSprint(
  seasonId: string,
  sprintId: string | null,
  input: { startDate: string; endDate: string; status: "PLANNED" | "ACTIVE" | "CLOSED" },
) {
  const season = await getPrisma().season.findUnique({
    where: { id: seasonId },
    select: { startDate: true, endDate: true, status: true },
  });
  if (!season || season.status === "CLOSED") return "این دوره قابل ویرایش نیست.";
  if (!isSprintInsideSeason(input, season)) return "بازه اسپرینت باید داخل بازه دوره ارزیابی باشد.";
  if (input.status === "ACTIVE") {
    const activeSprint = await getPrisma().sprint.findFirst({
      where: { seasonId, status: "ACTIVE", ...(sprintId ? { id: { not: sprintId } } : {}) },
      select: { id: true },
    });
    if (activeSprint) return "در هر دوره فقط یک اسپرینت می‌تواند فعال باشد.";
  }
  return null;
}

function revalidateSprints(seasonId: string) {
  revalidatePath(`/seasons/${seasonId}`);
  revalidatePath(`/seasons/${seasonId}/sprints`);
}

export async function createSprintAction(
  seasonId: string,
  _previousState: SprintFormState,
  formData: FormData,
): Promise<SprintFormState> {
  const { user } = await requireSeasonCapability(seasonId, "season:manage-sprints");
  const raw = readSprintForm(formData);
  const parsed = sprintInputSchema.safeParse(raw);
  if (!parsed.success) return { status: "validation-error", fieldErrors: parsed.error.flatten().fieldErrors, values: raw };
  const conflict = await validateSeasonAndActiveSprint(seasonId, null, parsed.data);
  if (conflict) return { status: "conflict", message: conflict, values: parsed.data };

  try {
    await getPrisma().$transaction(async (transaction) => {
      const sprint = await transaction.sprint.create({
        data: {
          seasonId,
          name: parsed.data.name,
          sequenceNumber: parsed.data.sequenceNumber,
          startDate: parseSprintDate(parsed.data.startDate),
          endDate: parseSprintDate(parsed.data.endDate),
          status: parsed.data.status,
        },
        select: { id: true },
      });
      await transaction.auditLog.create({
        data: {
          seasonId,
          actorId: user.id,
          entityType: "Sprint",
          entityId: sprint.id,
          action: "CREATED",
          after: parsed.data,
        },
      });
    });
  } catch (error) {
    if (isUniqueConflict(error)) return { status: "conflict", message: "این شماره ترتیب قبلاً در دوره استفاده شده است.", values: parsed.data };
    console.error("Creating a sprint failed.", error);
    return { status: "system-error", message: "ایجاد اسپرینت انجام نشد.", values: parsed.data };
  }
  revalidateSprints(seasonId);
  redirect(`/seasons/${seasonId}/sprints?created=1`);
}

export async function updateSprintAction(
  seasonId: string,
  sprintId: string,
  _previousState: SprintFormState,
  formData: FormData,
): Promise<SprintFormState> {
  const { user } = await requireSeasonCapability(seasonId, "season:manage-sprints");
  const raw = readSprintForm(formData);
  const parsed = sprintInputSchema.safeParse(raw);
  if (!parsed.success) return { status: "validation-error", fieldErrors: parsed.error.flatten().fieldErrors, values: raw };
  const conflict = await validateSeasonAndActiveSprint(seasonId, sprintId, parsed.data);
  if (conflict) return { status: "conflict", message: conflict, values: parsed.data };

  try {
    await getPrisma().$transaction(async (transaction) => {
      const current = await transaction.sprint.findFirst({
        where: { id: sprintId, seasonId },
        select: { name: true, sequenceNumber: true, startDate: true, endDate: true, status: true },
      });
      if (!current) throw new Error("SPRINT_NOT_FOUND");
      await transaction.sprint.update({
        where: { id: sprintId },
        data: {
          name: parsed.data.name,
          sequenceNumber: parsed.data.sequenceNumber,
          startDate: parseSprintDate(parsed.data.startDate),
          endDate: parseSprintDate(parsed.data.endDate),
          status: parsed.data.status,
        },
      });
      await transaction.auditLog.create({
        data: {
          seasonId,
          actorId: user.id,
          entityType: "Sprint",
          entityId: sprintId,
          action: "UPDATED",
          before: {
            ...current,
            startDate: current.startDate.toISOString().slice(0, 10),
            endDate: current.endDate.toISOString().slice(0, 10),
          },
          after: parsed.data,
        },
      });
    });
  } catch (error) {
    if (isUniqueConflict(error)) return { status: "conflict", message: "این شماره ترتیب قبلاً در دوره استفاده شده است.", values: parsed.data };
    console.error("Updating a sprint failed.", error);
    return { status: "system-error", message: "ویرایش اسپرینت انجام نشد.", values: parsed.data };
  }
  revalidateSprints(seasonId);
  redirect(`/seasons/${seasonId}/sprints?updated=1`);
}
