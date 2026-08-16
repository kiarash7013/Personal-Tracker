import { AppShell } from "@/components/app-shell";
import { requireCurrentUser } from "@/modules/authentication/server/session";
import { WorkPracticeForm } from "@/modules/planning/components/work-practice-form";

export default async function NewWorkPracticePage() {
  const user = await requireCurrentUser();
  return <AppShell user={user} activeNavigation="practices"><div className="page-heading mb-4"><h1 className="h2 mb-2">مولفه کاری جدید</h1><p className="text-secondary mb-0">یک مولفه قابل استفاده مجدد به کتابخانه اضافه کنید.</p></div><WorkPracticeForm /></AppShell>;
}
