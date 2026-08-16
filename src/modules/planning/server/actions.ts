"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPrisma } from "@/infrastructure/database/prisma";
import { requireCurrentUser } from "@/modules/authentication/server/session";
import { requireSeasonCapability } from "@/modules/authentication/server/season-access";
import type {
  AgreementFormState,
  ProjectFormState,
  WorkPracticeFormState,
} from "../application/planning-form-state";
import {
  agreementInputSchema,
  projectInputSchema,
  workPracticeInputSchema,
  type AgreementInput,
  type ProjectInput,
  type WorkPracticeInput,
} from "../domain/planning-input";

function readProjectForm(formData: FormData): ProjectInput {
  return {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    weight: String(formData.get("weight") ?? ""),
  };
}

function readAgreementForm(formData: FormData): AgreementInput {
  return {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    agreementType: String(formData.get("agreementType") ?? "") as AgreementInput["agreementType"],
    practiceIds: formData.getAll("practiceIds").map(String),
  };
}

function readWorkPracticeForm(formData: FormData): WorkPracticeInput {
  return {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
  };
}

function isUniqueConflict(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
}

async function requireDraftPlan(seasonId: string) {
  const plan = await getPrisma().seasonPlanVersion.findFirst({
    where: { seasonId, status: "DRAFT", season: { status: "DRAFT" } },
    orderBy: { version: "desc" },
    select: { id: true },
  });

  if (!plan) {
    throw new Error("PLAN_NOT_DRAFT");
  }

  return plan;
}

function planningErrorMessage(error: unknown) {
  if (error instanceof Error && error.message === "PLAN_NOT_DRAFT") {
    return "برنامه این دوره دیگر قابل ویرایش نیست.";
  }
  return "ذخیره تغییرات انجام نشد. کمی بعد دوباره تلاش کنید.";
}

function revalidatePlanning(seasonId: string) {
  revalidatePath(`/seasons/${seasonId}`);
  revalidatePath(`/seasons/${seasonId}/projects`);
}

export async function createProjectAction(
  seasonId: string,
  _previousState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const { user } = await requireSeasonCapability(seasonId, "season:edit-setup");
  const raw = readProjectForm(formData);
  const parsed = projectInputSchema.safeParse(raw);

  if (!parsed.success) {
    return { status: "validation-error", fieldErrors: parsed.error.flatten().fieldErrors, values: raw };
  }

  let projectId: string;
  try {
    const plan = await requireDraftPlan(seasonId);
    projectId = await getPrisma().$transaction(async (transaction) => {
      const project = await transaction.project.create({
        data: {
          seasonId,
          name: parsed.data.name,
          description: parsed.data.description || null,
          scope: "AGREED",
        },
        select: { id: true },
      });
      await transaction.projectPlan.create({
        data: {
          seasonPlanVersionId: plan.id,
          projectId: project.id,
          nameSnapshot: parsed.data.name,
          descriptionSnapshot: parsed.data.description || null,
          weight: parsed.data.weight,
        },
      });
      await transaction.auditLog.create({
        data: {
          seasonId,
          actorId: user.id,
          entityType: "Project",
          entityId: project.id,
          action: "CREATED",
          after: { ...parsed.data, scope: "AGREED", planVersionId: plan.id },
        },
      });
      return project.id;
    });
  } catch (error) {
    if (isUniqueConflict(error)) {
      return { status: "conflict", message: "پروژه‌ای با این نام در دوره وجود دارد.", values: parsed.data };
    }
    console.error("Creating a project failed.", error);
    return { status: "system-error", message: planningErrorMessage(error), values: parsed.data };
  }

  revalidatePlanning(seasonId);
  redirect(`/seasons/${seasonId}/projects/${projectId}?created=1`);
}

