import type { SeasonInput } from "../domain/season-input";
import type { ActivationIssueCode } from "../domain/activation-readiness";

export type SeasonFormState = {
  status: "idle" | "validation-error" | "system-error" | "conflict";
  message?: string;
  fieldErrors?: Partial<Record<keyof SeasonInput, string[]>>;
  values?: Partial<SeasonInput>;
};

export const initialSeasonFormState: SeasonFormState = { status: "idle" };

export type ActivationState = {
  status: "idle" | "not-ready" | "system-error";
  message?: string;
  issues?: ActivationIssueCode[];
};

export const initialActivationState: ActivationState = { status: "idle" };
