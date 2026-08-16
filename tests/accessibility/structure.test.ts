import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("accessibility and RTL structure", () => {
  it("declares Persian RTL and exposes a skip link", () => {
    const layout = source("src/app/layout.tsx");

    expect(layout).toContain('<html lang="fa" dir="rtl">');
    expect(layout).toContain('bootstrap/dist/css/bootstrap.rtl.min.css');
    expect(layout).toContain('href="#main-content"');
  });

  it("gives authenticated and login content a focusable main landmark", () => {
    const shell = source("src/components/app-shell.tsx");
    const login = source("src/app/login/page.tsx");

    expect(shell).toContain('id="main-content"');
    expect(shell).toContain("tabIndex={-1}");
    expect(shell).toContain("aria-current=");
    expect(login).toContain('id="main-content"');
    expect(login).toContain('<h1 className="h2 fw-bold mb-2">');
  });

  it("keeps the trend chart named and backed by a data table", () => {
    const chart = source("src/components/charts/multi-line-chart.tsx");
    const trend = source("src/modules/dashboard/components/sprint-trend.tsx");

    expect(chart).toContain('role="img"');
    expect(chart).toContain("<title");
    expect(chart).toContain("<desc");
    expect(trend).toContain("جدول داده نمودار");
    expect(trend).toContain('scope="row"');
    expect(trend).toContain('scope="col"');
  });

  it("retains keyboard, mobile, and reduced-motion safeguards", () => {
    const styles = source("src/app/styles.css");

    expect(styles).toContain(":focus-visible");
    expect(styles).toContain(".skip-link:focus-visible");
    expect(styles).toContain("@media (max-width: 575.98px)");
    expect(styles).toContain(".task-practice-row,\n  .evidence-row");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
  });
});