export async function updateProjectAction(
  seasonId: string,
  projectId: string,
  _previousState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const { user } = await requireSeasonCapability(seasonId, "season:edit-setup");
  const raw = readProjectForm(formData);
  const parsed = projectInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "validation-error", fieldErrors: parsed.error.flatten().fieldErrors, values: raw };
  }

  try {
    const plan = await requireDraftPlan(seasonId);
    await getPrisma().$transaction(async (transaction) => {
      const current = await transaction.projectPlan.findFirst({
        where: { projectId, seasonPlanVersionId: plan.id, project: { seasonId, status: "ACTIVE" } },
        select: { nameSnapshot: true, descriptionSnapshot: true, weight: true },
      });
      if (!current) throw new Error("PROJECT_NOT_FOUND");

      await transaction.project.update({
        where: { id: projectId },
        data: { name: parsed.data.name, description: parsed.data.description || null },
      });
      await transaction.projectPlan.update({
        where: { seasonPlanVersionId_projectId: { seasonPlanVersionId: plan.id, projectId } },
        data: {
          nameSnapshot: parsed.data.name,
          descriptionSnapshot: parsed.data.description || null,
          weight: parsed.data.weight,
        },
      });
      await transaction.auditLog.create({
        data: {
          seasonId,
          actorId: user.id,
          entityType: "Project",
          entityId: projectId,
          action: "UPDATED",
          before: {
            name: current.nameSnapshot,
            description: current.descriptionSnapshot,
            weight: Number(current.weight),
          },
          after: parsed.data,
        },
      });
    });
  } catch (error) {
    if (isUniqueConflict(error)) {
      return { status: "conflict", message: "پروژه‌ای با این نام در دوره وجود دارد.", values: parsed.data };
    }
    console.error("Updating a project failed.", error);
    return { status: "system-error", message: planningErrorMessage(error), values: parsed.data };
  }

  revalidatePlanning(seasonId);
  redirect(`/seasons/${seasonId}/projects/${projectId}?updated=1`);
}

export async function archiveProjectAction(seasonId: string, projectId: string) {
  const { user } = await requireSeasonCapability(seasonId, "season:edit-setup");
  const plan = await requireDraftPlan(seasonId);

  await getPrisma().$transaction(async (transaction) => {
    const projectPlan = await transaction.projectPlan.findFirst({
      where: { projectId, seasonPlanVersionId: plan.id, project: { seasonId, status: "ACTIVE" } },
      select: {
        id: true,
        nameSnapshot: true,
        agreementRevisions: { select: { id: true, agreementId: true } },
      },
    });
    if (!projectPlan) throw new Error("PROJECT_NOT_FOUND");
    const revisionIds = projectPlan.agreementRevisions.map((revision) => revision.id);
    const agreementIds = projectPlan.agreementRevisions.map((revision) => revision.agreementId);

    if (revisionIds.length) {
      await transaction.agreementPractice.deleteMany({ where: { agreementRevisionId: { in: revisionIds } } });
      await transaction.agreementRevision.deleteMany({ where: { id: { in: revisionIds } } });
      await transaction.agreement.updateMany({
        where: { id: { in: agreementIds } },
        data: { status: "ARCHIVED", archivedAt: new Date() },
      });
    }
    await transaction.projectPlan.delete({ where: { id: projectPlan.id } });
    await transaction.project.update({
      where: { id: projectId },
      data: { status: "ARCHIVED", archivedAt: new Date() },
    });
    await transaction.auditLog.create({
      data: {
        seasonId,
        actorId: user.id,
        entityType: "Project",
        entityId: projectId,
        action: "ARCHIVED",
        before: { name: projectPlan.nameSnapshot },
      },
    });
  });

  revalidatePlanning(seasonId);
  redirect(`/seasons/${seasonId}/projects?archived=1`);
}

async function validatePractices(ownerId: string, practiceIds: string[], allowedInactiveIds: string[] = []) {
  const count = await getPrisma().workPractice.count({
    where: {
      id: { in: practiceIds },
      ownerId,
      OR: [{ active: true }, { id: { in: allowedInactiveIds } }],
    },
  });
  return count === practiceIds.length;
}

