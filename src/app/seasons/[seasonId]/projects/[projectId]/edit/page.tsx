import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { can } from "@/modules/authentication/domain/authorization";
import { requireCurrentUser } from "@/modules/authentication/server/session";
import { getSeasonAuthorizationContext } from "@/modules/authentication/server/season-access";
import { ProjectForm } from "@/modules/planning/components/project-form";
import { getProjectForEdit } from "@/modules/planning/server/queries";

export default async function EditProjectPage({ params }: { params: Promise<{ seasonId: string; projectId: string }> }) {
  const user = await requireCurrentUser();
  const { seasonId, projectId } = await params;
  const [context, project] = await Promise.all([
    getSeasonAuthorizationContext(user.id, seasonId),
    getProjectForEdit(seasonId, projectId),
  ]);
  if (!context || !project || !can(context, "season:edit-setup")) notFound();
  return (
    <AppShell user={user} activeNavigation="seasons">
      <nav aria-label="مسیر صفحه" className="mb-3"><ol className="breadcrumb">
        <li className="breadcrumb-item"><Link href={`/seasons/${seasonId}/projects/${projectId}`}>{project.nameSnapshot}</Link></li>
        <li aria-current="page" className="breadcrumb-item active">ویرایش پروژه</li>
      </ol></nav>
      <h1 className="h2 mb-4">ویرایش پروژه</h1>
      <ProjectForm
        initialValues={{
          name: project.nameSnapshot,
          description: project.descriptionSnapshot ?? "",
          weight: String(Number(project.weight)),
        }}
        projectId={projectId}
        seasonId={seasonId}
      />
    </AppShell>
  );
}
