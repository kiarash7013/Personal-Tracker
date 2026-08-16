export const seasonCapabilities = [
  "season:view",
  "season:edit-setup",
  "season:manage-projects",
  "season:manage-sprints",
  "season:manage-tasks",
  "season:manage-settings",
  "season:close",
  "season:reopen",
  "season:manager-review",
] as const;

export type SeasonCapability = (typeof seasonCapabilities)[number];
export type SeasonRole = "EMPLOYEE" | "MANAGER";
export type SeasonStatus = "DRAFT" | "ACTIVE" | "CLOSED";

export type SeasonAuthorizationContext = {
  role: SeasonRole | null;
  status: SeasonStatus;
};

const employeeWriteCapabilities = new Set<SeasonCapability>([
  "season:edit-setup",
  "season:manage-projects",
  "season:manage-sprints",
  "season:manage-tasks",
  "season:manage-settings",
  "season:close",
]);

export function can(
  context: SeasonAuthorizationContext,
  capability: SeasonCapability,
) {
  if (!context.role) {
    return false;
  }

  if (capability === "season:view") {
    return true;
  }

  if (capability === "season:manager-review") {
    return false;
  }

  if (context.role === "MANAGER") {
    return false;
  }

  if (capability === "season:reopen") {
    return context.status === "CLOSED";
  }

  return context.status !== "CLOSED" && employeeWriteCapabilities.has(capability);
}
