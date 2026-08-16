import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { can } from "@/modules/authentication/domain/authorization";
import { requireCurrentUser } from "@/modules/authentication/server/session";
import { getSeasonAuthorizationContext } from "@/modules/authentication/server/season-access";
import { archiveProjectAction } from "@/modules/planning/server/actions";
import { getSeasonPlanning } from "@/modules/planning/server/queries";
import { formatPercent, formatPersianNumber } from "@/presentation/formatters";

type PageProps = {
  params: Promise<{ seasonId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProjectsPage({ params, searchParams }: PageProps) {
  const user = await requireCurrentUser();
  const { seasonId } = await params;
  const [context, planning, query] = await Promise.all([
    getSeasonAuthorizationContext(user.id, seasonId),
    getSeasonPlanning(seasonId),
    searchParams,
  ]);
  if (!context || !planning || !can(context, "season:view")) notFound();
  const canEdit = context.role === "EMPLOYEE" && planning.plan.status === "DRAFT";

  return (
    <AppShell user={user} activeNavigation="seasons">
      {query.archived ? <div className="alert alert-success" role="status">پروژه بایگانی شد.</div> : null}
      <nav aria-label="مسیر صفحه" className="mb-3">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item"><Link href={`/seasons/${seasonId}`}>{planning.name}</Link></li>
          <li aria-current="page" className="breadcrumb-item active">پروژه‌ها و توافق‌ها</li>
        </ol>
      </nav>
      <div className="page-heading d-flex flex-column flex-sm-row justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h2 mb-2">پروژه‌ها و توافق‌ها</h1>
          <p className="text-secondary mb-0">اولویت‌های رسمی دوره و انتظارات قابل ردیابی هر پروژه</p>
        </div>
        {canEdit ? <Link className="btn btn-primary align-self-start" href={`/seasons/${seasonId}/projects/new`}>افزودن پروژه</Link> : null}
      </div>

      <section className={`weight-summary ${planning.weightSummary.valid ? "weight-valid" : "weight-pending"}`} aria-label="خلاصه وزن پروژه‌ها">
        <div>
          <span>مجموع وزن پروژه‌ها</span>
          <strong>{formatPercent(planning.weightSummary.total)}</strong>
        </div>
        <p className="mb-0">
          {planning.weightSummary.valid
            ? "مجموع وزن برای فعال‌سازی معتبر است."
            : planning.weightSummary.remaining > 0
              ? `${formatPercent(planning.weightSummary.remaining)} دیگر باید تخصیص داده شود.`
              : `${formatPercent(Math.abs(planning.weightSummary.remaining))} بیشتر از سقف مجاز است.`}
        </p>
      </section>

      {planning.plan.projects.length ? (
        <div className="row g-4 mt-1">
          {planning.plan.projects.map((project) => (
            <div className="col-lg-6" key={project.projectId}>
              <article className="card app-card border-0 h-100">
                <div className="card-body p-4">
                  <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                    <div>
                      <h2 className="h5 mb-1">{project.nameSnapshot}</h2>
                      <span className="text-secondary small">{formatPersianNumber(project.agreements.length)} توافق</span>
                    </div>
                    <span className="project-weight-badge">{formatPercent(project.weight)}</span>
                  </div>
                  <p className="text-secondary project-description">{project.descriptionSnapshot || "بدون توضیح"}</p>
                  <div className="d-flex flex-wrap gap-2 mt-4">
                    <Link className="btn btn-outline-primary" href={`/seasons/${seasonId}/projects/${project.projectId}`}>مشاهده توافق‌ها</Link>
                    {canEdit ? (
                      <>
                        <Link className="btn btn-outline-secondary" href={`/seasons/${seasonId}/projects/${project.projectId}/edit`}>ویرایش</Link>
                        <form action={archiveProjectAction.bind(null, seasonId, project.projectId)} className="me-auto">
                          <button className="btn btn-link text-danger text-decoration-none" type="submit">بایگانی</button>
                        </form>
                      </>
                    ) : null}
                  </div>
                </div>
              </article>
            </div>
          ))}
        </div>
      ) : (
        <section className="empty-state card app-card border-0 mt-4">
          <div className="card-body p-5 text-center">
            <h2 className="h5">پروژه توافق‌شده‌ای ثبت نشده است</h2>
            <p className="text-secondary">برای شروع برنامه‌ریزی دوره، اولین پروژه و وزن رسمی آن را وارد کنید.</p>
            {canEdit ? <Link className="btn btn-primary" href={`/seasons/${seasonId}/projects/new`}>افزودن اولین پروژه</Link> : null}
          </div>
        </section>
      )}
    </AppShell>
  );
}
