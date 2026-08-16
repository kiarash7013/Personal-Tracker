import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { can } from "@/modules/authentication/domain/authorization";
import { requireCurrentUser } from "@/modules/authentication/server/session";
import { getSeasonAuthorizationContext } from "@/modules/authentication/server/season-access";
import { PerformanceReasons } from "@/modules/dashboard/components/performance-reasons";
import { SprintTrend } from "@/modules/dashboard/components/sprint-trend";
import { getEmployeeDashboard, getManagerDashboard } from "@/modules/dashboard/server/queries";
import { ReportActions } from "@/modules/reports/components/report-actions";
import { PrintButton } from "@/modules/reports/components/print-button";
import { getLatestSeasonSnapshot, getWorkPracticeReport } from "@/modules/reports/server/queries";
import { getSeasonPlanning } from "@/modules/planning/server/queries";
import { formatPercent, formatPersianDate, formatPersianNumber } from "@/presentation/formatters";

const performanceLabels = { PARTIALLY_ACHIEVED: "بخشی از توافق انجام شده", MEETS_EXPECTATIONS: "در سطح انتظار", EXCEEDS_EXPECTATIONS: "فراتر از سطح انتظار" } as const;

function numberOrNull(value: { toString(): string } | null | undefined) { return value == null ? null : Number(value); }

