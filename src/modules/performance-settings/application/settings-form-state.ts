import type { PerformanceSettingsInput } from "../domain/performance-settings";

export type SettingsFormState = {
  status: "idle" | "validation-error" | "system-error";
  message?: string;
  fieldErrors?: Partial<Record<keyof PerformanceSettingsInput, string[]>>;
  values?: PerformanceSettingsInput;
};

export const initialSettingsFormState: SettingsFormState = { status: "idle" };
