# سامانه ارزیابی عملکرد دوره‌ای

سامانه‌ای فارسی و RTL برای تبدیل ارزیابی عملکرد از یک گفت‌وگوی ذهنی به گزارشی شفاف، داده‌محور و قابل ممیزی.

## وضعیت پیاده‌سازی

هر ۱۷ مرحله MVP تکمیل شده است. سامانه شامل Workflow کامل دوره، پروژه، توافق، مولفه کاری، اسپرینت و تسک؛ داشبورد کارمند و مدیر؛ Calculation/Reasoning مستقل؛ Trend؛ گزارش نهایی و Snapshot immutable؛ QA دسترس‌پذیری/RTL؛ و سخت‌سازی Production است.

## پیش‌نیازها

- Node.js 24+
- pnpm 11+
- یک پروژه Supabase

## راه‌اندازی

```bash
cp .env.example .env
pnpm install
pnpm db:generate
pnpm db:deploy
pnpm db:seed
pnpm dev
```

برای اجرای کل دروازهٔ کیفیت در یک دستور:

```bash
pnpm verify
```

پروژه از Supabase Postgres به‌عنوان دیتابیس اصلی استفاده می‌کند. `DATABASE_URL` برای Runtime و `DIRECT_URL` برای Prisma CLI و Migration است. Connection Stringها را از دکمه **Connect** پروژه Supabase دریافت کنید و Secretها را فقط در `.env` یا تنظیمات محیط استقرار نگه دارید.

راهنمای کامل اتصال و تصمیم امنیتی Prisma/Data API در [docs/supabase.md](docs/supabase.md) ثبت شده است.

Runtime از یک Prisma singleton و pool محدود استفاده می‌کند. مقادیر `DATABASE_POOL_MAX`، `DATABASE_CONNECTION_TIMEOUT_MS` و `DATABASE_IDLE_TIMEOUT_MS` را متناسب با ظرفیت Supabase و تعداد instanceهای استقرار تنظیم کنید؛ مجموع connectionهای همه instanceها باید پایین‌تر از ظرفیت پروژه بماند.

> نکته اتصال محلی: Runtime از اتصال مستقیم PostgreSQL/Supavisor استفاده می‌کند. اگر شبکه محلی پورت‌های `5432` و `6543` را مسدود کند، `pnpm build` و تست‌های مستقل از شبکه اجرا می‌شوند اما Workflowهای متصل به دیتابیس باید روی شبکه مجاز یا محیط استقرار اجرا شوند.

برای محیط واقعی، `AUTH_SECRET` را با یک مقدار تصادفی حداقل ۳۲ کاراکتری تنظیم کنید. دو رمز Seed نیز باید در `SEED_EMPLOYEE_PASSWORD` و `SEED_MANAGER_PASSWORD` قرار بگیرند. حساب‌های توسعه:

- `employee@example.test`
- `manager@example.test`

مقدار رمز هر حساب همان مقداری است که پیش از اجرای Seed در متغیر متناظر تعیین می‌کنید.

در Production، Seed توسعه را اجرا نکنید و همه secretها را فقط در secret manager محیط استقرار نگه دارید. چک‌لیست کامل استقرار، headerهای امنیتی، health check و rollback در [مستند Phase 17](docs/phase-17-production-hardening.md) آمده است.

## Authentication و Authorization

- رمزها با `scrypt` و Salt تصادفی هش می‌شوند و هرگز داخل Session قرار نمی‌گیرند.
- Session هشت‌ساعته، `HttpOnly`، `SameSite=Lax` و دارای امضای HMAC-SHA256 است.
- Cookie فقط شناسه کاربر و زمان‌های نشست را نگه می‌دارد.
- وضعیت فعال کاربر و نقش او برای عملیات حساس از پایگاه داده خوانده می‌شود.
- Role یک ویژگی سراسری حساب نیست؛ در سطح هر دوره از `SeasonMember` تعیین می‌شود.
- Manager در MVP فقط خواندنی است و Season بسته‌شده برای Employee نیز فقط خواندنی است، به‌جز عملیات Reopen.

جزئیات تصمیم‌ها و ماتریس دسترسی در [مستند Phase 5](docs/phase-5-authentication.md) آمده است.

## قواعد داده‌ای کلیدی

- تنها Projectهای توافق‌شده دارای وزن رسمی هستند.
- انتشار Plan Version فقط با مجموع وزن دقیق ۱۰۰٪ مجاز است.
- Agreement Weight دستی ندارد و Contribution آن بعداً در Domain Layer از Mappingها محاسبه می‌شود.
- Bonus Mapping وارد مخرج Core نمی‌شود.
- رکوردهای مرتبط با Season بسته‌شده در سطح Database محافظت می‌شوند.
- Project، Agreement و Work Practice دارای استفاده تاریخی Hard Delete نمی‌شوند.
- Task Code در Scope دوره و Source یکتا است.
- Snapshotها دارای Calculation Version و Input Hash هستند.

## دستورات بررسی

```bash
pnpm db:validate
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

همین بررسی‌ها روی هر Push و Pull Request توسط GitHub Actions اجرا می‌شوند.
