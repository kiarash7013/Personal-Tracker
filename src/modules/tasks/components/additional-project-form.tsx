"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { initialAdditionalProjectFormState } from "../application/task-form-state";
import { createAdditionalProjectAction } from "../server/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button className="btn btn-primary" disabled={pending}>{pending ? "در حال ذخیره…" : "ایجاد پروژه"}</button>;
}

export function AdditionalProjectForm({ seasonId }: { seasonId: string }) {
  const [state, action] = useActionState(createAdditionalProjectAction.bind(null, seasonId), initialAdditionalProjectFormState);
  return <form action={action} className="card app-card border-0" noValidate><div className="card-body p-4 p-lg-5">
    {state.message ? <div className="alert alert-danger">{state.message}</div> : null}
    <div className="mb-4"><label className="form-label fw-semibold" htmlFor="additional-name">نام پروژه</label><input autoFocus className={`form-control ${state.fieldErrors?.name ? "is-invalid" : ""}`} defaultValue={state.values?.name ?? ""} id="additional-name" maxLength={160} name="name" required />{state.fieldErrors?.name ? <div className="invalid-feedback">{state.fieldErrors.name[0]}</div> : null}</div>
    <div className="mb-4"><label className="form-label fw-semibold" htmlFor="additional-description">توضیحات</label><textarea className="form-control" defaultValue={state.values?.description ?? ""} id="additional-description" maxLength={2000} name="description" rows={4} /></div>
    <div className="alert alert-info small">این پروژه وزن رسمی ندارد، Core Achievement را تغییر نمی‌دهد و در «مشارکت خارج از توافق» گزارش می‌شود.</div>
    <div className="d-flex justify-content-end gap-2"><Link className="btn btn-outline-secondary" href={`/seasons/${seasonId}/tasks/new`}>انصراف</Link><SubmitButton /></div>
  </div></form>;
}
