import { z } from "zod";

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/u;

export const seasonInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "نام دوره باید حداقل ۲ کاراکتر باشد.")
      .max(160, "نام دوره نمی‌تواند بیشتر از ۱۶۰ کاراکتر باشد."),
    startDate: z
      .string()
      .regex(isoDatePattern, "تاریخ شروع معتبر نیست."),
    endDate: z
      .string()
      .regex(isoDatePattern, "تاریخ پایان معتبر نیست."),
    managerId: z.union([z.literal(""), z.uuid("مدیر انتخاب‌شده معتبر نیست.")]),
  })
  .superRefine((value, context) => {
    if (!isoDatePattern.test(value.startDate) || !isoDatePattern.test(value.endDate)) {
      return;
    }

    const start = Date.parse(`${value.startDate}T00:00:00.000Z`);
    const end = Date.parse(`${value.endDate}T00:00:00.000Z`);

    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      return;
    }

    if (end <= start) {
      context.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "تاریخ پایان باید بعد از تاریخ شروع باشد.",
      });
    }

    const maximumDuration = 366 * 24 * 60 * 60 * 1000;
    if (end - start > maximumDuration) {
      context.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "طول دوره نمی‌تواند بیشتر از یک سال باشد.",
      });
    }
  });

export type SeasonInput = z.infer<typeof seasonInputSchema>;

export function parseUtcDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}
