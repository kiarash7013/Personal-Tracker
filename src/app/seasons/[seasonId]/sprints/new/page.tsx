import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { can } from "@/modules/authentication/domain/authorization";
import { requireCurrentUser } from "@/modules/authentication/server/session";
import { getSeasonAuthorizationContext } from "@/modules/authentication/server/season-access";
import { SprintForm } from "@/modules/sprints/components/sprint-form";
import { getSeasonSprints } from "@/modules/sprints/server/queries";
import { toDateInputValue } from "@/presentation/formatters";

export default async function NewSprintPage({ params }: { params: Promise<{ seasonId: string }> }) {
  const user = await requireCurrentUser();
  const { seasonId } = await params;
  const [context, season] = await Promise.all([getSeasonAuthorizationContext(user.id, seasonId), getSeasonSprints(seasonId)]);
  if (!context || !season || !can(context, "season:manage-sprints")) notFound();
  return <AppShell user={user} activeNavigation="seasons"><nav aria-label="مسیر صفحه" className="mb-3"><ol className="breadcrumb"><li className="breadcrumb-item"><Link href={`/seasons/${seasonId}/sprints`}>{season.name}</Link></li><li aria-current="page" className="breadcrumb-item active">اسپرینت جدید</li></ol></nav><div className="page-heading mb-4"><h1 className="h2 mb-2">افزودن اسپرینت</h1><p className="text-secondary mb-0">بازه زمانی باید داخل دوره ارزیابی باشد.</p></div><SprintForm initialValues={{ name: `اسپرینت ${season.sprints.length + 1}`, sequenceNumber: String(season.sprints.length + 1), startDate: "", endDate: "", status: "PLANNED" }} seasonId={seasonId} seasonRange={{ start: toDateInputValue(season.startDate), end: toDateInputValue(season.endDate) }} /></AppShell>;
}
