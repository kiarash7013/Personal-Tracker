# Phase 15 — Final Season Report

## Snapshot Boundary

- Close فقط برای Employee و Season فعال مجاز است.
- Transaction با Isolation `Serializable` ابتدا Season را Closed می‌کند تا Triggerهای Database هر Child Write جدید را رد کنند.
- همان Transaction داده را با Prisma Transaction Client می‌خواند و Snapshot می‌سازد.
- Snapshot شامل Calculation Version، SHA-256 Input Hash، Settings/Classification/Reasons، KPIها، Project Detail و Trend Detail است.
- Reopen Snapshot را حذف نمی‌کند؛ Close بعدی `revision + 1` می‌سازد.

## گزارش

- Level، پنج KPI، دلیل اصلی و Supporting Reasonها.
- Project Weight، Core Achievement، Contribution و تعداد Agreement.
- Work Practice Coverage با حذف N/A از denominator.
- Task/Evidence transparency و لینک Drill-down.
- Trend تجمعی Sprintها و جدول قابل‌دسترسی.
- Print stylesheet برای چاپ یا Save as PDF مرورگر.

## Historical Integrity و Edge Cases

- Season بسته‌شده در Database برای Project/Sprint/Task/Plan/Settings فقط‌خواندنی است.
- Snapshot labelها مستقل از Rename آینده Entity باقی می‌مانند.
- Season بدون Opportunity نیز با `NOT_ENOUGH_DATA` Snapshot می‌شود و به‌زور امتیاز صفر نمی‌گیرد.
- Reopen و Close هر دو Audit Log دارند؛ Snapshot creation نیز Audit Event مستقل دارد.

## Verification

- Integration test پایداری `label_snapshot` پس از Rename Entity.
- Integration testهای قبلی Read-only بودن Season بسته و immutability Plan را پوشش می‌دهند.
- `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`.
