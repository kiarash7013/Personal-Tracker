import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { fa } from "@/i18n/fa";
import { can } from "@/modules/authentication/domain/authorization";
import { requireCurrentUser } from "@/modules/authentication/server/session";
import { getSeasonAuthorizationContext } from "@/modules/authentication/server/season-access";
import { SeasonForm } from "@/modules/seasons/components/season-form";
import { getSeasonDetails, listManagerCandidates } from "@/modules/seasons/server/queries";
import { toDateInputValue } from "@/presentation/formatters";

export default async function EditSeasonPage({ params }: { params: Promise<{ seasonId: string }> }) {
  const user = await requireCurrentUser();
  const { seasonId } = await params;
  const [context, season, managerCandidates] = await Promise.all([
    getSeasonAuthorizationContext(user.id, seasonId),
    getSeasonDetails(seasonId),
    listManagerCandidates(user.id),
  ]);

  if (!context || !can(context, "season:edit-setup") || !season) {
    notFound();
  }

  const managerId = season.members.find((member) => member.role === "MANAGER")?.userId ?? "";

  return (
    <AppShell user={user} activeNavigation="seasons">
      <div className="page-heading mb-4">
        <h1 className="h2 mb-2">{fa.seasons.edit}</h1>
        <p className="text-secondary mb-0">{season.name}</p>
      </div>
      <SeasonForm
        mode="edit"
        seasonId={season.id}
        managerCandidates={managerCandidates}
        initialValues={{
          name: season.name,
          startDate: toDateInputValue(season.startDate),
          endDate: toDateInputValue(season.endDate),
          managerId,
        }}
      />
    </AppShell>
  );
}
