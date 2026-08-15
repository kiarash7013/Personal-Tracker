# سامانه ارزیابی عملکرد دوره‌ای

سامانه‌ای فارسی و RTL برای تبدیل ارزیابی عملکرد از یک گفت‌وگوی ذهنی به گزارشی شفاف، داده‌محور و قابل ممیزی.

## وضعیت پیاده‌سازی

Phase 5 تکمیل شده است: مدل داده، موتور محاسبات، تست‌های Domain و اکنون احراز هویت و RBAC وابسته به دوره در دسترس‌اند. صفحه اصلی محافظت‌شده است و Manager در MVP فقط دسترسی خواندن دارد. ساخت Workflow دوره در Phase 6 انجام می‌شود.

## پیش‌نیازها

- Node.js 24+
- pnpm 11+
- PostgreSQL

## راه‌اندازی

```bash
cp .env.example .env
pnpm install
pnpm db:generate
pnpm db:deploy
pnpm db:seed
pnpm dev
```

برای محیط واقعی، `AUTH_SECRET` را با یک مقدار تصادفی حداقل ۳۲ کاراکتری تنظیم کنید. دو رمز Seed نیز باید در `SEED_EMPLOYEE_PASSWORD` و `SEED_MANAGER_PASSWORD` قرار بگیرند. حساب‌های توسعه:

- `employee@example.test`
- `manager@example.test`

مقدار رمز هر حساب همان مقداری است که پیش از اجرای Seed در متغیر متناظر تعیین می‌کنید.

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
