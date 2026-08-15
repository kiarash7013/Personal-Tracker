export type SignInActionState = {
  status: "idle" | "validation-error" | "authentication-error" | "system-error";
  message?: string;
  fieldErrors?: {
    email?: string[];
    password?: string[];
  };
};

export const initialSignInState: SignInActionState = {
  status: "idle",
};
