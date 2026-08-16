"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { initialTaskFormState, type TaskFormState } from "../application/task-form-state";
import { createTaskAction, updateTaskAction } from "../server/actions";

type Option = { id: string; name: string };
type PracticeOption = Option & { description: string | null; active: boolean };
type EvidenceValue = { type: "FIGMA" | "DOCUMENT" | "JIRA" | "OTHER_URL"; title: string; url: string };

type TaskFormProps = {
  seasonId: string;
  taskId?: string;
  sprints: Array<Option & { status: "PLANNED" | "ACTIVE" | "CLOSED" }>;
  projects: Array<Option & { scope: "AGREED" | "ADDITIONAL" }>;
  practices: PracticeOption[];
  initialValues?: {
    sprintId: string;
    projectId: string;
    externalCode: string;
    title: string;
    description: string;
    assignmentSource: string;
    approvalStatus: string;
    practiceStatuses: Record<string, string>;
    evidence: EvidenceValue[];
  };
};

const assignmentLabels = {
  MANAGER_ASSIGNED: "تخصیص مدیر",
  CUSTOMER_REQUEST: "درخواست مشتری",
  STAKEHOLDER_REQUEST: "درخواست ذی‌نفع",
  SELF_INITIATED: "خودآغاز",
  OTHER: "سایر",
} as const;

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button className="btn btn-primary px-4" disabled={pending}>{pending ? "در حال ذخیره…" : "ذخیره تسک"}</button>;
}

function fieldValue(state: TaskFormState, initial: TaskFormProps["initialValues"], field: "sprintId" | "projectId" | "externalCode" | "title" | "description" | "assignmentSource" | "approvalStatus") {
  return String(state.values?.[field] ?? initial?.[field] ?? "");
}

