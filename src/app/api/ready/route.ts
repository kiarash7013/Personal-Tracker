import { getPrisma } from "@/infrastructure/database/prisma";
import { getAuthSecret } from "@/modules/authentication/config";

export const dynamic = "force-dynamic";

const responseHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

export async function GET() {
  try {
    getAuthSecret();
  } catch (error) {
    console.error("Production readiness check failed.", {
      dependency: "authentication",
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

  try {
    await getPrisma().$queryRaw`SELECT 1`;
  } catch (error) {
    console.error("Production readiness check failed.", {
      dependency: "database",
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
}
