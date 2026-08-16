import { z } from "zod";

const requiredText = (label: string, max: number) =>
  z.string().trim().min(1, `${label} الزامی است.`).max(max, `${label} بیش از حد طولانی است.`);

const optionalDescription = z
  .string()
  .trim()
  .max(2_000, "توضیحات بیش از حد طولانی است.")
  .optional()
  .transform((value) => value || "");

export const projectInputSchema = z.object({
  name: requiredText("نام پروژه", 160),
  description: optionalDescription,
  weight: z.coerce
    .number({ error: "وزن پروژه باید عدد باشد." })
    .positive("وزن پروژه باید بیشتر از صفر باشد.")
    .max(100, "وزن پروژه نمی‌تواند بیشتر از ۱۰۰٪ باشد.")
    .refine((value) => Number.isInteger(value * 100), "وزن حداکثر دو رقم اعشار دارد."),
});

export type ProjectInput = z.input<typeof projectInputSchema>;

export const agreementInputSchema = z.object({
  title: requiredText("عنوان توافق", 240),
  description: optionalDescription,
  agreementType: z.enum(["CORE", "BONUS"], { error: "نوع توافق معتبر نیست." }),
  practiceIds: z
    .array(z.string().uuid("شناسه مولفه کاری معتبر نیست."))
    .min(1, "حداقل یک مولفه کاری انتخاب کنید.")
    .transform((ids) => [...new Set(ids)]),
});

export type AgreementInput = z.input<typeof agreementInputSchema>;

export const workPracticeInputSchema = z.object({
  name: requiredText("نام مولفه کاری", 160),
  description: optionalDescription,
});

export type WorkPracticeInput = z.input<typeof workPracticeInputSchema>;

export function calculateProjectWeightSummary(weights: number[]) {
  const total = Math.round(weights.reduce((sum, weight) => sum + weight, 0) * 100) / 100;

  return {
    total,
    remaining: Math.round((100 - total) * 100) / 100,
    valid: weights.length > 0 && total === 100,
  };
}

export function calculateAgreementContribution(
  agreementType: "CORE" | "BONUS",
  practiceCount: number,
  totalCorePracticeCount: number,
) {
  if (agreementType === "BONUS" || totalCorePracticeCount <= 0) {
    return null;
  }

  return (practiceCount / totalCorePracticeCount) * 100;
}
