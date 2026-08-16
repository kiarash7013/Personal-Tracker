"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { initialWorkPracticeFormState } from "../application/planning-form-state";
import { createWorkPracticeAction, updateWorkPracticeAction } from "../server/actions";

type WorkPracticeFormProps = {
  practiceId?: string;
  initialValues?: { name: string; description: string };
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button className="btn btn-primary px-4" disabled={pending}>{pending ? "در حال ذخیره…" : "ذخیره مولفه"}</button>;
}

export function WorkPracticeForm({ practiceId, initialValues }: WorkPracticeFormProps) {
  const action = practiceId ? updateWorkPracticeAction.bind(null, practiceId) : createWorkPracticeAction;
  const [state, formAction] = useActionState(action, initialWorkPracticeFormState);
  return (
    <form action={formAction} className="card app-card border-0" noValidate>
      <div className="card-body p-4 p-lg-5">
        {state.message ? <div className="alert alert-danger" role="alert">{state.message}</div> : null}
        <div className="mb-4">
          <label className="form-label fw-semibold" htmlFor="practice-name">نام مولفه کاری</label>
          <input
            autoFocus
            className={`form-control ${state.fieldErrors?.name ? "is-invalid" : ""}`}
            defaultValue={String(state.values?.name ?? initialValues?.name ?? "")}
            id="practice-name"
            maxLength={160}
            name="name"
            required
          />
          {state.fieldErrors?.name ? <div className="invalid-feedback">{state.fieldErrors.name[0]}</div> : null}
        </div>
        <div className="mb-4">
          <label className="form-label fw-semibold" htmlFor="practice-description">توضیحات</label>
          <textarea
            className="form-control"
            defaultValue={String(state.values?.description ?? initialValues?.description ?? "")}
            id="practice-description"
            maxLength={2000}
            name="description"
            rows={4}
          />
        </div>
        <div className="alert alert-light border small">نام فعلی هنگام اتصال به توافق و تسک Snapshot می‌شود؛ بنابراین تغییر نام، گزارش‌های تاریخی را بازنویسی نمی‌کند.</div>
        <div className="d-flex justify-content-end gap-2">
          <Link className="btn btn-outline-secondary" href="/work-practices">انصراف</Link>
          <SubmitButton />
        </div>
      </div>
    </form>
  );
}
