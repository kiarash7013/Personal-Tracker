"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { initialSettingsFormState, type SettingsFormState } from "../application/settings-form-state";
import { updatePerformanceSettingsAction } from "../server/actions";

type SettingsValues = {
  meetsExpectationsMinCoreAchievement: number;
  minimumAlignedExecution: number;
  bonusRequiredForExceeds: number;
  additionalContributionThreshold: number;
  lowAlignmentThreshold: number;
  strongMetricThreshold: number;
  minimumAdditionalTaskCount: number;
  minimumObservableProjectWeight: number;
  includeSelfInitiatedInAlignment: boolean;
};

const percentFields: Array<{ key: keyof SettingsValues; label: string; hint: string }> = [
  { key: "meetsExpectationsMinCoreAchievement", label: "حداقل تحقق Core برای سطح انتظار", hint: "حداقل Core Achievement" },
  { key: "minimumAlignedExecution", label: "حداقل اجرای هم‌راستا", hint: "شرط پایه Meets/Exceeds" },
  { key: "bonusRequiredForExceeds", label: "حداقل تحقق Bonus برای Exceeds", hint: "پس از برآورده شدن Core" },
  { key: "additionalContributionThreshold", label: "حداقل مشارکت خارج توافق برای Exceeds", hint: "مستقیماً با Core جمع نمی‌شود" },
  { key: "lowAlignmentThreshold", label: "مرز هم‌راستایی محدود", hint: "برای Reason Code در مرحله بعد" },
  { key: "strongMetricThreshold", label: "مرز شاخص قوی", hint: "برای Supporting Reason" },
  { key: "minimumObservableProjectWeight", label: "حداقل وزن فرصت قابل مشاهده", hint: "Context کفایت فرصت" },
];

function SubmitButton() { const { pending } = useFormStatus(); return <button className="btn btn-primary" disabled={pending}>{pending ? "در حال ذخیره…" : "ذخیره نسخه جدید"}</button>; }

function fieldValue(state: SettingsFormState, initial: SettingsValues, key: keyof SettingsValues) {
  return state.values?.[key] ?? initial[key];
}

export function SettingsForm({ seasonId, initialValues }: { seasonId: string; initialValues: SettingsValues }) {
  const [state, action] = useActionState(updatePerformanceSettingsAction.bind(null, seasonId), initialSettingsFormState);
  return <form action={action} className="card app-card border-0" noValidate><div className="card-body p-4 p-lg-5">
    {state.message ? <div className="alert alert-danger">{state.message}</div> : null}
    <div className="row g-4">{percentFields.map((field) => <div className="col-md-6" key={field.key}><label className="form-label fw-semibold" htmlFor={`setting-${field.key}`}>{field.label}</label><div className="input-group" dir="ltr"><input className={`form-control ${state.fieldErrors?.[field.key] ? "is-invalid" : ""}`} defaultValue={String(fieldValue(state, initialValues, field.key))} id={`setting-${field.key}`} max="100" min="0" name={field.key} step="0.1" type="number" /><span className="input-group-text">%</span>{state.fieldErrors?.[field.key] ? <div className="invalid-feedback">{state.fieldErrors[field.key]?.[0]}</div> : null}</div><div className="form-text">{field.hint}</div></div>)}</div>
    <hr className="my-4" />
    <div className="row g-4 align-items-end"><div className="col-md-6"><label className="form-label fw-semibold" htmlFor="setting-min-tasks">حداقل تعداد تسک Additional</label><input className="form-control" defaultValue={String(fieldValue(state, initialValues, "minimumAdditionalTaskCount"))} id="setting-min-tasks" min="1" name="minimumAdditionalTaskCount" type="number" /></div><div className="col-md-6"><div className="form-check form-switch pb-2"><input className="form-check-input" defaultChecked={Boolean(fieldValue(state, initialValues, "includeSelfInitiatedInAlignment"))} id="setting-self" name="includeSelfInitiatedInAlignment" type="checkbox" /><label className="form-check-label fw-semibold" htmlFor="setting-self">محاسبه Self-Initiated در Alignment</label></div></div></div>
    <div className="alert alert-light border small mt-4">ذخیره، نسخه جدیدی با زمان اثر ایجاد می‌کند؛ نسخه‌های قبلی برای Audit و Snapshotهای تاریخی باقی می‌مانند.</div>
    <div className="d-flex justify-content-end gap-2"><Link className="btn btn-outline-secondary" href={`/seasons/${seasonId}`}>انصراف</Link><SubmitButton /></div>
  </div></form>;
}