export default async function FinalReportPage({ params, searchParams }: { params: Promise<{ seasonId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireCurrentUser();
  const { seasonId } = await params;
  const context = await getSeasonAuthorizationContext(user.id, seasonId);
  if (!context || !can(context, "season:view")) notFound();
  const [dashboard, snapshot, planning, practices, query] = await Promise.all([
    context.role === "MANAGER" ? getManagerDashboard(seasonId, user.id) : getEmployeeDashboard(seasonId, user.id),
    getLatestSeasonSnapshot(seasonId),
    getSeasonPlanning(seasonId),
    getWorkPracticeReport(seasonId),
    searchParams,
  ]);
  if (!dashboard || !planning) notFound();
  const metrics = {
    core: snapshot ? numberOrNull(snapshot.coreAchievement) : dashboard.metrics.coreAchievement.value,
    alignment: snapshot ? numberOrNull(snapshot.workAlignment) : dashboard.metrics.workAlignment.value,
    execution: snapshot ? numberOrNull(snapshot.alignedExecution) : dashboard.metrics.alignedExecution.value,
    bonus: snapshot ? numberOrNull(snapshot.bonusAchievement) : dashboard.metrics.bonusAchievement.value,
    additional: snapshot ? numberOrNull(snapshot.additionalContribution) : dashboard.metrics.additionalContribution.value,
  };
  const level = snapshot?.performanceLevel ?? dashboard.classification.level;
  const projectDetails = snapshot?.details.filter((detail) => detail.metricKey === "PROJECT_CORE_ACHIEVEMENT") ?? [];

  return <AppShell user={user} activeNavigation="seasons">
    {query.closed ? <div className="alert alert-success no-print">دوره بسته و Snapshot قطعی گزارش ساخته شد.</div> : query.reopened ? <div className="alert alert-warning no-print">دوره بازگشایی شد؛ Snapshot قبلی برای تاریخچه حفظ شده است.</div> : null}
    <header className="report-header mb-4"><div><span className="eyebrow">گزارش نهایی دوره</span><h1 className="h2 mt-2 mb-2">{dashboard.season.name}</h1><p className="text-secondary mb-0">{dashboard.season.employee.name} · {formatPersianDate(dashboard.season.startDate)} تا {formatPersianDate(dashboard.season.endDate)}</p></div><div className="d-flex flex-wrap gap-2 no-print"><PrintButton />{context.role === "EMPLOYEE" ? <ReportActions seasonId={seasonId} status={dashboard.season.status} /> : null}</div></header>
    {snapshot ? <div className="snapshot-banner mb-4"><div><strong>Snapshot قطعی نسخه {formatPersianNumber(snapshot.revision)}</strong><span>محاسبه {snapshot.calculationVersion} · {formatPersianDate(snapshot.asOf)}</span></div><code dir="ltr">{snapshot.inputHash.slice(0, 16)}…</code></div> : <div className="alert alert-info">این گزارش پویا است. با بستن دوره، Snapshot قطعی و immutable ساخته می‌شود.</div>}

    <section className="report-level-card mb-4"><span>سطح عملکرد</span><strong>{level ? performanceLabels[level] : "داده کافی نیست"}</strong><small>Core = 100% به‌تنهایی به معنی فراتر از انتظار نیست.</small></section>
    <div className="row g-3 mb-4">{[
      ["تحقق توافق‌های اصلی", metrics.core], ["هم‌راستایی کارها", metrics.alignment], ["اجرای هم‌راستا", metrics.execution], ["تحقق امتیازی", metrics.bonus], ["مشارکت خارج توافق", metrics.additional],
    ].map(([label, value]) => <div className="col-sm-6 col-lg" key={String(label)}><article className="card app-card border-0 h-100"><div className="card-body p-4"><span className="metric-label">{label}</span><strong className="metric-value">{value === null ? "—" : formatPercent(Number(value))}</strong></div></article></div>)}</div>

    <div className="mb-4"><PerformanceReasons metrics={{ workAlignment: metrics.alignment, alignedExecution: metrics.execution, bonusAchievement: metrics.bonus, additionalContribution: metrics.additional, coreOpportunityCoverage: snapshot ? Number(snapshot.coreOpportunityCoverage ?? 0) : dashboard.metrics.coreAchievement.opportunityCoverage }} primaryReason={snapshot?.primaryReason ?? dashboard.reasoning.primaryReason} supportingReasons={snapshot?.supportingReasons ?? dashboard.reasoning.supportingReasons} /></div>

    <section className="card app-card border-0 mb-4"><div className="card-body p-4"><div className="d-flex justify-content-between gap-3 mb-4"><div><h2 className="h5 mb-1">گزارش پروژه‌ها و توافق‌ها</h2><p className="text-secondary small mb-0">از وزن رسمی تا تسک و Evidence قابل Drill-down است.</p></div><Link className="btn btn-sm btn-outline-primary no-print" href={`/seasons/${seasonId}/projects`}>جزئیات توافق‌ها</Link></div><div className="table-responsive"><table className="table align-middle"><thead><tr><th scope="col">پروژه</th><th scope="col">وزن</th><th scope="col">Core</th><th scope="col">Contribution</th><th scope="col">توافق‌ها</th></tr></thead><tbody>{planning.plan.projects.map((project) => { const saved = projectDetails.find((detail) => detail.entityId === project.projectId); const dynamic = dashboard.projectSummaries.find((item) => item.id === project.projectId); const achievement = saved ? numberOrNull(saved.value) : dynamic?.coreAchievement ?? null; return <tr key={project.projectId}><td><Link href={`/seasons/${seasonId}/projects/${project.projectId}`}>{project.nameSnapshot}</Link></td><td>{formatPercent(project.weight)}</td><td>{achievement === null ? "بدون فرصت" : formatPercent(achievement)}</td><td>{saved?.contribution ? formatPercent(Number(saved.contribution)) : achievement === null ? "—" : formatPercent((achievement * project.weight) / 100)}</td><td>{formatPersianNumber(project.agreements.length)}</td></tr>; })}</tbody></table></div></div></section>

    <div className="row g-4 mb-4"><div className="col-lg-6"><section className="card app-card border-0 h-100"><div className="card-body p-4"><h2 className="h5 mb-4">پوشش مولفه‌های کاری</h2>{practices.length ? <div className="vstack gap-3">{practices.map((practice) => <div key={practice.id}><div className="d-flex justify-content-between mb-1"><strong>{practice.name}</strong><span>{practice.achievement === null ? "N/A" : formatPercent(practice.achievement)}</span></div><div className="progress" role="progressbar" aria-valuenow={Math.round(practice.achievement ?? 0)} aria-valuemin={0} aria-valuemax={100}><div className="progress-bar" style={{ width: `${practice.achievement ?? 0}%` }} /></div><small className="text-secondary">{formatPersianNumber(practice.done)} از {formatPersianNumber(practice.applicable)} نمونه قابل‌اعمال · {formatPersianNumber(practice.taskCount)} تسک</small></div>)}</div> : <p className="text-secondary">داده قابل‌اعمالی وجود ندارد.</p>}</div></section></div><div className="col-lg-6"><section className="card app-card border-0 h-100"><div className="card-body p-4"><h2 className="h5 mb-4">شفافیت داده</h2><dl className="report-audit-list"><div><dt>تسک‌های نهایی</dt><dd>{formatPersianNumber(dashboard.counts.finalized)}</dd></div><div><dt>تسک نهایی بدون Evidence</dt><dd>{formatPersianNumber(dashboard.counts.missingEvidence)}</dd></div><div><dt>پروژه خارج توافق</dt><dd>{formatPersianNumber(dashboard.projectSummaries.filter((project) => project.scope === "ADDITIONAL").length)}</dd></div><div><dt>نسخه تنظیمات</dt><dd>{formatPersianNumber(dashboard.settings.version || 1)}</dd></div></dl><Link className="btn btn-outline-primary w-100 no-print" href={`/seasons/${seasonId}/tasks`}>مشاهده Taskها و Evidenceها</Link></div></section></div></div>

    <SprintTrend points={dashboard.trend} summary={dashboard.trendSummary} />
  </AppShell>;
}
