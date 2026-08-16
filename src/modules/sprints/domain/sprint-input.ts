import { z } from "zod";

const isoDate = z.string().date("تاریخ معتبر نیست.");

export const sprintInputSchema = z
  .object({
    name: z.string().trim().min(1, "نام اسپرینت الزامی است.").max(120, "نام اسپرینت بیش از حد طولانی است."),
    sequenceNumber: z.coerce
      .number({ error: "شماره ترتیب باید عدد باشد." })
      .int("شماره ترتیب باید عدد صحیح باشد.")
      .positive("شماره ترتیب باید بزرگ‌تر از صفر باشد."),
    startDate: isoDate,
    endDate: isoDate,
    status: z.enum(["PLANNED", "ACTIVE", "CLOSED"], { error: "وضعیت اسپرینت معتبر نیست." }),
  })
  .superRefine((value, context) => {
    if (value.startDate > value.endDate) {
      context.addIssue({ code: "custom", path: ["endDate"], message: "تاریخ پایان باید بعد از تاریخ شروع باشد." });
    }
  });

export type SprintInput = z.input<typeof sprintInputSchema>;

export function isSprintInsideSeason(
  sprint: { startDate: string; endDate: string },
  season: { startDate: Date; endDate: Date },
) {
  const seasonStart = season.startDate.toISOString().slice(0, 10);
  const seasonEnd = season.endDate.toISOString().slice(0, 10);
  return sprint.startDate >= seasonStart && sprint.endDate <= seasonEnd;
}

export function parseSprintDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}
