export const SESSION_COOKIE_NAME = "personal_tracker_session";

const DEVELOPMENT_AUTH_SECRET =
  "personal-tracker-local-development-secret-only";

export function getAuthSecret() {
  const configuredSecret = process.env.AUTH_SECRET;

  if (configuredSecret) {
    if (configuredSecret.length < 32) {
      throw new Error("AUTH_SECRET must contain at least 32 characters.");
    }

    return configuredSecret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required in production.");
  }

  return DEVELOPMENT_AUTH_SECRET;
}
