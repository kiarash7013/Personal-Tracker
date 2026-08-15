import { fa } from "@/i18n/fa";
import { signOutAction } from "@/modules/authentication/server/actions";
import { requireCurrentUser } from "@/modules/authentication/server/session";

export default async function HomePage() {
  const user = await requireCurrentUser();

  return (
    <div className="app-page">
      <header className="app-header border-bottom bg-white">
        <div className="container d-flex align-items-center justify-content-between py-3">
          <div className="d-flex align-items-center gap-3">
            <div className="brand-mark brand-mark-sm" aria-hidden="true">هـ</div>
            <div>
              <strong className="d-block">{fa.app.name}</strong>
              <span className="text-secondary small">{fa.app.description}</span>
            </div>
          </div>
          <form action={signOutAction}>
            <button className="btn btn-outline-secondary btn-sm" type="submit">
              {fa.home.signOut}
            </button>
          </form>
        </div>
      </header>

      <main className="container py-5">
        <section className="dashboard-hero mb-4">
          <p className="text-primary fw-semibold mb-2">
            {fa.home.greeting}، {user.name}
          </p>
          <h1 className="h2 fw-bold mb-3">{fa.home.phaseTitle}</h1>
          <p className="text-secondary dashboard-lead mb-0">{fa.home.phaseDescription}</p>
        </section>

        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <article className="card dashboard-card h-100 border-0">
              <div className="card-body p-4">
                <span className="dashboard-card-index">۰۱</span>
                <h2 className="h5 mt-4">{fa.home.contextualRoleTitle}</h2>
                <p className="text-secondary mb-0">{fa.home.contextualRoleDescription}</p>
              </div>
            </article>
          </div>
          <div className="col-md-6">
            <article className="card dashboard-card h-100 border-0">
              <div className="card-body p-4">
                <span className="dashboard-card-index">۰۲</span>
                <h2 className="h5 mt-4">{fa.home.protectedDataTitle}</h2>
                <p className="text-secondary mb-0">{fa.home.protectedDataDescription}</p>
              </div>
            </article>
          </div>
        </div>

        <section className="next-step-card d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
          <div>
            <span className="small opacity-75">{fa.home.nextTitle}</span>
            <h2 className="h5 mb-0 mt-1">{fa.home.nextDescription}</h2>
          </div>
          <span className="next-step-badge">Phase 6</span>
        </section>
      </main>
    </div>
  );
}
