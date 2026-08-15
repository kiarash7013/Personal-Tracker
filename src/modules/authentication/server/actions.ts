"use server";

import { redirect } from "next/navigation";
import { fa } from "@/i18n/fa";
import { getPrisma } from "@/infrastructure/database/prisma";
import { authenticateUser } from "../application/authenticate-user";
import type { SignInActionState } from "../application/login-state";
import { signInSchema } from "../domain/credentials";
import { verifyPassword } from "../infrastructure/password";
import { clearSessionCookie, setSessionCookie } from "./session";

export async function signInAction(
  _previousState: SignInActionState,
  formData: FormData,
): Promise<SignInActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;

    return {
      status: "validation-error",
      fieldErrors: {
        email: errors.email,
        password: errors.password,
      },
    };
  }

  let user;

  try {
    user = await authenticateUser(parsed.data, {
      findUserByEmail: (email) =>
        getPrisma().user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            active: true,
            passwordHash: true,
          },
        }),
      verifyPassword,
    });
  } catch (error) {
    console.error("Sign-in failed because the authentication service is unavailable.", error);
    return {
      status: "system-error",
      message: fa.auth.unavailable,
    };
  }

  if (!user) {
    return {
      status: "authentication-error",
      message: fa.auth.invalidCredentials,
    };
  }

  await setSessionCookie(user.id);
  redirect("/");
}

export async function signOutAction() {
  await clearSessionCookie();
  redirect("/login");
}
