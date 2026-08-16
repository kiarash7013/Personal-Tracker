import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { can } from "@/modules/authentication/domain/authorization";
import { requireCurrentUser } from "@/modules/authentication/server/session";
import { getSeasonAuthorizationContext } from "@/modules/authentication/server/season-access";
import { MetricCard } from "@/modules/dashboard/components/metric-card";
import { getEmployeeDashboard } from "@/modules/dashboard/server/queries";
import { formatPercent, formatPersianDate, formatPersianNumber } from "@/presentation/formatters";

const statusLabels = { DRAFT: "پیش‌نویس", IN_PROGRESS: "در حال انجام", FINAL_APPROVED: "نهایی" } as const;
const performanceLabels = { PARTIALLY_ACHIEVED: "بخشی از توافق انجام شده", MEETS_EXPECTATIONS: "در سطح انتظار", EXCEEDS_EXPECTATIONS: "فراتر از سطح انتظار" } as const;

export default async function EmployeeDashboardPage({ params }: { params: Promise<{ seasonId: string }> }) {
  const user = await requireCurrentUser();
  const { seasonId } = await params;
  const [context, dashboard] = await Promise.all([
    getSeasonAuthorizationContext(user.id, seasonId),
    getEmployeeDashboard(seasonId, user.id),
  ]);
  if (!context || !dashboard || context.role !== "EMPLOYEE" || !can(context, "season:view")) notFound();
  const { metrics } = dashboard;

  return <AppShell user={user} activeNavigation="dashboard">
    <div className="dashboard-hero employee-dashboard-hero mb-4">
      <div>
        <span className="eyebrow">داشبورد کارمند</span>
        <h1 className="display-6 fw-bold mt-2 mb-2">{dashboard.season.name}</h1>
        <p className="mb-0 opacity-75">{formatPersianDate(dashboard.season.startDate)} تا {formatPersianDate(dashboard.season.endDate)}</p>
      </div>
      <div className="dashboard-hero-actions">
        <span className="current-sprint-chip">سطح فعلی: {dashboard.classification.level ? performanceLabels[dashboard.classification.level] : "داده کافی نیست"}</span>
        {dashboard.currentSprint ? <span className="current-sprint-chip">اسپرینت فعلی: {dashboard.currentSprint.name}</span> : <span className="current-sprint-chip">اسپرینت فعالی وجود ندارد</span>}
        <Link className="btn btn-light" href={`/seasons/${seasonId}/tasks/new`}>ثبت تسک جدید</Link>
      </div>
    </div>

    <div className="row g-3 mb-4">
      <div className="col-md-6 col-xl"><MetricCard helper="نرخ تحقق انتظارهای اصلی در فرصت‌های مشاهده‌شده" status={metrics.coreAchievement.status} title="تحقق توافق‌های اصلی" tone="primary" value={metrics.coreAchievement.value} /></div>
      <div className="col-md-6 col-xl"><MetricCard denominator={metrics.workAlignment.denominator} helper="کار نهایی تخصیص‌یافته داخل پروژه‌های توافق‌شده" numerator={metrics.workAlignment.numerator} status={metrics.workAlignment.status} title="هم‌راستایی کارها" tone="success" value={metrics.workAlignment.value} /></div>
      <div className="col-md-6 col-xl"><MetricCard denominator={metrics.alignedExecution.denominator} helper="مولفه‌های انجام‌شده در کارهای هم‌راستا" numerator={metrics.alignedExecution.numerator} status={metrics.alignedExecution.status} title="اجرای هم‌راستا" tone="success" value={metrics.alignedExecution.value} /></div>
      <div className="col-md-6 col-xl"><MetricCard helper="تحقق جداگانه توافق‌های امتیازی" status={metrics.bonusAchievement.status} title="تحقق امتیازی" tone="warning" value={metrics.bonusAchievement.value} /></div>
      <div className="col-md-6 col-xl"><MetricCard denominator={metrics.additionalContribution.denominator} helper="سهم تسک‌های نهایی خارج از توافق اولیه" numerator={metrics.additionalContribution.numerator} status={metrics.additionalContribution.status} title="مشارکت خارج توافق" tone="neutral" value={metrics.additionalContribution.value} /></div>
    </div>

    <section className="card app-card border-0 mb-4"><div className="card-body p-4">
      <div className="d-flex align-items-center justify-content-between gap-3 mb-2"><div><h2 className="h5 mb-1">زمان سپری‌شده دوره</h2><p className="text-secondary small mb-0">این شاخص فقط Context زمانی است و امتیاز عملکرد نیست.</p></div><strong>{formatPercent(dashboard.season.elapsed)}</strong></div>
      <div aria-label={`${formatPercent(dashboard.season.elapsed)} از دوره سپری شده`} aria-valuemax={100} aria-valuemin={0} aria-valuenow={Math.round(dashboard.season.elapsed)} className="progress" role="progressbar"><div className="progress-bar" style={{ width: `${dashboard.season.elapsed}%` }} /></div>
    </div></section>

    <div className="row g-4 mb-4">
      <div className="col-lg-5"><section className="card app-card border-0 h-100"><div className="card-body p-4">
        <h2 className="h5 mb-4">اقدام‌های بعدی</h2>
        <div className="action-summary-grid"><Link href={`/seasons/${seasonId}/tasks?status=DRAFT`}><strong>{formatPersianNumber(dashboard.counts.draft)}</strong><span>تسک تکمیل‌نشده</span></Link><Link href={`/seasons/${seasonId}/tasks`}><strong>{formatPersianNumber(dashboard.counts.missingEvidence)}</strong><span>تسک نهایی بدون مستند</span></Link></div>
        {dashboard.draftTasks.length ? <div className="vstack gap-2 mt-4">{dashboard.draftTasks.map((task) => <Link className="compact-task-link" href={`/seasons/${seasonId}/tasks/${task.id}/edit`} key={task.id}><span><strong>{task.title}</strong><small>{task.sprint.name} · {statusLabels[task.approvalStatus]}</small></span><span aria-hidden="true">←</span></Link>)}</div> : <p className="text-secondary small mt-4 mb-0">تسک باز یا پیش‌نویسی وجود ندارد.</p>}
      </div></section></div>
      <div className="col-lg-7"><section className="card app-card border-0 h-100"><div className="card-body p-4">
        <div className="d-flex align-items-center justify-content-between mb-4"><h2 className="h5 mb-0">آخرین تسک‌ها</h2><Link className="small" href={`/seasons/${seasonId}/tasks`}>مشاهده همه</Link></div>
        {dashboard.recentTasks.length ? <div className="vstack gap-2">{dashboard.recentTasks.map((task) => <Link className="recent-task-row" href={`/seasons/${seasonId}/tasks/${task.id}`} key={task.id}><span className={`task-state-dot state-${task.approvalStatus.toLowerCase()}`} aria-hidden="true" /><span className="flex-grow-1"><strong>{task.title}</strong><small>{task.project.name} · {task.sprint.name}</small></span><span className="task-code" dir="ltr">{task.externalCode || "—"}</span></Link>)}</div> : <p className="text-secondary mb-0">هنوز تسکی ثبت نشده است.</p>}
      </div></section></div>
    </div>

    <details className="card app-card border-0 calculation-details" id="calculation-details"><summary className="card-body p-4 fw-semibold">مشاهده نحوه محاسبه KPIها</summary><div className="px-4 pb-4"><div className="row g-3">
      <div className="col-md-4"><div className="calculation-box"><span>Core Opportunity Coverage</span><strong>{formatPercent(metrics.coreAchievement.opportunityCoverage)}</strong><small>{formatPersianNumber(metrics.coreAchievement.projects.length)} پروژه توافق‌شده</small></div></div>
      <div className="col-md-4"><div className="calculation-box"><span>Alignment</span><strong>{formatPersianNumber(metrics.workAlignment.numerator)} ÷ {formatPersianNumber(metrics.workAlignment.denominator || 0)}</strong><small>تسک نهایی تخصیص‌یافته</small></div></div>
      <div className="col-md-4"><div className="calculation-box"><span>Aligned Execution</span><strong>{formatPersianNumber(metrics.alignedExecution.numerator)} ÷ {formatPersianNumber(metrics.alignedExecution.denominator || 0)}</strong><small>نمونه مولفه قابل‌اعمال</small></div></div>
    </div><div className="d-flex justify-content-end mt-3"><Link className="btn btn-sm btn-outline-secondary" href={`/seasons/${seasonId}/settings/performance`}>تنظیم Thresholdها</Link></div></div></details>
  </AppShell>;
}
