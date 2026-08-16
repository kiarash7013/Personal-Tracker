import { z } from "zod";

export const DEFAULT_PERFORMANCE_SETTINGS = {
  meetsExpectationsMinCoreAchievement: 80,
  minimumAlignedExecution: 80,
  bonusRequiredForExceeds: 60,
  additionalContributionThreshold: 15,
  lowAlignmentThreshold: 60,
  strongMetricThreshold: 85,
  minimumAdditionalTaskCount: 2,
  minimumObservableProjectWeight: 30,
  includeSelfInitiatedInAlignment: false,
} as const;

const percent = (label: string) => z.coerce
  .number({ error: `${label} باید عدد باشد.` })
  .min(0, `${label} نمی‌تواند کمتر از صفر باشد.`)
  .max(100, `${label} نمی‌تواند بیشتر از ۱۰۰ باشد.`);

export const performanceSettingsSchema = z.object({
  meetsExpectationsMinCoreAchievement: percent("حداقل تحقق Core"),
  minimumAlignedExecution: percent("حداقل اجرای هم‌راستا"),
  bonusRequiredForExceeds: percent("حداقل Bonus"),
  additionalContributionThreshold: percent("حداقل مشارکت اضافه"),
  lowAlignmentThreshold: percent("مرز هم‌راستایی محدود"),
  strongMetricThreshold: percent("مرز شاخص قوی"),
  minimumAdditionalTaskCount: z.coerce.number().int().min(1).max(100),
  minimumObservableProjectWeight: percent("حداقل وزن قابل مشاهده"),
  includeSelfInitiatedInAlignment: z.boolean(),
});

export type PerformanceSettingsInput = z.input<typeof performanceSettingsSchema>;
