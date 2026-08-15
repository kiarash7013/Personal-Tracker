import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPrisma } from "@/infrastructure/database/prisma";
import { getAuthSecret, SESSION_COOKIE_NAME } from "../config";
import {
  createSessionToken,
  SESSION_DURATION_SECONDS,
  verifySessionToken,
} from "../domain/session-token";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  locale: string;
};

export async function setSessionCookie(userId: string) {
  const token = await createSessionToken(userId, getAuthSecret());
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const identity = await verifySessionToken(token, getAuthSecret());

  if (!identity) {
    return null;
  }

  const user = await getPrisma().user.findUnique({
    where: { id: identity.userId },
    select: {
      id: true,
      email: true,
      name: true,
      locale: true,
      active: true,
    },
  });

  if (!user?.active) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    locale: user.locale,
  };
});

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
