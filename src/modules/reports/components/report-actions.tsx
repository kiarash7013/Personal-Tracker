"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { initialReportActionState } from "../application/report-action-state";
import { closeSeasonAction, reopenSeasonAction } from "../server/actions";

function Submit({ mode }: { mode: "close" | "reopen" }) { const { pending } = useFormStatus(); return <button className={mode === "close" ? "btn btn-danger" : "btn btn-outline-primary"} disabled={pending}>{pending ? "در حال ثبت…" : mode === "close" ? "بستن دوره و ساخت گزارش قطعی" : "بازگشایی دوره"}</button>; }

export function ReportActions({ seasonId, status }: { seasonId: string; status: "DRAFT" | "ACTIVE" | "CLOSED" }) {
  const action = status === "CLOSED" ? reopenSeasonAction.bind(null, seasonId) : closeSeasonAction.bind(null, seasonId);
  const [state, formAction] = useActionState(action, initialReportActionState);
  if (status === "DRAFT") return null;
  return <form action={formAction}>{state.message ? <div className="alert alert-danger" role="alert">{state.message}</div> : null}<Submit mode={status === "CLOSED" ? "reopen" : "close"} /></form>;
}
