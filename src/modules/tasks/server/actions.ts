"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "../../../../generated/prisma/client";
import { getPrisma } from "@/infrastructure/database/prisma";
import { requireSeasonCapability } from "@/modules/authentication/server/season-access";
import type {
  AdditionalProjectFormState,
  TaskFormState,
} from "../application/task-form-state";
import {
  additionalProjectInputSchema,
  suggestAgreementMatches,
  taskInputSchema,
  type TaskInput,
} from "../domain/task-input";

function readTaskForm(formData: FormData): TaskInput {
  const practices: TaskInput["practices"] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("practice.")) continue;
    const status = String(value);
    if (status) {
      practices.push({
        workPracticeId: key.slice("practice.".length),
        status: status as (typeof practices)[number]["status"],
      });
    }
  }

  const evidenceTitles = formData.getAll("evidenceTitle").map(String);
  const evidenceTypes = formData.getAll("evidenceType").map(String);
  const evidenceUrls = formData.getAll("evidenceUrl").map(String);
  const evidence = evidenceTitles.flatMap((title, index) => {
    const type = evidenceTypes[index] ?? "OTHER_URL";
    const url = evidenceUrls[index] ?? "";
    if (!title.trim() && !url.trim()) return [];
    return [{ type: type as TaskInput["evidence"][number]["type"], title, url }];
  });

  return {
    sprintId: String(formData.get("sprintId") ?? ""),
    projectId: String(formData.get("projectId") ?? ""),
    externalCode: String(formData.get("externalCode") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    assignmentSource: String(formData.get("assignmentSource") ?? "") as TaskInput["assignmentSource"],
    approvalStatus: String(formData.get("approvalStatus") ?? "") as TaskInput["approvalStatus"],
    practices,
    evidence,
  };
}

function isUniqueConflict(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
}

async function getWritableTaskContext(seasonId: string) {
  return getPrisma().season.findFirst({
    where: { id: seasonId, status: "ACTIVE" },
    select: {
      employeeId: true,
      planVersions: {
        where: { status: "PUBLISHED" },
        orderBy: { version: "desc" },
        take: 1,
        select: { id: true },
      },
    },
  });
}

async function validateTaskReferences(
  seasonId: string,
  employeeId: string,
  input: { sprintId: string; projectId: string; practices: Array<{ workPracticeId: string }> },
  allowedInactivePracticeIds: string[] = [],
) {
  const [sprint, project, practiceCount] = await Promise.all([
    getPrisma().sprint.findFirst({ where: { id: input.sprintId, seasonId }, select: { id: true } }),
    getPrisma().project.findFirst({ where: { id: input.projectId, seasonId, status: "ACTIVE" }, select: { id: true } }),
    getPrisma().workPractice.count({
      where: {
        ownerId: employeeId,
        id: { in: input.practices.map((practice) => practice.workPracticeId) },
        OR: [{ active: true }, { id: { in: allowedInactivePracticeIds } }],
      },
    }),
  ]);
  if (!sprint) return "اسپرینت انتخاب‌شده متعلق به این دوره نیست.";
  if (!project) return "پروژه انتخاب‌شده متعلق به این دوره نیست.";
  if (practiceCount !== input.practices.length) return "یکی از مولفه‌های کاری انتخاب‌شده معتبر نیست.";
  return null;
}

async function createTaskChildren(
  transaction: Prisma.TransactionClient,
  taskId: string,
  employeeId: string,
  planId: string,
  projectId: string,
  input: ReturnType<typeof taskInputSchema.parse>,
) {
  const practices = await transaction.workPractice.findMany({
    where: { ownerId: employeeId, id: { in: input.practices.map((practice) => practice.workPracticeId) } },
    select: { id: true, name: true },
  });
  const practiceNames = new Map(practices.map((practice) => [practice.id, practice.name]));
  if (practices.length !== input.practices.length) throw new Error("PRACTICE_CONFLICT");

  if (input.practices.length) {
    await transaction.taskPractice.createMany({
      data: input.practices.map((practice) => ({
        taskId,
        workPracticeId: practice.workPracticeId,
        status: practice.status,
        practiceNameSnapshot: practiceNames.get(practice.workPracticeId) ?? "",
      })),
    });
  }
  if (input.evidence.length) {
    await transaction.evidence.createMany({
      data: input.evidence.map((item) => ({ ...item, taskId, createdById: employeeId })),
    });
  }

  const agreements = await transaction.agreementRevision.findMany({
    where: { seasonPlanVersionId: planId, projectPlan: { projectId } },
    select: {
      id: true,
      expectedPractices: { select: { workPracticeId: true } },
    },
  });
  const matches = suggestAgreementMatches(
    input.practices.map((practice) => practice.workPracticeId),
    agreements.map((agreement) => ({
      id: agreement.id,
      expectedPracticeIds: agreement.expectedPractices.map((practice) => practice.workPracticeId),
    })),
  );
  if (matches.length) {
    await transaction.taskAgreementMatch.createMany({
      data: matches.map((match) => ({ ...match, taskId, status: "SUGGESTED" })),
    });
  }
}

