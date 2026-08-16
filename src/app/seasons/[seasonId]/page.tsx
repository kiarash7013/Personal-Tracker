import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { fa } from "@/i18n/fa";
import { can } from "@/modules/authentication/domain/authorization";
import { requireCurrentUser } from "@/modules/authentication/server/session";
import { getSeasonAuthorizationContext } from "@/modules/authentication/server/season-access";
import { ActivationPanel } from "@/modules/seasons/components/activation-panel";
import { getSeasonDetails } from "@/modules/seasons/server/queries";
import { formatPersianDate, formatPersianNumber } from "@/presentation/formatters";

const statusLabels = {
  DRAFT: fa.seasons.draft,
  ACTIVE: fa.seasons.active,
  CLOSED: fa.seasons.closed,
} as const;

type SeasonDetailsPageProps = {
  params: Promise<{ seasonId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SeasonDetailsPage({ params, searchParams }: SeasonDetailsPageProps) {
  const user = await requireCurrentUser();
  const { seasonId } = await params;
  const [context, season, query] = await Promise.all([
    getSeasonAuthorizationContext(user.id, seasonId),
    getSeasonDetails(seasonId),
    searchParams,
  ]);

  if (!context || !can(context, "season:view") || !season) {
    notFound();
  }

  const manager = season.members.find((member) => member.role === "MANAGER");
  const canEdit = can(context, "season:edit-setup");
  const successMessage = query.created
    ? fa.seasons.createdSuccess
    : query.updated
      ? fa.seasons.updatedSuccess
      : query.activated
        ? fa.seasons.activationSuccess
        : null;

  return (
    <AppShell user={user} activeNavigation="seasons">
      {successMessage ? (
        <div className="alert alert-success" role="status">{successMessage}</div>
      ) : null}

      <div className="page-heading d-flex flex-column flex-sm-row align-items-sm-start justify-content-between gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-2">
            <span className={`status-pill status-${season.status.toLowerCase()}`}>
              {statusLabels[season.status]}
            </span>
            <span className="role-chip">
              {context.role === "MANAGER" ? fa.seasons.managerRole : fa.seasons.employee}
            </span>
          </div>
          <h1 className="h2 mb-2">{season.name}</h1>
          <p className="text-secondary mb-0">
            {formatPersianDate(season.startDate)} تا {formatPersianDate(season.endDate)}
          </p>
        </div>
        {canEdit ? (
          <div className="d-flex flex-wrap gap-2">
            {season.status === "ACTIVE" ? (
              <Link className="btn btn-primary" href={`/seasons/${season.id}/dashboard`}>
                داشبورد دوره
              </Link>
            ) : null}
            <Link className={season.status === "ACTIVE" ? "btn btn-outline-primary" : "btn btn-primary"} href={`/seasons/${season.id}/projects`}>
              {fa.seasons.managePlan}
            </Link>
            <Link className="btn btn-outline-primary" href={`/seasons/${season.id}/sprints`}>
              {fa.seasons.manageSprints}
            </Link>
            {season.status === "ACTIVE" ? (
              <Link className="btn btn-outline-primary" href={`/seasons/${season.id}/tasks`}>
                {fa.seasons.manageTasks}
              </Link>
            ) : null}
            <Link className="btn btn-outline-primary" href={`/seasons/${season.id}/edit`}>
              {fa.seasons.editAction}
            </Link>
          </div>
        ) : (
          <div className="d-flex flex-wrap gap-2">
            {context.role === "MANAGER" ? (
              <Link className="btn btn-primary" href={`/seasons/${season.id}/manager-dashboard`}>
                داشبورد مدیر
              </Link>
            ) : null}
            <Link className="btn btn-outline-primary" href={`/seasons/${season.id}/projects`}>
              {fa.seasons.managePlan}
            </Link>
            <Link className="btn btn-outline-primary" href={`/seasons/${season.id}/sprints`}>
              {fa.seasons.manageSprints}
            </Link>
            <Link className="btn btn-outline-primary" href={`/seasons/${season.id}/tasks`}>
              {fa.seasons.manageTasks}
            </Link>
          </div>
        )}
      </div>

      <div className="row g-3 mb-4">
        <div className="col-sm-4">
          <div className="card app-card border-0 h-100"><div className="card-body p-4">
            <span className="metric-label">{fa.seasons.projects}</span>
            <strong className="metric-value">{formatPersianNumber(season._count.projects)}</strong>
          </div></div>
        </div>
        <div className="col-sm-4">
          <div className="card app-card border-0 h-100"><div className="card-body p-4">
            <span className="metric-label">{fa.seasons.sprints}</span>
            <strong className="metric-value">{formatPersianNumber(season._count.sprints)}</strong>
          </div></div>
        </div>
        <div className="col-sm-4">
          <div className="card app-card border-0 h-100"><div className="card-body p-4">
            <span className="metric-label">{fa.seasons.tasks}</span>
            <strong className="metric-value">{formatPersianNumber(season._count.tasks)}</strong>
          </div></div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <section className="card app-card border-0 h-100">
            <div className="card-body p-4">
              <h2 className="h5 mb-4">اعضای دوره</h2>
              <dl className="season-members mb-0">
                <div>
                  <dt>کارمند</dt>
                  <dd>{season.employee.name}<small dir="ltr">{season.employee.email}</small></dd>
                </div>
                <div>
                  <dt>مدیر ناظر</dt>
                  <dd>
                    {manager ? <>{manager.user.name}<small dir="ltr">{manager.user.email}</small></> : "انتخاب نشده"}
                  </dd>
                </div>
              </dl>
            </div>
          </section>
        </div>
        <div className="col-lg-5">
          {season.status === "DRAFT" && canEdit ? (
            <ActivationPanel
              seasonId={season.id}
              ready={season.activationReadiness.ready}
              issues={season.activationReadiness.issues}
              totalWeight={season.activationReadiness.totalWeight}
            />
          ) : (
            <section className="card app-card border-0 h-100"><div className="card-body p-4">
              <h2 className="h5 mb-3">وضعیت برنامه دوره</h2>
              <p className="text-secondary mb-0">
                {season.status === "ACTIVE"
                  ? "برنامه این دوره منتشر و دوره فعال شده است."
                  : "این دوره بسته شده و اطلاعات آن فقط‌خواندنی است."}
              </p>
            </div></section>
          )}
        </div>
      </div>
    </AppShell>
  );
}
