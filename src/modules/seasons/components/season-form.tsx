"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { fa } from "@/i18n/fa";
import {
  initialSeasonFormState,
  type SeasonFormState,
} from "../application/season-form-state";
import { createSeasonAction, updateSeasonAction } from "../server/actions";

type ManagerCandidate = { id: string; name: string; email: string };

type SeasonFormProps = {
  mode: "create" | "edit";
  seasonId?: string;
  initialValues?: {
    name: string;
    startDate: string;
    endDate: string;
    managerId: string;
  };
  managerCandidates: ManagerCandidate[];
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="btn btn-primary px-4" type="submit" disabled={pending}>
      {pending ? (
        <>
          <span className="spinner-border spinner-border-sm ms-2" aria-hidden="true" />
          {fa.seasons.saving}
        </>
      ) : (
        fa.seasons.save
      )}
    </button>
  );
}

function getFieldValue(
  state: SeasonFormState,
  initialValues: SeasonFormProps["initialValues"],
  field: "name" | "startDate" | "endDate" | "managerId",
) {
  return state.values?.[field] ?? initialValues?.[field] ?? "";
}

export function SeasonForm({
  mode,
  seasonId,
  initialValues,
  managerCandidates,
}: SeasonFormProps) {
  const action = mode === "edit" && seasonId
    ? updateSeasonAction.bind(null, seasonId)
    : createSeasonAction;
  const [state, formAction] = useActionState(action, initialSeasonFormState);

  return (
    <form action={formAction} className="card app-card border-0" noValidate>
      <div className="card-body p-4 p-lg-5">
        {state.message ? (
          <div className="alert alert-danger" role="alert" aria-live="polite">
            {state.message}
          </div>
        ) : null}

        <div className="mb-4">
          <label className="form-label fw-semibold" htmlFor="season-name">
            {fa.seasons.name}
          </label>
          <input
            className={`form-control form-control-lg ${state.fieldErrors?.name ? "is-invalid" : ""}`}
            id="season-name"
            name="name"
            type="text"
            maxLength={160}
            defaultValue={getFieldValue(state, initialValues, "name")}
            placeholder={fa.seasons.namePlaceholder}
            required
            autoFocus
          />
          {state.fieldErrors?.name ? (
            <div className="invalid-feedback">{state.fieldErrors.name[0]}</div>
          ) : null}
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <label className="form-label fw-semibold" htmlFor="season-start-date">
              {fa.seasons.startDate}
            </label>
            <input
              className={`form-control ${state.fieldErrors?.startDate ? "is-invalid" : ""}`}
              dir="ltr"
              id="season-start-date"
              name="startDate"
              type="date"
              defaultValue={getFieldValue(state, initialValues, "startDate")}
              required
            />
            {state.fieldErrors?.startDate ? (
              <div className="invalid-feedback">{state.fieldErrors.startDate[0]}</div>
            ) : null}
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold" htmlFor="season-end-date">
              {fa.seasons.endDate}
            </label>
            <input
              className={`form-control ${state.fieldErrors?.endDate ? "is-invalid" : ""}`}
              dir="ltr"
              id="season-end-date"
              name="endDate"
              type="date"
              defaultValue={getFieldValue(state, initialValues, "endDate")}
              required
            />
            {state.fieldErrors?.endDate ? (
              <div className="invalid-feedback">{state.fieldErrors.endDate[0]}</div>
            ) : null}
          </div>
        </div>

        <div className="mb-5">
          <label className="form-label fw-semibold" htmlFor="season-manager">
            {fa.seasons.manager}
          </label>
          <select
            className={`form-select ${state.fieldErrors?.managerId ? "is-invalid" : ""}`}
            id="season-manager"
            name="managerId"
            defaultValue={getFieldValue(state, initialValues, "managerId")}
          >
            <option value="">{fa.seasons.noManager}</option>
            {managerCandidates.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.name} — {manager.email}
              </option>
            ))}
          </select>
          {state.fieldErrors?.managerId ? (
            <div className="invalid-feedback">{state.fieldErrors.managerId[0]}</div>
          ) : (
            <div className="form-text">{fa.seasons.managerHint}</div>
          )}
        </div>

        <div className="d-flex flex-wrap gap-2 justify-content-end">
          {seasonId ? (
            <Link className="btn btn-outline-secondary" href={`/seasons/${seasonId}`}>
              {fa.seasons.cancel}
            </Link>
          ) : (
            <Link className="btn btn-outline-secondary" href="/seasons">
              {fa.seasons.cancel}
            </Link>
          )}
          <SubmitButton />
        </div>
      </div>
    </form>
  );
}
