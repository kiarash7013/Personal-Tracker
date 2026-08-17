import { getPrisma } from "@/infrastructure/database/prisma";
import { getAuthSecret } from "@/modules/authentication/config";

export const dynamic = "force-dynamic";

const responseHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

export async function GET() {
  try {
    getAuthSecret();
    await getPrisma().$queryRaw`SELECT 1`;

    return Response.json(
      {
        status: "ready",
        dependencies: {
          authentication: "ok",
          database: "ok",
        },
      },
      { headers: responseHeaders },
    );
  } catch (error) {
    console.error("Production readiness check failed.", {
      errorType: error instanceof Error ? error.name : "UnknownError",
    });

    return Response.json(
      { status: "not_ready" },
      {
        status: 503,
        headers: responseHeaders,
      },
    );
  }
}
