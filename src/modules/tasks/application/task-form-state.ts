import type { TaskInput } from "../domain/task-input";

export type TaskFormState = {
  status: "idle" | "validation-error" | "conflict" | "system-error";
  message?: string;
  fieldErrors?: Partial<Record<keyof TaskInput, string[]>>;
  values?: TaskInput;
};

export const initialTaskFormState: TaskFormState = { status: "idle" };

export type AdditionalProjectFormState = {
  status: "idle" | "validation-error" | "conflict" | "system-error";
  message?: string;
  fieldErrors?: { name?: string[]; description?: string[] };
  values?: { name: string; description: string };
};

export const initialAdditionalProjectFormState: AdditionalProjectFormState = { status: "idle" };