export async function createAgreementAction(
  seasonId: string,
  projectId: string,
  _previousState: AgreementFormState,
  formData: FormData,
): Promise<AgreementFormState> {
  const { user } = await requireSeasonCapability(seasonId, "season:edit-setup");
  const raw = readAgreementForm(formData);
  const parsed = agreementInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "validation-error", fieldErrors: parsed.error.flatten().fieldErrors, values: raw };
  }
  if (!(await validatePractices(user.id, parsed.data.practiceIds))) {
    return { status: "conflict", message: "یکی از مولفه‌های انتخاب‌شده دیگر فعال نیست.", values: parsed.data };
  }

  try {
    const plan = await requireDraftPlan(seasonId);
    await getPrisma().$transaction(async (transaction) => {
      const projectPlan = await transaction.projectPlan.findFirst({
        where: { projectId, seasonPlanVersionId: plan.id, project: { seasonId, status: "ACTIVE" } },
        select: { id: true },
      });
      if (!projectPlan) throw new Error("PROJECT_NOT_FOUND");
      const practices = await transaction.workPractice.findMany({
        where: { id: { in: parsed.data.practiceIds }, ownerId: user.id, active: true },
        select: { id: true, name: true, description: true },
      });
      if (practices.length !== parsed.data.practiceIds.length) throw new Error("PRACTICE_CONFLICT");

      const agreement = await transaction.agreement.create({
        data: { projectId },
        select: { id: true },
      });
      const revision = await transaction.agreementRevision.create({
        data: {
          agreementId: agreement.id,
          projectPlanId: projectPlan.id,
          seasonPlanVersionId: plan.id,
          revision: 1,
          title: parsed.data.title,
          description: parsed.data.description || null,
          agreementType: parsed.data.agreementType,
        },
        select: { id: true },
      });
      await transaction.agreementPractice.createMany({
        data: practices.map((practice) => ({
          agreementRevisionId: revision.id,
          workPracticeId: practice.id,
          practiceNameSnapshot: practice.name,
          practiceDescriptionSnapshot: practice.description,
        })),
      });
      await transaction.auditLog.create({
        data: {
          seasonId,
          actorId: user.id,
          entityType: "Agreement",
          entityId: agreement.id,
          action: "CREATED",
          after: parsed.data,
        },
      });
    });
  } catch (error) {
    console.error("Creating an agreement failed.", error);
    return { status: "system-error", message: planningErrorMessage(error), values: parsed.data };
  }

  revalidatePlanning(seasonId);
  redirect(`/seasons/${seasonId}/projects/${projectId}?agreementCreated=1`);
}

export async function updateAgreementAction(
  seasonId: string,
  projectId: string,
  agreementId: string,
  _previousState: AgreementFormState,
  formData: FormData,
): Promise<AgreementFormState> {
  const { user } = await requireSeasonCapability(seasonId, "season:edit-setup");
  const raw = readAgreementForm(formData);
  const parsed = agreementInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "validation-error", fieldErrors: parsed.error.flatten().fieldErrors, values: raw };
  }

  try {
    const plan = await requireDraftPlan(seasonId);
    await getPrisma().$transaction(async (transaction) => {
      const revision = await transaction.agreementRevision.findFirst({
        where: {
          agreementId,
          projectPlan: { projectId },
          seasonPlanVersionId: plan.id,
          agreement: { project: { seasonId }, status: "ACTIVE" },
        },
        select: {
          id: true,
          title: true,
          description: true,
          agreementType: true,
          expectedPractices: { select: { workPracticeId: true } },
        },
      });
      if (!revision) throw new Error("AGREEMENT_NOT_FOUND");
      const existingIds = revision.expectedPractices.map((practice) => practice.workPracticeId);
      const practices = await transaction.workPractice.findMany({
        where: {
          id: { in: parsed.data.practiceIds },
          ownerId: user.id,
          OR: [{ active: true }, { id: { in: existingIds } }],
        },
        select: { id: true, name: true, description: true },
      });
      if (practices.length !== parsed.data.practiceIds.length) throw new Error("PRACTICE_CONFLICT");

      await transaction.agreementRevision.update({
        where: { id: revision.id },
        data: {
          title: parsed.data.title,
          description: parsed.data.description || null,
          agreementType: parsed.data.agreementType,
        },
      });
      await transaction.agreementPractice.deleteMany({ where: { agreementRevisionId: revision.id } });
      await transaction.agreementPractice.createMany({
        data: practices.map((practice) => ({
          agreementRevisionId: revision.id,
          workPracticeId: practice.id,
          practiceNameSnapshot: practice.name,
          practiceDescriptionSnapshot: practice.description,
        })),
      });
      await transaction.auditLog.create({
        data: {
          seasonId,
          actorId: user.id,
          entityType: "Agreement",
          entityId: agreementId,
          action: "UPDATED",
          before: {
            title: revision.title,
            description: revision.description,
            agreementType: revision.agreementType,
            practiceIds: existingIds,
          },
          after: parsed.data,
        },
      });
    });
  } catch (error) {
    console.error("Updating an agreement failed.", error);
    return { status: "system-error", message: planningErrorMessage(error), values: parsed.data };
  }

  revalidatePlanning(seasonId);
  redirect(`/seasons/${seasonId}/projects/${projectId}?agreementUpdated=1`);
}

