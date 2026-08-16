import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { can } from "@/modules/authentication/domain/authorization";
import { requireCurrentUser } from "@/modules/authentication/server/session";
import { getSeasonAuthorizationContext } from "@/modules/authentication/server/season-access";
import { MetricCard } from "@/modules/dashboard/components/metric-card";
import { PerformanceReasons } from "@/modules/dashboard/components/performance-reasons";
import { SprintTrend } from "@/modules/dashboard/components/sprint-trend";
import { getManagerDashboard } from "@/modules/dashboard/server/queries";
import { formatPercent, formatPersianDate, formatPersianNumber } from "@/presentation/formatters";

const performanceLabels = { PARTIALLY_ACHIEVED: "بخشی از توافق انجام شده", MEETS_EXPECTATIONS: "در سطح انتظار", EXCEEDS_EXPECTATIONS: "فراتر از سطح انتظار" } as const;

export default async function ManagerDashboardPage({ params }: { params: Promise<{ seasonId: string }> }) {
  const user = await requireCurrentUser();
  const { seasonId } = await params;
  const [context, dashboard] = await Promise.all([
    getSeasonAuthorizationContext(user.id, seasonId),
    getManagerDashboard(seasonId, user.id),
  ]);
  if (!context || !dashboard || context.role !== "MANAGER" || !can(context, "season:view")) notFound();
  const { metrics } = dashboard;

  return <AppShell user={user} activeNavigation="dashboard">
    <div className="manager-dashboard-heading d-flex flex-column flex-lg-row justify-content-between gap-3 mb-4">
      <div><span className="eyebrow">داشبورد فقط‌خواندنی مدیر</span><h1 className="h2 mt-2 mb-2">{dashboard.season.name}</h1><p className="text-secondary mb-0">{dashboard.season.employee.name} · <span dir="ltr">{dashboard.season.employee.email}</span></p></div>
      <div className="text-lg-end"><span className="d-block text-secondary small">بازه ارزیابی</span><strong>{formatPersianDate(dashboard.season.startDate)} تا {formatPersianDate(dashboard.season.endDate)}</strong></div>
    </div>

    <div className="row g-3 mb-4">
      <div className="col-md-6 col-xl-3"><article className="card app-card border-0 h-100 performance-level-pending"><div className="card-body p-4"><span className="metric-label">سطح عملکرد</span><strong className="metric-value metric-value-text">{dashboard.classification.level ? performanceLabels[dashboard.classification.level] : "داده کافی نیست"}</strong><p className="text-secondary small mb-0">براساس نسخه {formatPersianNumber(dashboard.settings.version || 1)} Thresholdها</p></div></article></div>
      <div className="col-md-6 col-xl-3"><MetricCard helper="تحقق انتظارات اصلی در فرصت‌های مرتبط" status={metrics.coreAchievement.status} title="تحقق توافق‌های اصلی" value={metrics.coreAchievement.value} /></div>
      <div className="col-md-6 col-xl-3"><MetricCard denominator={metrics.workAlignment.denominator} helper="سهم کار تخصیص‌یافته داخل توافق اولیه" numerator={metrics.workAlignment.numerator} status={metrics.workAlignment.status} title="هم‌راستایی کارها" tone="success" value={metrics.workAlignment.value} /></div>
      <div className="col-md-6 col-xl-3"><MetricCard denominator={metrics.alignedExecution.denominator} helper="کیفیت اجرا در فرصت‌های هم‌راستا" numerator={metrics.alignedExecution.numerator} status={metrics.alignedExecution.status} title="اجرای هم‌راستا" tone="success" value={metrics.alignedExecution.value} /></div>
      <div className="col-md-6 col-xl-3"><MetricCard helper="جدا از Core محاسبه می‌شود" status={metrics.bonusAchievement.status} title="تحقق امتیازی" tone="warning" value={metrics.bonusAchievement.value} /></div>
      <div className="col-md-6 col-xl-3"><MetricCard denominator={metrics.additionalContribution.denominator} helper="مستقیماً با Core جمع نمی‌شود" numerator={metrics.additionalContribution.numerator} status={metrics.additionalContribution.status} title="مشارکت خارج توافق" tone="neutral" value={metrics.additionalContribution.value} /></div>
      <div className="col-md-6 col-xl-3"><MetricCard helper="Context زمانی دوره" title="زمان سپری‌شده" tone="neutral" value={dashboard.season.elapsed} /></div>
      <div className="col-md-6 col-xl-3"><article className="card app-card border-0 h-100"><div className="card-body p-4"><span className="metric-label">تسک‌های نهایی</span><strong className="metric-value">{formatPersianNumber(dashboard.counts.finalized)}</strong><p className="text-secondary small mb-0">{formatPersianNumber(dashboard.counts.missingEvidence)} مورد بدون Evidence</p></div></article></div>
    </div>

    <div className="mb-4"><PerformanceReasons
      metrics={{
        workAlignment: metrics.workAlignment.value,
        alignedExecution: metrics.alignedExecution.value,
        bonusAchievement: metrics.bonusAchievement.value,
        additionalContribution: metrics.additionalContribution.value,
        coreOpportunityCoverage: metrics.coreAchievement.opportunityCoverage,
      }}
      primaryReason={dashboard.reasoning.primaryReason}
      supportingReasons={dashboard.reasoning.supportingReasons}
    /></div>

    <div className="mb-4"><SprintTrend points={dashboard.trend} summary={dashboard.trendSummary} /></div>

    <section className="card app-card border-0 mb-4"><div className="card-body p-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4"><div><h2 className="h5 mb-1">وضعیت پروژه‌ها</h2><p className="text-secondary small mb-0">وزن رسمی، فرصت مشاهده‌شده و تحقق Core هر پروژه</p></div><Link className="btn btn-sm btn-outline-primary" href={`/seasons/${seasonId}/projects`}>مشاهده توافق‌ها</Link></div>
      <div className="table-responsive"><table className="table align-middle mb-0"><thead><tr><th scope="col">پروژه</th><th scope="col">نوع / وزن</th><th scope="col">تسک نهایی</th><th scope="col">تحقق Core</th><th scope="col">پوشش فرصت</th></tr></thead><tbody>{dashboard.projectSummaries.map((project) => <tr key={project.id}><td><strong>{project.name}</strong></td><td>{project.scope === "AGREED" ? formatPercent(project.weight ?? 0) : <span className="badge bonus-badge">خارج توافق</span>}</td><td>{formatPersianNumber(project.finalizedTaskCount)}</td><td>{project.scope === "ADDITIONAL" ? "—" : project.coreAchievement === null ? "بدون فرصت" : formatPercent(project.coreAchievement)}</td><td>{project.scope === "ADDITIONAL" ? "—" : formatPercent(project.opportunityCoverage)}</td></tr>)}</tbody></table></div>
    </div></section>

    <div className="row g-4">
      <div className="col-lg-7"><section className="card app-card border-0 h-100"><div className="card-body p-4"><div className="d-flex justify-content-between align-items-center mb-4"><h2 className="h5 mb-0">تسک‌های اخیر</h2><Link className="small" href={`/seasons/${seasonId}/tasks`}>همه تسک‌ها</Link></div><div className="vstack gap-2">{dashboard.recentTasks.map((task) => <Link className="recent-task-row" href={`/seasons/${seasonId}/tasks/${task.id}`} key={task.id}><span className={`task-state-dot state-${task.approvalStatus.toLowerCase()}`} /><span className="flex-grow-1"><strong>{task.title}</strong><small>{task.project.name} · {task.sprint.name}</small></span><span className="task-code" dir="ltr">{task.externalCode || "—"}</span></Link>)}</div></div></section></div>
      <div className="col-lg-5"><section className="card app-card border-0 h-100"><div className="card-body p-4"><div className="d-flex justify-content-between gap-2 mb-3"><h2 className="h5 mb-0">Context فعلی داده‌ها</h2><Link className="small" href={`/seasons/${seasonId}/settings/performance`}>Thresholdها</Link></div><p className="neutral-observation">{metrics.workAlignment.value === null ? "هنوز کار نهایی تخصیص‌یافته‌ای برای محاسبه هم‌راستایی وجود ندارد." : `${formatPercent(metrics.workAlignment.value)} از کارهای نهایی تخصیص‌یافته با پروژه‌های توافق‌شده هم‌راستا بوده‌اند.`}</p><p className="neutral-observation">{metrics.alignedExecution.value === null ? "هنوز نمونه مولفه قابل‌اعمالی در کار هم‌راستا ثبت نشده است." : `${formatPercent(metrics.alignedExecution.value)} از مولفه‌های قابل‌اعمال در کارهای هم‌راستا انجام شده‌اند.`}</p></div></section></div>
    </div>
  </AppShell>;
}
