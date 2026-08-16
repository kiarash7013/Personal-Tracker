import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { fa } from "@/i18n/fa";
import { requireCurrentUser } from "@/modules/authentication/server/session";
import { getSeasonRole, listAccessibleSeasons } from "@/modules/seasons/server/queries";
import { formatPersianDate, formatPersianNumber } from "@/presentation/formatters";

const statusLabels = {
  DRAFT: fa.seasons.draft,
  ACTIVE: fa.seasons.active,
  CLOSED: fa.seasons.closed,
} as const;

export default async function SeasonsPage() {
  const user = await requireCurrentUser();
  const seasons = await listAccessibleSeasons(user.id);

  return (
    <AppShell user={user} activeNavigation="seasons">
      <div className="page-heading d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h2 mb-2">{fa.seasons.title}</h1>
          <p className="text-secondary mb-0">{fa.seasons.subtitle}</p>
        </div>
        <Link className="btn btn-primary" href="/seasons/new">{fa.seasons.create}</Link>
      </div>

      {seasons.length === 0 ? (
        <section className="empty-state card app-card border-0 text-center">
          <div className="card-body p-5">
            <div className="empty-state-icon mx-auto mb-3" aria-hidden="true">د</div>
            <h2 className="h4">{fa.seasons.emptyTitle}</h2>
            <p className="text-secondary mx-auto mb-4">{fa.seasons.emptyDescription}</p>
            <Link className="btn btn-primary" href="/seasons/new">{fa.seasons.create}</Link>
          </div>
        </section>
      ) : (
        <div className="row g-3">
          {seasons.map((season) => {
            const role = getSeasonRole(season, user.id);
            return (
              <div className="col-12 col-lg-6" key={season.id}>
                <article className="card app-card season-card border-0 h-100">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                      <div>
                        <span className={`status-pill status-${season.status.toLowerCase()}`}>
                          {statusLabels[season.status]}
                        </span>
                        <h2 className="h4 mt-3 mb-2">{season.name}</h2>
                      </div>
                      <span className="role-chip">
                        {role === "MANAGER" ? fa.seasons.managerRole : fa.seasons.employee}
                      </span>
                    </div>

                    <p className="text-secondary mb-4">
                      {formatPersianDate(season.startDate)} تا {formatPersianDate(season.endDate)}
                    </p>

                    <div className="season-counts d-flex flex-wrap gap-3 mb-4">
                      <span>{formatPersianNumber(season._count.projects)} پروژه</span>
                      <span>{formatPersianNumber(season._count.sprints)} اسپرینت</span>
                      <span>{formatPersianNumber(season._count.tasks)} تسک</span>
                    </div>

                    <Link className="btn btn-outline-primary w-100" href={`/seasons/${season.id}`}>
                      {fa.seasons.open}
                    </Link>
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
