import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { can } from "@/modules/authentication/domain/authorization";
import { requireCurrentUser } from "@/modules/authentication/server/session";
import { getSeasonAuthorizationContext } from "@/modules/authentication/server/season-access";
import { getSeasonSprints } from "@/modules/sprints/server/queries";
import { formatPersianDate, formatPersianNumber } from "@/presentation/formatters";

const statusLabels = { PLANNED: "برنامه‌ریزی‌شده", ACTIVE: "فعال", CLOSED: "بسته‌شده" } as const;

export default async function SprintsPage({ params, searchParams }: { params: Promise<{ seasonId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireCurrentUser();
  const { seasonId } = await params;
  const [context, season, query] = await Promise.all([
    getSeasonAuthorizationContext(user.id, seasonId),
    getSeasonSprints(seasonId),
    searchParams,
  ]);
  if (!context || !season || !can(context, "season:view")) notFound();
  const canEdit = can(context, "season:manage-sprints");
  const message = query.created ? "اسپرینت ایجاد شد." : query.updated ? "اسپرینت به‌روزرسانی شد." : null;
  return (
    <AppShell user={user} activeNavigation="seasons">
      {message ? <div className="alert alert-success" role="status">{message}</div> : null}
      <nav aria-label="مسیر صفحه" className="mb-3"><ol className="breadcrumb"><li className="breadcrumb-item"><Link href={`/seasons/${seasonId}`}>{season.name}</Link></li><li aria-current="page" className="breadcrumb-item active">اسپرینت‌ها</li></ol></nav>
      <div className="page-heading d-flex flex-column flex-sm-row justify-content-between gap-3 mb-4">
        <div><h1 className="h2 mb-2">مدیریت اسپرینت‌ها</h1><p className="text-secondary mb-0">بازه‌های زمانی ثبت و تحلیل روند عملکرد</p></div>
        {canEdit ? <Link className="btn btn-primary align-self-start" href={`/seasons/${seasonId}/sprints/new`}>افزودن اسپرینت</Link> : null}
      </div>
      {season.sprints.length ? (
        <div className="vstack gap-3">
          {season.sprints.map((sprint) => (
            <article className={`card app-card border-0 sprint-row sprint-${sprint.status.toLowerCase()}`} key={sprint.id}>
              <div className="card-body p-4 d-flex flex-column flex-md-row align-items-md-center gap-3">
                <span className="sprint-sequence">{formatPersianNumber(sprint.sequenceNumber)}</span>
                <div className="flex-grow-1"><div className="d-flex flex-wrap align-items-center gap-2 mb-1"><h2 className="h5 mb-0">{sprint.name}</h2><span className={`badge ${sprint.status === "ACTIVE" ? "text-bg-success" : sprint.status === "CLOSED" ? "text-bg-secondary" : "text-bg-light"}`}>{statusLabels[sprint.status]}</span></div><p className="text-secondary mb-0">{formatPersianDate(sprint.startDate)} تا {formatPersianDate(sprint.endDate)}</p></div>
                <span className="text-secondary small">{formatPersianNumber(sprint._count.tasks)} تسک</span>
                {canEdit ? <Link className="btn btn-sm btn-outline-secondary" href={`/seasons/${seasonId}/sprints/${sprint.id}/edit`}>ویرایش</Link> : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="empty-state card app-card border-0"><div className="card-body p-5 text-center"><h2 className="h5">هنوز اسپرینتی ثبت نشده است</h2><p className="text-secondary">تعداد اسپرینت‌ها محدود نیست و براساس تقویم واقعی دوره تعریف می‌شود.</p>{canEdit ? <Link className="btn btn-primary" href={`/seasons/${seasonId}/sprints/new`}>افزودن اولین اسپرینت</Link> : null}</div></section>
      )}
    </AppShell>
  );
}
