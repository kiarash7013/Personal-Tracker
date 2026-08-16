import { formatPercent, formatPersianNumber } from "@/presentation/formatters";

type MetricCardProps = {
  title: string;
  value: number | null;
  status?: string;
  helper: string;
  numerator?: number;
  denominator?: number;
  tone?: "primary" | "success" | "warning" | "neutral";
};

export function MetricCard({ title, value, status, helper, numerator, denominator, tone = "primary" }: MetricCardProps) {
  return <article className={`card app-card metric-card metric-tone-${tone} border-0 h-100`}>
    <div className="card-body p-4">
      <span className="metric-label">{title}</span>
      <strong className="metric-value">{value === null ? "—" : formatPercent(value)}</strong>
      <p className="text-secondary small mb-2">{value === null || status === "NO_OPPORTUNITY" ? "هنوز فرصت قابل محاسبه‌ای ثبت نشده است." : helper}</p>
      {typeof numerator === "number" && typeof denominator === "number" && denominator > 0 ? (
        <span className="metric-fraction">{formatPersianNumber(numerator)} از {formatPersianNumber(denominator)}</span>
      ) : null}
    </div>
  </article>;
}
