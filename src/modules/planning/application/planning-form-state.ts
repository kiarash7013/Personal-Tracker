import type { AgreementInput, ProjectInput, WorkPracticeInput } from "../domain/planning-input";

type FormStatus = "idle" | "validation-error" | "conflict" | "system-error";

export type ProjectFormState = {
  status: FormStatus;
  message?: string;
  fieldErrors?: Partial<Record<keyof ProjectInput, string[]>>;
  values?: ProjectInput;
};

export type AgreementFormState = {
  status: FormStatus;
  message?: string;
  fieldErrors?: Partial<Record<keyof AgreementInput, string[]>>;
  values?: AgreementInput;
};

export type WorkPracticeFormState = {
  status: FormStatus;
  message?: string;
  fieldErrors?: Partial<Record<keyof WorkPracticeInput, string[]>>;
  values?: WorkPracticeInput;
};

export const initialProjectFormState: ProjectFormState = { status: "idle" };
export const initialAgreementFormState: AgreementFormState = { status: "idle" };
export const initialWorkPracticeFormState: WorkPracticeFormState = { status: "idle" };
