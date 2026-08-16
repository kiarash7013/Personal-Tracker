import type { PerformanceReasonCode } from "@/domain/calculations";
import { formatPercent } from "@/presentation/formatters";

type ReasonMetrics = {
  workAlignment: number | null;
  alignedExecution: number | null;
  bonusAchievement: number | null;
  additionalContribution: number | null;
  coreOpportunityCoverage: number;
};

export function getPersianPerformanceReason(code: PerformanceReasonCode, metrics: ReasonMetrics) {
  const alignment = metrics.workAlignment === null ? "نامشخص" : formatPercent(metrics.workAlignment);
  const execution = metrics.alignedExecution === null ? "نامشخص" : formatPercent(metrics.alignedExecution);
  const copy = {
    LIMITED_ALIGNMENT: {
      title: "فرصت هم‌راستایی محدود بوده است",
      description: `${alignment} از کارهای نهایی تخصیص‌یافته با پروژه‌های توافق‌شده هم‌راستا بوده‌اند، در حالی که اجرای کارهای مرتبط جداگانه ارزیابی شده است.`,
    },
    EXECUTION_GAP: {
      title: "بخشی از مولفه‌های مورد انتظار تکمیل نشده‌اند",
      description: `${execution} از مولفه‌های کاری قابل‌اعمال در تسک‌های هم‌راستا انجام شده‌اند.`,
    },
    MIXED_ALIGNMENT_EXECUTION: {
      title: "ترکیبی از هم‌راستایی و اجرای ناقص",
      description: `نتیجه فعلی ترکیبی از ${alignment} هم‌راستایی کارها و ${execution} اجرای مولفه‌های قابل‌اعمال است.`,
    },
    STRONG_EXECUTION: {
      title: "اجرای قوی در کارهای هم‌راستا",
      description: `${execution} از مولفه‌های کاری مورد انتظار در تسک‌های نهایی و هم‌راستا انجام شده‌اند.`,
    },
    STRONG_ALIGNMENT: {
      title: "هم‌راستایی قوی کارها",
      description: `${alignment} از کارهای نهایی تخصیص‌یافته در محدوده پروژه‌های توافق‌شده قرار داشته‌اند.`,
    },
    BONUS_ACHIEVEMENT: {
      title: "تحقق معنادار توافق‌های امتیازی",
      description: `${metrics.bonusAchievement === null ? "فرصتی ثبت نشده" : formatPercent(metrics.bonusAchievement)} از فرصت‌های قابل‌اعمال توافق‌های امتیازی محقق شده‌اند؛ Core نیز مستقل در سطح لازم قرار دارد.`,
    },
    ADDITIONAL_CONTRIBUTION: {
      title: "مشارکت معنادار خارج از توافق اولیه",
      description: `${metrics.additionalContribution === null ? "داده‌ای ثبت نشده" : formatPercent(metrics.additionalContribution)} از تسک‌های نهایی مربوط به پروژه‌های خارج از توافق اولیه بوده‌اند؛ این مقدار با Core جمع نشده است.`,
    },
    LIMITED_OPPORTUNITY: {
      title: "فرصت قابل مشاهده هنوز محدود است",
      description: `در حال حاضر ${formatPercent(metrics.coreOpportunityCoverage)} از وزن پروژه‌های توافق‌شده دارای فرصت قابل محاسبه است؛ برای نتیجه قطعی‌تر داده بیشتری لازم است.`,
    },
  } satisfies Record<PerformanceReasonCode, { title: string; description: string }>;
  return copy[code];
}
