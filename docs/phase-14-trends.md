# Phase 14 — Sprint Trends

## مدل Trend

- هر Point نتیجه تجمعی همه Taskهای نهایی تا پایان Sprint متناظر است؛ بنابراین KPI «تا آن لحظه» را نشان می‌دهد، نه فقط داده منفرد همان Sprint.
- ترتیب از `sequenceNumber` می‌آید و تعداد Sprint محدود نیست.
- Summary خنثی تغییر Core، Alignment و Execution را بدون Attribution انسانی توضیح می‌دهد.
- نمونه «Core پایدار + Alignment کاهشی» به‌صورت صریح تشخیص داده می‌شود.

## Dynamic در برابر Snapshot

در Season فعال، Trend به‌صورت Dynamic از وضعیت فعلی Taskها محاسبه می‌شود تا ویرایش‌های مجاز فوراً دیده شوند. Snapshot قطعی برای گزارش تاریخی هنگام بستن Season در Phase 15 ذخیره می‌شود. این تفکیک، Dashboard جاری را responsive و گزارش بسته را deterministic نگه می‌دارد.

## Chart و Accessibility

- به‌دلیل عدم دسترسی محیط به npm registry، نصب Recharts ممکن نشد؛ Chart renderer در یک ماژول SVG مستقل با API قابل تعویض قرار گرفت.
- نمودار `title` و `desc` قابل‌خواندن دارد، رنگ تنها حامل معنا نیست و Legend متنی ارائه می‌شود.
- جدول کامل داده و Summary متنی کنار نمودار وجود دارد.
- با بازشدن registry می‌توان renderer را با Recharts جایگزین کرد، بدون تغییر Trend Adapter یا Dashboard.

## Verification

- Unit test محاسبه تجمعی دو Sprint و Summary کاهش Alignment.
- `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`.
