import { z } from "zod";

export const practiceStatuses = ["DONE", "NOT_DONE", "NOT_APPLICABLE"] as const;
export const evidenceTypes = ["FIGMA", "DOCUMENT", "JIRA", "OTHER_URL"] as const;

const taskPracticeSchema = z.object({
  workPracticeId: z.string().uuid(),
  status: z.enum(practiceStatuses),
});

const evidenceSchema = z.object({
  type: z.enum(evidenceTypes),
  title: z.string().trim().min(1, "عنوان مستند الزامی است.").max(240),
  url: z
    .string()
    .trim()
    .url("آدرس مستند معتبر نیست.")
    .max(2048)
    .refine((value) => /^https?:\/\//i.test(value), "آدرس مستند باید با http یا https آغاز شود."),
});

export const taskInputSchema = z
  .object({
    sprintId: z.string().uuid("اسپرینت معتبر نیست."),
    projectId: z.string().uuid("پروژه معتبر نیست."),
    externalCode: z.string().trim().max(120).optional().transform((value) => value || ""),
    title: z.string().trim().min(1, "عنوان تسک الزامی است.").max(300),
    description: z.string().trim().max(4000).optional().transform((value) => value || ""),
    assignmentSource: z.enum([
      "MANAGER_ASSIGNED",
      "CUSTOMER_REQUEST",
      "STAKEHOLDER_REQUEST",
      "SELF_INITIATED",
      "OTHER",
    ]),
    approvalStatus: z.enum(["DRAFT", "IN_PROGRESS", "FINAL_APPROVED"]),
    practices: z.array(taskPracticeSchema),
    evidence: z.array(evidenceSchema),
  })
  .superRefine((value, context) => {
    const practiceIds = value.practices.map((practice) => practice.workPracticeId);
    if (new Set(practiceIds).size !== practiceIds.length) {
      context.addIssue({ code: "custom", path: ["practices"], message: "هر مولفه فقط یک‌بار قابل ثبت است." });
    }
    if (value.approvalStatus === "FINAL_APPROVED" && value.practices.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["practices"],
        message: "تسک نهایی باید حداقل یک نتیجه مولفه کاری داشته باشد.",
      });
    }
  });

export type TaskInput = z.input<typeof taskInputSchema>;
export type ParsedTaskInput = z.output<typeof taskInputSchema>;

export const additionalProjectInputSchema = z.object({
  name: z.string().trim().min(1, "نام پروژه الزامی است.").max(160),
  description: z.string().trim().max(2000).optional().transform((value) => value || ""),
});

export function suggestAgreementMatches(
  taskPracticeIds: string[],
  agreements: Array<{ id: string; expectedPracticeIds: string[] }>,
) {
  const taskPractices = new Set(taskPracticeIds);
  return agreements.flatMap((agreement) => {
    const matchedPracticeCount = agreement.expectedPracticeIds.filter((id) => taskPractices.has(id)).length;
    if (matchedPracticeCount === 0) return [];
    return [{
      agreementRevisionId: agreement.id,
      matchedPracticeCount,
      confidence: matchedPracticeCount / agreement.expectedPracticeIds.length,
    }];
  });
}
