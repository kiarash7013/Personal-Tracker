"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  initialAgreementFormState,
  type AgreementFormState,
} from "../application/planning-form-state";
import { createAgreementAction, updateAgreementAction } from "../server/actions";

type PracticeOption = { id: string; name: string; description: string | null; active: boolean };

type AgreementFormProps = {
  seasonId: string;
  projectId: string;
  agreementId?: string;
  practices: PracticeOption[];
  initialValues?: {
    title: string;
    description: string;
    agreementType: "CORE" | "BONUS";
    practiceIds: string[];
  };
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button className="btn btn-primary px-4" disabled={pending}>{pending ? "در حال ذخیره…" : "ذخیره توافق"}</button>;
}

function selectedIds(state: AgreementFormState, initialValues: AgreementFormProps["initialValues"]) {
  return new Set(state.values?.practiceIds ?? initialValues?.practiceIds ?? []);
}

export function AgreementForm({
  seasonId,
  projectId,
  agreementId,
  practices,
  initialValues,
}: AgreementFormProps) {
  const action = agreementId
    ? updateAgreementAction.bind(null, seasonId, projectId, agreementId)
    : createAgreementAction.bind(null, seasonId, projectId);
  const [state, formAction] = useActionState(action, initialAgreementFormState);
  const selected = selectedIds(state, initialValues);
  const type = state.values?.agreementType ?? initialValues?.agreementType ?? "CORE";

  return (
    <form action={formAction} className="card app-card border-0" noValidate>
      <div className="card-body p-4 p-lg-5">
        {state.message ? <div className="alert alert-danger" role="alert">{state.message}</div> : null}
        <div className="mb-4">
          <label className="form-label fw-semibold" htmlFor="agreement-title">عنوان توافق</label>
          <input
            autoFocus
            className={`form-control ${state.fieldErrors?.title ? "is-invalid" : ""}`}
            defaultValue={String(state.values?.title ?? initialValues?.title ?? "")}
            id="agreement-title"
            maxLength={240}
            name="title"
            required
          />
          {state.fieldErrors?.title ? <div className="invalid-feedback">{state.fieldErrors.title[0]}</div> : null}
        </div>
        <fieldset className="mb-4">
          <legend className="form-label fw-semibold">نوع توافق</legend>
          <div className="d-flex flex-wrap gap-4">
            <div className="form-check">
              <input className="form-check-input" defaultChecked={type === "CORE"} id="agreement-core" name="agreementType" type="radio" value="CORE" />
              <label className="form-check-label" htmlFor="agreement-core">توافق اصلی</label>
            </div>
            <div className="form-check">
              <input className="form-check-input" defaultChecked={type === "BONUS"} id="agreement-bonus" name="agreementType" type="radio" value="BONUS" />
              <label className="form-check-label" htmlFor="agreement-bonus">توافق امتیازی</label>
            </div>
          </div>
          <p className="form-text mb-0 mt-2">عدم تحقق توافق امتیازی از امتیاز توافق‌های اصلی کم نمی‌کند، اما تحقق آن می‌تواند در ارزیابی فراتر از سطح انتظار مؤثر باشد.</p>
        </fieldset>
        <div className="mb-4">
          <label className="form-label fw-semibold" htmlFor="agreement-description">توضیحات</label>
          <textarea
            className="form-control"
            defaultValue={String(state.values?.description ?? initialValues?.description ?? "")}
            id="agreement-description"
            maxLength={2000}
            name="description"
            rows={4}
          />
        </div>
        <fieldset className="mb-4">
          <legend className="form-label fw-semibold">مولفه‌های کاری مورد انتظار</legend>
          {practices.length ? (
            <div className={`practice-picker ${state.fieldErrors?.practiceIds ? "practice-picker-invalid" : ""}`}>
              {practices.map((practice) => (
                <label className={`practice-option ${practice.active ? "" : "practice-inactive"}`} key={practice.id}>
                  <input
                    className="form-check-input"
                    defaultChecked={selected.has(practice.id)}
                    disabled={!practice.active && !selected.has(practice.id)}
                    name="practiceIds"
                    type="checkbox"
                    value={practice.id}
                  />
                  <span><strong>{practice.name}</strong>{practice.description ? <small>{practice.description}</small> : null}</span>
                  {!practice.active ? <span className="badge text-bg-secondary">غیرفعال</span> : null}
                </label>
              ))}
            </div>
          ) : (
            <div className="alert alert-warning mb-0">ابتدا حداقل یک مولفه کاری در کتابخانه ایجاد کنید.</div>
          )}
          {state.fieldErrors?.practiceIds ? <div className="text-danger small mt-2">{state.fieldErrors.practiceIds[0]}</div> : null}
        </fieldset>
        <div className="d-flex flex-wrap justify-content-between gap-2">
          <Link className="btn btn-outline-primary" href="/work-practices/new">افزودن مولفه جدید</Link>
          <div className="d-flex gap-2">
            <Link className="btn btn-outline-secondary" href={`/seasons/${seasonId}/projects/${projectId}`}>انصراف</Link>
            <SubmitButton />
          </div>
        </div>
      </div>
    </form>
  );
}
