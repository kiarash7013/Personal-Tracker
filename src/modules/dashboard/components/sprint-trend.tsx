import { MultiLineChart } from "@/components/charts/multi-line-chart";
import type { SprintTrendPoint } from "../application/sprint-trend";
import { formatPercent } from "@/presentation/formatters";

const series = [
  { key: "coreAchievement", label: "تحقق Core", color: "#176d64" },
  { key: "workAlignment", label: "هم‌راستایی", color: "#3f89b3" },
  { key: "alignedExecution", label: "اجرای هم‌راستا", color: "#d3992f" },
];

export function SprintTrend({ points, summary }: { points: SprintTrendPoint[]; summary: string }) {
  return <section className="card app-card border-0"><div className="card-body p-4">
    <div className="mb-3"><h2 className="h5 mb-1">روند تجمعی اسپرینت‌ها</h2><p className="text-secondary small mb-0">هر نقطه، داده‌های نهایی ثبت‌شده تا پایان همان اسپرینت را نشان می‌دهد.</p></div>
    {points.length ? <>
      <MultiLineChart id="sprint-performance-trend" points={points.map((point) => ({ label: point.name, coreAchievement: point.coreAchievement, workAlignment: point.workAlignment, alignedExecution: point.alignedExecution }))} series={series} title="روند عملکرد دوره به تفکیک اسپرینت" />
      <p className="trend-summary">{summary}</p>
      <details className="mt-3"><summary className="small fw-semibold">جدول داده نمودار</summary><div className="table-responsive mt-2"><table className="table table-sm"><thead><tr><th scope="col">اسپرینت</th><th scope="col">Core</th><th scope="col">هم‌راستایی</th><th scope="col">اجرا</th></tr></thead><tbody>{points.map((point) => <tr key={point.sprintId}><th scope="row">{point.name}</th><td>{point.coreAchievement === null ? "—" : formatPercent(point.coreAchievement)}</td><td>{point.workAlignment === null ? "—" : formatPercent(point.workAlignment)}</td><td>{point.alignedExecution === null ? "—" : formatPercent(point.alignedExecution)}</td></tr>)}</tbody></table></div></details>
    </> : <p className="text-secondary mb-0">برای نمایش روند، ابتدا اسپرینت و Task نهایی ثبت کنید.</p>}
  </div></section>;
}
