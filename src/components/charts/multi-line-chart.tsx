type ChartPoint = { label: string; [key: string]: string | number | null };
type Series = { key: string; label: string; color: string };

export function MultiLineChart({ id, title, points, series }: { id: string; title: string; points: ChartPoint[]; series: Series[] }) {
  const width = 720;
  const height = 280;
  const padding = { top: 20, right: 34, bottom: 48, left: 46 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const x = (index: number) => padding.left + (points.length <= 1 ? chartWidth / 2 : (index / (points.length - 1)) * chartWidth);
  const y = (value: number) => padding.top + chartHeight - (Math.max(0, Math.min(100, value)) / 100) * chartHeight;
  const pathFor = (key: string) => {
    let started = false;
    return points.flatMap((point, index) => {
      const value = point[key];
      if (typeof value !== "number") return [];
      const command = started ? "L" : "M";
      started = true;
      return [`${command}${x(index)},${y(value)}`];
    }).join(" ");
  };

  return <div className="trend-chart-wrapper">
    <svg aria-labelledby={`${id}-title ${id}-desc`} className="trend-chart" role="img" viewBox={`0 0 ${width} ${height}`}>
      <title id={`${id}-title`}>{title}</title>
      <desc id={`${id}-desc`}>نمودار خطی درصد تحقق Core، هم‌راستایی و اجرای هم‌راستا به تفکیک اسپرینت. جدول داده پس از نمودار قرار دارد.</desc>
      {[0, 25, 50, 75, 100].map((tick) => <g key={tick}><line stroke="#dfe8e6" x1={padding.left} x2={width - padding.right} y1={y(tick)} y2={y(tick)} /><text fill="#6c807c" fontSize="11" textAnchor="end" x={padding.left - 8} y={y(tick) + 4}>{tick}%</text></g>)}
      {series.map((item) => <g key={item.key}><path d={pathFor(item.key)} fill="none" stroke={item.color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />{points.map((point, index) => typeof point[item.key] === "number" ? <circle cx={x(index)} cy={y(point[item.key] as number)} fill="#fff" key={`${item.key}-${index}`} r="4" stroke={item.color} strokeWidth="3" /> : null)}</g>)}
      {points.map((point, index) => <text fill="#536964" fontSize="11" key={point.label} textAnchor="middle" x={x(index)} y={height - 18}>{point.label}</text>)}
    </svg>
    <div className="chart-legend" aria-hidden="true">{series.map((item) => <span key={item.key}><i style={{ backgroundColor: item.color }} />{item.label}</span>)}</div>
  </div>;
}
