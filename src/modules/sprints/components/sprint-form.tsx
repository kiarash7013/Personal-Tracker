"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { initialSprintFormState, type SprintFormState } from "../application/sprint-form-state";
import { createSprintAction, updateSprintAction } from "../server/actions";

type SprintFormProps = {
  seasonId: string;
  sprintId?: string;
  seasonRange: { start: string; end: string };
  initialValues?: {
    name: string;
    sequenceNumber: string;
    startDate: string;
    endDate: string;
    status: "PLANNED" | "ACTIVE" | "CLOSED";
  };
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button className="btn btn-primary px-4" disabled={pending}>{pending ? "در حال ذخیره…" : "ذخیره اسپرینت"}</button>;
}

function valueOf(state: SprintFormState, initial: SprintFormProps["initialValues"], field: keyof NonNullable<SprintFormProps["initialValues"]>) {
  return String(state.values?.[field] ?? initial?.[field] ?? "");
}

export function SprintForm({ seasonId, sprintId, seasonRange, initialValues }: SprintFormProps) {
  const action = sprintId ? updateSprintAction.bind(null, seasonId, sprintId) : createSprintAction.bind(null, seasonId);
  const [state, formAction] = useActionState(action, initialSprintFormState);
  return (
    <form action={formAction} className="card app-card border-0" noValidate>
      <div className="card-body p-4 p-lg-5">
        {state.message ? <div className="alert alert-danger" role="alert">{state.message}</div> : null}
        <div className="row g-4">
          <div className="col-md-8">
            <label className="form-label fw-semibold" htmlFor="sprint-name">نام اسپرینت</label>
            <input autoFocus className={`form-control ${state.fieldErrors?.name ? "is-invalid" : ""}`} defaultValue={valueOf(state, initialValues, "name")} id="sprint-name" maxLength={120} name="name" required />
            {state.fieldErrors?.name ? <div className="invalid-feedback">{state.fieldErrors.name[0]}</div> : null}
          </div>
          <div className="col-md-4">
            <label className="form-label fw-semibold" htmlFor="sprint-sequence">شماره ترتیب</label>
            <input className={`form-control ${state.fieldErrors?.sequenceNumber ? "is-invalid" : ""}`} defaultValue={valueOf(state, initialValues, "sequenceNumber")} id="sprint-sequence" min="1" name="sequenceNumber" required type="number" />
            {state.fieldErrors?.sequenceNumber ? <div className="invalid-feedback">{state.fieldErrors.sequenceNumber[0]}</div> : null}
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold" htmlFor="sprint-start">تاریخ شروع</label>
            <input className={`form-control ${state.fieldErrors?.startDate ? "is-invalid" : ""}`} defaultValue={valueOf(state, initialValues, "startDate")} dir="ltr" id="sprint-start" max={seasonRange.end} min={seasonRange.start} name="startDate" required type="date" />
            {state.fieldErrors?.startDate ? <div className="invalid-feedback">{state.fieldErrors.startDate[0]}</div> : null}
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold" htmlFor="sprint-end">تاریخ پایان</label>
            <input className={`form-control ${state.fieldErrors?.endDate ? "is-invalid" : ""}`} defaultValue={valueOf(state, initialValues, "endDate")} dir="ltr" id="sprint-end" max={seasonRange.end} min={seasonRange.start} name="endDate" required type="date" />
            {state.fieldErrors?.endDate ? <div className="invalid-feedback">{state.fieldErrors.endDate[0]}</div> : null}
          </div>
          <div className="col-12">
            <label className="form-label fw-semibold" htmlFor="sprint-status">وضعیت</label>
            <select className="form-select" defaultValue={valueOf(state, initialValues, "status") || "PLANNED"} id="sprint-status" name="status">
              <option value="PLANNED">برنامه‌ریزی‌شده</option>
              <option value="ACTIVE">فعال</option>
              <option value="CLOSED">بسته‌شده</option>
            </select>
            <div className="form-text">در هر دوره فقط یک اسپرینت می‌تواند فعال باشد.</div>
          </div>
        </div>
        <div className="d-flex justify-content-end gap-2 mt-5">
          <Link className="btn btn-outline-secondary" href={`/seasons/${seasonId}/sprints`}>انصراف</Link>
          <SubmitButton />
        </div>
      </div>
    </form>
  );
}
