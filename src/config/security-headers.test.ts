import { describe, expect, it } from "vitest";
import { getSecurityHeaders } from "./security-headers";

function asMap(isProduction: boolean) {
  return new Map(getSecurityHeaders(isProduction).map((header) => [header.key, header.value]));
}

describe("security headers", () => {
  it("locks framing, sniffing, browser capabilities, and external resource defaults", () => {
    const headers = asMap(false);

    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Permissions-Policy")).toContain("camera=()");
    expect(headers.get("Content-Security-Policy")).toContain("frame-ancestors 'none'");
    expect(headers.get("Content-Security-Policy")).toContain("object-src 'none'");
  });

  it("adds transport hardening only in production", () => {
    const development = asMap(false);
    const production = asMap(true);

    expect(development.has("Strict-Transport-Security")).toBe(false);
    expect(development.get("Content-Security-Policy")).toContain("'unsafe-eval'");
    expect(production.get("Strict-Transport-Security")).toContain("max-age=63072000");
    expect(production.get("Content-Security-Policy")).not.toContain("'unsafe-eval'");
    expect(production.get("Content-Security-Policy")).toContain("upgrade-insecure-requests");
  });
});
