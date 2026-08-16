"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  initialProjectFormState,
  type ProjectFormState,
} from "../application/planning-form-state";
import { createProjectAction, updateProjectAction } from "../server/actions";

type ProjectFormProps = {
  seasonId: string;
  projectId?: string;
  initialValues?: { name: string; description: string; weight: string };
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary px-4" disabled={pending} type="submit">
      {pending ? "در حال ذخیره…" : "ذخیره پروژه"}
    </button>
  );
}

function valueOf(
  state: ProjectFormState,
  initialValues: ProjectFormProps["initialValues"],
  field: "name" | "description" | "weight",
) {
  return String(state.values?.[field] ?? initialValues?.[field] ?? "");
}

export function ProjectForm({ seasonId, projectId, initialValues }: ProjectFormProps) {
  const action = projectId
    ? updateProjectAction.bind(null, seasonId, projectId)
    : createProjectAction.bind(null, seasonId);
  const [state, formAction] = useActionState(action, initialProjectFormState);

  return (
    <form action={formAction} className="card app-card border-0" noValidate>
      <div className="card-body p-4 p-lg-5">
        {state.message ? <div className="alert alert-danger" role="alert">{state.message}</div> : null}
        <div className="row g-4">
          <div className="col-md-8">
            <label className="form-label fw-semibold" htmlFor="project-name">نام پروژه</label>
            <input
              autoFocus
              className={`form-control ${state.fieldErrors?.name ? "is-invalid" : ""}`}
              defaultValue={valueOf(state, initialValues, "name")}
              id="project-name"
              maxLength={160}
              name="name"
              required
            />
            {state.fieldErrors?.name ? <div className="invalid-feedback">{state.fieldErrors.name[0]}</div> : null}
          </div>
          <div className="col-md-4">
            <label className="form-label fw-semibold" htmlFor="project-weight">وزن رسمی پروژه</label>
            <div className="input-group" dir="ltr">
              <input
                className={`form-control ${state.fieldErrors?.weight ? "is-invalid" : ""}`}
                defaultValue={valueOf(state, initialValues, "weight")}
                id="project-weight"
                max="100"
                min="0.01"
                name="weight"
                required
                step="0.01"
                type="number"
              />
              <span className="input-group-text">%</span>
              {state.fieldErrors?.weight ? <div className="invalid-feedback">{state.fieldErrors.weight[0]}</div> : null}
            </div>
          </div>
          <div className="col-12">
            <label className="form-label fw-semibold" htmlFor="project-description">توضیحات</label>
            <textarea
              className={`form-control ${state.fieldErrors?.description ? "is-invalid" : ""}`}
              defaultValue={valueOf(state, initialValues, "description")}
              id="project-description"
              maxLength={2000}
              name="description"
              rows={4}
            />
            {state.fieldErrors?.description ? <div className="invalid-feedback">{state.fieldErrors.description[0]}</div> : null}
          </div>
        </div>
        <p className="form-text mt-3 mb-4">مجموع وزن پروژه‌های توافق‌شده پیش از فعال‌سازی باید دقیقاً ۱۰۰٪ باشد.</p>
        <div className="d-flex justify-content-end gap-2">
          {projectId ? (
            <Link className="btn btn-outline-secondary" href={`/seasons/${seasonId}/projects/${projectId}`}>انصراف</Link>
          ) : (
            <Link className="btn btn-outline-secondary" href={`/seasons/${seasonId}/projects`}>انصراف</Link>
          )}
          <SubmitButton />
        </div>
      </div>
    </form>
  );
}
