import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { can } from "@/modules/authentication/domain/authorization";
import { requireCurrentUser } from "@/modules/authentication/server/session";
import { getSeasonAuthorizationContext } from "@/modules/authentication/server/season-access";
import { TaskForm } from "@/modules/tasks/components/task-form";
import { getTaskEditContext } from "@/modules/tasks/server/queries";

export default async function EditTaskPage({ params }: { params: Promise<{ seasonId: string; taskId: string }> }) {
  const user = await requireCurrentUser();
  const { seasonId, taskId } = await params;
  const [context, editContext] = await Promise.all([getSeasonAuthorizationContext(user.id, seasonId), getTaskEditContext(seasonId, taskId, user.id)]);
  if (!context || !editContext || !can(context, "season:manage-tasks") || editContext.formContext.status !== "ACTIVE") notFound();
  const { task, formContext } = editContext;
  return <AppShell user={user} activeNavigation="seasons"><nav aria-label="مسیر صفحه" className="mb-3"><ol className="breadcrumb"><li className="breadcrumb-item"><Link href={`/seasons/${seasonId}/tasks/${taskId}`}>{task.title}</Link></li><li aria-current="page" className="breadcrumb-item active">ویرایش</li></ol></nav><div className="page-heading mb-4"><h1 className="h2 mb-2">ویرایش تسک</h1><p className="text-secondary mb-0">تغییر تسک نهایی همراه Audit Log ثبت و دوباره اعتبارسنجی می‌شود.</p></div><TaskForm initialValues={{ sprintId: task.sprintId, projectId: task.projectId, externalCode: task.externalCode ?? "", title: task.title, description: task.description ?? "", assignmentSource: task.assignmentSource, approvalStatus: task.approvalStatus, practiceStatuses: Object.fromEntries(task.practices.map((practice) => [practice.workPracticeId, practice.status])), evidence: task.evidence }} practices={formContext.practices} projects={formContext.projects} seasonId={seasonId} sprints={formContext.sprints} taskId={taskId} /></AppShell>;
}
