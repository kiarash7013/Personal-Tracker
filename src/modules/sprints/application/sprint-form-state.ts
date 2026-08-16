import type { SprintInput } from "../domain/sprint-input";

export type SprintFormState = {
  status: "idle" | "validation-error" | "conflict" | "system-error";
  message?: string;
  fieldErrors?: Partial<Record<keyof SprintInput, string[]>>;
  values?: SprintInput;
};

export const initialSprintFormState: SprintFormState = { status: "idle" };
