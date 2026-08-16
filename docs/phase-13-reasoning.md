# Phase 13 — Reasoning Engine

## Domain Rules

- Engine فقط Reason Code تولید می‌کند و به React، Prisma یا متن فارسی وابسته نیست.
- نتیجه `NOT_ENOUGH_DATA` یا Opportunity Coverage پایین، `LIMITED_OPPORTUNITY` است.
- Partially با Alignment و Execution پایین، `MIXED_ALIGNMENT_EXECUTION` است.
- Alignment پایین با Execution قوی، `LIMITED_ALIGNMENT` و Supporting `STRONG_EXECUTION` می‌دهد.
- Alignment قوی با Execution پایین، `EXECUTION_GAP` و Supporting `STRONG_ALIGNMENT` می‌دهد.
- Exceeds به‌ترتیب با Bonus یا Additional، علت اصلی متناظر می‌گیرد.

## Localization و اصل بی‌طرفی

Reason Codeها در `i18n/performance-reasons.fa.ts` به عنوان و متن فارسی تبدیل می‌شوند. متن‌ها نسبت‌های واقعی را بیان می‌کنند و هیچ‌گاه «مدیر»، «کارمند»، ضعف یا تقصیر را علت اعلام نمی‌کنند. Manager و Employee دقیقاً یک تفسیر داده‌محور را می‌بینند.

## Verification

- پنج سناریوی Unit Test: Limited Alignment، Execution Gap، Mixed، Bonus Exceeds و Limited Opportunity.
- Supporting Reasonها و جلوگیری از تکرار Primary Reason تست می‌شوند.
- `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`.
