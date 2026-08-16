import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { can } from "@/modules/authentication/domain/authorization";
import { requireCurrentUser } from "@/modules/authentication/server/session";
import { getSeasonAuthorizationContext } from "@/modules/authentication/server/season-access";
import { AgreementForm } from "@/modules/planning/components/agreement-form";
import { getAgreementForEdit, listWorkPractices } from "@/modules/planning/server/queries";

export default async function EditAgreementPage({ params }: { params: Promise<{ seasonId: string; projectId: string; agreementId: string }> }) {
  const user = await requireCurrentUser();
  const { seasonId, projectId, agreementId } = await params;
  const [context, agreement, practices] = await Promise.all([
    getSeasonAuthorizationContext(user.id, seasonId),
    getAgreementForEdit(seasonId, projectId, agreementId),
    listWorkPractices(user.id),
  ]);
  if (!context || !agreement || !can(context, "season:edit-setup")) notFound();
  return (
    <AppShell user={user} activeNavigation="seasons">
      <nav aria-label="مسیر صفحه" className="mb-3"><ol className="breadcrumb">
        <li className="breadcrumb-item"><Link href={`/seasons/${seasonId}/projects/${projectId}`}>بازگشت به پروژه</Link></li>
        <li aria-current="page" className="breadcrumb-item active">ویرایش توافق</li>
      </ol></nav>
      <div className="page-heading mb-4"><h1 className="h2 mb-2">ویرایش توافق</h1><p className="text-secondary mb-0">{agreement.title}</p></div>
      <AgreementForm
        agreementId={agreementId}
        initialValues={{
          title: agreement.title,
          description: agreement.description ?? "",
          agreementType: agreement.agreementType,
          practiceIds: agreement.expectedPractices.map((practice) => practice.workPracticeId),
        }}
        practices={practices}
        projectId={projectId}
        seasonId={seasonId}
      />
    </AppShell>
  );
}
