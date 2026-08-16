import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { can } from "@/modules/authentication/domain/authorization";
import { requireCurrentUser } from "@/modules/authentication/server/session";
import { getSeasonAuthorizationContext } from "@/modules/authentication/server/season-access";
import { SettingsForm } from "@/modules/performance-settings/components/settings-form";
import { getPerformanceSettings } from "@/modules/performance-settings/server/queries";
import { formatPercent, formatPersianNumber } from "@/presentation/formatters";

export default async function PerformanceSettingsPage({ params, searchParams }: { params: Promise<{ seasonId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireCurrentUser();
  const { seasonId } = await params;
  const [context, settings, query] = await Promise.all([getSeasonAuthorizationContext(user.id, seasonId), getPerformanceSettings(seasonId), searchParams]);
  if (!context || !can(context, "season:view")) notFound();
  const canEdit = can(context, "season:manage-settings");
  return <AppShell user={user} activeNavigation="seasons">
    {query.updated ? <div className="alert alert-success">نسخه جدید تنظیمات فعال شد.</div> : null}
    <div className="page-heading mb-4"><h1 className="h2 mb-2">تنظیمات سطح عملکرد</h1><p className="text-secondary mb-0">Thresholdهای قابل تنظیم Classification · نسخه {formatPersianNumber(settings.version || 1)}{settings.version === 0 ? " (پیش‌فرض)" : ""}</p></div>
    {canEdit ? <SettingsForm initialValues={settings} seasonId={seasonId} /> : <section className="card app-card border-0"><div className="card-body p-4"><div className="row g-3">{[
      ["حداقل Core برای Meets", settings.meetsExpectationsMinCoreAchievement],
      ["حداقل اجرای هم‌راستا", settings.minimumAlignedExecution],
      ["Bonus لازم برای Exceeds", settings.bonusRequiredForExceeds],
      ["Additional لازم برای Exceeds", settings.additionalContributionThreshold],
      ["مرز Alignment محدود", settings.lowAlignmentThreshold],
      ["مرز شاخص قوی", settings.strongMetricThreshold],
    ].map(([label, value]) => <div className="col-md-6" key={String(label)}><div className="calculation-box"><span>{label}</span><strong>{formatPercent(Number(value))}</strong></div></div>)}</div></div></section>}
  </AppShell>;
}
