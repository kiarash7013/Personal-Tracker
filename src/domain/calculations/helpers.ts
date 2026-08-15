import { CALCULATION_VERSION, type RatioMetricResult } from "./types";
import { DomainCalculationError } from "./errors";

export const WEIGHT_EPSILON = 0.0001;

export function percentage(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : (numerator / denominator) * 100;
}

export function calculatedRatio(
  numerator: number,
  denominator: number,
  includedEntityIds: readonly string[],
  exclusions: RatioMetricResult["exclusions"],
): RatioMetricResult {
  return {
    status: "CALCULATED",
    value: percentage(numerator, denominator),
    numerator,
    denominator,
    includedEntityIds,
    exclusions,
    calculationVersion: CALCULATION_VERSION,
  };
}

export function noOpportunity(
  exclusions: RatioMetricResult["exclusions"] = [],
): RatioMetricResult {
  return {
    status: "NO_OPPORTUNITY",
    value: null,
    numerator: 0,
    denominator: 0,
    includedEntityIds: [],
    exclusions,
    calculationVersion: CALCULATION_VERSION,
  };
}

export function assertUniqueIds<T>(
  values: readonly T[],
  getId: (value: T) => string,
  entityName: string,
): void {
  const ids = new Set<string>();
  for (const value of values) {
    const id = getId(value);
    if (ids.has(id)) {
      throw new DomainCalculationError(
        "DUPLICATE_INPUT_ID",
        `${entityName} contains duplicate id: ${id}`,
      );
    }
    ids.add(id);
  }
}

export function assertFiniteNumber(value: number, fieldName: string): void {
  if (!Number.isFinite(value)) {
    throw new DomainCalculationError(
      "INVALID_NUMERIC_INPUT",
      `${fieldName} must be a finite number`,
    );
  }
}
