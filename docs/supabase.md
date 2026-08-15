# Supabase Database

Supabase Postgres دیتابیس اصلی این پروژه است. دسترسی داده برنامه در MVP فقط از Backend و با Prisma انجام می‌شود؛ `supabase-js` و Data API مستقیماً از مرورگر استفاده نمی‌شوند.

## Connectionها

- `DATABASE_URL`: اتصال Runtime. برای اجرای فعلی مبتنی بر Node.js، Supavisor Session Mode روی پورت `5432` انتخاب امن و سازگار است.
- `DIRECT_URL`: اتصال Prisma CLI برای Migration و Seed. Direct Connection در شبکه دارای IPv6 مناسب است؛ در شبکه IPv4 می‌توان از Supavisor Session Mode روی پورت `5432` استفاده کرد.
- Transaction Mode روی پورت `6543` فقط هنگام استقرار Serverless و پس از تست سازگاری Driver استفاده می‌شود.

هر دو URL باید `sslmode=require` داشته باشند و هرگز Commit نشوند.

## Prisma Role

برای محیط Production یک Role اختصاصی به نام `prisma` با Password تصادفی ایجاد شود. این Role فقط در Backend استفاده می‌شود و Credential آن نباید با متغیرهای `NEXT_PUBLIC_` در دسترس مرورگر قرار بگیرد.

## Data API و RLS

مدل Authorization فعلی در Application Layer و بر اساس `SeasonMember` است و Supabase Auth در MVP استفاده نمی‌شود. بنابراین:

- جدول‌های محصول نباید به `anon` یا `authenticated` از Data API دسترسی مستقیم بدهند.
- در Supabase، گزینه خودکار Expose کردن جدول‌های جدید غیرفعال بماند.
- در صورت نیاز آینده به Data API، ابتدا RLS و Policyهای مالکیت دقیق طراحی و همراه Grantهای صریح در Migration ثبت می‌شوند.
- `service_role` یا Database Password هرگز وارد Client Bundle نمی‌شود.

## راه‌اندازی

1. `.env.example` را به `.env` کپی کنید.
2. `DATABASE_URL` و `DIRECT_URL` را با Connection Stringهای پروژه جایگزین کنید.
3. `AUTH_SECRET` و رمزهای Seed را مقداردهی کنید.
4. وضعیت اتصال را با `pnpm db:status` بررسی کنید.
5. Migrationها را با `pnpm db:deploy` اعمال کنید.
6. کاربران نمونه را با `pnpm db:seed` بسازید.

پس از Seed، ایمیل‌های `employee@example.test` و `manager@example.test` با رمزهای تعیین‌شده در متغیرهای محیطی قابل استفاده‌اند.
