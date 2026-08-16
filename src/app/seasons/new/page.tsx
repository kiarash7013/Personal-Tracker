import { AppShell } from "@/components/app-shell";
import { fa } from "@/i18n/fa";
import { requireCurrentUser } from "@/modules/authentication/server/session";
import { SeasonForm } from "@/modules/seasons/components/season-form";
import { listManagerCandidates } from "@/modules/seasons/server/queries";

export default async function NewSeasonPage() {
  const user = await requireCurrentUser();
  const managerCandidates = await listManagerCandidates(user.id);

  return (
    <AppShell user={user} activeNavigation="seasons">
      <div className="page-heading mb-4">
        <span className="section-kicker">Phase 6</span>
        <h1 className="h2 mt-2 mb-2">{fa.seasons.create}</h1>
        <p className="text-secondary mb-0">
          مشخصات پایه دوره را ثبت کنید؛ پروژه‌ها و توافق‌ها در گام بعد اضافه می‌شوند.
        </p>
      </div>
      <SeasonForm mode="create" managerCandidates={managerCandidates} />
    </AppShell>
  );
}
