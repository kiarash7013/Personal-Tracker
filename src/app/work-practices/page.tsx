import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireCurrentUser } from "@/modules/authentication/server/session";
import { toggleWorkPracticeAction } from "@/modules/planning/server/actions";
import { listWorkPractices } from "@/modules/planning/server/queries";
import { formatPersianNumber } from "@/presentation/formatters";

export default async function WorkPracticesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireCurrentUser();
  const [practices, query] = await Promise.all([listWorkPractices(user.id), searchParams]);
  const message = query.created ? "مولفه کاری ایجاد شد." : query.updated ? "مولفه کاری به‌روزرسانی شد." : null;
  return (
    <AppShell user={user} activeNavigation="practices">
      {message ? <div className="alert alert-success" role="status">{message}</div> : null}
      <div className="page-heading d-flex flex-column flex-sm-row justify-content-between gap-3 mb-4">
        <div><h1 className="h2 mb-2">کتابخانه مولفه‌های کاری</h1><p className="text-secondary mb-0">مولفه‌های reusable برای توافق‌ها و ثبت اجرای واقعی تسک‌ها</p></div>
        <Link className="btn btn-primary align-self-start" href="/work-practices/new">افزودن مولفه</Link>
      </div>
      {practices.length ? (
        <div className="table-responsive card app-card border-0">
          <table className="table align-middle mb-0">
            <thead><tr><th scope="col">مولفه</th><th scope="col">وضعیت</th><th scope="col">استفاده تاریخی</th><th className="text-end" scope="col">عملیات</th></tr></thead>
            <tbody>{practices.map((practice) => (
              <tr key={practice.id}>
                <td><strong className="d-block">{practice.name}</strong><small className="text-secondary">{practice.description || "بدون توضیح"}</small></td>
                <td><span className={`badge ${practice.active ? "text-bg-success" : "text-bg-secondary"}`}>{practice.active ? "فعال" : "غیرفعال"}</span></td>
                <td>{formatPersianNumber(practice._count.agreements)} توافق · {formatPersianNumber(practice._count.taskPractices)} تسک</td>
                <td><div className="d-flex justify-content-end gap-2"><Link className="btn btn-sm btn-outline-secondary" href={`/work-practices/${practice.id}/edit`}>ویرایش</Link><form action={toggleWorkPracticeAction.bind(null, practice.id)}><button className={`btn btn-sm ${practice.active ? "btn-outline-danger" : "btn-outline-success"}`}>{practice.active ? "غیرفعال‌سازی" : "فعال‌سازی"}</button></form></div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : (
        <section className="empty-state card app-card border-0"><div className="card-body p-5 text-center"><h2 className="h5">کتابخانه هنوز خالی است</h2><p className="text-secondary">مولفه‌هایی مانند تحلیل، User Flow، مستندسازی و Prototype را اضافه کنید.</p><Link className="btn btn-primary" href="/work-practices/new">افزودن اولین مولفه</Link></div></section>
      )}
    </AppShell>
  );
}
