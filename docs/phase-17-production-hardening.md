# Phase 17 — Production Hardening

## کنترل‌های اعمال‌شده

- Runtime environment دیتابیس با Zod اعتبارسنجی می‌شود و خطای تنظیمات بدون چاپ connection string گزارش می‌شود.
- Prisma در هر process یک singleton است؛ pool دارای سقف connection و timeoutهای قابل تنظیم است تا هر request pool تازه ایجاد نکند.
- Cookie نشست در Production از prefix استاندارد `__Host-`، همراه `Secure`، `HttpOnly`، `SameSite=Lax`، path ریشه و priority بالا استفاده می‌کند.
- پاسخ‌های HTTP دارای CSP، جلوگیری از MIME sniffing و framing، Referrer Policy، Permissions Policy و isolation header هستند.
- HSTS و `upgrade-insecure-requests` فقط در Production فعال می‌شوند تا توسعه محلی HTTP مختل نشود.
- هدر شناسایی framework غیرفعال است.
- `/api/health` یک liveness endpoint بدون cache و بدون افشای secret یا وضعیت داده‌های کسب‌وکار فراهم می‌کند.
- CI روی Node 24 و pnpm قفل‌شده، generate/validate Prisma، typecheck، lint، test و build را اجرا می‌کند.

## تنظیمات محیط

متغیرهای اجباری:

- `DATABASE_URL`: Runtime URL رمزنگاری‌شده Supabase/Supavisor.
- `DIRECT_URL`: اتصال مورد استفاده Prisma CLI برای migration.
- `AUTH_SECRET`: مقدار تصادفی حداقل ۳۲ کاراکتری.

تنظیمات pool با default محافظه‌کارانه:

- `DATABASE_POOL_MAX=5`
- `DATABASE_CONNECTION_TIMEOUT_MS=10000`
- `DATABASE_IDLE_TIMEOUT_MS=30000`

Pool max باید در تعداد instanceهای هم‌زمان ضرب شود و نتیجه از ظرفیت connection پروژه Supabase کمتر بماند.

## ترتیب استقرار

1. secretها و connection stringهای SSL را در محیط استقرار ثبت کنید.
2. `pnpm install --frozen-lockfile` و `pnpm db:generate` را اجرا کنید.
3. قبل از انتشار کد، `pnpm db:deploy` را به‌عنوان job یک‌باره اجرا کنید.
4. `pnpm verify` را عبور دهید و artifact خروجی را deploy کنید.
5. پاسخ 200 از `/api/health` و redirect مسیرهای محافظت‌شده به `/login` را کنترل کنید.
6. Login، ایجاد Task و خواندن گزارش را با یک حساب تست Production smoke-test کنید.
7. Advisorهای Security و Performance Supabase و logهای خطای application/database را بررسی کنید.

Seed صرفاً برای محیط توسعه است و نباید در Production اجرا شود.

## Backup و rollback

- قبل از migration مهم از قابلیت backup/PITR متناسب با plan پروژه Supabase استفاده کنید.
- migrationها باید forward-compatible باشند؛ rollback کد فقط وقتی امن است که schema جدید با نسخه قبلی سازگار مانده باشد.
- Snapshotهای Performance حذف یا بازنویسی نمی‌شوند و Reopen یک revision تازه می‌سازد.
- در رخداد مشکل، ابتدا rollout کد را متوقف کنید، log و health را بررسی کنید و از اجرای migration معکوس بدون نسخه پشتیبان خودداری کنید.

## نتیجه ممیزی نهایی Supabase

- Security Advisor: بدون lint امنیتی.
- Migration history: همه migrationهای پروژه ثبت شده‌اند.
- Performance Advisor: فقط اعلان‌های INFO برای indexهای هنوز استفاده‌نشده. به‌دلیل کم‌ترافیک بودن پروژه و کاربرد این indexها در queryهای اصلی، حذف انجام نشد.
