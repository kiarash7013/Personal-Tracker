import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { can } from "@/modules/authentication/domain/authorization";
import { requireCurrentUser } from "@/modules/authentication/server/session";
import { getSeasonAuthorizationContext } from "@/modules/authentication/server/season-access";
import { TaskForm } from "@/modules/tasks/components/task-form";
import { getTaskFormContext } from "@/modules/tasks/server/queries";

export default async function NewTaskPage({ params, searchParams }: { params: Promise<{ seasonId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireCurrentUser();
  const { seasonId } = await params;
  const [context, formContext, query] = await Promise.all([getSeasonAuthorizationContext(user.id, seasonId), getTaskFormContext(seasonId, user.id), searchParams]);
  if (!context || !formContext || !can(context, "season:manage-tasks") || formContext.status !== "ACTIVE") notFound();
  const activeSprint = formContext.sprints.find((sprint) => sprint.status === "ACTIVE");
  return <AppShell user={user} activeNavigation="seasons">
    {query.additionalProjectCreated ? <div className="alert alert-success">پروژه خارج از توافق ایجاد شد؛ اکنون آن را در فرم انتخاب کنید.</div> : null}
    <nav aria-label="مسیر صفحه" className="mb-3"><ol className="breadcrumb"><li className="breadcrumb-item"><Link href={`/seasons/${seasonId}/tasks`}>{formContext.name}</Link></li><li aria-current="page" className="breadcrumb-item active">تسک جدید</li></ol></nav>
    <div className="page-heading mb-4"><h1 className="h2 mb-2">ثبت تسک جدید</h1><p className="text-secondary mb-0">فرم سریع ثبت خروجی واقعی، مولفه‌ها و Evidence</p></div>
    <TaskForm initialValues={{ sprintId: activeSprint?.id ?? "", projectId: "", externalCode: "", title: "", description: "", assignmentSource: "MANAGER_ASSIGNED", approvalStatus: "DRAFT", practiceStatuses: {}, evidence: [] }} practices={formContext.practices} projects={formContext.projects} seasonId={seasonId} sprints={formContext.sprints} />
  </AppShell>;
}
