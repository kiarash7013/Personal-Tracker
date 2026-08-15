import { describe, expect, it } from "vitest";
import {
  createSessionToken,
  SESSION_DURATION_SECONDS,
  verifySessionToken,
} from "./session-token";

const secret = "a-test-secret-that-is-at-least-thirty-two-characters";
const now = 1_800_000_000;

describe("signed session token", () => {
  it("round-trips a minimal user identity", async () => {
    const token = await createSessionToken("user-123", secret, now);

    await expect(verifySessionToken(token, secret, now + 10)).resolves.toEqual({
      userId: "user-123",
      issuedAt: now,
      expiresAt: now + SESSION_DURATION_SECONDS,
    });
  });

  it("rejects a token whose payload was changed", async () => {
    const token = await createSessionToken("user-123", secret, now);
    const [payload, signature] = token.split(".");
    const tamperedPayload = `${payload?.slice(0, -1)}A`;

    await expect(
      verifySessionToken(`${tamperedPayload}.${signature}`, secret, now),
    ).resolves.toBeNull();
  });

  it("rejects a token signed by another secret", async () => {
    const token = await createSessionToken("user-123", secret, now);

    await expect(
      verifySessionToken(
        token,
        "another-test-secret-that-is-at-least-thirty-two-characters",
        now,
      ),
    ).resolves.toBeNull();
  });

  it("rejects an expired token", async () => {
    const token = await createSessionToken("user-123", secret, now);

    await expect(
      verifySessionToken(token, secret, now + SESSION_DURATION_SECONDS),
    ).resolves.toBeNull();
  });

  it.each(["", "invalid", "a.b.c", "%%%.abc"])(
    "handles a malformed token without throwing: %s",
    async (token) => {
      await expect(verifySessionToken(token, secret, now)).resolves.toBeNull();
    },
  );
});
