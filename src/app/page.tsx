import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { fa } from "@/i18n/fa";
import { requireCurrentUser } from "@/modules/authentication/server/session";
import { listAccessibleSeasons } from "@/modules/seasons/server/queries";
import { formatPersianDate, formatPersianNumber } from "@/presentation/formatters";

export default async function HomePage() {
  const user = await requireCurrentUser();
  const seasons = await listAccessibleSeasons(user.id);
  const activeSeason = seasons.find((season) => season.status === "ACTIVE");
  const draftCount = seasons.filter((season) => season.status === "DRAFT").length;

  return (
    <AppShell user={user} activeNavigation="dashboard">
      <section className="dashboard-hero mb-4">
        <p className="text-primary fw-semibold mb-2">
          {fa.home.greeting}، {user.name}
        </p>
        <h1 className="h2 fw-bold mb-3">نمای کلی ارزیابی عملکرد</h1>
        <p className="text-secondary dashboard-lead mb-0">
          دوره‌های ارزیابی، برنامه‌ریزی و وضعیت داده‌های ثبت‌شده را از اینجا دنبال کنید.
        </p>
      </section>

      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-4">
          <article className="card dashboard-card h-100 border-0">
            <div className="card-body p-4">
              <span className="metric-label">کل دوره‌ها</span>
              <strong className="metric-value">{formatPersianNumber(seasons.length)}</strong>
            </div>
          </article>
        </div>
        <div className="col-sm-6 col-lg-4">
          <article className="card dashboard-card h-100 border-0">
            <div className="card-body p-4">
              <span className="metric-label">دوره‌های پیش‌نویس</span>
              <strong className="metric-value">{formatPersianNumber(draftCount)}</strong>
            </div>
          </article>
        </div>
        <div className="col-sm-12 col-lg-4">
          <article className="card dashboard-card h-100 border-0">
            <div className="card-body p-4">
              <span className="metric-label">دوره فعال</span>
              <strong className="metric-value metric-value-text">
                {activeSeason?.name ?? "هنوز فعال نشده"}
              </strong>
              {activeSeason ? (
                <span className="text-secondary small">
                  از {formatPersianDate(activeSeason.startDate)}
                </span>
              ) : null}
            </div>
          </article>
        </div>
      </div>

      <section className="next-step-card d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <span className="small opacity-75">گام بعدی</span>
          <h2 className="h5 mb-0 mt-1">
            {seasons.length === 0 ? "اولین دوره ارزیابی را ایجاد کنید" : "مدیریت دوره‌های ارزیابی"}
          </h2>
        </div>
        <Link className="btn btn-light" href={seasons.length === 0 ? "/seasons/new" : "/seasons"}>
          {seasons.length === 0 ? fa.seasons.create : fa.seasons.title}
        </Link>
      </section>
    </AppShell>
  );
}
