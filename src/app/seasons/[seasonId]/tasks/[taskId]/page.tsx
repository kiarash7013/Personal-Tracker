import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { can } from "@/modules/authentication/domain/authorization";
import { requireCurrentUser } from "@/modules/authentication/server/session";
import { getSeasonAuthorizationContext } from "@/modules/authentication/server/season-access";
import { getTaskDetails } from "@/modules/tasks/server/queries";
import { formatPercent, formatPersianDate } from "@/presentation/formatters";

const statusLabels = { DRAFT: "پیش‌نویس", IN_PROGRESS: "در حال انجام", FINAL_APPROVED: "نهایی / تأییدشده" } as const;
const practiceLabels = { DONE: "انجام شده", NOT_DONE: "انجام نشده", NOT_APPLICABLE: "کاربرد ندارد" } as const;
const evidenceLabels = { FIGMA: "Figma", DOCUMENT: "سند", JIRA: "Jira", OTHER_URL: "لینک" } as const;

export default async function TaskDetailsPage({ params, searchParams }: { params: Promise<{ seasonId: string; taskId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireCurrentUser();
  const { seasonId, taskId } = await params;
  const [context, task, query] = await Promise.all([getSeasonAuthorizationContext(user.id, seasonId), getTaskDetails(seasonId, taskId), searchParams]);
  if (!context || !task || !can(context, "season:view")) notFound();
  const canEdit = can(context, "season:manage-tasks");
  const message = query.created ? "تسک ثبت شد." : query.updated ? "تسک به‌روزرسانی شد." : null;
  return <AppShell user={user} activeNavigation="seasons">
    {message ? <div className="alert alert-success" role="status">{message}</div> : null}
    <nav aria-label="مسیر صفحه" className="mb-3"><ol className="breadcrumb"><li className="breadcrumb-item"><Link href={`/seasons/${seasonId}/tasks`}>تسک‌ها</Link></li><li aria-current="page" className="breadcrumb-item active"><span dir="ltr">{task.externalCode || "بدون کد"}</span></li></ol></nav>
    <div className="page-heading d-flex flex-column flex-sm-row justify-content-between gap-3 mb-4"><div><div className="d-flex flex-wrap align-items-center gap-2 mb-2"><span className={`badge task-status-${task.approvalStatus.toLowerCase()}`}>{statusLabels[task.approvalStatus]}</span>{task.project.scope === "ADDITIONAL" ? <span className="badge bonus-badge">مشارکت خارج توافق</span> : null}</div><h1 className="h2 mb-2">{task.title}</h1><p className="text-secondary mb-0"><span dir="ltr">{task.externalCode || "—"}</span> · {task.project.name} · {task.sprint.name}</p></div>{canEdit ? <Link className="btn btn-outline-primary align-self-start" href={`/seasons/${seasonId}/tasks/${taskId}/edit`}>ویرایش تسک</Link> : null}</div>
    {task.description ? <section className="card app-card border-0 mb-4"><div className="card-body p-4"><h2 className="h5">توضیحات</h2><p className="text-secondary pre-wrap mb-0">{task.description}</p></div></section> : null}
    <div className="row g-4">
      <div className="col-lg-7"><section className="card app-card border-0 h-100"><div className="card-body p-4"><h2 className="h5 mb-4">نتیجه مولفه‌های کاری</h2>{task.practices.length ? <div className="vstack gap-2">{task.practices.map((practice) => <div className="practice-result" key={practice.workPracticeId}><strong>{practice.practiceNameSnapshot}</strong><span className={`badge practice-status-${practice.status.toLowerCase()}`}>{practiceLabels[practice.status]}</span></div>)}</div> : <p className="text-secondary">هنوز مولفه‌ای ثبت نشده است.</p>}</div></section></div>
      <div className="col-lg-5"><section className="card app-card border-0 h-100"><div className="card-body p-4"><h2 className="h5 mb-4">توافق‌های پیشنهادی</h2>{task.agreementMatches.length ? <div className="vstack gap-3">{task.agreementMatches.map((match) => <div key={match.id}><strong className="d-block">{match.agreementRevision.title}</strong><span className="small text-secondary">{match.agreementRevision.agreementType === "CORE" ? "توافق اصلی" : "توافق امتیازی"} · تطبیق {formatPercent(Number(match.confidence) * 100)}</span></div>)}</div> : <p className="text-secondary mb-0">این تسک با توافقی از پروژه انتخاب‌شده تطبیق داده نشد.</p>}</div></section></div>
    </div>
    <section className="card app-card border-0 mt-4"><div className="card-body p-4"><h2 className="h5 mb-4">مستندات</h2>{task.evidence.length ? <div className="row g-3">{task.evidence.map((evidence) => <div className="col-md-6" key={evidence.id}><a className="evidence-link" href={evidence.url} rel="noreferrer" target="_blank"><span className="badge text-bg-light">{evidenceLabels[evidence.type]}</span><strong>{evidence.title}</strong><small dir="ltr">{evidence.url}</small></a></div>)}</div> : <p className="text-secondary mb-0">مستندی ثبت نشده است.</p>}</div></section>
    <p className="text-secondary small mt-3">آخرین تغییر: {formatPersianDate(task.updatedAt)}</p>
  </AppShell>;
}
