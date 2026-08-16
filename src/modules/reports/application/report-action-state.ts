export type ReportActionState = {
  status: "idle" | "conflict" | "system-error";
  message?: string;
};

export const initialReportActionState: ReportActionState = { status: "idle" };
