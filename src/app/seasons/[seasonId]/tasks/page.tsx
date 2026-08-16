import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { can } from "@/modules/authentication/domain/authorization";
import { requireCurrentUser } from "@/modules/authentication/server/session";
import { getSeasonAuthorizationContext } from "@/modules/authentication/server/season-access";
import { getTaskFormContext, listSeasonTasks, type TaskFilters } from "@/modules/tasks/server/queries";
import { formatPersianDate, formatPersianNumber } from "@/presentation/formatters";

const statusLabels = { DRAFT: "پیش‌نویس", IN_PROGRESS: "در حال انجام", FINAL_APPROVED: "نهایی" } as const;
const assignmentLabels = { MANAGER_ASSIGNED: "تخصیص مدیر", CUSTOMER_REQUEST: "درخواست مشتری", STAKEHOLDER_REQUEST: "درخواست ذی‌نفع", SELF_INITIATED: "خودآغاز", OTHER: "سایر" } as const;

function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

export default async function TasksPage({ params, searchParams }: { params: Promise<{ seasonId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireCurrentUser();
  const { seasonId } = await params;
  const query = await searchParams;
  const status = first(query.status);
  const filters: TaskFilters = {
    ...(status && ["DRAFT", "IN_PROGRESS", "FINAL_APPROVED"].includes(status) ? { status: status as TaskFilters["status"] } : {}),
    ...(first(query.sprintId) ? { sprintId: first(query.sprintId) } : {}),
    ...(first(query.projectId) ? { projectId: first(query.projectId) } : {}),
  };
  const [context, formContext, tasks] = await Promise.all([
    getSeasonAuthorizationContext(user.id, seasonId),
    getTaskFormContext(seasonId, user.id),
    listSeasonTasks(seasonId, filters),
  ]);
  if (!context || !formContext || !can(context, "season:view")) notFound();
  const canEdit = can(context, "season:manage-tasks") && formContext.status === "ACTIVE";
  return <AppShell user={user} activeNavigation="seasons">
    <nav aria-label="مسیر صفحه" className="mb-3"><ol className="breadcrumb"><li className="breadcrumb-item"><Link href={`/seasons/${seasonId}`}>{formContext.name}</Link></li><li aria-current="page" className="breadcrumb-item active">تسک‌ها</li></ol></nav>
    <div className="page-heading d-flex flex-column flex-sm-row justify-content-between gap-3 mb-4"><div><h1 className="h2 mb-2">تسک‌های دوره</h1><p className="text-secondary mb-0">ثبت کار واقعی، مولفه‌های اجراشده و مستندهای پشتیبان</p></div>{canEdit ? <Link className="btn btn-primary align-self-start" href={`/seasons/${seasonId}/tasks/new`}>ثبت تسک جدید</Link> : null}</div>
    <form className="card app-card border-0 mb-4" method="get"><div className="card-body p-3"><div className="row g-2">
      <div className="col-md-4"><label className="visually-hidden" htmlFor="filter-status">وضعیت</label><select className="form-select" defaultValue={status ?? ""} id="filter-status" name="status"><option value="">همه وضعیت‌ها</option><option value="DRAFT">پیش‌نویس</option><option value="IN_PROGRESS">در حال انجام</option><option value="FINAL_APPROVED">نهایی</option></select></div>
      <div className="col-md-3"><label className="visually-hidden" htmlFor="filter-sprint">اسپرینت</label><select className="form-select" defaultValue={filters.sprintId ?? ""} id="filter-sprint" name="sprintId"><option value="">همه اسپرینت‌ها</option>{formContext.sprints.map((sprint) => <option key={sprint.id} value={sprint.id}>{sprint.name}</option>)}</select></div>
      <div className="col-md-3"><label className="visually-hidden" htmlFor="filter-project">پروژه</label><select className="form-select" defaultValue={filters.projectId ?? ""} id="filter-project" name="projectId"><option value="">همه پروژه‌ها</option>{formContext.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></div>
      <div className="col-md-2"><button className="btn btn-outline-primary w-100">اعمال فیلتر</button></div>
    </div></div></form>
    {tasks.length ? <div className="card app-card border-0 table-responsive"><table className="table align-middle mb-0"><thead><tr><th scope="col">تسک</th><th scope="col">پروژه / اسپرینت</th><th scope="col">وضعیت</th><th scope="col">پوشش</th><th scope="col"></th></tr></thead><tbody>{tasks.map((task) => <tr key={task.id}>
      <td><span className="task-code" dir="ltr">{task.externalCode || "—"}</span><strong className="d-block mt-1">{task.title}</strong><small className="text-secondary">{assignmentLabels[task.assignmentSource]} · {formatPersianDate(task.updatedAt)}</small></td>
      <td><strong className="d-block">{task.project.name}{task.project.scope === "ADDITIONAL" ? <span className="badge bonus-badge me-2">خارج توافق</span> : null}</strong><small className="text-secondary">{task.sprint.name}</small></td>
      <td><span className={`badge task-status-${task.approvalStatus.toLowerCase()}`}>{statusLabels[task.approvalStatus]}</span></td>
      <td className="small">{formatPersianNumber(task._count.practices)} مولفه · {formatPersianNumber(task._count.evidence)} مستند</td>
      <td className="text-end"><Link className="btn btn-sm btn-outline-primary" href={`/seasons/${seasonId}/tasks/${task.id}`}>جزئیات</Link></td>
    </tr>)}</tbody></table></div> : <section className="empty-state card app-card border-0"><div className="card-body p-5 text-center"><h2 className="h5">تسکی با این فیلتر پیدا نشد</h2><p className="text-secondary">تسک‌های واقعی دوره را ثبت کنید تا گزارش‌ها قابل محاسبه شوند.</p>{canEdit ? <Link className="btn btn-primary" href={`/seasons/${seasonId}/tasks/new`}>ثبت اولین تسک</Link> : null}</div></section>}
  </AppShell>;
}
