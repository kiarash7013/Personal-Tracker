import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("verifies the original password and rejects another one", async () => {
    const hash = await hashPassword("A-strong-test-password-42!");

    await expect(verifyPassword("A-strong-test-password-42!", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("uses a unique random salt", async () => {
    const firstHash = await hashPassword("same-password");
    const secondHash = await hashPassword("same-password");

    expect(firstHash).not.toBe(secondHash);
  });

  it.each([
    "",
    "sha256$abc",
    "scrypt$1$8$1$c2FsdA$aGFzaA",
    "scrypt$16384$8$1$not-base64!$also-invalid!",
  ])("rejects malformed or unsupported hashes", async (hash) => {
    await expect(verifyPassword("password", hash)).resolves.toBe(false);
  });
});
