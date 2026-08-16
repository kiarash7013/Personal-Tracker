"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { fa } from "@/i18n/fa";
import { formatPercent } from "@/presentation/formatters";
import {
  initialActivationState,
} from "../application/season-form-state";
import type { ActivationIssueCode } from "../domain/activation-readiness";
import { activateSeasonAction } from "../server/actions";

const issueLabels: Record<ActivationIssueCode, string> = {
  NO_AGREED_PROJECTS: "حداقل یک پروژه توافق‌شده ثبت شود.",
  PROJECT_WEIGHT_TOTAL: "مجموع وزن پروژه‌های توافق‌شده دقیقاً ۱۰۰٪ باشد.",
  PROJECT_WITHOUT_CORE_AGREEMENT: "هر پروژه حداقل یک توافق اصلی داشته باشد.",
  CORE_AGREEMENT_WITHOUT_PRACTICE: "هر توافق اصلی حداقل به یک مولفه کاری متصل باشد.",
};

type ActivationPanelProps = {
  seasonId: string;
  ready: boolean;
  issues: ActivationIssueCode[];
  totalWeight: number;
};

function ActivateButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button className="btn btn-primary" type="submit" disabled={disabled || pending}>
      {pending ? fa.seasons.activating : fa.seasons.activate}
    </button>
  );
}

export function ActivationPanel({
  seasonId,
  ready,
  issues,
  totalWeight,
}: ActivationPanelProps) {
  const action = activateSeasonAction.bind(null, seasonId);
  const [state, formAction] = useActionState(action, initialActivationState);
  const visibleIssues = state.issues ?? issues;

  return (
    <section className={`card app-card border-0 ${ready ? "activation-ready" : ""}`}>
      <div className="card-body p-4">
        <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3">
          <div>
            <h2 className="h5 mb-2">{fa.seasons.setupChecklist}</h2>
            <p className="text-secondary mb-0">
              مجموع وزن فعلی: <strong>{formatPercent(totalWeight)}</strong>
            </p>
          </div>
          <span className={`status-pill ${ready ? "status-active" : "status-draft"}`}>
            {ready ? "آماده" : "نیازمند تکمیل"}
          </span>
        </div>

        {state.message ? (
          <div className="alert alert-danger" role="alert" aria-live="polite">
            {state.message}
          </div>
        ) : null}

        {ready ? (
          <p className="text-success-emphasis mb-4">{fa.seasons.ready}</p>
        ) : (
          <div className="mb-4">
            <p className="mb-2">{fa.seasons.notReady}</p>
            <ul className="setup-checklist mb-0">
              {visibleIssues.map((issue) => <li key={issue}>{issueLabels[issue]}</li>)}
            </ul>
          </div>
        )}

        <form action={formAction}>
          <ActivateButton disabled={!ready} />
        </form>
      </div>
    </section>
  );
}
