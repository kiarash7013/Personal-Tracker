import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { can } from "@/modules/authentication/domain/authorization";
import { requireCurrentUser } from "@/modules/authentication/server/session";
import { getSeasonAuthorizationContext } from "@/modules/authentication/server/season-access";
import { SprintForm } from "@/modules/sprints/components/sprint-form";
import { getSeasonSprints, getSprintForEdit } from "@/modules/sprints/server/queries";
import { toDateInputValue } from "@/presentation/formatters";

export default async function EditSprintPage({ params }: { params: Promise<{ seasonId: string; sprintId: string }> }) {
  const user = await requireCurrentUser();
  const { seasonId, sprintId } = await params;
  const [context, season, sprint] = await Promise.all([getSeasonAuthorizationContext(user.id, seasonId), getSeasonSprints(seasonId), getSprintForEdit(seasonId, sprintId)]);
  if (!context || !season || !sprint || !can(context, "season:manage-sprints")) notFound();
  return <AppShell user={user} activeNavigation="seasons"><nav aria-label="مسیر صفحه" className="mb-3"><ol className="breadcrumb"><li className="breadcrumb-item"><Link href={`/seasons/${seasonId}/sprints`}>{season.name}</Link></li><li aria-current="page" className="breadcrumb-item active">ویرایش اسپرینت</li></ol></nav><div className="page-heading mb-4"><h1 className="h2 mb-2">ویرایش اسپرینت</h1><p className="text-secondary mb-0">{sprint.name}</p></div><SprintForm initialValues={{ name: sprint.name, sequenceNumber: String(sprint.sequenceNumber), startDate: toDateInputValue(sprint.startDate), endDate: toDateInputValue(sprint.endDate), status: sprint.status }} seasonId={seasonId} seasonRange={{ start: toDateInputValue(season.startDate), end: toDateInputValue(season.endDate) }} sprintId={sprintId} /></AppShell>;
}