function revalidateTasks(seasonId: string, taskId?: string) {
  revalidatePath(`/seasons/${seasonId}`);
  revalidatePath(`/seasons/${seasonId}/tasks`);
  if (taskId) revalidatePath(`/seasons/${seasonId}/tasks/${taskId}`);
}

export async function createTaskAction(
  seasonId: string,
  _previousState: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const { user } = await requireSeasonCapability(seasonId, "season:manage-tasks");
  const raw = readTaskForm(formData);
  const parsed = taskInputSchema.safeParse(raw);
  if (!parsed.success) return { status: "validation-error", fieldErrors: parsed.error.flatten().fieldErrors, values: raw };

  const context = await getWritableTaskContext(seasonId);
  if (!context?.planVersions[0]) return { status: "conflict", message: "برای ثبت تسک، دوره باید فعال و دارای برنامه منتشرشده باشد.", values: parsed.data };
  const referenceError = await validateTaskReferences(seasonId, context.employeeId, parsed.data);
  if (referenceError) return { status: "conflict", message: referenceError, values: parsed.data };

  let taskId: string;
  try {
    taskId = await getPrisma().$transaction(async (transaction) => {
      const task = await transaction.task.create({
        data: {
          seasonId,
          sprintId: parsed.data.sprintId,
          projectId: parsed.data.projectId,
          seasonPlanVersionId: context.planVersions[0].id,
          externalCode: parsed.data.externalCode || null,
          title: parsed.data.title,
          description: parsed.data.description || null,
          assignmentSource: parsed.data.assignmentSource,
          sourceType: "MANUAL",
          approvalStatus: "DRAFT",
          createdById: user.id,
        },
        select: { id: true },
      });
      await createTaskChildren(
        transaction,
        task.id,
        context.employeeId,
        context.planVersions[0].id,
        parsed.data.projectId,
        parsed.data,
      );
      if (parsed.data.approvalStatus !== "DRAFT") {
        await transaction.task.update({
          where: { id: task.id },
          data: {
            approvalStatus: parsed.data.approvalStatus,
            finalizedAt: parsed.data.approvalStatus === "FINAL_APPROVED" ? new Date() : null,
          },
        });
      }
      await transaction.auditLog.create({
        data: {
          seasonId,
          actorId: user.id,
          entityType: "Task",
          entityId: task.id,
          action: parsed.data.approvalStatus === "FINAL_APPROVED" ? "FINALIZED" : "CREATED",
          after: parsed.data,
        },
      });
      return task.id;
    });
  } catch (error) {
    if (isUniqueConflict(error)) return { status: "conflict", message: "این کد تسک قبلاً در دوره ثبت شده است.", values: parsed.data };
    console.error("Creating a task failed.", error);
    return { status: "system-error", message: "ثبت تسک انجام نشد. دوباره تلاش کنید.", values: parsed.data };
  }

  revalidateTasks(seasonId, taskId);
  redirect(`/seasons/${seasonId}/tasks/${taskId}?created=1`);
}

