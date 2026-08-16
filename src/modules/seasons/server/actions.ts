"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPrisma } from "@/infrastructure/database/prisma";
import { requireCurrentUser } from "@/modules/authentication/server/session";
import { requireSeasonCapability } from "@/modules/authentication/server/season-access";
import type {
  ActivationState,
  SeasonFormState,
} from "../application/season-form-state";
import { evaluateActivationReadiness } from "../domain/activation-readiness";
import {
  parseUtcDate,
  seasonInputSchema,
  type SeasonInput,
} from "../domain/season-input";

function readSeasonForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    startDate: String(formData.get("startDate") ?? ""),
    endDate: String(formData.get("endDate") ?? ""),
    managerId: String(formData.get("managerId") ?? ""),
  } satisfies SeasonInput;
}

async function managerIsSelectable(managerId: string, employeeId: string) {
  if (!managerId) {
    return true;
  }

  if (managerId === employeeId) {
    return false;
  }

  const manager = await getPrisma().user.findFirst({
    where: { id: managerId, active: true },
    select: { id: true },
  });

  return Boolean(manager);
}

function invalidManagerState(values: SeasonInput): SeasonFormState {
  return {
    status: "validation-error",
    fieldErrors: { managerId: ["مدیر انتخاب‌شده معتبر یا فعال نیست."] },
    values,
  };
}

export async function createSeasonAction(
  _previousState: SeasonFormState,
  formData: FormData,
): Promise<SeasonFormState> {
  const user = await requireCurrentUser();
  const rawInput = readSeasonForm(formData);
  const parsed = seasonInputSchema.safeParse(rawInput);

  if (!parsed.success) {
    return {
      status: "validation-error",
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: rawInput,
    };
  }

  if (!(await managerIsSelectable(parsed.data.managerId, user.id))) {
    return invalidManagerState(parsed.data);
  }

  let seasonId: string;

  try {
    seasonId = await getPrisma().$transaction(async (transaction) => {
      const season = await transaction.season.create({
        data: {
          name: parsed.data.name,
          startDate: parseUtcDate(parsed.data.startDate),
          endDate: parseUtcDate(parsed.data.endDate),
          employeeId: user.id,
        },
        select: { id: true },
      });

      await transaction.seasonMember.create({
        data: { seasonId: season.id, userId: user.id, role: "EMPLOYEE" },
      });

      if (parsed.data.managerId) {
        await transaction.seasonMember.create({
          data: {
            seasonId: season.id,
            userId: parsed.data.managerId,
            role: "MANAGER",
          },
        });
      }

      await transaction.seasonPlanVersion.create({
        data: { seasonId: season.id, version: 1, createdById: user.id },
      });

      await transaction.auditLog.create({
        data: {
          seasonId: season.id,
          actorId: user.id,
          entityType: "Season",
          entityId: season.id,
          action: "CREATED",
          after: {
            name: parsed.data.name,
            startDate: parsed.data.startDate,
            endDate: parsed.data.endDate,
            managerId: parsed.data.managerId || null,
          },
        },
      });

      return season.id;
    });
  } catch (error) {
    console.error("Creating a season failed.", error);
    return {
      status: "system-error",
      message: "ایجاد دوره انجام نشد. کمی بعد دوباره تلاش کنید.",
      values: parsed.data,
    };
  }

  revalidatePath("/");
  revalidatePath("/seasons");
  redirect(`/seasons/${seasonId}?created=1`);
}

