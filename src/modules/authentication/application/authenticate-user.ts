import { signInSchema, type SignInInput } from "../domain/credentials";

const DUMMY_PASSWORD_HASH =
  "scrypt$16384$8$1$cGVyc29uYWwtdHJhY2tlci1hdXRoLWR1bW15LXNhbHQ$5GzW-yI5L0UKJC4o9ImNfkbeVjkYrJ8xGqrlvHmO0nJAYXtmAzHMoR679UmsJ4yJn8QM7cwuuMu-_xOqNCXrVA";

export type AuthenticationUserRecord = {
  id: string;
  email: string;
  name: string;
  active: boolean;
  passwordHash: string | null;
};

export type AuthenticatedUser = Pick<AuthenticationUserRecord, "id" | "email" | "name">;

export type AuthenticationDependencies = {
  findUserByEmail: (email: string) => Promise<AuthenticationUserRecord | null>;
  verifyPassword: (password: string, encodedHash: string) => Promise<boolean>;
};

export async function authenticateUser(
  input: SignInInput,
  dependencies: AuthenticationDependencies,
): Promise<AuthenticatedUser | null> {
  const parsed = signInSchema.safeParse(input);

  if (!parsed.success) {
    return null;
  }

  const user = await dependencies.findUserByEmail(parsed.data.email);
  const hashToVerify = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
  const passwordIsValid = await dependencies.verifyPassword(
    parsed.data.password,
    hashToVerify,
  );

  if (!user || !user.active || !user.passwordHash || !passwordIsValid) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}
