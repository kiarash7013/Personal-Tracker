# Phase 2 — Data Model Decisions

## Plan versioning

`SeasonPlanVersion` مرز تاریخی توافقات است. هر نسخه منتشرشده شامل `ProjectPlan`های وزن‌دار و `AgreementRevision`های همان نسخه است. Task هنگام نهایی‌شدن به نسخه مؤثر متصل می‌شود؛ در نتیجه تغییر بعدی متن توافق یا نام مولفه، گزارش قبلی را بازنویسی نمی‌کند.

## Agreed and additional projects

`Project.scope` مشخص می‌کند پروژه در توافق اولیه بوده است یا خارج از توافق. فقط `AGREED` می‌تواند در `ProjectPlan` حاضر و دارای وزن باشد. پروژه `ADDITIONAL` برای گزارش مشارکت خارج از توافق نگهداری می‌شود و در Core Achievement وارد نمی‌شود.

## Closed seasons

Application Layer پیش از هر Mutation وضعیت Season را بررسی می‌کند. Migration نیز Triggerهای دفاعی اضافه می‌کند تا Mutation مستقیم روی داده اصلی Season بسته‌شده رد شود. Reopen در آینده یک عملیات صریح و Audit‌شده خواهد بود.

## Historical labels

نام Work Practice در `AgreementPractice` و `TaskPractice` Snapshot می‌شود. نام Project نیز در `ProjectPlan` نگهداری می‌شود. این Snapshotها همراه Revisionها مانع تغییر غیرقابل‌پیش‌بینی گزارش‌های گذشته می‌شوند.

## Calculation snapshots

`PerformanceSnapshot` مقدار KPI، Reason Code، نسخه الگوریتم و Hash ورودی را نگه می‌دارد. `SnapshotMetricDetail` اجزای numerator، denominator، weight و contribution را برای Drill-down و Audit ثبت می‌کند.

## Delete strategy

Entityهای دارای مرجع تاریخی با `ARCHIVED` یا `active=false` غیرفعال می‌شوند. Foreign Keyهای اصلی `RESTRICT` هستند. Cascade فقط برای داده‌ای استفاده می‌شود که مالکیت کامل و مستقل ندارد؛ مانند جزئیات یک Snapshot.
