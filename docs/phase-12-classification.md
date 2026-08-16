# Phase 12 — Performance Classification

## قواعد Classification

- نبود Core Opportunity یا Aligned Execution نتیجه `NOT_ENOUGH_DATA` می‌دهد، نه Level مصنوعی.
- Core Achievement و Aligned Execution باید حداقل‌های نسخه فعال Settings را برآورده کنند تا Level به `MEETS_EXPECTATIONS` برسد.
- Core صددرصد بدون Contribution اضافه همچنان `MEETS_EXPECTATIONS` است.
- `EXCEEDS_EXPECTATIONS` نیازمند Core مناسب و سپس یکی از این دو است:
  - Bonus Achievement برابر/بالاتر از Threshold؛ یا
  - Additional Contribution برابر/بالاتر از Threshold همراه حداقل تعداد Task تعیین‌شده.
- Bonus بالا با Core پایین، `PARTIALLY_ACHIEVED` باقی می‌ماند.

## Settings Versioning

- هر Save یک `PerformanceSettingVersion` جدید با `effectiveAt` ایجاد می‌کند.
- Manager نسخه فعال را فقط مشاهده می‌کند و Employee نسخه جدید ایجاد می‌کند.
- نسخه‌های قبلی حذف یا overwrite نمی‌شوند تا Snapshot تاریخی deterministic بماند.
- تنظیم `includeSelfInitiatedInAlignment` واقعاً ورودی Work Alignment را تغییر می‌دهد.

## Verification

- Unit tests برای insufficient data، Core پایین، Bonus با Core پایین، Core=100، Bonus Exceeds و حداقل تعداد Additional Task.
- RBAC برای Capability جدید `season:manage-settings` تست شده است.
- `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`.
