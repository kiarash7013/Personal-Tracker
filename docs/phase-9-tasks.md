# Phase 9 — Task Management

## Requirement و فرضیات

- ثبت Task فقط در Season فعال و روی آخرین Plan منتشرشده انجام می‌شود.
- Source در MVP همیشه `MANUAL` است، اما Data Model فیلدهای Jira/API را حفظ می‌کند.
- Draft می‌تواند بدون Practice باشد؛ `FINAL_APPROVED` حداقل یک نتیجه Practice می‌خواهد.
- `NOT_APPLICABLE` نتیجه صریح است ولی در مخرج Achievement وارد نخواهد شد.
- Evidence اختیاری است و URL فقط با Scheme امن HTTP/HTTPS پذیرفته می‌شود.

## معماری و Audit

- Validation فرم و پیشنهاد Match در Domain مستقل قرار دارد.
- ایجاد Task ابتدا به‌صورت Draft انجام می‌شود؛ سپس Practice/Evidence/Match ذخیره و در پایان Finalization اجرا می‌شود تا Constraint دیتابیس رعایت شود.
- ویرایش Task نهایی در Transaction موقتاً آن را Draft می‌کند، Child Recordها را جایگزین می‌کند و دوباره Finalization Validation را اجرا می‌کند.
- Agreement Match از اشتراک Practiceهای Task و Expected Practiceهای Agreement همان Project ساخته می‌شود؛ هر رابطه فقط یک‌بار ذخیره می‌شود.
- Project خارج از توافق وزن رسمی و ProjectPlan ندارد و به‌صورت `ADDITIONAL` ثبت می‌شود.
- Create/Update/Finalize و ایجاد پروژه Additional در Audit Log ثبت می‌شوند.

## Edge Caseهای پوشش‌داده‌شده

- کد تکراری در Scope Season/Source توسط Unique Constraint رد می‌شود.
- Final بدون Practice رد می‌شود؛ Final با همه Practiceهای N/A معتبر است اما Achievement denominator نخواهد داشت.
- تغییر Project/Sprint فقط با Entityهای همان Season ممکن است.
- Practice غیرفعال فقط در ویرایش استفاده تاریخی قبلی قابل حفظ است.
- URL با Scheme ناامن رد می‌شود.
- یک Task می‌تواند با چند Agreement همان Project Match شود بدون رکورد تکراری.

## Verification

- Unit tests برای Finalization، N/A، URL امن و Matching چند Agreement.
- Integration tests موجود برای Task context، Finalization و Unique Task Code.
- `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`.
