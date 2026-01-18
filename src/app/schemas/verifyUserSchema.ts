import z from "zod";

export const verifySchema = z.object({
  email: z.string().email("Enter a valid email"),
  otp: z.string().length(6, "OTP must be 6 digits").optional(),
  phone: z
    .string()
    .regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),
});

export type VerifyForm = z.infer<typeof verifySchema>;
