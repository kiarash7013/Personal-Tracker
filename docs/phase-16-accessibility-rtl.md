# Phase 16 — Accessibility و RTL QA

## نتیجه

- زبان و جهت سند در Root Layout با `lang="fa"` و `dir="rtl"` تثبیت شده است.
- Bootstrap RTL بارگذاری می‌شود و CSS سفارشی برای فاصله‌گذاری ساختاری از logical propertyها استفاده می‌کند.
- لینک Skip-to-content، landmark اصلی با شناسه ثابت و وضعیت `aria-current` ناوبری اضافه شده‌اند.
- صفحه ورود در همه breakpointها یک عنوان اصلی قابل مشاهده دارد و کنترل‌های آن label، autocomplete و جهت LTR مناسب دارند.
- وضعیت‌های فرم با `role="alert"` یا `role="status"` اعلام می‌شوند.
- نمودار Trend دارای نام و توضیح دسترس‌پذیر است و جدول کامل داده به‌عنوان مسیر جایگزین ارائه می‌شود.
- وضعیت‌ها علاوه بر رنگ، برچسب متنی دارند و جدول‌ها headerهای دارای `scope` دارند.
- فرم ثبت Task و Evidence در viewport کوچک به یک ستون تبدیل می‌شود.
- `prefers-reduced-motion` و focus ring پرکنتراست در stylesheet عمومی پشتیبانی می‌شوند.

## روش بررسی

1. HTML واقعی `/login` از سرور توسعه خوانده و وجود `html[lang=fa][dir=rtl]`، landmark، labelها، inputها و نام دکمه کنترل شد.
2. ساختار صفحه‌ها و componentها برای heading، form label، table header، status announcement و متن جایگزین نمودار ممیزی شد.
3. قواعد کلیدی فوق به تست regression تبدیل شدند تا حذف ناخواسته آن‌ها در CI شناسایی شود.

مرورگر داخلی محیط Codex دسترسی خودکار به URL محلی را طبق سیاست URL مسدود کرد؛ بنابراین screenshot خودکار گرفته نشد و بررسی روی HTML واقعی سرور و تست ساختاری انجام شد.
