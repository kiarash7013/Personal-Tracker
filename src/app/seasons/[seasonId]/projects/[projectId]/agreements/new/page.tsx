import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { can } from "@/modules/authentication/domain/authorization";
import { requireCurrentUser } from "@/modules/authentication/server/session";
import { getSeasonAuthorizationContext } from "@/modules/authentication/server/season-access";
import { AgreementForm } from "@/modules/planning/components/agreement-form";
import { getSeasonPlanning, listWorkPractices } from "@/modules/planning/server/queries";

export default async function NewAgreementPage({ params }: { params: Promise<{ seasonId: string; projectId: string }> }) {
  const user = await requireCurrentUser();
  const { seasonId, projectId } = await params;
  const [context, planning, practices] = await Promise.all([
    getSeasonAuthorizationContext(user.id, seasonId),
    getSeasonPlanning(seasonId),
    listWorkPractices(user.id, false),
  ]);
  const project = planning?.plan.projects.find((item) => item.projectId === projectId);
  if (!context || !planning || !project || !can(context, "season:edit-setup") || planning.plan.status !== "DRAFT") notFound();
  return (
    <AppShell user={user} activeNavigation="seasons">
      <nav aria-label="مسیر صفحه" className="mb-3"><ol className="breadcrumb">
        <li className="breadcrumb-item"><Link href={`/seasons/${seasonId}/projects/${projectId}`}>{project.nameSnapshot}</Link></li>
        <li aria-current="page" className="breadcrumb-item active">توافق جدید</li>
      </ol></nav>
      <div className="page-heading mb-4"><h1 className="h2 mb-2">افزودن توافق</h1><p className="text-secondary mb-0">انتظار دوره را به مولفه‌های کاری قابل مشاهده متصل کنید.</p></div>
      <AgreementForm practices={practices} projectId={projectId} seasonId={seasonId} />
    </AppShell>
  );
}
