import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { can } from "@/modules/authentication/domain/authorization";
import { requireCurrentUser } from "@/modules/authentication/server/session";
import { getSeasonAuthorizationContext } from "@/modules/authentication/server/season-access";
import { ProjectForm } from "@/modules/planning/components/project-form";
import { getSeasonPlanning } from "@/modules/planning/server/queries";

export default async function NewProjectPage({ params }: { params: Promise<{ seasonId: string }> }) {
  const user = await requireCurrentUser();
  const { seasonId } = await params;
  const [context, planning] = await Promise.all([
    getSeasonAuthorizationContext(user.id, seasonId),
    getSeasonPlanning(seasonId),
  ]);
  if (!context || !planning || !can(context, "season:edit-setup") || planning.plan.status !== "DRAFT") notFound();

  return (
    <AppShell user={user} activeNavigation="seasons">
      <nav aria-label="مسیر صفحه" className="mb-3"><ol className="breadcrumb">
        <li className="breadcrumb-item"><Link href={`/seasons/${seasonId}/projects`}>{planning.name}</Link></li>
        <li aria-current="page" className="breadcrumb-item active">پروژه جدید</li>
      </ol></nav>
      <div className="page-heading mb-4"><h1 className="h2 mb-2">افزودن پروژه توافق‌شده</h1><p className="text-secondary mb-0">وزن ثبت‌شده باید همان اولویت رسمی توافق‌شده با مدیر باشد.</p></div>
      <ProjectForm seasonId={seasonId} />
    </AppShell>
  );
}