export function TaskForm({ seasonId, taskId, sprints, projects, practices, initialValues }: TaskFormProps) {
  const action = taskId ? updateTaskAction.bind(null, seasonId, taskId) : createTaskAction.bind(null, seasonId);
  const [state, formAction] = useActionState(action, initialTaskFormState);
  const statePracticeStatuses = new Map(state.values?.practices?.map((practice) => [practice.workPracticeId, practice.status]));
  const blankEvidence: EvidenceValue = { type: "FIGMA", title: "", url: "" };
  const [evidenceRows, setEvidenceRows] = useState<Array<EvidenceValue & { key: number }>>(
    (initialValues?.evidence.length ? initialValues.evidence : [blankEvidence])
      .map((item, index) => ({ ...item, key: index })),
  );
  const [nextEvidenceKey, setNextEvidenceKey] = useState(evidenceRows.length);

  function addEvidence() {
    setEvidenceRows((rows) => [...rows, { key: nextEvidenceKey, type: "OTHER_URL", title: "", url: "" }]);
    setNextEvidenceKey((key) => key + 1);
  }

  return (
    <form action={formAction} className="vstack gap-4" noValidate>
      {state.message ? <div className="alert alert-danger mb-0" role="alert">{state.message}</div> : null}
      <section className="card app-card border-0"><div className="card-body p-4 p-lg-5">
        <h2 className="h5 mb-4">مشخصات تسک</h2>
        <div className="row g-4">
          <div className="col-md-4">
            <label className="form-label fw-semibold" htmlFor="task-code">کد تسک</label>
            <input className="form-control" defaultValue={fieldValue(state, initialValues, "externalCode")} dir="ltr" id="task-code" maxLength={120} name="externalCode" placeholder="CXS-345" />
          </div>
          <div className="col-md-8">
            <label className="form-label fw-semibold" htmlFor="task-title">عنوان</label>
            <input autoFocus className={`form-control ${state.fieldErrors?.title ? "is-invalid" : ""}`} defaultValue={fieldValue(state, initialValues, "title")} id="task-title" maxLength={300} name="title" required />
            {state.fieldErrors?.title ? <div className="invalid-feedback">{state.fieldErrors.title[0]}</div> : null}
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold" htmlFor="task-sprint">اسپرینت</label>
            <select className={`form-select ${state.fieldErrors?.sprintId ? "is-invalid" : ""}`} defaultValue={fieldValue(state, initialValues, "sprintId")} id="task-sprint" name="sprintId" required>
              <option value="">انتخاب اسپرینت</option>
              {sprints.map((sprint) => <option key={sprint.id} value={sprint.id}>{sprint.name}{sprint.status === "ACTIVE" ? " — فعال" : sprint.status === "CLOSED" ? " — بسته" : ""}</option>)}
            </select>
            {state.fieldErrors?.sprintId ? <div className="invalid-feedback">{state.fieldErrors.sprintId[0]}</div> : null}
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold" htmlFor="task-project">پروژه</label>
            <select className={`form-select ${state.fieldErrors?.projectId ? "is-invalid" : ""}`} defaultValue={fieldValue(state, initialValues, "projectId")} id="task-project" name="projectId" required>
              <option value="">انتخاب پروژه</option>
              <optgroup label="پروژه‌های توافق‌شده">{projects.filter((project) => project.scope === "AGREED").map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</optgroup>
              <optgroup label="خارج از توافق">{projects.filter((project) => project.scope === "ADDITIONAL").map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</optgroup>
            </select>
            {state.fieldErrors?.projectId ? <div className="invalid-feedback">{state.fieldErrors.projectId[0]}</div> : <div className="form-text"><Link href={`/seasons/${seasonId}/tasks/projects/new`}>پروژه خارج از توافق جدید</Link></div>}
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold" htmlFor="task-assignment">منبع تخصیص</label>
            <select className="form-select" defaultValue={fieldValue(state, initialValues, "assignmentSource") || "MANAGER_ASSIGNED"} id="task-assignment" name="assignmentSource">
              {Object.entries(assignmentLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold" htmlFor="task-status">وضعیت</label>
            <select className="form-select" defaultValue={fieldValue(state, initialValues, "approvalStatus") || "DRAFT"} id="task-status" name="approvalStatus">
              <option value="DRAFT">پیش‌نویس</option>
              <option value="IN_PROGRESS">در حال انجام</option>
              <option value="FINAL_APPROVED">نهایی / تأییدشده</option>
            </select>
          </div>
          <div className="col-12">
            <label className="form-label fw-semibold" htmlFor="task-description">توضیحات</label>
            <textarea className="form-control" defaultValue={fieldValue(state, initialValues, "description")} id="task-description" maxLength={4000} name="description" rows={4} />
          </div>
        </div>
      </div></section>

      <section className="card app-card border-0"><div className="card-body p-4 p-lg-5">
        <div className="mb-4"><h2 className="h5 mb-1">مولفه‌های کاری</h2><p className="text-secondary small mb-0">فقط مولفه‌های واقعاً مرتبط را مشخص و نتیجه آن‌ها را ثبت کنید.</p></div>
        {practices.length ? <div className="task-practice-grid">
          {practices.map((practice) => {
            const initialStatus = statePracticeStatuses.get(practice.id) ?? initialValues?.practiceStatuses[practice.id] ?? "";
            return <div className="task-practice-row" key={practice.id}><div><strong>{practice.name}</strong>{practice.description ? <small>{practice.description}</small> : null}{!practice.active ? <span className="badge text-bg-secondary">غیرفعال تاریخی</span> : null}</div><select aria-label={`وضعیت ${practice.name}`} className="form-select form-select-sm" defaultValue={initialStatus} name={`practice.${practice.id}`}><option value="">ثبت نشده</option><option value="DONE">انجام شده</option><option value="NOT_DONE">انجام نشده</option><option value="NOT_APPLICABLE">کاربرد ندارد</option></select></div>;
          })}
        </div> : <div className="alert alert-warning">کتابخانه مولفه‌های کاری خالی است. ابتدا یک مولفه ایجاد کنید.</div>}
        {state.fieldErrors?.practices ? <div className="text-danger small mt-3" role="alert">{state.fieldErrors.practices[0]}</div> : null}
      </div></section>

      <section className="card app-card border-0"><div className="card-body p-4 p-lg-5">
        <div className="d-flex justify-content-between gap-3 mb-4"><div><h2 className="h5 mb-1">مستندات</h2><p className="text-secondary small mb-0">لینک Figma، سند، Jira یا هر URL پشتیبان</p></div><button className="btn btn-sm btn-outline-primary align-self-start" onClick={addEvidence} type="button">افزودن لینک</button></div>
        <div className="vstack gap-3">{evidenceRows.map((row, index) => <div className="evidence-row" key={row.key}>
          <select aria-label={`نوع مستند ${index + 1}`} className="form-select" defaultValue={row.type} name="evidenceType"><option value="FIGMA">Figma</option><option value="DOCUMENT">سند</option><option value="JIRA">Jira</option><option value="OTHER_URL">سایر</option></select>
          <input aria-label={`عنوان مستند ${index + 1}`} className="form-control" defaultValue={row.title} maxLength={240} name="evidenceTitle" placeholder="عنوان مستند" />
          <input aria-label={`آدرس مستند ${index + 1}`} className="form-control" defaultValue={row.url} dir="ltr" maxLength={2048} name="evidenceUrl" placeholder="https://…" type="url" />
          <button aria-label={`حذف مستند ${index + 1}`} className="btn btn-outline-danger" onClick={() => setEvidenceRows((rows) => rows.filter((item) => item.key !== row.key))} type="button">×</button>
        </div>)}</div>
        {state.fieldErrors?.evidence ? <div className="text-danger small mt-3" role="alert">{state.fieldErrors.evidence[0]}</div> : null}
      </div></section>

      <div className="d-flex justify-content-end gap-2 pb-4">
        <Link className="btn btn-outline-secondary" href={taskId ? `/seasons/${seasonId}/tasks/${taskId}` : `/seasons/${seasonId}/tasks`}>انصراف</Link>
        <SubmitButton />
      </div>
    </form>
  );
}
