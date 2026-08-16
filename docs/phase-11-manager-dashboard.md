# Phase 11 — Manager Dashboard

## Scope و دسترسی

- صفحه فقط برای عضو `MANAGER` همان Season قابل بارگذاری است.
- Data Query نیز Membership مدیر را در Database شرط می‌کند؛ صرف دانستن URL کافی نیست.
- هیچ فرم، Server Action یا CTA نوشتنی در Dashboard مدیر وجود ندارد.

## محتوای Dashboard

- Core Achievement، Work Alignment، Aligned Execution، Bonus، Additional Contribution، Season Elapsed و تعداد Task نهایی.
- Summary پروژه‌ها شامل وزن رسمی، Task نهایی، Core Achievement و Opportunity Coverage.
- Drill-down به Project/Agreement و Task/Evidence از صفحات فقط‌خواندنی مشترک.
- بیان خنثی داده‌های Alignment و Execution بدون تعیین مقصر.

## تصمیم مرحله‌ای

Performance Level عمداً «در انتظار طبقه‌بندی» نمایش داده می‌شود. Phase 12 Thresholdهای قابل تنظیم و Classification را اضافه می‌کند و Phase 13 متن «دلیل این سطح عملکرد» را از Reason Codeهای مستقل می‌سازد.

## Verification

- Query مدیر علاوه بر RBAC صفحه، Membership را در شرط Database اعمال می‌کند.
- UI از همان Calculation Adapter تست‌شده Dashboard کارمند استفاده می‌کند.
- `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`.
