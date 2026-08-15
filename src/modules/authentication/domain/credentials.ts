import { z } from "zod";

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "ایمیل را وارد کنید.")
    .max(320, "ایمیل واردشده معتبر نیست.")
    .email("ایمیل واردشده معتبر نیست."),
  password: z
    .string()
    .min(1, "رمز عبور را وارد کنید.")
    .max(128, "رمز عبور واردشده معتبر نیست."),
});

export type SignInInput = z.infer<typeof signInSchema>;
