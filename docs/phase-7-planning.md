# Phase 7 — Project, Agreement and Work Practice Management

## Requirement و فرضیات

- وزن رسمی فقط روی `ProjectPlan` ذخیره می‌شود و مجموع آن هنگام انتشار باید دقیقاً ۱۰۰٪ باشد.
- پروژه توافق‌شده، توافق و Mapping مولفه‌ها فقط تا پیش از انتشار Plan قابل ویرایش‌اند.
- `WorkPractice` متعلق به کاربر و میان دوره‌ها reusable است؛ غیرفعال‌سازی آن Hard Delete نیست.
- Manager از همان صفحات جزئیات استفاده می‌کند، اما هیچ Action نوشتنی دریافت نمی‌کند.

## معماری

- Validation و محاسبه سهم در `modules/planning/domain` مستقل از UI قرار دارد.
- Server Actionها مالکیت دوره و Capability را دوباره در سمت سرور بررسی می‌کنند.
- ایجاد/ویرایش چندرکوردی داخل Transaction انجام و تغییرهای مهم در `AuditLog` ثبت می‌شوند.
- نام و توضیح مولفه در `AgreementPractice` Snapshot می‌شود؛ Rename آینده گزارش منتشرشده را تغییر نمی‌دهد.
- Plan منتشرشده با Triggerهای PostgreSQL immutable است و UI نیز فرم‌های ویرایش را فقط برای Plan پیش‌نویس نشان می‌دهد.

## Edge Caseهای پوشش‌داده‌شده

- وزن صفر، بالاتر از ۱۰۰ یا بیش از دو رقم اعشار رد می‌شود.
- نام تکراری پروژه یا مولفه به پیام Conflict تبدیل می‌شود.
- توافق بدون مولفه قابل ذخیره نیست و Practice غیرفعال جدید قابل Mapping نیست.
- Bonus در مخرج سهم توافق‌های اصلی وارد نمی‌شود.
- بایگانی پروژه/توافق پیش‌نویس، رکورد اصلی را Soft Archive می‌کند و داده موقت Plan را حذف می‌کند.
- Practice غیرفعال با استفاده تاریخی باقی می‌ماند و Snapshot آن قابل ممیزی است.

## Verification

- Domain tests: ورودی پروژه/توافق، مجموع وزن و سهم خودکار Agreement.
- Integration test: تغییرناپذیری Agreement منتشرشده و پایداری Snapshot نام Practice.
- `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`.
