import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { can } from "@/modules/authentication/domain/authorization";
import { requireCurrentUser } from "@/modules/authentication/server/session";
import { getSeasonAuthorizationContext } from "@/modules/authentication/server/season-access";
import { archiveAgreementAction } from "@/modules/planning/server/actions";
import { getSeasonPlanning } from "@/modules/planning/server/queries";
import { formatPercent, formatPersianNumber } from "@/presentation/formatters";

type PageProps = {
  params: Promise<{ seasonId: string; projectId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProjectDetailsPage({ params, searchParams }: PageProps) {
  const user = await requireCurrentUser();
  const { seasonId, projectId } = await params;
  const [context, planning, query] = await Promise.all([
    getSeasonAuthorizationContext(user.id, seasonId),
    getSeasonPlanning(seasonId),
    searchParams,
  ]);
  const project = planning?.plan.projects.find((item) => item.projectId === projectId);
  if (!context || !planning || !project || !can(context, "season:view")) notFound();
  const canEdit = context.role === "EMPLOYEE" && planning.plan.status === "DRAFT";
  const message = query.created ? "پروژه ایجاد شد." : query.updated ? "پروژه به‌روزرسانی شد." : query.agreementCreated ? "توافق ایجاد شد." : query.agreementUpdated ? "توافق به‌روزرسانی شد." : query.agreementArchived ? "توافق بایگانی شد." : null;

  return (
    <AppShell user={user} activeNavigation="seasons">
      {message ? <div className="alert alert-success" role="status">{message}</div> : null}
      <nav aria-label="مسیر صفحه" className="mb-3"><ol className="breadcrumb">
        <li className="breadcrumb-item"><Link href={`/seasons/${seasonId}/projects`}>{planning.name}</Link></li>
        <li aria-current="page" className="breadcrumb-item active">{project.nameSnapshot}</li>
      </ol></nav>
      <div className="page-heading d-flex flex-column flex-sm-row justify-content-between gap-3 mb-4">
        <div><div className="d-flex align-items-center gap-2 mb-2"><h1 className="h2 mb-0">{project.nameSnapshot}</h1><span className="project-weight-badge">{formatPercent(project.weight)}</span></div><p className="text-secondary mb-0">{project.descriptionSnapshot || "بدون توضیح"}</p></div>
        {canEdit ? <Link className="btn btn-primary align-self-start" href={`/seasons/${seasonId}/projects/${projectId}/agreements/new`}>افزودن توافق</Link> : null}
      </div>
      <div className="alert alert-info small" role="note">سهم هر توافق براساس تعداد مولفه‌های کاری مورد انتظار محاسبه شده است و وزن مستقل تعیین‌شده توسط مدیر محسوب نمی‌شود.</div>

      {project.agreements.length ? (
        <div className="vstack gap-3">
          {project.agreements.map((agreement) => (
            <article className="card app-card border-0" key={agreement.agreementId}>
              <div className="card-body p-4">
                <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
                  <div>
                    <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                      <h2 className="h5 mb-0">{agreement.title}</h2>
                      <span className={`badge ${agreement.agreementType === "CORE" ? "text-bg-primary" : "bonus-badge"}`}>{agreement.agreementType === "CORE" ? "اصلی" : "امتیازی"}</span>
                    </div>
                    <p className="text-secondary mb-3">{agreement.description || "بدون توضیح"}</p>
                  </div>
                  <div className="agreement-contribution text-nowrap">
                    <span>سهم محاسباتی</span>
                    <strong>{agreement.contribution === null ? "جداگانه" : formatPercent(agreement.contribution)}</strong>
                  </div>
                </div>
                <div className="d-flex flex-wrap gap-2" aria-label="مولفه‌های کاری">
                  {agreement.expectedPractices.map((practice) => <span className="practice-chip" key={practice.workPracticeId}>{practice.practiceNameSnapshot}</span>)}
                </div>
                <div className="d-flex gap-2 mt-4">
                  <span className="text-secondary small align-self-center">{formatPersianNumber(agreement.expectedPractices.length)} مولفه</span>
                  {canEdit ? <>
                    <Link className="btn btn-sm btn-outline-secondary me-auto" href={`/seasons/${seasonId}/projects/${projectId}/agreements/${agreement.agreementId}/edit`}>ویرایش</Link>
                    <form action={archiveAgreementAction.bind(null, seasonId, projectId, agreement.agreementId)}><button className="btn btn-sm btn-link text-danger text-decoration-none">بایگانی</button></form>
                  </> : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="empty-state card app-card border-0"><div className="card-body p-5 text-center"><h2 className="h5">توافقی برای این پروژه ثبت نشده است</h2><p className="text-secondary">توافق‌های اصلی و امتیازی را به مولفه‌های کاری قابل‌اندازه‌گیری متصل کنید.</p>{canEdit ? <Link className="btn btn-primary" href={`/seasons/${seasonId}/projects/${projectId}/agreements/new`}>افزودن اولین توافق</Link> : null}</div></section>
      )}
    </AppShell>
  );
}
