import { describe, expect, it, vi } from "vitest";
import { authenticateUser, type AuthenticationUserRecord } from "./authenticate-user";

const activeUser: AuthenticationUserRecord = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "employee@example.test",
  name: "کارمند تست",
  active: true,
  passwordHash: "encoded-password-hash",
};

describe("authenticateUser", () => {
  it("normalizes email and returns only the safe user fields", async () => {
    const findUserByEmail = vi.fn().mockResolvedValue(activeUser);
    const verifyPassword = vi.fn().mockResolvedValue(true);

    await expect(
      authenticateUser(
        { email: "  EMPLOYEE@example.test ", password: "correct-password" },
        { findUserByEmail, verifyPassword },
      ),
    ).resolves.toEqual({
      id: activeUser.id,
      email: activeUser.email,
      name: activeUser.name,
    });
    expect(findUserByEmail).toHaveBeenCalledWith("employee@example.test");
    expect(verifyPassword).toHaveBeenCalledWith(
      "correct-password",
      activeUser.passwordHash,
    );
  });

  it("returns null for a wrong password", async () => {
    await expect(
      authenticateUser(
        { email: activeUser.email, password: "wrong-password" },
        {
          findUserByEmail: vi.fn().mockResolvedValue(activeUser),
          verifyPassword: vi.fn().mockResolvedValue(false),
        },
      ),
    ).resolves.toBeNull();
  });

  it("does not allow an inactive user to sign in", async () => {
    await expect(
      authenticateUser(
        { email: activeUser.email, password: "correct-password" },
        {
          findUserByEmail: vi.fn().mockResolvedValue({ ...activeUser, active: false }),
          verifyPassword: vi.fn().mockResolvedValue(true),
        },
      ),
    ).resolves.toBeNull();
  });

  it("still performs a dummy verification for an unknown email", async () => {
    const verifyPassword = vi.fn().mockResolvedValue(false);

    await expect(
      authenticateUser(
        { email: "unknown@example.test", password: "some-password" },
        {
          findUserByEmail: vi.fn().mockResolvedValue(null),
          verifyPassword,
        },
      ),
    ).resolves.toBeNull();
    expect(verifyPassword).toHaveBeenCalledOnce();
    expect(verifyPassword.mock.calls[0]?.[1]).toMatch(/^scrypt\$/u);
  });

  it("rejects malformed credentials before querying a repository", async () => {
    const findUserByEmail = vi.fn();

    await expect(
      authenticateUser(
        { email: "not-an-email", password: "" },
        { findUserByEmail, verifyPassword: vi.fn() },
      ),
    ).resolves.toBeNull();
    expect(findUserByEmail).not.toHaveBeenCalled();
  });
});