export async function archiveAgreementAction(
  seasonId: string,
  projectId: string,
  agreementId: string,
) {
  const { user } = await requireSeasonCapability(seasonId, "season:edit-setup");
  const plan = await requireDraftPlan(seasonId);
  await getPrisma().$transaction(async (transaction) => {
    const revision = await transaction.agreementRevision.findFirst({
      where: {
        agreementId,
        projectPlan: { projectId },
        seasonPlanVersionId: plan.id,
        agreement: { project: { seasonId }, status: "ACTIVE" },
      },
      select: { id: true, title: true },
    });
    if (!revision) throw new Error("AGREEMENT_NOT_FOUND");
    await transaction.agreementPractice.deleteMany({ where: { agreementRevisionId: revision.id } });
    await transaction.agreementRevision.delete({ where: { id: revision.id } });
    await transaction.agreement.update({
      where: { id: agreementId },
      data: { status: "ARCHIVED", archivedAt: new Date() },
    });
    await transaction.auditLog.create({
      data: {
        seasonId,
        actorId: user.id,
        entityType: "Agreement",
        entityId: agreementId,
        action: "ARCHIVED",
        before: { title: revision.title },
      },
    });
  });
  revalidatePlanning(seasonId);
  redirect(`/seasons/${seasonId}/projects/${projectId}?agreementArchived=1`);
}

export async function createWorkPracticeAction(
  _previousState: WorkPracticeFormState,
  formData: FormData,
): Promise<WorkPracticeFormState> {
  const user = await requireCurrentUser();
  const raw = readWorkPracticeForm(formData);
  const parsed = workPracticeInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "validation-error", fieldErrors: parsed.error.flatten().fieldErrors, values: raw };
  }
  try {
    await getPrisma().workPractice.create({
      data: { ownerId: user.id, name: parsed.data.name, description: parsed.data.description || null },
    });
  } catch (error) {
    if (isUniqueConflict(error)) {
      return { status: "conflict", message: "مولفه‌ای با این نام قبلاً ثبت شده است.", values: parsed.data };
    }
    console.error("Creating a work practice failed.", error);
    return { status: "system-error", message: "ایجاد مولفه کاری انجام نشد.", values: parsed.data };
  }
  revalidatePath("/work-practices");
  redirect("/work-practices?created=1");
}

export async function updateWorkPracticeAction(
  practiceId: string,
  _previousState: WorkPracticeFormState,
  formData: FormData,
): Promise<WorkPracticeFormState> {
  const user = await requireCurrentUser();
  const raw = readWorkPracticeForm(formData);
  const parsed = workPracticeInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "validation-error", fieldErrors: parsed.error.flatten().fieldErrors, values: raw };
  }
  try {
    const updated = await getPrisma().workPractice.updateMany({
      where: { id: practiceId, ownerId: user.id },
      data: { name: parsed.data.name, description: parsed.data.description || null },
    });
    if (updated.count !== 1) return { status: "conflict", message: "مولفه کاری در دسترس نیست." };
  } catch (error) {
    if (isUniqueConflict(error)) {
      return { status: "conflict", message: "مولفه‌ای با این نام قبلاً ثبت شده است.", values: parsed.data };
    }
    console.error("Updating a work practice failed.", error);
    return { status: "system-error", message: "ویرایش مولفه کاری انجام نشد.", values: parsed.data };
  }
  revalidatePath("/work-practices");
  redirect("/work-practices?updated=1");
}

export async function toggleWorkPracticeAction(practiceId: string) {
  const user = await requireCurrentUser();
  const practice = await getPrisma().workPractice.findFirst({
    where: { id: practiceId, ownerId: user.id },
    select: { active: true },
  });
  if (!practice) return;
  await getPrisma().workPractice.update({
    where: { id: practiceId },
    data: practice.active
      ? { active: false, archivedAt: new Date() }
      : { active: true, archivedAt: null },
  });
  revalidatePath("/work-practices");
}
