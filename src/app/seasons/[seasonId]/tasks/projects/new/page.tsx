import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { can } from "@/modules/authentication/domain/authorization";
import { requireCurrentUser } from "@/modules/authentication/server/session";
import { getSeasonAuthorizationContext } from "@/modules/authentication/server/season-access";
import { AdditionalProjectForm } from "@/modules/tasks/components/additional-project-form";

export default async function NewAdditionalProjectPage({ params }: { params: Promise<{ seasonId: string }> }) {
  const user = await requireCurrentUser();
  const { seasonId } = await params;
  const context = await getSeasonAuthorizationContext(user.id, seasonId);
  if (!context || context.status !== "ACTIVE" || !can(context, "season:manage-tasks")) notFound();
  return <AppShell user={user} activeNavigation="seasons"><div className="page-heading mb-4"><h1 className="h2 mb-2">پروژه خارج از توافق</h1><p className="text-secondary mb-0">برای ثبت تسک‌هایی که در پروژه‌های برنامه اولیه قرار نداشته‌اند.</p></div><AdditionalProjectForm seasonId={seasonId} /></AppShell>;
}
