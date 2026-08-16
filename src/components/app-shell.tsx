import Link from "next/link";
import { fa } from "@/i18n/fa";
import type { CurrentUser } from "@/modules/authentication/server/session";
import { signOutAction } from "@/modules/authentication/server/actions";

type AppShellProps = {
  user: CurrentUser;
  activeNavigation?: "dashboard" | "seasons" | "practices";
  children: React.ReactNode;
};

export function AppShell({ user, activeNavigation, children }: AppShellProps) {
  return (
    <div className="app-page">
      <header className="app-header border-bottom bg-white sticky-top">
        <div className="container d-flex flex-wrap align-items-center justify-content-between gap-3 py-3">
          <div className="d-flex align-items-center gap-3">
            <div className="brand-mark brand-mark-sm" aria-hidden="true">هـ</div>
            <div>
              <strong className="d-block">{fa.app.name}</strong>
              <span className="text-secondary small d-none d-sm-inline">{fa.app.description}</span>
            </div>
          </div>

          <nav className="app-navigation" aria-label="ناوبری اصلی">
            <Link
              aria-current={activeNavigation === "dashboard" ? "page" : undefined}
              className={`app-navigation-link ${activeNavigation === "dashboard" ? "active" : ""}`}
              href="/"
            >
              {fa.navigation.dashboard}
            </Link>
            <Link
              aria-current={activeNavigation === "seasons" ? "page" : undefined}
              className={`app-navigation-link ${activeNavigation === "seasons" ? "active" : ""}`}
              href="/seasons"
            >
              {fa.navigation.seasons}
            </Link>
            <Link
              aria-current={activeNavigation === "practices" ? "page" : undefined}
              className={`app-navigation-link ${activeNavigation === "practices" ? "active" : ""}`}
              href="/work-practices"
            >
              {fa.navigation.practices}
            </Link>
          </nav>

          <div className="d-flex align-items-center gap-3">
            <div className="text-start d-none d-md-block">
              <strong className="d-block small">{user.name}</strong>
              <span className="text-secondary app-user-email" dir="ltr">{user.email}</span>
            </div>
            <form action={signOutAction}>
              <button className="btn btn-outline-secondary btn-sm" type="submit">
                {fa.home.signOut}
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="container py-4 py-lg-5" id="main-content" tabIndex={-1}>{children}</main>
    </div>
  );
}
