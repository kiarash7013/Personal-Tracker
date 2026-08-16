import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireCurrentUser } from "@/modules/authentication/server/session";
import { WorkPracticeForm } from "@/modules/planning/components/work-practice-form";
import { getWorkPracticeForEdit } from "@/modules/planning/server/queries";

export default async function EditWorkPracticePage({ params }: { params: Promise<{ practiceId: string }> }) {
  const user = await requireCurrentUser();
  const { practiceId } = await params;
  const practice = await getWorkPracticeForEdit(user.id, practiceId);
  if (!practice) notFound();
  return <AppShell user={user} activeNavigation="practices"><div className="page-heading mb-4"><h1 className="h2 mb-2">ویرایش مولفه کاری</h1><p className="text-secondary mb-0">{practice.name}</p></div><WorkPracticeForm initialValues={{ name: practice.name, description: practice.description ?? "" }} practiceId={practice.id} /></AppShell>;
}
