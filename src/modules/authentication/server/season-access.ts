import { getPrisma } from "@/infrastructure/database/prisma";
import {
  can,
  type SeasonAuthorizationContext,
  type SeasonCapability,
} from "../domain/authorization";
import { requireCurrentUser } from "./session";

export class AuthorizationError extends Error {
  constructor() {
    super("The current user is not authorized for this season operation.");
    this.name = "AuthorizationError";
  }
}

export async function getSeasonAuthorizationContext(
  userId: string,
  seasonId: string,
): Promise<SeasonAuthorizationContext | null> {
  const season = await getPrisma().season.findUnique({
    where: { id: seasonId },
    select: {
      employeeId: true,
      status: true,
      members: {
        where: { userId },
        select: { role: true },
        take: 1,
      },
    },
  });

  if (!season) {
    return null;
  }

  const role =
    season.employeeId === userId ? "EMPLOYEE" : (season.members[0]?.role ?? null);

  return {
    role,
    status: season.status,
  };
}

export async function requireSeasonCapability(
  seasonId: string,
  capability: SeasonCapability,
) {
  const user = await requireCurrentUser();
  const context = await getSeasonAuthorizationContext(user.id, seasonId);

  if (!context || !can(context, capability)) {
    throw new AuthorizationError();
  }

  return { user, context };
}
