import { assertFiniteNumber, assertUniqueIds, WEIGHT_EPSILON } from "./helpers";
import type { ProjectInput } from "./types";

export type ProjectWeightValidationErrorCode =
  | "NO_AGREED_PROJECTS"
  | "MISSING_WEIGHT"
  | "UNEXPECTED_ADDITIONAL_WEIGHT"
  | "WEIGHT_OUT_OF_RANGE"
  | "TOTAL_NOT_100";

export interface ProjectWeightValidationError {
  readonly code: ProjectWeightValidationErrorCode;
  readonly projectId?: string;
  readonly actual?: number;
}

export interface ProjectWeightValidationResult {
  readonly valid: boolean;
  readonly totalWeight: number;
  readonly errors: readonly ProjectWeightValidationError[];
}

export function validateProjectWeights(
  projects: readonly ProjectInput[],
): ProjectWeightValidationResult {
  assertUniqueIds(projects, (project) => project.id, "projects");

  const agreedProjects = projects.filter((project) => project.scope === "AGREED");
  const errors: ProjectWeightValidationError[] = [];

  if (agreedProjects.length === 0) {
    errors.push({ code: "NO_AGREED_PROJECTS" });
  }

  for (const project of projects) {
    if (project.scope === "ADDITIONAL" && project.weight !== null) {
      errors.push({ code: "UNEXPECTED_ADDITIONAL_WEIGHT", projectId: project.id });
    }

    if (project.scope === "AGREED" && project.weight === null) {
      errors.push({ code: "MISSING_WEIGHT", projectId: project.id });
      continue;
    }

    if (project.weight !== null) {
      assertFiniteNumber(project.weight, `project(${project.id}).weight`);
      if (project.weight <= 0 || project.weight > 100) {
        errors.push({
          code: "WEIGHT_OUT_OF_RANGE",
          projectId: project.id,
          actual: project.weight,
        });
      }
    }
  }

  const totalWeight = agreedProjects.reduce(
    (total, project) => total + (project.weight ?? 0),
    0,
  );

  if (agreedProjects.length > 0 && Math.abs(totalWeight - 100) > WEIGHT_EPSILON) {
    errors.push({ code: "TOTAL_NOT_100", actual: totalWeight });
  }

  return {
    valid: errors.length === 0,
    totalWeight,
    errors,
  };
}
