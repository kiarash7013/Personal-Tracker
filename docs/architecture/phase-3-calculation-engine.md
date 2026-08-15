# Phase 3 — Calculation Engine

## Boundary

Calculation Engine یک ماژول TypeScript خالص است و به React، Next.js، Prisma، PostgreSQL، Localization و تقویم شمسی وابستگی ندارد. Adapter لایه Application در مراحل بعد داده‌های Snapshot‌شده را به ورودی این ماژول تبدیل می‌کند.

## Metric contract

هر KPI علاوه بر مقدار درصدی، `status`، numerator، denominator، شناسه ورودی‌های محاسبه‌شده، موارد حذف‌شده با Reason و `calculationVersion` را برمی‌گرداند. مقدار `null` فقط با وضعیت `NO_OPPORTUNITY` یا `NOT_ENOUGH_DATA` مجاز است؛ نبود فرصت هرگز صفر Achievement تلقی نمی‌شود.

## Applicable practice instance

واحد اتمی Execution زوج یکتای `(taskId, practiceId)` است. تنها Task نهایی و وضعیت‌های `DONE` یا `NOT_DONE` وارد denominator می‌شوند. `NOT_APPLICABLE` حذف می‌شود. اشتراک یک Practice بین چند Agreement در گزارش Agreement قابل مشاهده است، ولی در `Aligned Execution` با Union کردن Practiceهای مورد انتظار هر Project فقط یک بار شمرده می‌شود.

## Opportunity renormalization

Contribution Share پایه Agreement از تعداد Mappingها محاسبه می‌شود. اگر یک Agreement هنوز هیچ Applicable Instance نداشته باشد، سهم آن از denominator مشاهده‌شده Project خارج و به‌صورت Opportunity Coverage گزارش می‌شود. همین سیاست برای Project فاقد فرصت در Core و Bonus Achievement اعمال می‌شود.

## Alignment and additional work

Work Alignment فقط Finalized Assigned Work را بررسی می‌کند و `SELF_INITIATED` را به‌صورت پیش‌فرض کنار می‌گذارد. Additional Contribution تمام Taskهای نهایی را مبنا قرار می‌دهد و سهم Assigned و Self-initiated را جدا برمی‌گرداند. این KPI با Core Achievement جمع نمی‌شود.

## Deferred decisions

`classifyPerformance` و `generatePerformanceReasons` طبق برنامه MVP در Phaseهای 12 و 13 پیاده‌سازی می‌شوند. این مرحله فقط اعداد پایه و Audit Detail مورد نیاز آن دو Engine را تولید می‌کند.
