import { redirect } from "next/navigation";
import { fa } from "@/i18n/fa";
import { getCurrentUser } from "@/modules/authentication/server/session";
import { LoginForm } from "./login-form";

export const metadata = {
  title: fa.auth.pageTitle,
};

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="auth-page" id="main-content" tabIndex={-1}>
      <div className="container auth-container">
        <div className="row g-0 auth-shell overflow-hidden">
          <section className="col-lg-6 auth-story d-none d-lg-flex" aria-label="معرفی هم‌مسیر">
            <div className="auth-story-content">
              <div className="brand-mark mb-4" aria-hidden="true">
                هـ
              </div>
              <p className="auth-kicker mb-3">{fa.app.name}</p>
              <h2 className="display-6 fw-semibold mb-4">
                عملکردی که می‌شود آن را دید، توضیح داد و بهبود بخشید.
              </h2>
              <p className="auth-story-copy mb-0">
                از توافق ابتدای دوره تا تسک و مستند نهایی؛ همه‌چیز در یک مسیر روشن و قابل ردیابی.
              </p>
            </div>
            <div className="auth-orbit auth-orbit-one" aria-hidden="true" />
            <div className="auth-orbit auth-orbit-two" aria-hidden="true" />
          </section>

          <section className="col-12 col-lg-6 auth-panel">
            <div className="auth-form-wrap">
              <div className="d-flex d-lg-none align-items-center gap-2 mb-5">
                <div className="brand-mark brand-mark-sm" aria-hidden="true">
                  هـ
                </div>
                <span className="fw-bold">{fa.app.name}</span>
              </div>
              <p className="text-primary fw-semibold small mb-2">{fa.app.description}</p>
              <h1 className="h2 fw-bold mb-2">{fa.auth.heading}</h1>
              <p className="text-secondary mb-4">{fa.auth.intro}</p>
              <LoginForm />
              <div className="auth-security mt-4 pt-4 border-top">
                <span className="auth-security-dot" aria-hidden="true" />
                <span>{fa.auth.secureSession}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
