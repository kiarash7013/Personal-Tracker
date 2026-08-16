# Phase 10 — Employee Dashboard

## Requirement و معماری

- Dashboard فقط برای Employee مالک Season ساخته می‌شود و داده را از Plan منتشرشده، Projectهای Additional و Taskهای همان Season می‌گیرد.
- Adapter سمت Server رکوردهای Prisma را به Input خالص Calculation Engine تبدیل می‌کند؛ هیچ Formula داخل React Component نیست.
- پنج KPI مستقل نمایش داده می‌شوند: Core Achievement، Work Alignment، Aligned Execution، Bonus Achievement و Additional Contribution.
- نبود Task/Opportunity با مقدار `null` و پیام «فرصت قابل محاسبه نیست» نمایش داده می‌شود، نه صفر.

## UX و شفافیت

- Season و Sprint جاری، CTA ثبت Task و درصد زمان سپری‌شده در بالای صفحه‌اند.
- Draft/In-progress و Task نهایی بدون Evidence به‌عنوان اقدام بعدی دیده می‌شوند و امتیاز را به‌طور پنهان تغییر نمی‌دهند.
- آخرین Taskها با Project/Sprint و Status نمایش داده می‌شوند.
- بخش «نحوه محاسبه» numerator، denominator و Opportunity Coverage را قابل مشاهده می‌کند.
- Season Elapsed فقط Context زمانی است و در Performance Score جمع نمی‌شود.

## Verification

- Unit test Adapter نشان می‌دهد Alignment، Execution و Additional Contribution با هم جمع یا جایگزین نمی‌شوند.
- Unit test زمان سپری‌شده را در محدوده صفر تا صد Clamp می‌کند.
- `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`.