export async function updateTaskAction(
  seasonId: string,
  taskId: string,
  _previousState: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const { user } = await requireSeasonCapability(seasonId, "season:manage-tasks");
  const raw = readTaskForm(formData);
  const parsed = taskInputSchema.safeParse(raw);
  if (!parsed.success) return { status: "validation-error", fieldErrors: parsed.error.flatten().fieldErrors, values: raw };

  const [context, existing] = await Promise.all([
    getWritableTaskContext(seasonId),
    getPrisma().task.findFirst({
      where: { id: taskId, seasonId },
      select: {
        approvalStatus: true,
        externalCode: true,
        title: true,
        sprintId: true,
        projectId: true,
        practices: { select: { workPracticeId: true } },
      },
    }),
  ]);
  if (!context?.planVersions[0] || !existing) return { status: "conflict", message: "تسک یا دوره دیگر قابل ویرایش نیست.", values: parsed.data };
  const referenceError = await validateTaskReferences(
    seasonId,
    context.employeeId,
    parsed.data,
    existing.practices.map((practice) => practice.workPracticeId),
  );
  if (referenceError) return { status: "conflict", message: referenceError, values: parsed.data };

  try {
    await getPrisma().$transaction(async (transaction) => {
      if (existing.approvalStatus === "FINAL_APPROVED") {
        await transaction.task.update({ where: { id: taskId }, data: { approvalStatus: "DRAFT", finalizedAt: null } });
      }
      await transaction.taskAgreementMatch.deleteMany({ where: { taskId } });
      await transaction.evidence.deleteMany({ where: { taskId } });
      await transaction.taskPractice.deleteMany({ where: { taskId } });

      await transaction.task.update({
        where: { id: taskId },
        data: {
          sprintId: parsed.data.sprintId,
          projectId: parsed.data.projectId,
          seasonPlanVersionId: context.planVersions[0].id,
          externalCode: parsed.data.externalCode || null,
          title: parsed.data.title,
          description: parsed.data.description || null,
          assignmentSource: parsed.data.assignmentSource,
          approvalStatus: "DRAFT",
          finalizedAt: null,
        },
      });
      await createTaskChildren(
        transaction,
        taskId,
        context.employeeId,
        context.planVersions[0].id,
        parsed.data.projectId,
        parsed.data,
      );
      if (parsed.data.approvalStatus !== "DRAFT") {
        await transaction.task.update({
          where: { id: taskId },
          data: {
            approvalStatus: parsed.data.approvalStatus,
            finalizedAt: parsed.data.approvalStatus === "FINAL_APPROVED" ? new Date() : null,
          },
        });
      }
      await transaction.auditLog.create({
        data: {
          seasonId,
          actorId: user.id,
          entityType: "Task",
          entityId: taskId,
          action: parsed.data.approvalStatus === "FINAL_APPROVED" && existing.approvalStatus !== "FINAL_APPROVED"
            ? "FINALIZED"
            : "UPDATED",
          before: {
            approvalStatus: existing.approvalStatus,
            externalCode: existing.externalCode,
            title: existing.title,
            sprintId: existing.sprintId,
            projectId: existing.projectId,
          },
          after: parsed.data,
        },
      });
    });
  } catch (error) {
    if (isUniqueConflict(error)) return { status: "conflict", message: "این کد تسک قبلاً در دوره ثبت شده است.", values: parsed.data };
    console.error("Updating a task failed.", error);
    return { status: "system-error", message: "ویرایش تسک انجام نشد. دوباره تلاش کنید.", values: parsed.data };
  }
  revalidateTasks(seasonId, taskId);
  redirect(`/seasons/${seasonId}/tasks/${taskId}?updated=1`);
}

export async function createAdditionalProjectAction(
  seasonId: string,
  _previousState: AdditionalProjectFormState,
  formData: FormData,
): Promise<AdditionalProjectFormState> {
  const { user } = await requireSeasonCapability(seasonId, "season:manage-tasks");
  const raw = { name: String(formData.get("name") ?? ""), description: String(formData.get("description") ?? "") };
  const parsed = additionalProjectInputSchema.safeParse(raw);
  if (!parsed.success) return { status: "validation-error", fieldErrors: parsed.error.flatten().fieldErrors, values: raw };
  const context = await getWritableTaskContext(seasonId);
  if (!context) return { status: "conflict", message: "فقط در دوره فعال می‌توان پروژه خارج از توافق افزود.", values: parsed.data };

  try {
    await getPrisma().$transaction(async (transaction) => {
      const project = await transaction.project.create({
        data: {
          seasonId,
          name: parsed.data.name,
          description: parsed.data.description || null,
          scope: "ADDITIONAL",
        },
        select: { id: true },
      });
      await transaction.auditLog.create({
        data: {
          seasonId,
          actorId: user.id,
          entityType: "Project",
          entityId: project.id,
          action: "CREATED",
          after: { ...parsed.data, scope: "ADDITIONAL" },
        },
      });
    });
  } catch (error) {
    if (isUniqueConflict(error)) return { status: "conflict", message: "پروژه‌ای با این نام در دوره وجود دارد.", values: parsed.data };
    console.error("Creating an additional project failed.", error);
    return { status: "system-error", message: "ایجاد پروژه انجام نشد.", values: parsed.data };
  }
  revalidatePath(`/seasons/${seasonId}/tasks/new`);
  redirect(`/seasons/${seasonId}/tasks/new?additionalProjectCreated=1`);
}
