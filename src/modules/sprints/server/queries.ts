import { getPrisma } from "@/infrastructure/database/prisma";

export async function getSeasonSprints(seasonId: string) {
  return getPrisma().season.findUnique({
    where: { id: seasonId },
    select: {
      id: true,
      name: true,
      status: true,
      employeeId: true,
      startDate: true,
      endDate: true,
      sprints: {
        orderBy: [{ sequenceNumber: "asc" }, { startDate: "asc" }],
        select: {
          id: true,
          name: true,
          sequenceNumber: true,
          startDate: true,
          endDate: true,
          status: true,
          _count: { select: { tasks: true } },
        },
      },
    },
  });
}

export async function getSprintForEdit(seasonId: string, sprintId: string) {
  return getPrisma().sprint.findFirst({
    where: { id: sprintId, seasonId },
    select: { id: true, name: true, sequenceNumber: true, startDate: true, endDate: true, status: true },
  });
}