export async function updateSeasonAction(
  seasonId: string,
  _previousState: SeasonFormState,
  formData: FormData,
): Promise<SeasonFormState> {
  const { user } = await requireSeasonCapability(seasonId, "season:edit-setup");
  const rawInput = readSeasonForm(formData);
  const parsed = seasonInputSchema.safeParse(rawInput);

  if (!parsed.success) {
    return {
      status: "validation-error",
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: rawInput,
    };
  }

  if (!(await managerIsSelectable(parsed.data.managerId, user.id))) {
    return invalidManagerState(parsed.data);
  }

  try {
    const current = await getPrisma().season.findUnique({
      where: { id: seasonId },
      select: {
        name: true,
        startDate: true,
        endDate: true,
        lockVersion: true,
        members: {
          where: { role: "MANAGER" },
          select: { userId: true },
        },
      },
    });

    if (!current) {
      return { status: "conflict", message: "دوره موردنظر دیگر در دسترس نیست." };
    }

    await getPrisma().$transaction(async (transaction) => {
      const updated = await transaction.season.updateMany({
        where: { id: seasonId, lockVersion: current.lockVersion },
        data: {
          name: parsed.data.name,
          startDate: parseUtcDate(parsed.data.startDate),
          endDate: parseUtcDate(parsed.data.endDate),
          lockVersion: { increment: 1 },
        },
      });

      if (updated.count !== 1) {
        throw new Error("SEASON_CONCURRENT_UPDATE");
      }

      await transaction.seasonMember.deleteMany({
        where: { seasonId, role: "MANAGER" },
      });

      if (parsed.data.managerId) {
        await transaction.seasonMember.create({
          data: {
            seasonId,
            userId: parsed.data.managerId,
            role: "MANAGER",
          },
        });
      }

      await transaction.auditLog.create({
        data: {
          seasonId,
          actorId: user.id,
          entityType: "Season",
          entityId: seasonId,
          action: "UPDATED",
          before: {
            name: current.name,
            startDate: current.startDate.toISOString().slice(0, 10),
            endDate: current.endDate.toISOString().slice(0, 10),
            managerIds: current.members.map((member) => member.userId),
          },
          after: {
            name: parsed.data.name,
            startDate: parsed.data.startDate,
            endDate: parsed.data.endDate,
            managerId: parsed.data.managerId || null,
          },
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "SEASON_CONCURRENT_UPDATE") {
      return {
        status: "conflict",
        message: "این دوره هم‌زمان در جای دیگری تغییر کرده است. صفحه را تازه‌سازی کنید.",
        values: parsed.data,
      };
    }

    console.error("Updating a season failed.", error);
    return {
      status: "system-error",
      message: "به‌روزرسانی دوره انجام نشد. کمی بعد دوباره تلاش کنید.",
      values: parsed.data,
    };
  }

  revalidatePath("/");
  revalidatePath("/seasons");
  revalidatePath(`/seasons/${seasonId}`);
  redirect(`/seasons/${seasonId}?updated=1`);
}

class SeasonNotReadyError extends Error {
  constructor(public readonly issues: ReturnType<typeof evaluateActivationReadiness>["issues"]) {
    super("Season setup is incomplete.");
  }
}

export async function activateSeasonAction(
  seasonId: string,
  _previousState: ActivationState,
  _formData: FormData,
): Promise<ActivationState> {
  void _previousState;
  void _formData;
  const { user } = await requireSeasonCapability(seasonId, "season:edit-setup");

  try {
    await getPrisma().$transaction(async (transaction) => {
      const season = await transaction.season.findUnique({
        where: { id: seasonId },
        select: {
          status: true,
          lockVersion: true,
          planVersions: {
            where: { status: "DRAFT" },
            orderBy: { version: "desc" },
            take: 1,
            select: {
              id: true,
              projectPlans: {
                select: {
                  weight: true,
                  agreementRevisions: {
                    where: { agreementType: "CORE" },
                    select: { _count: { select: { expectedPractices: true } } },
                  },
                },
              },
            },
          },
        },
      });

      if (!season || season.status !== "DRAFT" || !season.planVersions[0]) {
        throw new Error("SEASON_NOT_DRAFT");
      }

      const plan = season.planVersions[0];
      const readiness = evaluateActivationReadiness(
        plan.projectPlans.map((project) => ({
          weight: Number(project.weight),
          coreAgreements: project.agreementRevisions.map((agreement) => ({
            practiceCount: agreement._count.expectedPractices,
          })),
        })),
      );

      if (!readiness.ready) {
        throw new SeasonNotReadyError(readiness.issues);
      }

      const now = new Date();
      await transaction.seasonPlanVersion.update({
        where: { id: plan.id },
        data: { status: "PUBLISHED", effectiveAt: now, publishedAt: now },
      });

      const activated = await transaction.season.updateMany({
        where: { id: seasonId, status: "DRAFT", lockVersion: season.lockVersion },
        data: { status: "ACTIVE", lockVersion: { increment: 1 } },
      });

      if (activated.count !== 1) {
        throw new Error("SEASON_CONCURRENT_UPDATE");
      }

      await transaction.auditLog.create({
        data: {
          seasonId,
          actorId: user.id,
          entityType: "Season",
          entityId: seasonId,
          action: "ACTIVATED",
          before: { status: "DRAFT" },
          after: { status: "ACTIVE", planVersionId: plan.id },
        },
      });
    });
  } catch (error) {
    if (error instanceof SeasonNotReadyError) {
      return { status: "not-ready", issues: error.issues };
    }

    if (error instanceof Error && error.message === "SEASON_NOT_DRAFT") {
      return { status: "system-error", message: "این دوره دیگر در وضعیت پیش‌نویس نیست." };
    }

    console.error("Activating a season failed.", error);
    return {
      status: "system-error",
      message: "فعال‌سازی دوره انجام نشد. کمی بعد دوباره تلاش کنید.",
    };
  }

  revalidatePath("/");
  revalidatePath("/seasons");
  revalidatePath(`/seasons/${seasonId}`);
  redirect(`/seasons/${seasonId}?activated=1`);
}
