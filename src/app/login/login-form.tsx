"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { fa } from "@/i18n/fa";
import { initialSignInState } from "@/modules/authentication/application/login-state";
import { signInAction } from "@/modules/authentication/server/actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="btn btn-primary auth-submit w-100" type="submit" disabled={pending}>
      {pending ? (
        <>
          <span className="spinner-border spinner-border-sm ms-2" aria-hidden="true" />
          {fa.auth.submitting}
        </>
      ) : (
        fa.auth.submit
      )}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(signInAction, initialSignInState);

  return (
    <form action={formAction} noValidate>
      {state.message ? (
        <div className="alert alert-danger py-2" role="alert" aria-live="polite">
          {state.message}
        </div>
      ) : null}

      <div className="mb-3">
        <label className="form-label" htmlFor="email">
          {fa.auth.emailLabel}
        </label>
        <input
          className={`form-control auth-input ${state.fieldErrors?.email ? "is-invalid" : ""}`}
          dir="ltr"
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={fa.auth.emailPlaceholder}
          aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
          required
          autoFocus
        />
        {state.fieldErrors?.email ? (
          <div className="invalid-feedback" id="email-error">
            {state.fieldErrors.email[0]}
          </div>
        ) : null}
      </div>

      <div className="mb-4">
        <label className="form-label" htmlFor="password">
          {fa.auth.passwordLabel}
        </label>
        <input
          className={`form-control auth-input ${state.fieldErrors?.password ? "is-invalid" : ""}`}
          dir="ltr"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder={fa.auth.passwordPlaceholder}
          aria-describedby={state.fieldErrors?.password ? "password-error" : undefined}
          required
        />
        {state.fieldErrors?.password ? (
          <div className="invalid-feedback" id="password-error">
            {state.fieldErrors.password[0]}
          </div>
        ) : null}
      </div>

      <SubmitButton />
    </form>
  );
}
