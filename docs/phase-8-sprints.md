# Phase 8 — Sprint Management

## تصمیم‌ها و فرضیات

- تعداد اسپرینت‌ها Hard-code نشده و `sequenceNumber` فقط در Scope دوره یکتا است.
- بازه اسپرینت باید داخل بازه دوره باشد؛ هم‌پوشانی به‌صورت خودکار ممنوع نشده چون تیم‌ها ممکن است Sprintهای موازی داشته باشند.
- در هر دوره تنها یک Sprint با وضعیت `ACTIVE` قابل ثبت است.
- Sprint دارای تاریخچه یا Task حذف نمی‌شود؛ MVP فقط ایجاد و ویرایش کنترل‌شده ارائه می‌دهد.

## معماری و دسترسی

- Validation تاریخ/ترتیب در Domain مستقل از UI قرار دارد.
- Employee در دوره Draft یا Active می‌تواند اسپرینت را مدیریت کند؛ Manager و دوره Closed فقط‌خواندنی‌اند.
- هر Create/Update همراه Audit Log و داخل Transaction انجام می‌شود.
- تاریخ در Database استاندارد و در UI با تقویم فارسی نمایش داده می‌شود.

## Verification

- Unit test برای ترتیب دلخواه، بازه معکوس و قرارگیری داخل بازه دوره.
- Constraint یکتایی `season_id + sequence_number` در Migration موجود است.
- `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`.
