# سامانه ارزیابی عملکرد دوره‌ای

سامانه‌ای فارسی و RTL برای تبدیل ارزیابی عملکرد از یک گفت‌وگوی ذهنی به گزارشی شفاف، داده‌محور و قابل ممیزی.

## وضعیت پیاده‌سازی

Phase 2 روی مدل رابطه‌ای و Integrity تاریخی متمرکز است. UI موجود فقط یک پوسته اولیه است و Workflowهای محصول در Phaseهای بعد اضافه می‌شوند.

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
