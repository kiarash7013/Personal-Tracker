# Phase 5 — Authentication و Role Model

## فرضیات

- حساب‌های MVP از قبل Provision می‌شوند؛ ثبت‌نام عمومی و بازیابی رمز در Scope این فاز نیست.
- Role به Season وابسته است، نه به User. یک User می‌تواند Employee یک Season و Manager دوره‌ای دیگر باشد.
- مالک `Season.employeeId` همیشه Employee همان دوره محسوب می‌شود. ایجاد دوره در Phase 6 باید رکورد متناظر `SeasonMember` را نیز در یک Transaction بسازد.
- Manager Approval عمداً در MVP غیرفعال است، اما Capability مستقل آن برای توسعه آینده وجود دارد.

## معماری

Authentication از Authorization جدا است:

1. Credentials با Zod اعتبارسنجی می‌شوند.
2. Password با scrypt و Salt تصادفی بررسی می‌شود.
3. Cookie امضاشده فقط `userId`، زمان صدور و انقضا را حمل می‌کند.
4. Proxy فقط وجود و صحت رمزنگاری Session را برای Redirect سریع بررسی می‌کند.
5. Data Access Layer دوباره Session، فعال‌بودن User و Membership دوره را بررسی می‌کند.
6. Server Action یا Route Handler آینده باید پیش از Mutation، `requireSeasonCapability` را صدا بزند.

این جداسازی اجازه می‌دهد بعداً Provider ورود با OIDC یا Auth.js جایگزین شود، بدون آن‌که Policyهای RBAC یا مدل داده تغییر کنند.

## ماتریس دسترسی MVP

| Capability | Employee — Draft/Active | Employee — Closed | Manager |
| --- | ---: | ---: | ---: |
| مشاهده دوره و گزارش | بله | بله | بله |
| ویرایش تنظیمات دوره | بله | خیر | خیر |
| مدیریت پروژه و توافق | بله | خیر | خیر |
| مدیریت اسپرینت | بله | خیر | خیر |
| مدیریت تسک و مستند | بله | خیر | خیر |
| بستن دوره | بله | خیر | خیر |
| بازگشایی دوره | خیر | بله | خیر |
| Manager Approval | خیر | خیر | خیر |

## Edge Caseهای پوشش‌داده‌شده

- Session دستکاری‌شده، بدفرمت، منقضی یا امضاشده با Secret دیگر رد می‌شود.
- User حذف‌شده یا غیرفعال حتی با Cookie معتبر وارد DAL نمی‌شود.
- User بدون Membership هیچ دسترسی به Season ندارد.
- Manager در هیچ وضعیت Season اجازه Mutation ندارد.
- Season بسته‌شده فقط برای Employee مالک قابل Reopen است.
- ایمیل ناشناخته نیز یک Password Verification ساختگی انجام می‌دهد تا اختلاف زمانی آشکار کاهش یابد.
- Migration برای Userهای قبلی Backward-compatible است و `password_hash` را nullable اضافه می‌کند.

## خارج از Scope این فاز

- Rate limiting توزیع‌شده و Lockout حساب
- Reset password و MFA
- Enterprise SSO/OIDC
- Rotation و Revocation مرکزی Session
- Manager Approval workflow

موارد امنیتی عملیاتی در Phase 17 Production Hardening تکمیل می‌شوند.
