import type { PerformanceReasonCode } from "@/domain/calculations";
import { getPersianPerformanceReason } from "@/i18n/performance-reasons.fa";

type PerformanceReasonsProps = {
  primaryReason: PerformanceReasonCode;
  supportingReasons: PerformanceReasonCode[];
  metrics: {
    workAlignment: number | null;
    alignedExecution: number | null;
    bonusAchievement: number | null;
    additionalContribution: number | null;
    coreOpportunityCoverage: number;
  };
};

export function PerformanceReasons({ primaryReason, supportingReasons, metrics }: PerformanceReasonsProps) {
  const primary = getPersianPerformanceReason(primaryReason, metrics);
  return <section className="card app-card border-0 reason-section"><div className="card-body p-4">
    <span className="eyebrow">دلیل این سطح عملکرد</span>
    <h2 className="h5 mt-2 mb-2">{primary.title}</h2>
    <p className="text-secondary mb-0">{primary.description}</p>
    {supportingReasons.length ? <div className="supporting-reasons mt-4">{supportingReasons.map((code) => { const reason = getPersianPerformanceReason(code, metrics); return <div key={code}><strong>{reason.title}</strong><p>{reason.description}</p></div>; })}</div> : null}
  </div></section>;
}
